import { apiClient } from "./api-client";
import type {
  ApiResponse,
  ApiListResponse,
  ElectionFilters,
  ElectionSummary,
  ElectionWithRelations,
} from "@/types";
import type { CreateElectionInput } from "@/lib/validators";

const ELECTIONS_PATH = "/api/elections";

export const electionService = {
  /**
   * Fetch paginated list of elections with filters.
   */
  async getAll(filters?: ElectionFilters): Promise<ApiListResponse<ElectionSummary>> {
    return apiClient.get<ApiListResponse<ElectionSummary>>(ELECTIONS_PATH, filters);
  },

  /**
   * Fetch a single election by slug with all relations.
   */
  async getBySlug(slug: string): Promise<ApiResponse<ElectionWithRelations>> {
    return apiClient.get<ApiResponse<ElectionWithRelations>>(`${ELECTIONS_PATH}/${slug}`);
  },

  /**
   * Create a new election.
   */
  async create(data: CreateElectionInput): Promise<ApiResponse<ElectionWithRelations>> {
    return apiClient.post<ApiResponse<ElectionWithRelations>>(ELECTIONS_PATH, data);
  },

  /**
   * Update an existing election.
   */
  async update(
    id: string,
    data: Partial<CreateElectionInput>
  ): Promise<ApiResponse<ElectionWithRelations>> {
    return apiClient.patch<ApiResponse<ElectionWithRelations>>(`${ELECTIONS_PATH}/${id}`, data);
  },

  /**
   * Soft-delete an election.
   */
  async delete(id: string): Promise<ApiResponse<{ deleted: boolean }>> {
    return apiClient.delete<ApiResponse<{ deleted: boolean }>>(`${ELECTIONS_PATH}/${id}`);
  },
};
