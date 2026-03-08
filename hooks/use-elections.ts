import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants";
import { electionService } from "@/services";
import type { ElectionFilters } from "@/types";
import type { CreateElectionInput } from "@/lib/validators";

/**
 * Hook to fetch paginated elections with filters.
 */
export function useElections(filters?: ElectionFilters) {
  return useQuery({
    queryKey: QUERY_KEYS.elections.list(filters),
    queryFn: () => electionService.getAll(filters),
  });
}

/**
 * Hook to fetch a single election by slug.
 */
export function useElection(slug: string) {
  return useQuery({
    queryKey: QUERY_KEYS.elections.detail(slug),
    queryFn: () => electionService.getBySlug(slug),
    enabled: !!slug,
  });
}

/**
 * Hook to create a new election.
 */
export function useCreateElection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateElectionInput) => electionService.create(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.elections.all });
    },
  });
}

/**
 * Hook to update an election.
 */
export function useUpdateElection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateElectionInput> }) =>
      electionService.update(id, data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.elections.all });
    },
  });
}

/**
 * Hook to delete an election.
 */
export function useDeleteElection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => electionService.delete(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.elections.all });
    },
  });
}
