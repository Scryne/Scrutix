// ╔══════════════════════════════════════════════════════════════════╗
// ║  Data Quality Validation Service                                ║
// ║                                                                 ║
// ║  Her veri girişinde otomatik çalışan kalite kontrol servisi.     ║
// ║  5 kontrol adımı:                                               ║
// ║    1. Kaynak doğrulama (URL erişilebilirlik)                    ║
// ║    2. Mantık kontrolü (yüzdeler, tarihler)                      ║
// ║    3. Tutarlılık kontrolü (çift kayıt tespiti)                  ║
// ║    4. Anomali tespiti (önceki ankete göre %15+ değişim)         ║
// ║    5. Log kaydı (DataSource modeline yazma)                     ║
// ║                                                                 ║
// ║  Tüm kontrol fonksiyonları pure function olarak tasarlanmıştır  ║
// ║  — unit test yazılabilir, side-effect içermez.                   ║
// ║  Yalnızca DataValidationService sınıfı DB erişimi yapar.        ║
// ║                                                                 ║
// ║  ⚠ Server-side only — Prisma ve HTTP istekleri kullanır.        ║
// ╚══════════════════════════════════════════════════════════════════╝

import { z } from "zod";
import prisma from "@/lib/prisma";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  EXPORTED TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Tek bir kontrol adımının sonucu.
 *
 * - errors:   Kaydı engelleyen kritik hatalar.
 * - warnings: Kaydı engellemez ama admin'e gösterilir.
 */
export interface ValidationResult {
  /** Tüm kontroller geçti mi? (errors.length === 0) */
  passed: boolean;
  /** Kritik hatalar — bunlar varsa kayıt yapılmamalı. */
  errors: string[];
  /** Uyarılar — kayıt yapılır ama admin bilgilendirilir. */
  warnings: string[];
}

/**
 * Tüm kontrol adımlarının birleşik sonucu.
 * Her adım ayrı raporlanır + birleşik özet sağlanır.
 */
export interface FullValidationReport {
  /** Tüm adımlar geçti mi? */
  passed: boolean;
  /** Toplam hata sayısı. */
  totalErrors: number;
  /** Toplam uyarı sayısı. */
  totalWarnings: number;
  /** Her adımın ayrı sonucu. */
  steps: {
    sourceVerification: ValidationResult;
    logicCheck: ValidationResult;
    consistencyCheck: ValidationResult;
    anomalyDetection: ValidationResult;
  };
  /** Birleşik tüm hatalar. */
  allErrors: string[];
  /** Birleşik tüm uyarılar. */
  allWarnings: string[];
  /** Log kaydı için oluşturulan DataSource ID'si (null = log yazılamadı). */
  dataSourceLogId: string | null;
}

/**
 * Validasyon servisine gelen anket verisi.
 * Admin form'dan veya API'den gelebilir — ortak arayüz.
 */
export interface PollEntryData {
  electionId: string;
  pollFirmId: string;
  publishedAt: Date;
  sampleSize: number;
  methodology?: string | null;
  sourceUrl: string;
  results: Array<{
    partyId: string;
    percentage: number;
  }>;
  isVerified?: boolean;
  notes?: string | null;
}

/**
 * Anomali tespiti için önceki anket verisi.
 * DB'den çekilir, pure fonksiyona parametre olarak verilir.
 */
export interface PreviousPollData {
  partyId: string;
  percentage: number;
  publishedAt: Date;
  pollFirmName: string;
}

/**
 * Tutarlılık kontrolü için mevcut kayıt verisi.
 * DB'den çekilir, pure fonksiyona parametre olarak verilir.
 */
