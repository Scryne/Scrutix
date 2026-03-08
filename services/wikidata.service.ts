// ╔══════════════════════════════════════════════════════════════════╗
// ║  Wikidata SPARQL Service                                       ║
// ║  Türkiye seçim ve parti verilerini Wikidata'dan çeker,         ║
// ║  validate eder ve Scrutix veritabanına senkronize eder.        ║
// ║                                                                ║
// ║  ⚠ Server-side only — crypto ve Prisma kullanır.               ║
// ║  Client component'larda doğrudan import etmeyin.               ║
// ╚══════════════════════════════════════════════════════════════════╝

import { z } from "zod";
import { createHash } from "crypto";
import prisma from "@/lib/prisma";
import { slugify, sleep } from "@/lib/utils";
import type { ElectionType, ElectionStatus } from "@prisma/client";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  CONSTANTS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const WIKIDATA_SPARQL_ENDPOINT = "https://query.wikidata.org/sparql";

/** Wikidata politikası gereği tanımlayıcı User-Agent zorunludur. */
const USER_AGENT = "Scrutix/1.0 (Election Tracker; https://github.com/scrutix)";

/** Wikidata rate limit: max 1 istek/saniye. 100ms güvenlik payı. */
const MIN_REQUEST_INTERVAL_MS = 1100;

/** 429 hatası alındığında max retry sayısı. */
const MAX_RETRIES = 2;

/** Varsayılan parti rengi — Wikidata'da renk kodu bulunamazsa. */
const DEFAULT_PARTY_COLOR = "#808080";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  SPARQL QUERIES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Türkiye'deki genel seçimleri (1950+) çeken SPARQL sorgusu.
 *
 * Kullanılan Wikidata property'leri:
 *   P31  (instance of)        → seçim türü sınıflandırması
 *   P279 (subclass of)        → üst sınıf zinciri takibi (election → general election → ...)
 *   P17  (country)            → ülke filtresi: Q43 = Türkiye
 *   P585 (point in time)      → seçim tarihi
 *   P1868 (ballots cast)      → kullanılan oy sayısı
 *   P1867 (eligible voters)   → kayıtlı seçmen sayısı
 *   P991 (successful candidate) → kazanan aday veya parti
 *
 * DISTINCT kullanılır: bazı seçimler birden fazla P31 değerine sahip olabilir
 * ve aynı entity farklı sınıflandırmalarla birden fazla satırda dönebilir.
 *
 * SERVICE wikibase:label ile Türkçe etiketler çözümlenir (fallback: İngilizce).
 */
const SPARQL_ELECTIONS_QUERY = `
SELECT DISTINCT
  ?election ?electionLabel ?date
  ?type ?typeLabel
  ?winner ?winnerLabel
  ?totalVotes ?eligibleVoters
WHERE {
  # Seçim entity'si: "election" (Q40231) veya herhangi bir alt sınıfının instance'ı.
  # P279* ile transitive closure — "Turkish general election" gibi spesifik sınıfları da yakalar.
  ?election wdt:P31/wdt:P279* wd:Q40231 .

  # Ülke filtresi: yalnızca Türkiye (Q43) ile ilişkili seçimler.
  ?election wdt:P17 wd:Q43 .

  # Tarih zorunlu — tarihi olmayan kayıtlar sonuçtan hariç tutulur.
  ?election wdt:P585 ?date .

  # Seçim türü (opsiyonel): "general election", "presidential election" vb.
  # Label ile ElectionType enum'a eşleştirilecek.
  OPTIONAL { ?election wdt:P31 ?type . }

  # Kazanan aday/parti (opsiyonel): her seçimde tanımlı olmayabilir.
  OPTIONAL { ?election wdt:P991 ?winner . }

  # Kullanılan oy ve kayıtlı seçmen sayısı (opsiyonel): katılım oranı hesabı için.
  # turnout = totalVotes / eligibleVoters * 100
  OPTIONAL { ?election wdt:P1868 ?totalVotes . }
  OPTIONAL { ?election wdt:P1867 ?eligibleVoters . }

  # Etiket servisi — Türkçe öncelikli, İngilizce fallback.
  SERVICE wikibase:label { bd:serviceParam wikibase:language "tr,en" . }

  # 1950 filtresi: çok partili demokratik dönem başlangıcı.
  FILTER(YEAR(?date) >= 1950)
}
ORDER BY ?date
`;

/**
 * Türkiye'deki siyasi partileri çeken SPARQL sorgusu.
 *
 * Kullanılan Wikidata property'leri:
 *   P31   (instance of)          → Q7278 (political party)
 *   P17   (country)              → Q43 (Türkiye)
 *   P1813 (short name)           → parti kısaltması (AKP, CHP, MHP vb.)
 *   P571  (inception)            → kuruluş tarihi
 *   P1142 (political ideology)   → siyasi ideoloji entity'si (label alınır)
 *   P462  (color)                → renk entity'si
 *   P465  (sRGB color hex)       → hex renk kodu (#RRGGBB)
 *
 * Renk çıkarma iki hop gerektirir: parti → P462 → renk entity → P465 → hex string.
 * Kısa ad için dil filtresi: Türkçe, İngilizce veya dil belirtilmemiş.
 */
