import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { ElectionFilters } from "@/types";

// ─────────────────────────────────────────────
// Election Store - UI state for election browsing
// ─────────────────────────────────────────────

interface ElectionStoreState {
  // Filters
  filters: ElectionFilters;
  setFilters: (filters: Partial<ElectionFilters>) => void;
  resetFilters: () => void;

  // View preferences
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;

  // Selected election (for detail panel)
  selectedElectionId: string | null;
  setSelectedElectionId: (id: string | null) => void;
}

const DEFAULT_FILTERS: ElectionFilters = {
  page: 1,
  limit: 20,
  sortBy: "date",
  sortOrder: "desc",
};

export const useElectionStore = create<ElectionStoreState>()(
  devtools(
    (set) => ({
      // Filters
      filters: DEFAULT_FILTERS,
      setFilters: (newFilters) =>
        set(
          (state) => ({ filters: { ...state.filters, ...newFilters, page: 1 } }),
          false,
          "setFilters"
        ),
      resetFilters: () =>
        set({ filters: DEFAULT_FILTERS }, false, "resetFilters"),

      // View
      viewMode: "grid",
      setViewMode: (mode) => set({ viewMode: mode }, false, "setViewMode"),

      // Selection
      selectedElectionId: null,
      setSelectedElectionId: (id) =>
        set({ selectedElectionId: id }, false, "setSelectedElectionId"),
    }),
    { name: "election-store" }
  )
);
