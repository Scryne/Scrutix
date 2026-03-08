"use server";

// ╔══════════════════════════════════════════════════════════════════╗
// ║  Admin Poll Entry — Server Actions                              ║
// ║                                                                 ║
// ║  1. createPollEntry: Anket sonucu kaydet (form submit)          ║
// ║  2. getElectionsForSelect: Seçim dropdown verisi                ║
// ║  3. getPollFirmsForSelect: Anket şirketi dropdown verisi        ║
// ║  4. getPartiesByElection: Seçime bağlı parti listesi            ║
// ╚══════════════════════════════════════════════════════════════════╝

import { revalidatePath } from "next/cache";
import { createHash } from "crypto";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import { adminPollEntrySchema } from "@/lib/validators";
import { slugify } from "@/lib/utils";
import { dataValidationService } from "@/services/validation.service";

const DEFAULT_VERIFIED_RELIABILITY_SCORE = 0.8;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** Server action sonuç tipi — form'a geri döner. */
export type ActionResult = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
  /** Validasyon uyarıları — kayıt yapıldı ama admin bilgilendirilmeli. */
  warnings?: string[];
  /** Validasyon raporu — admin panelinde detaylı gösterim için. */
  validationPassed?: boolean;
};

/** Seçim dropdown verisi. */
export type ElectionOption = {
  id: string;
  title: string;
  date: string;
  type: string;
};

/** Anket şirketi dropdown verisi. */
export type PollFirmOption = {
  id: string;
  name: string;
};