const SPARQL_PARTIES_QUERY = `
SELECT DISTINCT
  ?party ?partyLabel
  ?shortName
  ?inception
  ?ideology ?ideologyLabel
  ?color
WHERE {
  # Siyasi parti instance'ı: Q7278 = political party
  ?party wdt:P31 wd:Q7278 .

  # Ülke filtresi: Türkiye
  ?party wdt:P17 wd:Q43 .

  # Kısa ad / kısaltma (opsiyonel)
  # Dil filtresi: tr > en > dil belirtilmemiş
  OPTIONAL {
    ?party wdt:P1813 ?shortName .
    FILTER(LANG(?shortName) IN ("tr", "en", ""))
  }

  # Kuruluş tarihi (opsiyonel)
  OPTIONAL { ?party wdt:P571 ?inception . }

  # Siyasi ideoloji (opsiyonel): entity'nin Türkçe label'ı alınır.
  OPTIONAL { ?party wdt:P1142 ?ideology . }

  # Renk kodu (opsiyonel): P462 → renk entity → P465 → hex triplet
  OPTIONAL {
    ?party wdt:P462 ?colorEntity .
    ?colorEntity wdt:P465 ?color .
  }

  SERVICE wikibase:label { bd:serviceParam wikibase:language "tr,en" . }
}
ORDER BY ?partyLabel
`;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  ZOD SCHEMAS — Wikidata SPARQL JSON Response
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Wikidata SPARQL API her değeri bu formatta döner:
 * {
 *   type: "uri" | "literal" | "typed-literal" | "bnode",
 *   value: "...",
 *   datatype?: "http://www.w3.org/2001/XMLSchema#dateTime",
 *   "xml:lang"?: "tr"
 * }
 */
const wikidataValueSchema = z.object({
  type: z.string(),
  value: z.string(),
  datatype: z.string().optional(),
  "xml:lang": z.string().optional(),
});

/** Opsiyonel Wikidata değeri — SPARQL OPTIONAL clause alanları için. */
const optionalWikidataValue = wikidataValueSchema.optional();

/** Seçim sorgusu: tek bir binding satırının şeması. */
const electionBindingSchema = z.object({
  election: wikidataValueSchema,
  electionLabel: wikidataValueSchema,
  date: wikidataValueSchema,
  type: optionalWikidataValue,
  typeLabel: optionalWikidataValue,
  winner: optionalWikidataValue,
  winnerLabel: optionalWikidataValue,
  totalVotes: optionalWikidataValue,
  eligibleVoters: optionalWikidataValue,
});

/** Parti sorgusu: tek bir binding satırının şeması. */
const partyBindingSchema = z.object({
  party: wikidataValueSchema,
  partyLabel: wikidataValueSchema,
  shortName: optionalWikidataValue,
  inception: optionalWikidataValue,
  ideology: optionalWikidataValue,
  ideologyLabel: optionalWikidataValue,
  color: optionalWikidataValue,
});

/**
 * SPARQL JSON response wrapper factory.
 * Her sorgu tipi için aynı üst yapı, farklı binding şeması.
 */
function createSparqlResponseSchema<T extends z.ZodType>(bindingSchema: T) {
  return z.object({
    results: z.object({
      bindings: z.array(bindingSchema),
    }),
  });
}

const electionResponseSchema = createSparqlResponseSchema(electionBindingSchema);
const partyResponseSchema = createSparqlResponseSchema(partyBindingSchema);

// Inferred types
type ElectionBinding = z.infer<typeof electionBindingSchema>;
type PartyBinding = z.infer<typeof partyBindingSchema>;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  EXPORTED TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** Her sync işleminin sonuç raporu. */
export interface SyncResult {
  /** Hangi veri kaynağı senkronize edildi. */
  source: "elections" | "parties";
  /** Başarıyla upsert edilen kayıt sayısı. */
  synced: number;
  /** Transform/validation hatası nedeniyle atlanan kayıt sayısı. */
  skipped: number;
  /** Veritabanı hatası nedeniyle kaydedilemeyen kayıt sayısı. */
  errors: number;
  /** Şüpheli ama kaydedilen veriler hakkında uyarılar. */
  warnings: string[];
  /** Oluşturulan DataSource kaydının ID'si (null = log oluşturulamadı). */
  dataSourceId: string | null;
  /** İşlem süresi (ms). */
  duration: number;
}

