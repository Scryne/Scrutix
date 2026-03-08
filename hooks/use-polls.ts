import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants";
import { pollResultService, pollFirmService } from "@/services";
import type { PollResultFilters } from "@/types";
import type { CreatePollResultInput, CreateBatchPollResultInput } from "@/lib/validators";

/**
 * Hook to fetch poll results for a specific election.
 */
export function usePollResults(filters: PollResultFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.elections.pollResults(filters.electionId),
    queryFn: () => pollResultService.getByElection(filters),
    enabled: !!filters.electionId,
  });
}

/**
 * Hook to fetch poll trend data for charts.
 */
export function usePollTrends(electionId: string) {
  return useQuery({
    queryKey: [...QUERY_KEYS.elections.pollResults(electionId), "trends"],
    queryFn: () => pollResultService.getTrends(electionId),
    enabled: !!electionId,
  });
}

/**
 * Hook to create a single poll result.
 */
export function useCreatePollResult() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePollResultInput) => pollResultService.create(data),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.elections.pollResults(variables.electionId),
      });
    },
  });
}

/**
 * Hook to create batch poll results.
 */
export function useCreateBatchPollResults() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBatchPollResultInput) => pollResultService.createBatch(data),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.elections.pollResults(variables.electionId),
      });
    },
  });
}

/**
 * Hook to fetch all poll firms.
 */
export function usePollFirms() {
  return useQuery({
    queryKey: QUERY_KEYS.pollFirms.all,
    queryFn: () => pollFirmService.getAll(),
  });
}
