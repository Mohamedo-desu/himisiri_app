import { USER_TABLE } from "@/convex/schema";
import { create } from "zustand";

interface UserState {
  currentUser: USER_TABLE | null;
  setCurrentUser: (user: USER_TABLE | null) => void;
  clearCurrentUser: () => void;

  // User loading state
  isLoadingUser: boolean;
  setLoadingUser: (loading: boolean) => void;
}

export const useUserStore = create<UserState>((set) => ({
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
  clearCurrentUser: () => set({ currentUser: null }),

  // User loading state
  isLoadingUser: false,
  setLoadingUser: (loading) => set({ isLoadingUser: loading }),
}));
