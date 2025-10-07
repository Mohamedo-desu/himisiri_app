import { USER_TABLE } from "@/convex/schema";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mmkvStorage } from "./storage";

interface UserState {
  currentUser: USER_TABLE | null;
  setCurrentUser: (user: USER_TABLE | null) => void;
  clearCurrentUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      currentUser: null,
      setCurrentUser: (user) => set({ currentUser: user }),
      clearCurrentUser: () => set({ currentUser: null }),
    }),
    {
      name: "user-store",
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
