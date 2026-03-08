// ─────────────────────────────────────────────
// Election Type Labels
// ─────────────────────────────────────────────

export const ELECTION_TYPE_LABELS: Record<string, string> = {
  PRESIDENTIAL: "Cumhurbaskanlig\u0131",
  PARLIAMENTARY: "Genel Secim",
  LOCAL: "Yerel Secim",
  REFERENDUM: "Referandum",
  MUNICIPAL: "Belediye Secimi",
  BY_ELECTION: "Ara Secim",
} as const;

// ─────────────────────────────────────────────
// Election Status Labels & Colors
// ─────────────────────────────────────────────

export const ELECTION_STATUS_LABELS: Record<string, string> = {
  UPCOMING: "Yaklasan",
  ACTIVE: "Devam Ediyor",
  COUNTING: "Sayim Yapiliyor",
  COMPLETED: "Tamamlandi",
  CANCELLED: "Iptal Edildi",
} as const;

export const ELECTION_STATUS_COLORS: Record<string, string> = {
  UPCOMING: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  COUNTING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  COMPLETED: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
} as const;

// ─────────────────────────────────────────────
// Region Type Labels
// ─────────────────────────────────────────────

export const REGION_TYPE_LABELS: Record<string, string> = {
  COUNTRY: "Ulke",
  PROVINCE: "Il",
  DISTRICT: "Ilce",
  NEIGHBORHOOD: "Mahalle",
  CONSTITUENCY: "Secim Cevresi",
  ABROAD: "Yurt Disi",
} as const;

// ─────────────────────────────────────────────
// Verification Status Labels
// ─────────────────────────────────────────────

export const VERIFICATION_STATUS_LABELS: Record<string, string> = {
  PENDING: "Dogrulanmadi",
  VERIFIED: "Dogrulandi",
  REJECTED: "Reddedildi",
  STALE: "Guncelligini Yitirdi",
} as const;

export const VERIFICATION_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  VERIFIED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  STALE: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
} as const;

// ─────────────────────────────────────────────
// Prediction Status Labels
// ─────────────────────────────────────────────

export const PREDICTION_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Taslak",
  PUBLISHED: "Yayinda",
  SETTLED: "Sonuclandi",
  ARCHIVED: "Arsivlendi",
} as const;

// ─────────────────────────────────────────────
// Chart Colors (for consistent coloring)
// ─────────────────────────────────────────────

export const CHART_COLORS = [
  "#2563eb", // blue-600
  "#dc2626", // red-600
  "#16a34a", // green-600
  "#ca8a04", // yellow-600
  "#9333ea", // purple-600
  "#ea580c", // orange-600
  "#0d9488", // teal-600
  "#db2777", // pink-600
  "#4f46e5", // indigo-600
  "#65a30d", // lime-600
] as const;
