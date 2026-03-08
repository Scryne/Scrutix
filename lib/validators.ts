import { z } from "zod";

// ─────────────────────────────────────────────
// Common Schemas
// ─────────────────────────────────────────────

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const idSchema = z.object({
  id: z.string().cuid(),
});

export const slugSchema = z.object({
  slug: z.string().min(1).max(200),
});

const slugRegex = /^[a-z0-9-]+$/;

// ─────────────────────────────────────────────
// Enum Schemas
// ─────────────────────────────────────────────

export const electionTypeSchema = z.enum([
  "PRESIDENTIAL",
  "PARLIAMENTARY",
  "LOCAL",
  "REFERENDUM",
  "MUNICIPAL",
  "BY_ELECTION",
]);

export const electionStatusSchema = z.enum([
  "UPCOMING",
  "ACTIVE",
  "COUNTING",
  "COMPLETED",
  "CANCELLED",
]);

export const regionTypeSchema = z.enum([
  "COUNTRY",
  "PROVINCE",
  "DISTRICT",
  "NEIGHBORHOOD",
  "CONSTITUENCY",
  "ABROAD",
]);

export const verificationStatusSchema = z.enum([
  "PENDING",
  "VERIFIED",
  "REJECTED",
  "STALE",
]);

export const predictionStatusSchema = z.enum([
  "DRAFT",
  "PUBLISHED",
  "SETTLED",
  "ARCHIVED",
]);

// ─────────────────────────────────────────────
// 1. Election Schemas
// ─────────────────────────────────────────────

export const createElectionSchema = z.object({
  title: z.string().min(3).max(300),
  slug: z.string().min(3).max(300).regex(slugRegex, "Slug yalnizca kucuk harf, rakam ve tire icermelidir"),
  description: z.string().max(10000).optional(),
  type: electionTypeSchema,
  country: z.string().min(2).max(100),
  date: z.coerce.date(),
  round: z.number().int().min(1).max(5).default(1),
  regionId: z.string().cuid().optional(),
  coverImage: z.string().url().optional(),
});

export const updateElectionSchema = createElectionSchema.partial().merge(idSchema);

// ─────────────────────────────────────────────
// 2. Party Schemas
// ─────────────────────────────────────────────

export const createPartySchema = z.object({
  name: z.string().min(2).max(250),
  abbreviation: z.string().min(1).max(20),
  slug: z.string().min(2).max(100).regex(slugRegex),
  country: z.string().min(2).max(100),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Gecerli bir hex renk kodu olmalidir"),
  logoUrl: z.string().url().optional(),
  website: z.string().url().optional(),
  description: z.string().max(5000).optional(),
  ideology: z.string().max(200).optional(),
  founded: z.number().int().min(1800).max(new Date().getFullYear()).optional(),
  leaderName: z.string().max(200).optional(),
});

// ─────────────────────────────────────────────
// 3. Candidate Schemas
// ─────────────────────────────────────────────

export const createCandidateSchema = z.object({
  name: z.string().min(2).max(250),
  slug: z.string().min(2).max(250).regex(slugRegex),
  photoUrl: z.string().url().optional(),
  biography: z.string().max(10000).optional(),
  electionId: z.string().cuid(),
  partyId: z.string().cuid().optional(),
  isIncumbent: z.boolean().default(false),
  number: z.number().int().positive().optional(),
});

// ─────────────────────────────────────────────
// 4. PollResult Schemas
// ─────────────────────────────────────────────

export const createPollResultSchema = z.object({
  electionId: z.string().cuid(),
  pollFirmId: z.string().cuid(),
  partyId: z.string().cuid().optional(),
  candidateId: z.string().cuid().optional(),
  dataSourceId: z.string().cuid().optional(),
  percentage: z.number().min(0).max(100),
  sampleSize: z.number().int().positive().optional(),
  marginOfError: z.number().min(0).max(50).optional(),
  methodology: z.string().max(300).optional(),
  fieldworkStart: z.coerce.date().optional(),
  fieldworkEnd: z.coerce.date().optional(),
  publishedAt: z.coerce.date(),
  reliabilityScore: z.number().min(0).max(1).optional(),
});