/** syncAll() birleşik sonuç tipi. */
export interface SyncAllResult {
  elections: SyncResult;
  parties: SyncResult;
  totalDuration: number;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  INTERNAL TYPES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/** Transform sonrası seçim upsert verisi (Prisma-ready). */
interface ElectionUpsertData {
  slug: string;
  title: string;
  type: ElectionType;
  status: ElectionStatus;
  country: string;
  date: Date;
  turnout: number | null;
  description: string | null;
  wikidataQId: string; // Log/debug amaçlı, DB'ye yazılmaz
}

/** Transform sonrası parti upsert verisi (Prisma-ready). */
interface PartyUpsertData {
  slug: string;
  name: string;
  abbreviation: string;
  color: string;
  country: string;
  founded: number | null;
  ideology: string | null;
  wikidataQId: string; // Log/debug amaçlı, DB'ye yazılmaz
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  CUSTOM ERROR CLASSES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Wikidata SPARQL fetch hatası.
 * Network hatası veya HTTP 4xx/5xx durumlarında fırlatılır.
 */
export class WikidataFetchError extends Error {
  constructor(
    message: string,
    public httpStatus: number | null,
    public responseBody?: string
  ) {
    super(message);
    this.name = "WikidataFetchError";
  }
}

/**
 * Wikidata response validation hatası.
 * Zod şema validasyonu başarısız olduğunda fırlatılır.
 */
export class WikidataValidationError extends Error {
  constructor(
    message: string,
    public zodError: z.ZodError
  ) {
    super(message);
    this.name = "WikidataValidationError";
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  HELPER FUNCTIONS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Wikidata entity URI'dan Q-ID çıkarır.
 * @example extractQId("http://www.wikidata.org/entity/Q12345") → "Q12345"
 */
function extractQId(uri: string): string {
  const match = uri.match(/Q\d+$/);
  return match?.[0] ?? uri;
}

/** SPARQL binding'den düz string çıkarır. Tanımsız ise null döner. */
function extractValue(
  binding: z.infer<typeof wikidataValueSchema> | undefined
): string | null {
  return binding?.value ?? null;
}

/** SPARQL binding'den sayısal değer çıkarır. Geçersiz ise null döner. */
function extractNumber(
  binding: z.infer<typeof wikidataValueSchema> | undefined
): number | null {
  const raw = extractValue(binding);
  if (raw === null) return null;
  const num = parseFloat(raw);
  return isNaN(num) ? null : num;
}

/**
 * SPARQL date binding'den Date objesi oluşturur.
 * Wikidata tarihleri ISO 8601: "2023-05-14T00:00:00Z"
 */
function extractDate(
  binding: z.infer<typeof wikidataValueSchema> | undefined
): Date | null {
  const raw = extractValue(binding);
  if (raw === null) return null;
  const date = new Date(raw);
  return isNaN(date.getTime()) ? null : date;
}

/** SPARQL date binding'den sadece yıl çıkarır (kuruluş tarihi vb. için). */
function extractYear(
  binding: z.infer<typeof wikidataValueSchema> | undefined
): number | null {
  const date = extractDate(binding);
  return date ? date.getFullYear() : null;
}

/** SHA-256 checksum hesaplar (veri bütünlüğü kontrolü için). */
function computeChecksum(data: string): string {
  return createHash("sha256").update(data, "utf-8").digest("hex");
}

/**
 * Wikidata seçim türü label → Prisma ElectionType enum eşlemesi.
 *
 * Wikidata'daki typeLabel değerleri tutarlı olmayabilir (farklı dillerde,
 * farklı sınıflandırmalarla gelebilir). Substring-based case-insensitive
 * matching ile en iyi eşleşmeyi buluyoruz.
 *
 * Eşleşme bulunamazsa PARLIAMENTARY varsayılır (1950+ dönemde en yaygın tür).
 */
const ELECTION_TYPE_PATTERNS: ReadonlyArray<{
  pattern: RegExp;
  type: ElectionType;
}> = [
    {
      pattern: /cumhurba[sş]kanl[ıi][gğ][ıi]|presidential/i,
      type: "PRESIDENTIAL",
    },
    {
      pattern: /genel se[cç]im|general election|parliamentary/i,
      type: "PARLIAMENTARY",
    },
    { pattern: /yerel|local/i, type: "LOCAL" },
    { pattern: /belediye|municipal/i, type: "MUNICIPAL" },
    { pattern: /referandum|referendum|halk oylamas[ıi]/i, type: "REFERENDUM" },
    { pattern: /ara se[cç]im|by.election/i, type: "BY_ELECTION" },
  ];

function mapElectionType(
  typeLabel: string | null
): { type: ElectionType; confident: boolean } {
  if (!typeLabel) return { type: "PARLIAMENTARY", confident: false };

  for (const { pattern, type } of ELECTION_TYPE_PATTERNS) {
    if (pattern.test(typeLabel)) {
      return { type, confident: true };
    }
  }

  return { type: "PARLIAMENTARY", confident: false };
}

/** Seçim tarihine göre status belirler: geçmişte ise COMPLETED, gelecekte ise UPCOMING. */
function determineElectionStatus(date: Date): ElectionStatus {
  return date < new Date() ? "COMPLETED" : "UPCOMING";
}

/**
 * Hex renk kodu validasyonu ve normalizasyonu.
 *
 * Wikidata'dan gelen değer "#" prefix'siz olabilir (P465 sadece hex triplet döner).
 * 3 haneli kısa hex'i 6 haneliye genişletir.
 * Geçersiz değerler için null döner.
 *
 * @example normalizeHexColor("FF0000") → "#FF0000"
 * @example normalizeHexColor("#F00")   → "#FF0000"
 * @example normalizeHexColor("xyz")    → null
 */
function normalizeHexColor(raw: string | null): string | null {
  if (!raw) return null;

  const hex = raw.replace(/^#/, "").trim();

  // 6 haneli hex
  if (/^[0-9A-Fa-f]{6}$/.test(hex)) {
    return `#${hex}`;
  }

  // 3 haneli kısa hex → 6 haneli
  if (/^[0-9A-Fa-f]{3}$/.test(hex)) {
    const expanded = hex
      .split("")
      .map((c) => c + c)
      .join("");
    return `#${expanded}`;
  }

  return null;
}

/**
 * Boş SyncResult objesi oluşturur.
 * Her sync metodu başlangıçta bunu kullanır.
 */
function createEmptySyncResult(
  source: SyncResult["source"]
): SyncResult {
  return {
    source,
    synced: 0,
    skipped: 0,
    errors: 0,
    warnings: [],
    dataSourceId: null,
    duration: 0,
  };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  WikidataService CLASS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Wikidata SPARQL API üzerinden Türkiye seçim ve parti verilerini
 * çekip Scrutix veritabanına senkronize eden servis.
 *
 * Özellikler:
 * - Rate limiting (max 1 istek/saniye, Wikidata politikasına uygun)
 * - Zod ile response validasyonu (tip güvenliği)
 * - Şüpheli veri tespiti ve loglama (kaydetmeden atlama)
 * - Her fetch işlemi DataSource modeline loglanır (izlenebilirlik)
 * - Slug bazlı upsert stratejisi (varsa güncelle, yoksa oluştur)
 *
 * @example
 * ```ts
 * import { wikidataService } from "@/services/wikidata.service";
 *
 * // Tüm verileri senkronize et (önce partiler, sonra seçimler)
 * const result = await wikidataService.syncAll();
 * console.log(`Partiler: ${result.parties.synced} synced`);
 * console.log(`Seçimler: ${result.elections.synced} synced`);
 *
 * // Sadece seçimleri senkronize et
 * const electionResult = await wikidataService.syncElections();
 * if (electionResult.warnings.length > 0) {
 *   console.warn("Uyarılar:", electionResult.warnings);
 * }
 *
 * // Sadece partileri senkronize et
 * const partyResult = await wikidataService.syncParties();
 * ```
 */
class WikidataService {
  /** Son HTTP isteğinin zaman damgası — rate limiting kontrolü için. */
  private lastRequestTime = 0;

  // ────────────────────────────────────────────
  //  Private: HTTP & Rate Limiting
  // ────────────────────────────────────────────

  /**
   * Rate-limited SPARQL sorgusu çalıştırır.
   *
   * - Minimum 1100ms aralık enforce eder (Wikidata: max 1 req/s)
   * - 429 (Too Many Requests) → Retry-After header'a göre bekleyip yeniden dener
   * - Max {@link MAX_RETRIES} retry (sonsuz döngüyü önlemek için)
   *
   * @param query   SPARQL sorgu string'i
   * @param retryCount  Mevcut retry sayısı (recursive çağrılarda artar)
   * @throws Network hatası veya retry limiti aşılırsa
   */
  private async rateLimitedFetch(
    query: string,
    retryCount = 0
  ): Promise<Response> {
    // ── Rate limit enforcement ──
    const elapsed = Date.now() - this.lastRequestTime;
    if (elapsed < MIN_REQUEST_INTERVAL_MS) {
      await sleep(MIN_REQUEST_INTERVAL_MS - elapsed);
    }
    this.lastRequestTime = Date.now();

    // ── SPARQL endpoint URL ──
    const url = new URL(WIKIDATA_SPARQL_ENDPOINT);
    url.searchParams.set("query", query);
    url.searchParams.set("format", "json");

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/sparql-results+json",
        "User-Agent": USER_AGENT,
      },
    });

    // ── 429 Too Many Requests → retry with backoff ──
    if (response.status === 429 && retryCount < MAX_RETRIES) {
      const retryAfterRaw = response.headers.get("Retry-After");
      const retryAfterSec = retryAfterRaw
        ? parseInt(retryAfterRaw, 10)
        : 5;
      const waitMs = (isNaN(retryAfterSec) ? 5 : retryAfterSec) * 1000;

      console.warn(
        `[WikidataService] Rate limited (429). ` +
        `Retry ${retryCount + 1}/${MAX_RETRIES}, ${waitMs}ms bekleniyor...`
      );

      await sleep(waitMs);
      return this.rateLimitedFetch(query, retryCount + 1);
    }

    return response;
  }

  /**
   * SPARQL sorgusunu çalıştırır, response'u Zod ile validate eder.
   *
   * Pipeline: fetch → text → JSON parse → Zod validate
   *
   * @returns Validate edilmiş data + raw body (checksum için) + HTTP status
   * @throws {@link WikidataFetchError} HTTP hatası
   * @throws {@link WikidataValidationError} Zod validation hatası
   */
  private async executeSparql<T>(
    query: string,
    schema: z.ZodType<T>
  ): Promise<{ data: T; rawBody: string; httpStatus: number }> {
    const response = await this.rateLimitedFetch(query);
    const rawBody = await response.text();

    if (!response.ok) {
      throw new WikidataFetchError(
        `Wikidata SPARQL hatası: HTTP ${response.status}`,
        response.status,
        rawBody.slice(0, 500) // Hata mesajında body'nin ilk 500 char'ı
      );
    }

    // JSON parse
    let json: unknown;
    try {
      json = JSON.parse(rawBody);
    } catch {
      throw new WikidataFetchError(
        "Wikidata response JSON parse hatası",
        response.status,
        rawBody.slice(0, 500)
      );
    }

    // Zod validation
    const parseResult = schema.safeParse(json);
    if (!parseResult.success) {
      throw new WikidataValidationError(
        "Wikidata response şema validasyonu başarısız",
        parseResult.error
      );
    }

    return {
      data: parseResult.data,
      rawBody,
      httpStatus: response.status,
    };
  }

  // ────────────────────────────────────────────
  //  Private: DataSource Logging
  // ────────────────────────────────────────────

  /**
   * Her fetch işlemini DataSource modeline loglar.
   *
   * DataSource kaydı veri kaynağı izlenebilirliği sağlar:
   * - URL: tam SPARQL endpoint URL'si
   * - fetchedAt: veri çekme zamanı
   * - httpStatus: son HTTP yanıt kodu
   * - checksum: SHA-256 response hash (veri değişim tespiti)
   * - verification: PENDING (editör doğrulaması bekleniyor)
   *
   * @returns Oluşturulan DataSource kaydının ID'si
   */
  private async logDataSource(params: {
    name: string;
    url: string;
    httpStatus: number | null;
    checksum: string | null;
    notes?: string;
  }): Promise<string> {
    const dataSource = await prisma.dataSource.create({
      data: {
        name: params.name,
        url: params.url,
        fetchedAt: new Date(),
        httpStatus: params.httpStatus,
        checksum: params.checksum,
        verification: "PENDING",
        notes: params.notes ?? null,
      },
    });

    return dataSource.id;
  }

  // ────────────────────────────────────────────
  //  Private: Transform — Election
  // ────────────────────────────────────────────

  /**
   * SPARQL seçim binding'lerini Q-ID bazında deduplicate eder.
   *
   * Aynı seçim entity'si SPARQL'da birden fazla satırda dönebilir:
   * - Birden fazla P31 değeri (ör. hem "genel seçim" hem "parlamento seçimi")
   * - Birden fazla kazanan (ör. koalisyon)
   *
   * İlk binding korunur (ORDER BY date ile sıralı gelir).
   */
  private deduplicateElections(
    bindings: ElectionBinding[]
  ): Map<string, ElectionBinding> {
    const grouped = new Map<string, ElectionBinding>();

    for (const binding of bindings) {
      const qid = extractQId(binding.election.value);
      if (!grouped.has(qid)) {
        grouped.set(qid, binding);
      }
    }

    return grouped;
  }

  /**
   * Tek bir Wikidata seçim binding'ini Prisma Election upsert datasına dönüştürür.
   *
   * Şüpheli veri kontrolü (skip):
   * - Label yoksa veya Q-ID'nin kendisiyse (etiket çözümlenemedi)
   * - Tarih parse edilemezse
   *
   * Şüpheli ama kaydedilen (warning):
   * - Seçim türü otomatik belirlendiyse
   * - Turnout 0-1 aralığında geldiyse (100 ile çarpılır)
   * - Turnout 0-100 dışındaysa (null'a çevrilir)
   *
   * @returns Transform edilmiş data + warnings, veya null (skip edilmeli)
   */
  private transformElection(
    binding: ElectionBinding
  ): { data: ElectionUpsertData; warnings: string[] } | null {
    const warnings: string[] = [];
    const qid = extractQId(binding.election.value);

    // ── Zorunlu: Label ──
    const label = extractValue(binding.electionLabel);
    if (!label || label === qid) {
      console.warn(
        `[WikidataService] Seçim atlandı — label eksik veya çözümlenemedi: ${qid}`
      );
      return null;
    }

    // ── Zorunlu: Tarih ──
    const date = extractDate(binding.date);
    if (!date) {
      console.warn(
        `[WikidataService] Seçim atlandı — tarih parse edilemedi: ${qid} (raw: "${binding.date.value}")`
      );
      return null;
    }

    // ── Slug üretimi ──
    // Yıl suffix'i ile unique yapılır (farklı yıllarda aynı isimli seçimler)
    const year = date.getFullYear();
    const baseSlug = slugify(label);
    const slug = baseSlug.includes(String(year))
      ? baseSlug
      : `${baseSlug}-${year}`;

    if (!slug) {
      console.warn(
        `[WikidataService] Seçim atlandı — slug üretilemedi: ${qid} (label: "${label}")`
      );
      return null;
    }

    // ── Seçim türü ──
    // Önce typeLabel'dan, yoksa electionLabel'dan çıkarmayı dene
    const typeLabel = extractValue(binding.typeLabel);
    const combinedLabel = [typeLabel, label].filter(Boolean).join(" ");
    const { type: electionType, confident: typeConfident } =
      mapElectionType(combinedLabel);

    if (!typeConfident) {
      warnings.push(
        `Seçim türü otomatik belirlendi → PARLIAMENTARY: ${qid} ("${combinedLabel.slice(0, 80)}")`
      );
    }

    // ── Katılım oranı (turnout) ──
    let turnout: number | null = null;
    const totalVotes = extractNumber(binding.totalVotes);
    const eligibleVoters = extractNumber(binding.eligibleVoters);

    if (
      totalVotes !== null &&
      eligibleVoters !== null &&
      eligibleVoters > 0
    ) {
      turnout = (totalVotes / eligibleVoters) * 100;
    }

    // Aralık kontrolü
    if (turnout !== null && (turnout < 0 || turnout > 100)) {
      warnings.push(
        `Turnout geçersiz aralıkta (${turnout.toFixed(2)}), null olarak kaydedildi: ${qid}`
      );
      turnout = null;
    }

    // ── Kazanan ──
    const winnerLabel = extractValue(binding.winnerLabel);

    // ── Status ──
    const status = determineElectionStatus(date);

    return {
      data: {
        slug,
        title: label,
        type: electionType,
        status,
        country: "Türkiye",
        date,
        turnout: turnout !== null ? parseFloat(turnout.toFixed(2)) : null,
        description: winnerLabel ? `Kazanan: ${winnerLabel}` : null,
        wikidataQId: qid,
      },
      warnings,
    };
  }

  // ────────────────────────────────────────────
  //  Private: Transform — Party
  // ────────────────────────────────────────────

  /**
   * SPARQL parti binding'lerini Q-ID bazında deduplicate eder.
   *
   * Aynı parti birden fazla satırda dönebilir:
   * - Birden fazla ideoloji (ör. "sosyal demokrasi" + "kemalizm")
   * - Birden fazla kısa ad (farklı dillerde)
   * - Birden fazla renk
   *
   * İlk binding korunur.
   */
  private deduplicateParties(
    bindings: PartyBinding[]
  ): Map<string, PartyBinding> {
    const grouped = new Map<string, PartyBinding>();

    for (const binding of bindings) {
      const qid = extractQId(binding.party.value);
      if (!grouped.has(qid)) {
        grouped.set(qid, binding);
      }
    }

    return grouped;
  }

  /**
   * Tek bir Wikidata parti binding'ini Prisma Party upsert datasına dönüştürür.
   *
   * Şüpheli veri kontrolü (skip):
   * - Label yoksa veya Q-ID'nin kendisiyse
   * - Slug üretilemezse
   *
   * Şüpheli ama kaydedilen (warning):
   * - Abbreviation yoksa → name'den türetilir
   * - Renk kodu geçersizse → varsayılan gri (#808080)
   * - Kuruluş yılı 1800-günümüz dışındaysa → null
   *
   * @returns Transform edilmiş data + warnings, veya null (skip edilmeli)
   */
  private transformParty(
    binding: PartyBinding
  ): { data: PartyUpsertData; warnings: string[] } | null {
    const warnings: string[] = [];
    const qid = extractQId(binding.party.value);

    // ── Zorunlu: Name ──
    const name = extractValue(binding.partyLabel);
    if (!name || name === qid) {
      console.warn(
        `[WikidataService] Parti atlandı — label eksik: ${qid}`
      );
      return null;
    }

    // ── Slug ──
    const slug = slugify(name);
    if (!slug) {
      console.warn(
        `[WikidataService] Parti atlandı — slug üretilemedi: ${qid} (name: "${name}")`
      );
      return null;
    }

    // ── Abbreviation ──
    let abbreviation = extractValue(binding.shortName);
    if (!abbreviation) {
      // Name'den kısaltma türet
      if (name.length <= 20) {
        abbreviation = name;
      } else {
        // Kelimelerin baş harflerinden kısaltma
        abbreviation = name
          .split(/\s+/)
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 20);
      }
      warnings.push(
        `Kısaltma otomatik türetildi → "${abbreviation}": ${qid}`
      );
    } else if (abbreviation.length > 20) {
      abbreviation = abbreviation.slice(0, 20);
      warnings.push(`Kısaltma 20 karaktere kırpıldı: ${qid}`);
    }

    // ── Renk kodu ──
    const rawColor = extractValue(binding.color);
    let color = normalizeHexColor(rawColor);

    if (rawColor && !color) {
      warnings.push(
        `Renk kodu geçersiz ("${rawColor}"), varsayılan ${DEFAULT_PARTY_COLOR} kullanılıyor: ${qid}`
      );
    }

    if (!color) {
      color = DEFAULT_PARTY_COLOR;
      if (!rawColor) {
        warnings.push(
          `Renk kodu bulunamadı, varsayılan ${DEFAULT_PARTY_COLOR} kullanılıyor: ${qid}`
        );
      }
    }

    // ── Kuruluş tarihi ──
    const founded = extractYear(binding.inception);
    const currentYear = new Date().getFullYear();
    let validFounded: number | null = null;

    if (founded !== null) {
      if (founded >= 1800 && founded <= currentYear) {
        validFounded = founded;
      } else {
        warnings.push(
          `Kuruluş yılı şüpheli (${founded}), null olarak kaydedilecek: ${qid}`
        );
      }
    }

    // ── İdeoloji ──
    const ideologyRaw = extractValue(binding.ideologyLabel);
    const ideology =
      ideologyRaw && ideologyRaw !== qid
        ? ideologyRaw.slice(0, 200)
        : null;

    return {
      data: {
        slug,
        name,
        abbreviation,
        color,
        country: "Türkiye",
        founded: validFounded,
        ideology,
        wikidataQId: qid,
      },
      warnings,
    };
  }

