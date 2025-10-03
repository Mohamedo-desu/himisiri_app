import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mmkvStorage } from "./storage";

export interface AppSettings {
  hideOffensiveWords: boolean;
}

interface SettingsStore extends AppSettings {
  setHideOffensiveWords: (value: boolean) => void;
}

const defaultSettings: AppSettings = {
  hideOffensiveWords: false,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...defaultSettings,
      setHideOffensiveWords: (value: boolean) =>
        set(() => ({ hideOffensiveWords: value })),
    }),
    {
      name: "app-settings",
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
