// ─────────────────────────────────────────────
// Generic API Response Types
// ─────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiListResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ApiErrorResponse {
  error: {
    message: string;
    code?: string;
    details?: Record<string, string[]>;
  };
}

// ─────────────────────────────────────────────
// Query Params
// ─────────────────────────────────────────────

export type PaginationParams = {
  page?: number;
  limit?: number;
};

export type ElectionFilters = PaginationParams & {
  status?: string;
  type?: string;
  country?: string;
  search?: string;
  regionId?: string;
  sortBy?: "date" | "title" | "createdAt";
  sortOrder?: "asc" | "desc";
};

export type PollResultFilters = PaginationParams & {
  electionId: string;
  pollFirmId?: string;
  partyId?: string;
  candidateId?: string;
  fromDate?: string;
  toDate?: string;
};

export type PredictionFilters = PaginationParams & {
  electionId: string;
  status?: string;
  regionId?: string;
  userId?: string;
};

export type HistoricalResultFilters = PaginationParams & {
  electionId: string;
  regionId?: string;
  partyId?: string;
};