export interface ExistingPollRecord {
  id: string;
  publishedAt: Date;
  pollFirmId: string;
  pollFirmName: string;
  partyId: string | null;
  percentage: number;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ZOD SCHEMAS — Giriş verisi validasyonu
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** Anket giriş verisinin yapısal doğruluğunu kontrol eden şema. */
export const pollEntryDataSchema = z.object({
  electionId: z.string().min(1, "Secim ID'si bos olamaz"),
  pollFirmId: z.string().min(1, "Anket sirketi ID'si bos olamaz"),
  publishedAt: z.date(),
  sampleSize: z.number().int().min(200, "Orneklem buyuklugu en az 200 olmalidir"),
  methodology: z.string().nullish(),
  sourceUrl: z.string().url("Gecerli bir URL giriniz"),
  results: z.array(
    z.object({
      partyId: z.string().min(1),
      percentage: z.number().min(0).max(100),
    })
  ).min(1, "En az bir parti sonucu olmalidir"),
  isVerified: z.boolean().optional(),
  notes: z.string().nullish(),
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  CONSTANTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** Anomali tespiti eşik değeri: bir önceki ankete göre yüzde farkı. */
const ANOMALY_THRESHOLD_PERCENT = 15;

/** Kaynak URL doğrulama zaman aşımı (ms). */
const URL_VERIFY_TIMEOUT_MS = 10_000;

/** Kaynak URL doğrulamada kabul edilen HTTP status aralığı. */
const ACCEPTABLE_HTTP_STATUSES = new Set([200, 201, 202, 203, 204, 301, 302, 303, 307, 308]);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  HELPER: Boş ValidationResult oluşturucu
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function createResult(): ValidationResult {
  return { passed: true, errors: [], warnings: [] };
}

function finalizeResult(result: ValidationResult): ValidationResult {
  return { ...result, passed: result.errors.length === 0 };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  1. KAYNAK DOĞRULAMA — URL erişilebilirlik
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * URL'nin erişilebilir olup olmadığını HTTP HEAD isteği ile kontrol eder.
 *
 * Pure function DEĞİL (network I/O) — ancak izole ve test'te mock'lanabilir.
 * Servis sınıfı üzerinden çağrılır.
 *
 * @returns HTTP status kodu ve erişilebilirlik durumu
 */
export async function verifySourceUrl(
  url: string
): Promise<{ reachable: boolean; httpStatus: number | null; error?: string }> {
  // URL format kontrolü
  try {
    new URL(url);
  } catch {
    return { reachable: false, httpStatus: null, error: "Gecersiz URL formati" };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), URL_VERIFY_TIMEOUT_MS);

    const response = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "Scrutix/1.0 DataValidator",
      },
    });

    clearTimeout(timeoutId);

    return {
      reachable: ACCEPTABLE_HTTP_STATUSES.has(response.status),
      httpStatus: response.status,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bilinmeyen hata";

    // AbortError = zaman aşımı
    if (err instanceof Error && err.name === "AbortError") {
      return {
        reachable: false,
        httpStatus: null,
        error: `URL zaman asimina ugradi (${URL_VERIFY_TIMEOUT_MS}ms)`,
      };
    }

    return { reachable: false, httpStatus: null, error: message };
  }
}

/**
 * Kaynak URL doğrulama sonucunu ValidationResult'a dönüştürür.
 *
 * Pure function: HTTP sonucunu alır, karar verir.
 *
 * Kural:
 * - Erişilemezse → warning (hata DEĞİL, çünkü URL geçici olarak
 *   down olabilir veya paywall arkasında olabilir)
 * - 4xx/5xx → warning + detay
 */