/// Toplu anket girisi — ayni anket firmasi + tarih icin birden fazla parti/aday
export const createBatchPollResultSchema = z.object({
  electionId: z.string().cuid(),
  pollFirmId: z.string().cuid(),
  dataSourceId: z.string().cuid().optional(),
  sampleSize: z.number().int().positive().optional(),
  marginOfError: z.number().min(0).max(50).optional(),
  methodology: z.string().max(300).optional(),
  fieldworkStart: z.coerce.date().optional(),
  fieldworkEnd: z.coerce.date().optional(),
  publishedAt: z.coerce.date(),
  results: z.array(
    z.object({
      partyId: z.string().cuid().optional(),
      candidateId: z.string().cuid().optional(),
      percentage: z.number().min(0).max(100),
      reliabilityScore: z.number().min(0).max(1).optional(),
    })
  ).min(1, "En az bir sonuc satirisi gereklidir"),
});

// ─────────────────────────────────────────────
// 5. PollFirm Schemas
// ─────────────────────────────────────────────

export const createPollFirmSchema = z.object({
  name: z.string().min(2).max(250),
  slug: z.string().min(2).max(200).regex(slugRegex),
  website: z.string().url().optional(),
  country: z.string().min(2).max(100),
  description: z.string().max(5000).optional(),
  methodology: z.string().max(500).optional(),
  accuracyScore: z.number().min(0).max(100).optional(),
});

// ─────────────────────────────────────────────
// 6. HistoricalResult Schemas
// ─────────────────────────────────────────────

export const createHistoricalResultSchema = z.object({
  electionId: z.string().cuid(),
  partyId: z.string().cuid().optional(),
  candidateId: z.string().cuid().optional(),
  regionId: z.string().cuid().optional(),
  voteCount: z.number().int().min(0),
  percentage: z.number().min(0).max(100),
  seatCount: z.number().int().min(0).optional(),
  registeredVoters: z.number().int().min(0).optional(),
  turnout: z.number().min(0).max(100).optional(),
  isOfficial: z.boolean().default(false),
});

// ─────────────────────────────────────────────
// 7. Region Schemas
// ─────────────────────────────────────────────

export const createRegionSchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(20),
  type: regionTypeSchema,
  country: z.string().min(2).max(100),
  parentId: z.string().cuid().optional(),
  population: z.number().int().positive().optional(),
  registeredVoters: z.number().int().positive().optional(),
  geoJson: z.any().optional(), // GeoJSON Feature object
});

// ─────────────────────────────────────────────
// 8. Prediction Schemas
// ─────────────────────────────────────────────

export const createPredictionSchema = z.object({
  electionId: z.string().cuid(),
  partyId: z.string().cuid().optional(),
  candidateId: z.string().cuid().optional(),
  regionId: z.string().cuid().optional(),
  low: z.number().min(0).max(100),
  mid: z.number().min(0).max(100),
  high: z.number().min(0).max(100),
  confidence: z.number().min(0).max(1).optional(),
  reasoning: z.string().max(10000).optional(),
}).refine(
  (data) => data.low <= data.mid && data.mid <= data.high,
  { message: "low <= mid <= high siralamasi saglanmalidir", path: ["mid"] }
);

// ─────────────────────────────────────────────
// 9. DataSource Schemas
// ─────────────────────────────────────────────

export const createDataSourceSchema = z.object({
  name: z.string().min(2).max(300),
  url: z.string().url().optional(),
  electionId: z.string().cuid().optional(),
  notes: z.string().max(5000).optional(),
});

export const verifyDataSourceSchema = z.object({
  id: z.string().cuid(),
  verification: verificationStatusSchema,
  notes: z.string().max(5000).optional(),
});

// ─────────────────────────────────────────────
// 10. Admin Poll Entry Form Schema
// ─────────────────────────────────────────────

/// Anket yöntemi — form select alanı için.
export const pollMethodologySchema = z.enum([
  "CATI",    // Telefon (Computer Assisted Telephone Interview)
  "CAPI",    // Yüz yüze (Computer Assisted Personal Interview)
  "ONLINE",  // Online anket
]);

