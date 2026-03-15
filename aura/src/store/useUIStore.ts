import { create } from "zustand";

interface UIStore {
  sidebarOpen: boolean;
  activeModal: string | null;
  setSidebarOpen: (open: boolean) => void;
  setActiveModal: (modal: string | null) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  activeModal: null,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActiveModal: (modal) => set({ activeModal: modal }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}));