export function buildSourceVerificationResult(
  url: string,
  verification: { reachable: boolean; httpStatus: number | null; error?: string }
): ValidationResult {
  const result = createResult();

  if (!verification.reachable) {
    const detail = verification.error
      ? `: ${verification.error}`
      : verification.httpStatus
        ? `: HTTP ${verification.httpStatus}`
        : "";

    result.warnings.push(
      `Kaynak URL'ye erisilemedi${detail} — "${url}"`
    );
  }

  return finalizeResult(result);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  2. MANTIK KONTROLÜ — Yüzdeler ve tarihler
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Anket verisi üzerinde mantık kontrolleri yapar.
 *
 * **Pure function** — hiçbir side-effect yok.
 * Unit test'te doğrudan çağrılabilir.
 *
 * Kontroller:
 * 1. Her parti yüzdesi 0-100 aralığında mı?
 * 2. Toplam yüzde %100'ü geçiyor mu?
 * 3. Toplam yüzde %50'nin altında mı? (anormal düşük → warning)
 * 4. Aynı parti birden fazla kez var mı? (duplicate partyId)
 * 5. Yayın tarihi gelecekte mi?
 * 6. Yayın tarihi çok eski mi? (10 yıldan fazla → warning)
 * 7. Örneklem büyüklüğü makul mü? (200-100.000 arası)
 * 8. Negatif yüzde var mı?
 */
export function checkLogic(data: PollEntryData): ValidationResult {
  const result = createResult();
  const now = new Date();

  // ── Yüzde kontrolleri ──
  for (const r of data.results) {
    if (r.percentage < 0) {
      result.errors.push(
        `Parti ${r.partyId}: oy orani negatif olamaz (${r.percentage})`
      );
    }
    if (r.percentage > 100) {
      result.errors.push(
        `Parti ${r.partyId}: oy orani %100'u gecemez (${r.percentage})`
      );
    }
  }

  // ── Toplam yüzde ──
  const total = data.results.reduce((sum, r) => sum + r.percentage, 0);
  const totalRounded = Math.round(total * 100) / 100;

  if (totalRounded > 100) {
    result.errors.push(
      `Toplam oy orani %100'u geciyor: %${totalRounded.toFixed(2)}`
    );
  }

  if (totalRounded > 0 && totalRounded < 50) {
    result.warnings.push(
      `Toplam oy orani dusuk: %${totalRounded.toFixed(2)} — eksik parti olabilir`
    );
  }

  // ── Aynı parti birden fazla kez ──
  const partyIds = data.results.map((r) => r.partyId);
  const uniquePartyIds = new Set(partyIds);

  if (uniquePartyIds.size < partyIds.length) {
    const duplicates = partyIds.filter(
      (id, i) => partyIds.indexOf(id) !== i
    );
    result.errors.push(
      `Ayni parti birden fazla kez girilmis: ${[...new Set(duplicates)].join(", ")}`
    );
  }

  // ── Tarih kontrolleri ──
  if (data.publishedAt > now) {
    result.errors.push(
      `Yayin tarihi gelecekte olamaz: ${data.publishedAt.toISOString().split("T")[0]}`
    );
  }

  const tenYearsAgo = new Date();
  tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);

  if (data.publishedAt < tenYearsAgo) {
    result.warnings.push(
      `Yayin tarihi 10 yildan eski: ${data.publishedAt.toISOString().split("T")[0]} — dogru mu kontrol edin`
    );
  }

  // ── Örneklem büyüklüğü ──
  if (data.sampleSize < 200) {
    result.errors.push(
      `Orneklem buyuklugu cok kucuk: ${data.sampleSize} (minimum 200)`
    );
  }

  if (data.sampleSize > 100_000) {
    result.warnings.push(
      `Orneklem buyuklugu cok buyuk: ${data.sampleSize} — dogru mu kontrol edin`
    );
  }

  // ── Boş sonuç kontrolü ──
  if (data.results.length === 0) {
    result.errors.push("En az bir parti icin oy orani girilmelidir");
  }

  return finalizeResult(result);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  3. TUTARLILIK KONTROLÜ — Çift kayıt tespiti
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Aynı anket şirketinin aynı seçim için aynı tarihte çift kaydı olup
 * olmadığını kontrol eder.
 *
 * **Pure function** — mevcut kayıtlar parametre olarak verilir.
 *
 * Kontroller:
 * 1. Aynı firma + aynı seçim + aynı tarihte kayıt var mı? → error
 * 2. Aynı firma + aynı seçim + ±3 gün içinde kayıt var mı? → warning
 *
 * @param existingRecords  Bu seçim + bu firma için mevcut PollResult kayıtları
 */
export function checkConsistency(
  data: PollEntryData,
  existingRecords: ExistingPollRecord[]
): ValidationResult {
  const result = createResult();

  if (existingRecords.length === 0) {
    return finalizeResult(result);
  }

  const newDate = data.publishedAt.getTime();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const THREE_DAYS_MS = 3 * ONE_DAY_MS;

  // Mevcut kayıtları tarihe göre grupla (aynı gün → aynı anket)
  const dateGroups = new Map<string, ExistingPollRecord[]>();
  for (const record of existingRecords) {
    const dateKey = record.publishedAt.toISOString().split("T")[0] ?? "";
    const group = dateGroups.get(dateKey) ?? [];
    group.push(record);
    dateGroups.set(dateKey, group);
  }

  const newDateKey = data.publishedAt.toISOString().split("T")[0] ?? "";

  // ── Aynı tarihte tam eşleşme → error ──
  if (dateGroups.has(newDateKey)) {
    const sameDateRecords = dateGroups.get(newDateKey)!;
    const firmName = sameDateRecords[0]?.pollFirmName ?? data.pollFirmId;

    result.errors.push(
      `Cift kayit: ${firmName} sirketinin ${newDateKey} tarihinde bu secim icin ` +
      `zaten ${sameDateRecords.length} kaydi var`
    );
  }

  // ── ±3 gün içinde yakın tarihli kayıt → warning ──
  for (const [dateKey, records] of dateGroups) {
    if (dateKey === newDateKey) continue; // Zaten error olarak raporlandı

    const recordDate = records[0]?.publishedAt.getTime();
    if (recordDate === undefined) continue;

    const diff = Math.abs(newDate - recordDate);

    if (diff <= THREE_DAYS_MS) {
      const firmName = records[0]?.pollFirmName ?? data.pollFirmId;
      const daysDiff = Math.round(diff / ONE_DAY_MS);

      result.warnings.push(
        `Yakin tarihli kayit: ${firmName} sirketinin ${dateKey} tarihinde ` +
        `(${daysDiff} gun farkla) bu secim icin kaydi var — cift giris olabilir`
      );
    }
  }

  return finalizeResult(result);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  4. ANOMALİ TESPİTİ — Önceki ankete göre değişim
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Bir önceki ankete göre her partinin oy oranındaki değişimi kontrol eder.
 * %15'ten fazla değişim varsa uyarı üretir.
 *
 * **Pure function** — önceki anket verileri parametre olarak verilir.
 *
 * Mantık:
 * - Her parti için önceki anketteki yüzdeyi bul
 * - |yeni - eski| > ANOMALY_THRESHOLD_PERCENT → warning
 * - Önceki ankette bu parti yoksa → bilgi notu (warning değil)
 * - Yeni girişte olmayıp önceki ankette olan parti → warning (parti düştü)
 *
 * @param previousPolls  Bu seçim için en son anketin parti bazlı sonuçları
 */
export function detectAnomalies(
  data: PollEntryData,
  previousPolls: PreviousPollData[]
): ValidationResult {
  const result = createResult();

  if (previousPolls.length === 0) {
    // İlk anket — karşılaştırma yapılamaz
    result.warnings.push(
      "Bu secim icin onceki anket verisi bulunamadi — anomali tespiti yapilmadi"
    );
    return finalizeResult(result);
  }

  // Önceki anketi parti bazlı map'e dönüştür
  const previousByParty = new Map<string, PreviousPollData>();
  for (const p of previousPolls) {
    previousByParty.set(p.partyId, p);
  }

  // ── Her yeni sonuç için öncekiyle karşılaştır ──
  for (const newResult of data.results) {
    const prev = previousByParty.get(newResult.partyId);

    if (!prev) {
      // Bu parti önceki ankette yoktu — bilgi notu
      continue;
    }

    const diff = Math.abs(newResult.percentage - prev.percentage);

    if (diff > ANOMALY_THRESHOLD_PERCENT) {
      const direction = newResult.percentage > prev.percentage ? "artis" : "dusus";

      result.warnings.push(
        `Anomali: Parti ${newResult.partyId} icin %${diff.toFixed(1)} ${direction} tespit edildi ` +
        `(onceki: %${prev.percentage.toFixed(1)} → yeni: %${newResult.percentage.toFixed(1)}, ` +
        `kaynak: ${prev.pollFirmName}, tarih: ${prev.publishedAt.toISOString().split("T")[0]})`
      );
    }
  }

  // ── Önceki ankette olup yeni girişte olmayan partiler ──
  for (const [partyId, prev] of previousByParty) {
    const existsInNew = data.results.some((r) => r.partyId === partyId);

    if (!existsInNew && prev.percentage >= 5) {
      result.warnings.push(
        `Eksik parti: Onceki ankette %${prev.percentage.toFixed(1)} oy alan ` +
        `parti ${partyId} yeni giriste yok — kasitli mi kontrol edin`
      );
    }
  }

  return finalizeResult(result);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  5. BIRLEŞTIRME — ValidationResult'ları birleştir
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Birden fazla ValidationResult'ı tek bir sonuçta birleştirir.
 *
 * **Pure function.**
 *
 * @returns Tüm adımların errors ve warnings'lerini içeren birleşik sonuç
 */
export function mergeValidationResults(
  ...results: ValidationResult[]
): ValidationResult {
  const merged = createResult();

  for (const r of results) {
    merged.errors.push(...r.errors);
    merged.warnings.push(...r.warnings);
  }

  return finalizeResult(merged);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  DataValidationService CLASS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Veri kalitesi kontrol servisi.
 *
 * Pure fonksiyonları orkestre eder ve DB erişimi gerektiren
 * adımları (tutarlılık, anomali, loglama) yönetir.
 *
 * Her veri girişinde `validatePollEntry()` çağrılmalıdır.
 * Sonuç `passed: false` ise kayıt yapılmamalıdır.
 *
 * @example
 * ```ts
 * import { dataValidationService } from "@/services/validation.service";
 *
 * const report = await dataValidationService.validatePollEntry({
 *   electionId: "clxx...",
 *   pollFirmId: "clyy...",
 *   publishedAt: new Date("2025-03-01"),
 *   sampleSize: 2400,
 *   sourceUrl: "https://example.com/anket",
 *   results: [
 *     { partyId: "clzz...", percentage: 32.5 },
 *     { partyId: "claa...", percentage: 28.1 },
 *   ],
 * });
 *
 * if (!report.passed) {
 *   // Hataları göster, kayıt yapma
 *   console.error(report.allErrors);
 * }
 *
 * if (report.allWarnings.length > 0) {
 *   // Uyarıları admin panelinde göster
 *   console.warn(report.allWarnings);
 * }
 * ```
 */
class DataValidationService {
  // ────────────────────────────────────────────
  //  Private: DB Queries (pure fonksiyonlara veri sağlar)
  // ────────────────────────────────────────────

  /**
   * Tutarlılık kontrolü için mevcut kayıtları çeker.
   *
   * Bu seçim + bu firma için daha önce girilmiş tüm PollResult kayıtlarını döner.
   * Pure function `checkConsistency()` bu veriyi parametre olarak alır.
   */
  private async fetchExistingRecords(
    electionId: string,
    pollFirmId: string
  ): Promise<ExistingPollRecord[]> {
    const records = await prisma.pollResult.findMany({
      where: {
        electionId,
        pollFirmId,
        isDeleted: false,
      },
      select: {
        id: true,
        publishedAt: true,
        pollFirmId: true,
        partyId: true,
        percentage: true,
        pollFirm: {
          select: { name: true },
        },
      },
      orderBy: { publishedAt: "desc" },
    });

    return records.map((r) => ({
      id: r.id,
      publishedAt: r.publishedAt,
      pollFirmId: r.pollFirmId,
      pollFirmName: r.pollFirm.name,
      partyId: r.partyId,
      percentage: r.percentage,
    }));
  }

  /**
   * Anomali tespiti için bu seçimin en son anket sonuçlarını çeker.
   *
   * Herhangi bir firmanın yayınladığı en son anketten parti bazlı
   * sonuçları döner. Pure function `detectAnomalies()` bu veriyi alır.
   */
  private async fetchLatestPollResults(
    electionId: string
  ): Promise<PreviousPollData[]> {
    // En son yayınlanan anketin tarihini bul
    const latest = await prisma.pollResult.findFirst({
      where: {
        electionId,
        isDeleted: false,
      },
      orderBy: { publishedAt: "desc" },
      select: { publishedAt: true, pollFirmId: true },
    });

    if (!latest) return [];

    // O tarihteki tüm sonuçları çek (aynı anketin tüm parti satırları)
    const results = await prisma.pollResult.findMany({
      where: {
        electionId,
        publishedAt: latest.publishedAt,
        pollFirmId: latest.pollFirmId,
        isDeleted: false,
      },
      select: {
        partyId: true,
        percentage: true,
        publishedAt: true,
        pollFirm: {
          select: { name: true },
        },
      },
    });

    return results
      .filter((r) => r.partyId !== null)
      .map((r) => ({
        partyId: r.partyId!,
        percentage: r.percentage,
        publishedAt: r.publishedAt,
        pollFirmName: r.pollFirm.name,
      }));
  }

  /**
   * Validasyon sonucunu DataSource modeline loglar.
   *
   * notes alanına validasyon raporunun özetini yazar:
   * - Geçti/kaldı durumu
   * - Hata ve uyarı sayıları
   * - İlk 5 mesaj (uzun raporlarda kırpılır)
   */
  private async logValidationResult(
    data: PollEntryData,
    report: Omit<FullValidationReport, "dataSourceLogId">,
    httpStatus: number | null
  ): Promise<string | null> {
    try {
      // Log notlarını oluştur
      const statusLabel = report.passed ? "GECTI" : "BASARISIZ";
      const lines: string[] = [
        `[Validasyon ${statusLabel}] ${report.totalErrors} hata, ${report.totalWarnings} uyari`,
        "",
      ];

      if (report.allErrors.length > 0) {
        lines.push("HATALAR:");
        for (const err of report.allErrors.slice(0, 5)) {
          lines.push(`  - ${err}`);
        }
        if (report.allErrors.length > 5) {
          lines.push(`  ... ve ${report.allErrors.length - 5} hata daha`);
        }
        lines.push("");
      }

      if (report.allWarnings.length > 0) {
        lines.push("UYARILAR:");
        for (const warn of report.allWarnings.slice(0, 5)) {
          lines.push(`  - ${warn}`);
        }
        if (report.allWarnings.length > 5) {
          lines.push(`  ... ve ${report.allWarnings.length - 5} uyari daha`);
        }
      }

      const notesText = lines.join("\n");

      const dataSource = await prisma.dataSource.create({
        data: {
          name: `Validasyon: ${data.publishedAt.toISOString().split("T")[0]} anket kontrolu`,
          url: data.sourceUrl,
          fetchedAt: new Date(),
          httpStatus,
          verification: report.passed ? "PENDING" : "REJECTED",
          notes: notesText.slice(0, 5000), // DB alan limiti
          electionId: data.electionId,
        },
      });

      return dataSource.id;
    } catch (err) {
      console.error("[DataValidationService] Log yazma hatasi:", err);
      return null;
    }
  }

  // ────────────────────────────────────────────
  //  Public API
  // ────────────────────────────────────────────

  /**
   * Tam veri kalitesi kontrolü çalıştırır.
   *
   * Pipeline (sıralı):
   * 1. Yapısal doğrulama (Zod şema)
   * 2. Mantık kontrolü (pure: checkLogic)
   * 3. Kaynak URL doğrulama (HTTP HEAD)
   * 4. Tutarlılık kontrolü (DB okuma → pure: checkConsistency)
   * 5. Anomali tespiti (DB okuma → pure: detectAnomalies)
   * 6. Log kaydı (DataSource modeline yazma)
   *
   * Adımlar arası bağımlılık yok — herhangi bir adım başarısız
   * olsa bile diğer adımlar çalıştırılır (tüm sorunlar raporlanır).
   *
   * @param data  Anket giriş verisi
   * @returns Tam validasyon raporu
   */
  async validatePollEntry(data: PollEntryData): Promise<FullValidationReport> {
    // ── 0. Yapısal doğrulama (Zod) ──
    const structuralParse = pollEntryDataSchema.safeParse(data);
    if (!structuralParse.success) {
      const zodErrors = structuralParse.error.flatten().formErrors;
      const fieldErrors = structuralParse.error.flatten().fieldErrors;

      const allZodErrors = [
        ...zodErrors,
        ...Object.entries(fieldErrors).flatMap(
          ([field, msgs]) => (msgs ?? []).map((m) => `${field}: ${m}`)
        ),
      ];

      const emptyResult = createResult();
      const failReport: FullValidationReport = {
        passed: false,
        totalErrors: allZodErrors.length,
        totalWarnings: 0,
        steps: {
          sourceVerification: emptyResult,
          logicCheck: emptyResult,
          consistencyCheck: emptyResult,
          anomalyDetection: emptyResult,
        },
        allErrors: allZodErrors,
        allWarnings: [],
        dataSourceLogId: null,
      };

      return failReport;
    }

    // ── 1. Mantık kontrolü (pure) ──
    const logicResult = checkLogic(data);

    // ── 2. Kaynak URL doğrulama (HTTP) ──
    const urlVerification = await verifySourceUrl(data.sourceUrl);
    const sourceResult = buildSourceVerificationResult(
      data.sourceUrl,
      urlVerification
    );

    // ── 3. Tutarlılık kontrolü (DB → pure) ──
    let consistencyResult: ValidationResult;
    try {
      const existingRecords = await this.fetchExistingRecords(
        data.electionId,
        data.pollFirmId
      );
      consistencyResult = checkConsistency(data, existingRecords);
    } catch (err) {
      console.error("[DataValidationService] Tutarlilik kontrolu DB hatasi:", err);
      consistencyResult = {
        passed: true,
        errors: [],
        warnings: ["Tutarlilik kontrolu yapilamadi (DB hatasi)"],
      };
    }

    // ── 4. Anomali tespiti (DB → pure) ──
    let anomalyResult: ValidationResult;
    try {
      const previousPolls = await this.fetchLatestPollResults(data.electionId);
      anomalyResult = detectAnomalies(data, previousPolls);
    } catch (err) {
      console.error("[DataValidationService] Anomali tespiti DB hatasi:", err);
      anomalyResult = {
        passed: true,
        errors: [],
        warnings: ["Anomali tespiti yapilamadi (DB hatasi)"],
      };
    }

    // ── 5. Sonuçları birleştir ──
    const allErrors = [
      ...logicResult.errors,
      ...sourceResult.errors,
      ...consistencyResult.errors,
      ...anomalyResult.errors,
    ];
    const allWarnings = [
      ...logicResult.warnings,
      ...sourceResult.warnings,
      ...consistencyResult.warnings,
      ...anomalyResult.warnings,
    ];

    const passed = allErrors.length === 0;

    const reportWithoutLog: Omit<FullValidationReport, "dataSourceLogId"> = {
      passed,
      totalErrors: allErrors.length,
      totalWarnings: allWarnings.length,
      steps: {
        sourceVerification: sourceResult,
        logicCheck: logicResult,
        consistencyCheck: consistencyResult,
        anomalyDetection: anomalyResult,
      },
      allErrors,
      allWarnings,
    };

    // ── 6. Log kaydı ──
    const dataSourceLogId = await this.logValidationResult(
      data,
      reportWithoutLog,
      urlVerification.httpStatus
    );

    const fullReport: FullValidationReport = {
      ...reportWithoutLog,
      dataSourceLogId,
    };

    // ── Console log ──
    const logPrefix = passed ? "GECTI" : "BASARISIZ";
    console.log(
      `[DataValidationService] Validasyon ${logPrefix}: ` +
      `${allErrors.length} hata, ${allWarnings.length} uyari`
    );

    return fullReport;
  }

  /**
   * Sadece pure kontrolleri çalıştırır (DB erişimi olmadan).
   *
   * Client-side preview veya test senaryoları için kullanılabilir.
   * Tutarlılık ve anomali kontrolleri atlanır.
   *
   * @param data  Anket giriş verisi
   * @returns Mantık kontrol sonucu
   */
  validatePollEntryOffline(data: PollEntryData): ValidationResult {
    return checkLogic(data);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  SINGLETON EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Singleton veri kalitesi kontrol servisi.
 *
 * @example
 * ```ts
 * import { dataValidationService } from "@/services/validation.service";
 *
 * // Tam validasyon (DB + HTTP kontrolleri dahil)
 * const report = await dataValidationService.validatePollEntry(data);
 *
 * if (!report.passed) {
 *   return { success: false, errors: report.allErrors };
 * }
 *
 * // Uyarıları admin panelinde göster
 * if (report.allWarnings.length > 0) {
 *   notifyAdmin(report.allWarnings);
 * }
 * ```
 */
export const dataValidationService = new DataValidationService();
