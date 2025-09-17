import { create } from "zustand";

interface TabBarStore {
  visible: boolean;
  setVisible: (visible: boolean) => void;
  fabVisible: boolean;
  setFabVisible: (fabVisible: boolean) => void;
  scrollY: number;
  setScrollY: (y: number) => void;
}

export const useTabBarStore = create<TabBarStore>((set) => ({
  visible: true,
  setVisible: (visible) => set({ visible }),
  fabVisible: false,
  setFabVisible: (fabVisible) => set({ fabVisible }),
  scrollY: 0,
  setScrollY: (y) => set({ scrollY: y }),
}));