/// Tek bir parti için oy oranı girişi.
const pollPartyResultSchema = z.object({
  partyId: z.string().cuid("Gecerli bir parti secmelisiniz"),
  percentage: z.coerce.number({
    required_error: "Oy orani zorunludur",
    invalid_type_error: "Gecerli bir sayi giriniz",
  }).min(0, "Oy orani negatif olamaz").max(100, "Oy orani %100'u gecemez"),
});

/// "Yeni anket şirketi oluştur" alt formu.
export const newPollFirmInlineSchema = z.object({
  name: z.string().min(2, "Firma adi en az 2 karakter olmalidir").max(250),
  website: z.string().url("Gecerli bir URL giriniz").optional().or(z.literal("")),
});

/// Admin panel anket sonucu giriş formu — tüm alanlar.
export const adminPollEntrySchema = z.object({
  electionId: z.string().cuid("Bir secim secmelisiniz"),

  // Mevcut firma seçimi VEYA yeni firma oluşturma
  pollFirmId: z.string().cuid("Bir anket sirketi secmelisiniz").optional(),
  newPollFirm: newPollFirmInlineSchema.optional(),

  publishedAt: z.coerce.date({
    required_error: "Yayin tarihi zorunludur",
    invalid_type_error: "Gecerli bir tarih giriniz",
  }).refine(
    (date) => date <= new Date(),
    { message: "Yayin tarihi gelecekte olamaz" }
  ),

  sampleSize: z.coerce.number({
    required_error: "Orneklem buyuklugu zorunludur",
    invalid_type_error: "Gecerli bir sayi giriniz",
  }).int("Tam sayi giriniz").min(200, "Orneklem en az 200 kisi olmalidir"),

  methodology: pollMethodologySchema.optional(),

  // Dinamik parti oy oranları
  results: z.array(pollPartyResultSchema)
    .min(1, "En az bir parti icin oy orani girilmelidir"),

  sourceUrl: z.string().url("Gecerli bir kaynak URL'si giriniz"),

  notes: z.string().max(5000, "Notlar en fazla 5000 karakter olabilir").optional().or(z.literal("")),

  isVerified: z.boolean().default(false),
}).refine(
  // pollFirmId veya newPollFirm'den en az biri olmalı
  (data) => data.pollFirmId || data.newPollFirm,
  { message: "Bir anket sirketi secin veya yeni bir tane olusturun", path: ["pollFirmId"] }
).refine(
  // Toplam oy oranı %100'ü geçemez
  (data) => {
    const total = data.results.reduce((sum, r) => sum + r.percentage, 0);
    return total <= 100;
  },
  { message: "Toplam oy orani %100'u gecemez", path: ["results"] }
);

// ─────────────────────────────────────────────
// Auth Schemas
// ─────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Gecerli bir e-posta adresi giriniz"),
  password: z.string().min(8, "Sifre en az 8 karakter olmalidir").max(128),
});

// ─────────────────────────────────────────────
// Comment Schemas
// ─────────────────────────────────────────────

export const createCommentSchema = z.object({
  content: z.string().min(1).max(5000),
  electionId: z.string().cuid(),
  parentId: z.string().cuid().optional(),
});

// ─────────────────────────────────────────────
// Type Exports
// ─────────────────────────────────────────────

export type PaginationInput = z.infer<typeof paginationSchema>;
export type CreateElectionInput = z.infer<typeof createElectionSchema>;
export type UpdateElectionInput = z.infer<typeof updateElectionSchema>;
export type CreatePartyInput = z.infer<typeof createPartySchema>;
export type CreateCandidateInput = z.infer<typeof createCandidateSchema>;
export type CreatePollResultInput = z.infer<typeof createPollResultSchema>;
export type CreateBatchPollResultInput = z.infer<typeof createBatchPollResultSchema>;
export type CreatePollFirmInput = z.infer<typeof createPollFirmSchema>;
export type CreateHistoricalResultInput = z.infer<typeof createHistoricalResultSchema>;
export type CreateRegionInput = z.infer<typeof createRegionSchema>;
export type CreatePredictionInput = z.infer<typeof createPredictionSchema>;
export type CreateDataSourceInput = z.infer<typeof createDataSourceSchema>;
export type VerifyDataSourceInput = z.infer<typeof verifyDataSourceSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type AdminPollEntryInput = z.infer<typeof adminPollEntrySchema>;
export type PollMethodology = z.infer<typeof pollMethodologySchema>;
