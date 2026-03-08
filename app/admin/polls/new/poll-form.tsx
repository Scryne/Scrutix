"use client";

// ╔══════════════════════════════════════════════════════════════════╗
// ║  PollEntryForm — Admin Anket Sonucu Giriş Formu                ║
// ║                                                                 ║
// ║  Özellikler:                                                    ║
// ║  - React Hook Form + Zod validasyon                             ║
// ║  - Seçim → parti dinamik yükleme                                ║
// ║  - Mevcut firma seç veya yeni firma oluştur toggle              ║
// ║  - Toplam oy oranı canlı hesaplama                              ║
// ║  - Server action ile submit (useTransition)                     ║
// ║  - Başarılı kayıt → /admin yönlendirme                         ║
// ╚══════════════════════════════════════════════════════════════════╝

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Plus, Trash2, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  Checkbox,
  Separator,
} from "@/components/ui";

import { adminPollEntrySchema } from "@/lib/validators";
import { formatPercentage } from "@/lib/utils";

import type {
  ElectionOption,
  PollFirmOption,
  PartyForElection,
  ActionResult,
} from "./actions";
import {
  getPartiesByElection,
  createPollEntry,
} from "./actions";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type FormValues = z.input<typeof adminPollEntrySchema>;

interface PollEntryFormProps {
  elections: ElectionOption[];
  pollFirms: PollFirmOption[];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  METHODOLOGY OPTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const METHODOLOGY_OPTIONS = [
  { value: "CATI", label: "Telefon (CATI)" },
  { value: "CAPI", label: "Yuz yuze (CAPI)" },
  { value: "ONLINE", label: "Online" },
] as const;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function PollEntryForm({ elections, pollFirms }: PollEntryFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // ── Local state ──
  const [isNewFirm, setIsNewFirm] = useState(false);
  const [parties, setParties] = useState<PartyForElection[]>([]);
  const [partiesLoading, setPartiesLoading] = useState(false);
  const [actionResult, setActionResult] = useState<ActionResult | null>(null);

  // ── React Hook Form ──
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(adminPollEntrySchema),
    defaultValues: {
      electionId: "",
      pollFirmId: "",
      newPollFirm: undefined,
      publishedAt: "" as unknown as Date,
      sampleSize: "" as unknown as number,
      methodology: undefined,
      results: [],
      sourceUrl: "",
      notes: "",
      isVerified: false,
    },
  });

  // ── Dynamic party rows ──
  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "results",
  });

  // ── Watch values for live computation ──
  const watchedElectionId = watch("electionId");
  const watchedResults = watch("results");

  // ── Total percentage ──
  const totalPercentage = (watchedResults ?? []).reduce(
    (sum, r) => sum + (Number(r?.percentage) || 0),
    0
  );
  const totalExceeds100 = totalPercentage > 100;

  // ── Load parties when election changes ──
  const loadParties = useCallback(async (electionId: string) => {
    if (!electionId) {
      setParties([]);
      replace([]);
      return;
    }

    setPartiesLoading(true);
    try {
      const data = await getPartiesByElection(electionId);
      setParties(data);

      // Mevcut satırları seçime göre sıfırla, parti satırlarını otomatik ekle
      replace(
        data.map((p) => ({
          partyId: p.id,
          percentage: 0,
        }))
      );
    } catch (err) {
      console.error("Parti yukleme hatasi:", err);
      setParties([]);
      replace([]);
    } finally {
      setPartiesLoading(false);
    }
  }, [replace]);

  useEffect(() => {
    if (watchedElectionId) {
      loadParties(watchedElectionId);
    }
  }, [watchedElectionId, loadParties]);

  // ── Toggle new firm mode ──
  useEffect(() => {
    if (isNewFirm) {
      setValue("pollFirmId", "");
    } else {
      setValue("newPollFirm", undefined);
    }
  }, [isNewFirm, setValue]);

  // ── Form submit ──
  const onSubmit = useCallback(
    (values: FormValues) => {
      setActionResult(null);

      // FormData oluştur (server action formatı)
      const formData = new FormData();
      formData.set("electionId", values.electionId);

      if (values.pollFirmId) {
        formData.set("pollFirmId", values.pollFirmId);
      }
      if (values.newPollFirm) {
        formData.set("newPollFirmName", values.newPollFirm.name);
        if (values.newPollFirm.website) {
          formData.set("newPollFirmWebsite", values.newPollFirm.website);
        }
      }

      formData.set(
        "publishedAt",
        values.publishedAt instanceof Date
          ? values.publishedAt.toISOString()
          : String(values.publishedAt)
      );
      formData.set("sampleSize", String(values.sampleSize));

      if (values.methodology) {
        formData.set("methodology", values.methodology);
      }

      formData.set("sourceUrl", values.sourceUrl);

      if (values.notes) {
        formData.set("notes", values.notes);
      }

      formData.set("isVerified", values.isVerified ? "true" : "false");

      // Dinamik parti sonuçları
      (values.results ?? []).forEach((r, i) => {
        formData.set(`results[${i}].partyId`, r.partyId);
        formData.set(`results[${i}].percentage`, String(r.percentage));
      });

      startTransition(async () => {
        const result = await createPollEntry(null, formData);
        setActionResult(result);

        if (result.success) {
          reset();
          // 2 saniye sonra admin paneline yönlendir
          setTimeout(() => {
            router.push("/admin");
          }, 2000);
        }
      });
    },
    [reset, router]
  );

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  //  RENDER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* ── Action Result Banner ── */}
      {actionResult && (
        <div
          role="alert"
          className={`flex items-start gap-3 rounded-md border px-4 py-3 text-sm ${actionResult.success
            ? "border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400"
            : "border-destructive/50 bg-destructive/10 text-destructive"
            }`}
        >
          {actionResult.success ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          <span>{actionResult.message}</span>
        </div>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/*  BÖLÜM 1 — Seçim & Firma                   */}
      {/* ═══════════════════════════════════════════ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Secim ve Anket Sirketi</CardTitle>
          <CardDescription>
            Anket sonucunun ait oldugu secimi ve anketi yapan firmay secin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Seçim */}
          <div className="space-y-2">
            <Label htmlFor="electionId">Secim *</Label>
            <Select
              value={watchedElectionId}
              onValueChange={(val) => setValue("electionId", val, { shouldValidate: true })}
            >
              <SelectTrigger id="electionId">
                <SelectValue placeholder="Bir secim secin..." />
              </SelectTrigger>
              <SelectContent>
                {elections.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.title} ({e.date})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.electionId && (
              <p className="text-sm text-destructive">{errors.electionId.message}</p>
            )}
          </div>

          <Separator />

          {/* Anket Şirketi Toggle */}
          <div className="flex items-center gap-2">
            <Label>Anket Sirketi *</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="ml-auto text-xs"
              onClick={() => setIsNewFirm(!isNewFirm)}
            >
              {isNewFirm ? "Mevcut firmadan sec" : "+ Yeni firma ekle"}
            </Button>
          </div>

          {isNewFirm ? (
            // ── Yeni firma oluşturma ──
            <div className="space-y-3 rounded-md border border-dashed p-4">
              <div className="space-y-2">
                <Label htmlFor="newPollFirmName">Firma Adi *</Label>
                <Input
                  id="newPollFirmName"
                  placeholder="Ornek: MetroPOLL"
                  {...register("newPollFirm.name")}
                />
                {errors.newPollFirm?.name && (
                  <p className="text-sm text-destructive">
                    {errors.newPollFirm.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPollFirmWebsite">
                  Web Sitesi{" "}
                  <span className="text-muted-foreground font-normal">(opsiyonel)</span>
                </Label>
                <Input
                  id="newPollFirmWebsite"
                  type="url"
                  placeholder="https://..."
                  {...register("newPollFirm.website")}
                />
                {errors.newPollFirm?.website && (
                  <p className="text-sm text-destructive">
                    {errors.newPollFirm.website.message}
                  </p>
                )}
              </div>
            </div>
          ) : (
            // ── Mevcut firma seçimi ──
            <div className="space-y-2">
              <Select
                value={watch("pollFirmId") ?? ""}
                onValueChange={(val) =>
                  setValue("pollFirmId", val, { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Anket sirketi secin..." />
                </SelectTrigger>
                <SelectContent>
                  {pollFirms.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.pollFirmId && (
                <p className="text-sm text-destructive">
                  {errors.pollFirmId.message}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════ */}
      {/*  BÖLÜM 2 — Anket Detayları                 */}
      {/* ═══════════════════════════════════════════ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Anket Detaylari</CardTitle>
          <CardDescription>
            Yayin tarihi, orneklem buyuklugu ve anket yontemini girin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Yayın Tarihi */}
            <div className="space-y-2">
              <Label htmlFor="publishedAt">Yayin Tarihi *</Label>
              <Input
                id="publishedAt"
                type="date"
                max={new Date().toISOString().split("T")[0]}
                {...register("publishedAt")}
              />
              {errors.publishedAt && (
                <p className="text-sm text-destructive">
                  {errors.publishedAt.message}
                </p>
              )}
            </div>

            {/* Örneklem Büyüklüğü */}
            <div className="space-y-2">
              <Label htmlFor="sampleSize">Orneklem Buyuklugu *</Label>
              <Input
                id="sampleSize"
                type="number"
                min={200}
                placeholder="Ornek: 2400"
                {...register("sampleSize")}
              />
              {errors.sampleSize && (
                <p className="text-sm text-destructive">
                  {errors.sampleSize.message}
                </p>
              )}
            </div>
          </div>

          {/* Yöntem */}
          <div className="space-y-2">
            <Label>
              Anket Yontemi{" "}
              <span className="text-muted-foreground font-normal">(opsiyonel)</span>
            </Label>
            <Select
              value={watch("methodology") ?? ""}
              onValueChange={(val) =>
                setValue(
                  "methodology",
                  val as "CATI" | "CAPI" | "ONLINE" | undefined,
                  { shouldValidate: true }
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Yontem secin..." />
              </SelectTrigger>
              <SelectContent>
                {METHODOLOGY_OPTIONS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════ */}
      {/*  BÖLÜM 3 — Parti Oy Oranları               */}
      {/* ═══════════════════════════════════════════ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Parti Oy Oranlari</CardTitle>
          <CardDescription>
            Secime bagli partiler otomatik yuklenir. Her parti icin oy oranini girin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Seçim seçilmedi uyarısı */}
          {!watchedElectionId && (
            <p className="text-sm text-muted-foreground">
              Once bir secim secin, partiler otomatik yuklenecektir.
            </p>
          )}

          {/* Yükleniyor */}
          {partiesLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Partiler yukleniyor...
            </div>
          )}

          {/* Parti satırları */}
          {!partiesLoading && fields.length > 0 && (
            <div className="space-y-3">
              {/* Başlık satırı */}
              <div className="grid grid-cols-[1fr_120px_40px] items-center gap-2 text-xs font-medium text-muted-foreground">
                <span>Parti</span>
                <span>Oy Orani (%)</span>
                <span />
              </div>

              {fields.map((field, index) => {
                const party = parties.find(
                  (p) => p.id === field.partyId
                );

                return (
                  <div
                    key={field.id}
                    className="grid grid-cols-[1fr_120px_40px] items-center gap-2"
                  >
                    {/* Parti adı + renk */}
                    <div className="flex items-center gap-2">
                      {party && (
                        <div
                          className="h-3 w-3 shrink-0 rounded-full"
                          style={{ backgroundColor: party.color }}
                        />
                      )}
                      <span className="text-sm font-medium">
                        {party
                          ? `${party.abbreviation} — ${party.name}`
                          : "Bilinmeyen Parti"}
                      </span>
                      <input
                        type="hidden"
                        {...register(`results.${index}.partyId`)}
                      />
                    </div>

                    {/* Oy oranı input */}
                    <Input
                      type="number"
                      step="0.1"
                      min={0}
                      max={100}
                      placeholder="0.0"
                      className="h-9"
                      {...register(`results.${index}.percentage`, {
                        valueAsNumber: true,
                      })}
                    />

                    {/* Satır sil butonu */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground hover:text-destructive"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}

              {/* Satır ekleme butonu */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => {
                  // Henüz eklenmemiş partilerden biri varsa onu ekle
                  const usedIds = new Set(fields.map((f) => f.partyId));
                  const unused = parties.find((p) => !usedIds.has(p.id));

                  append({
                    partyId: unused?.id ?? "",
                    percentage: 0,
                  });
                }}
              >
                <Plus className="mr-1 h-4 w-4" />
                Satir Ekle
              </Button>

              {/* Form-level errors */}
              {errors.results && !Array.isArray(errors.results) && (
                <p className="text-sm text-destructive">
                  {(errors.results as { message?: string }).message}
                </p>
              )}
              {errors.results && "root" in errors.results && (
                <p className="text-sm text-destructive">
                  {errors.results.root?.message}
                </p>
              )}
            </div>
          )}

          {/* Boş parti listesi */}
          {!partiesLoading && watchedElectionId && fields.length === 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Bu secime bagli parti bulunamadi. Manuel olarak satir ekleyebilirsiniz.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ partyId: "", percentage: 0 })}
              >
                <Plus className="mr-1 h-4 w-4" />
                Satir Ekle
              </Button>
            </div>
          )}

          {/* Toplam oy oranı */}
          {fields.length > 0 && (
            <>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Toplam</span>
                <span
                  className={`font-bold ${totalExceeds100
                    ? "text-destructive"
                    : totalPercentage === 100
                      ? "text-green-600 dark:text-green-400"
                      : "text-muted-foreground"
                    }`}
                >
                  {formatPercentage(totalPercentage)}
                  {totalExceeds100 && (
                    <span className="ml-2 font-normal">
                      (%100&apos;u gecemez)
                    </span>
                  )}
                </span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════ */}
      {/*  BÖLÜM 4 — Kaynak & Notlar                 */}
      {/* ═══════════════════════════════════════════ */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Kaynak ve Notlar</CardTitle>
          <CardDescription>
            Anket sonucunun kaynak URL&apos;sini ekleyin.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Kaynak URL */}
          <div className="space-y-2">
            <Label htmlFor="sourceUrl">Kaynak URL *</Label>
            <Input
              id="sourceUrl"
              type="url"
              placeholder="https://..."
              {...register("sourceUrl")}
            />
            {errors.sourceUrl && (
              <p className="text-sm text-destructive">
                {errors.sourceUrl.message}
              </p>
            )}
          </div>

          {/* Notlar */}
          <div className="space-y-2">
            <Label htmlFor="notes">
              Notlar{" "}
              <span className="text-muted-foreground font-normal">(opsiyonel)</span>
            </Label>
            <Textarea
              id="notes"
              placeholder="Anketle ilgili ek notlarinizi buraya yazabilirsiniz..."
              rows={3}
              {...register("notes")}
            />
            {errors.notes && (
              <p className="text-sm text-destructive">{errors.notes.message}</p>
            )}
          </div>

          <Separator />

          {/* Doğrulama checkbox */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="isVerified"
              checked={watch("isVerified")}
              onCheckedChange={(checked) =>
                setValue("isVerified", checked === true)
              }
            />
            <div className="space-y-1">
              <Label htmlFor="isVerified" className="cursor-pointer">
                Bu anket sonucunu dogrulanmis olarak isaretle
              </Label>
              <p className="text-xs text-muted-foreground">
                Isaretlerseniz, veri kaynagi &quot;Dogrulanmis&quot; olarak kaydedilir.
                Aksi halde &quot;Beklemede&quot; durumunda kalir.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════════ */}
      {/*  SUBMIT                                     */}
      {/* ═══════════════════════════════════════════ */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin")}
          disabled={isPending}
        >
          Iptal
        </Button>
        <Button type="submit" disabled={isPending || totalExceeds100}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Kaydediliyor...
            </>
          ) : (
            "Anket Sonucunu Kaydet"
          )}
        </Button>
      </div>
    </form>
  );
}