/** Seçime bağlı parti verisi (oy oranı giriş satırları için). */
export type PartyForElection = {
  id: string;
  name: string;
  abbreviation: string;
  color: string;
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  DATA FETCHERS (Server Actions — form yüklenmesinde çağrılır)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Seçim dropdown'ı için veritabanından aktif/yaklaşan/tamamlanmış seçimleri çeker.
 * Tarih sırasıyla (en yeni önce).
 */
export async function getElectionsForSelect(): Promise<ElectionOption[]> {
  const elections = await prisma.election.findMany({
    where: { isDeleted: false },
    select: {
      id: true,
      title: true,
      date: true,
      type: true,
    },
    orderBy: { date: "desc" },
  });

  return elections.map((e) => ({
    id: e.id,
    title: e.title,
    date: e.date.toISOString().split("T")[0] ?? "",
    type: e.type,
  }));
}

/**
 * Anket şirketi dropdown'ı için mevcut firmaları çeker.
 * İsim sırasıyla.
 */
export async function getPollFirmsForSelect(): Promise<PollFirmOption[]> {
  const firms = await prisma.pollFirm.findMany({
    where: { isDeleted: false },
    select: {
      id: true,
      name: true,
    },
    orderBy: { name: "asc" },
  });

  return firms;
}

/**
 * Seçime kayıtlı partilerin listesini çeker (oy oranı satırları için).
 *
 * Önce ElectionParty pivot tablosundan seçime bağlı partileri arar.
 * Eğer yoksa (henüz parti atanmamış), ülkedeki tüm partileri döner.
 */
export async function getPartiesByElection(
  electionId: string
): Promise<PartyForElection[]> {
  // Önce seçime bağlı partileri kontrol et
  const electionParties = await prisma.electionParty.findMany({
    where: { electionId },
    include: {
      party: {
        select: {
          id: true,
          name: true,
          abbreviation: true,
          color: true,
          isDeleted: true,
        },
      },
    },
    orderBy: { listOrder: "asc" },
  });

  const linkedParties = electionParties
    .filter((ep) => !ep.party.isDeleted)
    .map((ep) => ({
      id: ep.party.id,
      name: ep.party.name,
      abbreviation: ep.party.abbreviation,
      color: ep.party.color,
    }));

  if (linkedParties.length > 0) {
    return linkedParties;
  }

  // Seçime parti atanmamışsa — ülkedeki tüm aktif partileri getir
  const election = await prisma.election.findUnique({
    where: { id: electionId },
    select: { country: true },
  });

  const allParties = await prisma.party.findMany({
    where: {
      isDeleted: false,
      country: election?.country ?? "Türkiye",
    },
    select: {
      id: true,
      name: true,
      abbreviation: true,
      color: true,
    },
    orderBy: { name: "asc" },
  });

  return allParties;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  MAIN ACTION — Anket Sonucu Kaydet
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Admin panel anket sonucu giriş formu submit action'ı.
 *
 * Pipeline:
 * 1. Auth kontrolü (ADMIN rolü)
 * 2. Zod validasyonu
 * 3. Anket şirketi: mevcut seç veya yeni oluştur
 * 4. DataSource kaydı oluştur (kaynak URL + checksum)
 * 5. Toplu PollResult upsert (her parti için ayrı kayıt)
 * 6. Doğrulanmışsa → DataSource verification güncelle
 * 7. Tahmin modeli tetikleme (background — placeholder)
 * 8. Path revalidation
 */
export async function createPollEntry(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  // ── 1. Auth kontrolü ──
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return {
      success: false,
      message: "Bu islemi yapmak icin yetkiniz yok.",
    };
  }

  // ── Form verisini JSON'a dönüştür ──
  const rawData = {
    electionId: formData.get("electionId") as string,
    pollFirmId: (formData.get("pollFirmId") as string) || undefined,
    newPollFirm: formData.get("newPollFirmName")
      ? {
        name: formData.get("newPollFirmName") as string,
        website: (formData.get("newPollFirmWebsite") as string) || undefined,
      }
      : undefined,
    publishedAt: formData.get("publishedAt") as string,
    sampleSize: formData.get("sampleSize") as string,
    methodology: (formData.get("methodology") as string) || undefined,
    sourceUrl: formData.get("sourceUrl") as string,
    notes: (formData.get("notes") as string) || undefined,
    isVerified: formData.get("isVerified") === "true",
    results: parseResultsFromFormData(formData),
  };

  // ── 2. Zod validasyonu ──
  const parsed = adminPollEntrySchema.safeParse(rawData);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const formErrors = parsed.error.flatten().formErrors;

    return {
      success: false,
      message: formErrors[0] ?? "Form verisi gecersiz. Lutfen alanlari kontrol edin.",
      errors: fieldErrors as Record<string, string[]>,
    };
  }

  const data = parsed.data;

  try {
    // ── 3. Anket şirketi: mevcut seç veya yeni oluştur ──
    let firmId = data.pollFirmId;

    if (!firmId && data.newPollFirm) {
      const slug = slugify(data.newPollFirm.name);

      // Aynı slug ile firma var mı kontrol et
      const existing = await prisma.pollFirm.findUnique({
        where: { slug },
        select: { id: true },
      });

      if (existing) {
        firmId = existing.id;
      } else {
        const newFirm = await prisma.pollFirm.create({
          data: {
            name: data.newPollFirm.name,
            slug,
            country: "Türkiye",
            website: data.newPollFirm.website || null,
          },
        });
        firmId = newFirm.id;
      }
    }

    if (!firmId) {
      return {
        success: false,
        message: "Anket sirketi belirlenemedi.",
      };
    }

    // ── 3.5. Veri kalitesi kontrolü ──
    // Validasyon servisi 5 adımlı kontrol çalıştırır:
    //   1. Kaynak URL doğrulama (HTTP HEAD)
    //   2. Mantık kontrolü (yüzdeler, tarihler)
    //   3. Tutarlılık kontrolü (çift kayıt tespiti)
    //   4. Anomali tespiti (önceki ankete göre %15+ değişim)
    //   5. Log kaydı (DataSource modeline yazma)
    //
    // errors → kaydı engeller, warnings → admin'e gösterilir.
    const validationReport = await dataValidationService.validatePollEntry({
      electionId: data.electionId,
      pollFirmId: firmId,
      publishedAt: data.publishedAt,
      sampleSize: data.sampleSize,
      methodology: data.methodology,
      sourceUrl: data.sourceUrl,
      results: data.results,
      isVerified: data.isVerified,
      notes: data.notes,
    });

    if (!validationReport.passed) {
      return {
        success: false,
        message: `Veri kalitesi kontrolu basarisiz: ${validationReport.totalErrors} hata tespit edildi.`,
        warnings: validationReport.allWarnings,
        validationPassed: false,
        errors: {
          _validation: validationReport.allErrors,
        },
      };
    }

    // ── 4. DataSource kaydı oluştur / güncelle ──
    const sourceChecksum = createHash("sha256")
      .update(JSON.stringify({
        electionId: data.electionId,
        firmId,
        publishedAt: data.publishedAt.toISOString(),
        results: data.results,
      }))
      .digest("hex");

    let dataSourceId = validationReport.dataSourceLogId;

    if (dataSourceId) {
      // Validasyon sırasında oluşturulan logu güncelle
      await prisma.dataSource.update({
        where: { id: dataSourceId },
        data: {
          name: `Anket: ${data.publishedAt.toISOString().split("T")[0]}`,
          checksum: sourceChecksum,
          verification: data.isVerified ? "VERIFIED" : "PENDING",
          verifiedByUserId: data.isVerified ? session.user.id : null,
          verifiedAt: data.isVerified ? new Date() : null,
        },
      });
    } else {
      // Fallback: log oluşturulamamışsa yeni kayıt aç
      const dataSource = await prisma.dataSource.create({
        data: {
          name: `Anket: ${data.publishedAt.toISOString().split("T")[0]}`,
          url: data.sourceUrl,
          fetchedAt: new Date(),
          httpStatus: 200,
          checksum: sourceChecksum,
          verification: data.isVerified ? "VERIFIED" : "PENDING",
          verifiedByUserId: data.isVerified ? session.user.id : null,
          verifiedAt: data.isVerified ? new Date() : null,
          notes: data.notes || null,
          electionId: data.electionId,
        },
      });
      dataSourceId = dataSource.id;
    }

    // ── 5. PollResult kayıtları oluştur (her parti için ayrı satır) ──
    const pollResults = await prisma.$transaction(
      data.results.map((result) =>
        prisma.pollResult.create({
          data: {
            electionId: data.electionId,
            pollFirmId: firmId!,
            partyId: result.partyId,
            percentage: result.percentage,
            sampleSize: data.sampleSize,
            methodology: data.methodology ?? null,
            publishedAt: data.publishedAt,
            dataSourceId: dataSourceId,
            reliabilityScore: data.isVerified ? DEFAULT_VERIFIED_RELIABILITY_SCORE : null,
          },
        })
      )
    );

    // ── 6. Tahmin modeli tetikleme (background job — placeholder) ──
    // TODO: Gerçek tahmin modeli entegrasyonu yapıldığında burada
    // bir background job kuyruğuna (bull, inngest vb.) iş eklenecek.
    // Şimdilik sadece loglama yapılıyor.
    // eslint-disable-next-line no-console
    console.log(
      `[AdminPollEntry] ${pollResults.length} anket sonucu kaydedildi. ` +
      `Tahmin modeli tetikleme: electionId=${data.electionId} ` +
      `(TODO: background job entegrasyonu)`
    );

    // ── 7. Cache revalidation ──
    const election = await prisma.election.findUnique({
      where: { id: data.electionId },
      select: { slug: true }
    });

    revalidatePath("/admin");
    revalidatePath("/elections");
    if (election?.slug) {
      revalidatePath(`/elections/${election.slug}`);
    }

    // Validasyon uyarıları varsa mesaja ekle
    const warningsSuffix = validationReport.allWarnings.length > 0
      ? ` (${validationReport.allWarnings.length} uyari)`
      : "";

    return {
      success: true,
      message: `${pollResults.length} parti icin anket sonucu basariyla kaydedildi${warningsSuffix}.`,
      warnings: validationReport.allWarnings.length > 0
        ? validationReport.allWarnings
        : undefined,
      validationPassed: true,
    };
  } catch (error) {
    console.error("[AdminPollEntry] Kayit hatasi:", error);

    const message =
      error instanceof Error ? error.message : "Bilinmeyen bir hata olustu.";

    return {
      success: false,
      message: `Kayit sirasinda bir hata olustu: ${message}`,
    };
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * FormData'dan dinamik parti sonuçlarını çıkarır.
 *
 * Form'daki naming convention:
 *   results[0].partyId = "clxx..."
 *   results[0].percentage = "25.5"
 *   results[1].partyId = "clyy..."
 *   results[1].percentage = "18.3"
 */
function parseResultsFromFormData(
  formData: FormData
): Array<{ partyId: string; percentage: string }> {
  const results: Array<{ partyId: string; percentage: string }> = [];
  let index = 0;

  while (true) {
    const partyId = formData.get(`results[${index}].partyId`) as string | null;
    const percentage = formData.get(
      `results[${index}].percentage`
    ) as string | null;

    if (partyId === null && percentage === null) break;

    if (partyId && percentage !== null) {
      results.push({ partyId, percentage });
    }

    index++;
  }

  return results;
}
