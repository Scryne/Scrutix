import { apiClient } from "./api-client";
import type {
  ApiResponse,
  ApiListResponse,
  PredictionFilters,
  PredictionWithRelations,
} from "@/types";
import type { CreatePredictionInput } from "@/lib/validators";

const PREDICTIONS_PATH = "/api/predictions";

export const predictionService = {
  /**
   * Fetch predictions for an election.
   */
  async getByElection(filters: PredictionFilters): Promise<ApiListResponse<PredictionWithRelations>> {
    return apiClient.get<ApiListResponse<PredictionWithRelations>>(PREDICTIONS_PATH, filters);
  },

  /**
   * Create a new prediction.
   */
  async create(data: CreatePredictionInput): Promise<ApiResponse<PredictionWithRelations>> {
    return apiClient.post<ApiResponse<PredictionWithRelations>>(PREDICTIONS_PATH, data);
  },

  /**
   * Update a prediction.
   */
  async update(id: string, data: Partial<CreatePredictionInput>): Promise<ApiResponse<PredictionWithRelations>> {
    return apiClient.patch<ApiResponse<PredictionWithRelations>>(`${PREDICTIONS_PATH}/${id}`, data);
  },
};
