import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

// ─────────────────────────────────────────────
// UI Store - Global UI state
// ─────────────────────────────────────────────

interface UIStoreState {
  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Mobile menu
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;

  // Command palette
  commandOpen: boolean;
  setCommandOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStoreState>()(
  devtools(
    persist(
      (set) => ({
        // Sidebar
        sidebarOpen: true,
        toggleSidebar: () =>
          set((state) => ({ sidebarOpen: !state.sidebarOpen }), false, "toggleSidebar"),
        setSidebarOpen: (open) =>
          set({ sidebarOpen: open }, false, "setSidebarOpen"),

        // Mobile menu
        mobileMenuOpen: false,
        setMobileMenuOpen: (open) =>
          set({ mobileMenuOpen: open }, false, "setMobileMenuOpen"),

        // Command palette
        commandOpen: false,
        setCommandOpen: (open) =>
          set({ commandOpen: open }, false, "setCommandOpen"),
      }),
      {
        name: "scrutix-ui",
        partialize: (state) => ({ sidebarOpen: state.sidebarOpen }),
      }
    ),
    { name: "ui-store" }
  )
);
