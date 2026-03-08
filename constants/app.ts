// ─────────────────────────────────────────────
// Application Constants
// ─────────────────────────────────────────────

export const APP_NAME = "Scrutix" as const;
export const APP_DESCRIPTION = "Election tracking and prediction platform" as const;
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

// ─────────────────────────────────────────────
// Pagination Defaults
// ─────────────────────────────────────────────

export const DEFAULT_PAGE_SIZE = 20 as const;
export const MAX_PAGE_SIZE = 100 as const;

// ─────────────────────────────────────────────
// Navigation
// ─────────────────────────────────────────────

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  disabled?: boolean;
}

export const MAIN_NAV: NavItem[] = [
  { label: "Secimler", href: "/elections" },
  { label: "Harita", href: "/map" },
  { label: "Anketler", href: "/polls" },
  { label: "Metodoloji", href: "/legal/methodology" },
] as const;

// ─────────────────────────────────────────────
// Query Keys (for React Query consistency)
// ─────────────────────────────────────────────

export const QUERY_KEYS = {
  elections: {
    all: ["elections"] as const,
    list: (filters?: unknown) => ["elections", "list", filters] as const,
    detail: (slug: string) => ["elections", "detail", slug] as const,
    pollResults: (electionId: string) => ["elections", electionId, "pollResults"] as const,
    historicalResults: (electionId: string) => ["elections", electionId, "historicalResults"] as const,
    predictions: (electionId: string) => ["elections", electionId, "predictions"] as const,
    candidates: (electionId: string) => ["elections", electionId, "candidates"] as const,
  },
  parties: {
    all: ["parties"] as const,
    detail: (slug: string) => ["parties", "detail", slug] as const,
  },
  pollFirms: {
    all: ["pollFirms"] as const,
    detail: (slug: string) => ["pollFirms", "detail", slug] as const,
  },
  regions: {
    all: ["regions"] as const,
    byCountry: (country: string) => ["regions", "country", country] as const,
    detail: (id: string) => ["regions", "detail", id] as const,
  },
  dataSources: {
    all: ["dataSources"] as const,
    byElection: (electionId: string) => ["dataSources", "election", electionId] as const,
  },
  candidates: {
    all: ["candidates"] as const,
    byElection: (electionId: string) => ["candidates", "election", electionId] as const,
  },
  user: {
    current: ["user", "current"] as const,
    predictions: (userId: string) => ["user", userId, "predictions"] as const,
    bookmarks: (userId: string) => ["user", userId, "bookmarks"] as const,
  },
} as const;
