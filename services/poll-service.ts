import { apiClient } from "./api-client";
import type {
  ApiResponse,
  ApiListResponse,
  PollResultFilters,
  PollResultWithRelations,
  PollTrend,
  PollFirmWithStats,
} from "@/types";
import type { CreatePollResultInput, CreateBatchPollResultInput, CreatePollFirmInput } from "@/lib/validators";

const POLL_RESULTS_PATH = "/api/poll-results";
const POLL_FIRMS_PATH = "/api/poll-firms";

export const pollResultService = {
  /**
   * Fetch poll results for an election.
   */
  async getByElection(filters: PollResultFilters): Promise<ApiListResponse<PollResultWithRelations>> {
    return apiClient.get<ApiListResponse<PollResultWithRelations>>(POLL_RESULTS_PATH, filters);
  },

  /**
   * Fetch poll trend data for charts.
   */
  async getTrends(electionId: string): Promise<ApiResponse<PollTrend[]>> {
    return apiClient.get<ApiResponse<PollTrend[]>>(`${POLL_RESULTS_PATH}/trends`, { electionId });
  },

  /**
   * Create a single poll result entry.
   */
  async create(data: CreatePollResultInput): Promise<ApiResponse<PollResultWithRelations>> {
    return apiClient.post<ApiResponse<PollResultWithRelations>>(POLL_RESULTS_PATH, data);
  },

  /**
   * Create multiple poll results in batch (same firm + date).
   */
  async createBatch(data: CreateBatchPollResultInput): Promise<ApiResponse<PollResultWithRelations[]>> {
    return apiClient.post<ApiResponse<PollResultWithRelations[]>>(`${POLL_RESULTS_PATH}/batch`, data);
  },
};

export const pollFirmService = {
  /**
   * Fetch all poll firms.
   */
  async getAll(): Promise<ApiListResponse<PollFirmWithStats>> {
    return apiClient.get<ApiListResponse<PollFirmWithStats>>(POLL_FIRMS_PATH);
  },

  /**
   * Fetch a single poll firm by slug.
   */
  async getBySlug(slug: string): Promise<ApiResponse<PollFirmWithStats>> {
    return apiClient.get<ApiResponse<PollFirmWithStats>>(`${POLL_FIRMS_PATH}/${slug}`);
  },

  /**
   * Create a new poll firm.
   */
  async create(data: CreatePollFirmInput): Promise<ApiResponse<PollFirmWithStats>> {
    return apiClient.post<ApiResponse<PollFirmWithStats>>(POLL_FIRMS_PATH, data);
  },
};