  // ────────────────────────────────────────────
  //  Public API
  // ────────────────────────────────────────────

  /**
   * Wikidata'dan Türkiye genel seçimlerini çeker ve veritabanına senkronize eder.
   *
   * İşlem pipeline'ı:
   * 1. SPARQL sorgusunu rate-limited olarak çalıştır
   * 2. Response'u Zod ile validate et
   * 3. Binding'leri Q-ID bazında deduplicate et
   * 4. Her binding'i transform et (şüphelileri atla, warning logla)
   * 5. Prisma upsert ile kaydet (slug bazlı)
   * 6. DataSource kaydı oluştur (izlenebilirlik)
   * 7. Sonuç raporunu döndür
   *
   * Hata durumları:
   * - Network/HTTP hatası → tüm sync başarısız, errors: 1
   * - Boş response → synced: 0, warning loglanır
   * - Tek satır transform hatası → o satır skip, diğerleri devam
   * - Tek satır upsert hatası → o satır error, diğerleri devam
   */
  async syncElections(): Promise<SyncResult> {
    const startTime = Date.now();
    const result = createEmptySyncResult("elections");

    let httpStatus: number | null = null;
    let checksum: string | null = null;
    const sparqlUrl = `${WIKIDATA_SPARQL_ENDPOINT}?query=${encodeURIComponent(SPARQL_ELECTIONS_QUERY)}&format=json`;

    try {
      // 1. SPARQL sorgusu çalıştır
      console.log("[WikidataService] Seçim verileri çekiliyor...");
      const { data, rawBody, httpStatus: status } = await this.executeSparql(
        SPARQL_ELECTIONS_QUERY,
        electionResponseSchema
      );
      httpStatus = status;
      checksum = computeChecksum(rawBody);

      const bindings = data.results.bindings;
      console.log(
        `[WikidataService] ${bindings.length} seçim binding'i alındı`
      );

      // 2. Boş sonuç kontrolü
      if (bindings.length === 0) {
        result.warnings.push("Wikidata'dan hiç seçim verisi dönmedi");
        console.warn("[WikidataService] Seçim sorgusu boş sonuç döndü");
      }

      // 3. Deduplicate
      const unique = this.deduplicateElections(bindings);
      console.log(
        `[WikidataService] ${unique.size} unique seçim tespit edildi`
      );

      // 4-5. Transform + Upsert
      const upsertPromises = Array.from(unique.entries()).map(async ([qid, binding]) => {
        try {
          const transformed = this.transformElection(binding);

          if (!transformed) {
            result.skipped++;
            return;
          }

          result.warnings.push(...transformed.warnings);

          const { data: elData } = transformed;

          // Prisma upsert — slug bazlı
          await prisma.election.upsert({
            where: { slug: elData.slug },
            create: {
              title: elData.title,
              slug: elData.slug,
              description: elData.description,
              type: elData.type,
              status: elData.status,
              country: elData.country,
              date: elData.date,
              turnout: elData.turnout,
            },
            update: {
              // title ve type her zaman güncellenir (Wikidata authoritative)
              title: elData.title,
              type: elData.type,
              // Diğer alanlar sadece yeni değer null değilse güncellenir
              // → mevcut manuel girişleri korur
              ...(elData.turnout !== null && { turnout: elData.turnout }),
              ...(elData.description !== null && {
                description: elData.description,
              }),
            },
          });

          result.synced++;
        } catch (err) {
          result.errors++;
          const msg = err instanceof Error ? err.message : String(err);
          console.error(
            `[WikidataService] Seçim upsert hatası (${qid}): ${msg}`
          );
          result.warnings.push(`Upsert hatası (${qid}): ${msg}`);
        }
      });
      await Promise.all(upsertPromises);
    } catch (err) {
      // Üst seviye hata: fetch / parse / validation başarısız
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[WikidataService] Seçim sync kritik hatası: ${msg}`);
      result.warnings.push(`Kritik hata: ${msg}`);
      result.errors++;
    }

    // 6. DataSource log
    try {
      result.dataSourceId = await this.logDataSource({
        name: "Wikidata SPARQL — Türkiye Seçimleri",
        url: sparqlUrl,
        httpStatus,
        checksum,
        notes: [
          `Synced: ${result.synced}`,
          `Skipped: ${result.skipped}`,
          `Errors: ${result.errors}`,
        ].join(", "),
      });
    } catch (err) {
      console.error("[WikidataService] DataSource log hatası:", err);
    }

    result.duration = Date.now() - startTime;
    console.log(
      `[WikidataService] Seçim sync tamamlandı — ` +
      `${result.synced} synced, ${result.skipped} skipped, ` +
      `${result.errors} errors (${result.duration}ms)`
    );

    return result;
  }

  /**
   * Wikidata'dan Türkiye siyasi partilerini çeker ve veritabanına senkronize eder.
   *
   * Pipeline: {@link syncElections} ile aynı, Party modeli için uyarlanmış.
   */
  async syncParties(): Promise<SyncResult> {
    const startTime = Date.now();
    const result = createEmptySyncResult("parties");

    let httpStatus: number | null = null;
    let checksum: string | null = null;
    const sparqlUrl = `${WIKIDATA_SPARQL_ENDPOINT}?query=${encodeURIComponent(SPARQL_PARTIES_QUERY)}&format=json`;

    try {
      // 1. SPARQL sorgusu çalıştır
      console.log("[WikidataService] Parti verileri çekiliyor...");
      const { data, rawBody, httpStatus: status } = await this.executeSparql(
        SPARQL_PARTIES_QUERY,
        partyResponseSchema
      );
      httpStatus = status;
      checksum = computeChecksum(rawBody);

      const bindings = data.results.bindings;
      console.log(
        `[WikidataService] ${bindings.length} parti binding'i alındı`
      );

      // 2. Boş sonuç kontrolü
      if (bindings.length === 0) {
        result.warnings.push("Wikidata'dan hiç parti verisi dönmedi");
        console.warn("[WikidataService] Parti sorgusu boş sonuç döndü");
      }

      // 3. Deduplicate
      const unique = this.deduplicateParties(bindings);
      console.log(
        `[WikidataService] ${unique.size} unique parti tespit edildi`
      );

      // 4-5. Transform + Upsert
      const partyPromises = Array.from(unique.entries()).map(async ([qid, binding]) => {
        try {
          const transformed = this.transformParty(binding);

          if (!transformed) {
            result.skipped++;
            return;
          }

          result.warnings.push(...transformed.warnings);

          const { data: pData } = transformed;

          // Prisma upsert — slug bazlı
          await prisma.party.upsert({
            where: { slug: pData.slug },
            create: {
              name: pData.name,
              abbreviation: pData.abbreviation,
              slug: pData.slug,
              color: pData.color,
              country: pData.country,
              founded: pData.founded,
              ideology: pData.ideology,
            },
            update: {
              // Name her zaman güncellenir (Wikidata authoritative)
              name: pData.name,
              // Abbreviation her zaman güncellenir
              abbreviation: pData.abbreviation,
              // Founded ve ideology: sadece yeni değer varsa güncelle
              ...(pData.founded !== null && { founded: pData.founded }),
              ...(pData.ideology !== null && { ideology: pData.ideology }),
              // Renk: varsayılan gri DEĞİLSE güncelle
              // (mevcut elle girilmiş rengi varsayılanla ezmeyi önler)
              ...(pData.color !== DEFAULT_PARTY_COLOR && {
                color: pData.color,
              }),
            },
          });

          result.synced++;
        } catch (err) {
          result.errors++;
          const msg = err instanceof Error ? err.message : String(err);
          console.error(
            `[WikidataService] Parti upsert hatası (${qid}): ${msg}`
          );
          result.warnings.push(`Upsert hatası (${qid}): ${msg}`);
        }
      });
      await Promise.all(partyPromises);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[WikidataService] Parti sync kritik hatası: ${msg}`);
      result.warnings.push(`Kritik hata: ${msg}`);
      result.errors++;
    }

    // 6. DataSource log
    try {
      result.dataSourceId = await this.logDataSource({
        name: "Wikidata SPARQL — Türkiye Siyasi Partileri",
        url: sparqlUrl,
        httpStatus,
        checksum,
        notes: [
          `Synced: ${result.synced}`,
          `Skipped: ${result.skipped}`,
          `Errors: ${result.errors}`,
        ].join(", "),
      });
    } catch (err) {
      console.error("[WikidataService] DataSource log hatası:", err);
    }

    result.duration = Date.now() - startTime;
    console.log(
      `[WikidataService] Parti sync tamamlandı — ` +
      `${result.synced} synced, ${result.skipped} skipped, ` +
      `${result.errors} errors (${result.duration}ms)`
    );

    return result;
  }

  /**
   * Hem partileri hem seçimleri sırayla senkronize eder.
   *
   * Sıralama: önce partiler → sonra seçimler.
   * (İleride seçimlere parti ilişkilendirmesi eklenirse partiler hazır olur.)
   *
   * İki SPARQL sorgusu arasında rate limiting otomatik uygulanır.
   */
  async syncAll(): Promise<SyncAllResult> {
    const startTime = Date.now();

    console.log("[WikidataService] Tam senkronizasyon başlatılıyor...");

    // Önce partiler
    const parties = await this.syncParties();

    // Sonra seçimler
    const elections = await this.syncElections();

    const totalDuration = Date.now() - startTime;

    const partiesTotal = parties.synced + parties.skipped + parties.errors;
    const electionsTotal =
      elections.synced + elections.skipped + elections.errors;

    console.log(
      `[WikidataService] Tam senkronizasyon tamamlandı (${totalDuration}ms)\n` +
      `  Partiler:  ${parties.synced}/${partiesTotal} başarılı\n` +
      `  Seçimler:  ${elections.synced}/${electionsTotal} başarılı`
    );

    return { elections, parties, totalDuration };
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
//  SINGLETON EXPORT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * Singleton Wikidata servis instance'ı.
 *
 * @example
 * ```ts
 * import { wikidataService } from "@/services/wikidata.service";
 *
 * // Admin panel veya cron job'dan çağrılır
 * const result = await wikidataService.syncAll();
 *
 * // Sonuç raporu
 * console.log(JSON.stringify(result, null, 2));
 * // {
 * //   elections: { source: "elections", synced: 18, skipped: 2, errors: 0, ... },
 * //   parties:   { source: "parties",  synced: 45, skipped: 5, errors: 0, ... },
 * //   totalDuration: 4200
 * // }
 * ```
 */
export const wikidataService = new WikidataService();
