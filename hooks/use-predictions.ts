import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants";
import { predictionService } from "@/services";
import type { PredictionFilters } from "@/types";
import type { CreatePredictionInput } from "@/lib/validators";

/**
 * Hook to fetch predictions for a specific election.
 */
export function usePredictions(filters: PredictionFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.elections.predictions(filters.electionId),
    queryFn: () => predictionService.getByElection(filters),
    enabled: !!filters.electionId,
  });
}

/**
 * Hook to create a new prediction.
 */
export function useCreatePrediction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePredictionInput) => predictionService.create(data),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.elections.predictions(variables.electionId),
      });
    },
  });
}

/**
 * Hook to update a prediction.
 */
export function useUpdatePrediction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreatePredictionInput> }) =>
      predictionService.update(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.elections.all,
      });
    },
  });
}
