import type { ApiResponse, ApiListResponse, ApiErrorResponse } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";

class FetchError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: ApiErrorResponse
  ) {
    super(message);
    this.name = "FetchError";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = (await response.json().catch(() => null)) as ApiErrorResponse | null;
    throw new FetchError(
      errorData?.error?.message ?? `HTTP ${response.status}`,
      response.status,
      errorData ?? undefined
    );
  }
  return response.json() as Promise<T>;
}

type QueryParams = Record<string, string | number | boolean | null | undefined>;

function buildUrl(path: string, params?: QueryParams): string {
  const url = new URL(path, BASE_URL);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url.toString();
}

// ─────────────────────────────────────────────
// API Client
// ─────────────────────────────────────────────

export const apiClient = {
  async get<T>(path: string, params?: QueryParams): Promise<T> {
    const url = buildUrl(path, params);
    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    return handleResponse<T>(response);
  },

  async post<T>(path: string, body?: unknown): Promise<T> {
    const response = await fetch(buildUrl(path), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },

  async put<T>(path: string, body?: unknown): Promise<T> {
    const response = await fetch(buildUrl(path), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },

  async patch<T>(path: string, body?: unknown): Promise<T> {
    const response = await fetch(buildUrl(path), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },

  async delete<T>(path: string): Promise<T> {
    const response = await fetch(buildUrl(path), {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    return handleResponse<T>(response);
  },
};

export { FetchError };
export type { ApiResponse, ApiListResponse };
