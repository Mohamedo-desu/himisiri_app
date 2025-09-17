import { UnistylesRuntime } from "react-native-unistyles";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mmkvStorage } from "./storage";

export type ThemeOption = "light" | "dark" | "system" | "auto";

export interface AppSettings {
  theme: ThemeOption;
  pushNotifications: boolean;
  emailNotifications: boolean;
  currency: "USD" | "KES";
}

interface SettingsStore extends AppSettings {
  updateSetting: <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => void;
  updateMultipleSettings: (settings: Partial<AppSettings>) => void;
  resetToDefaults: () => void;
}

const defaultSettings: AppSettings = {
  theme: "system",
  pushNotifications: true,
  emailNotifications: true,
  currency: "KES",
};

const applyTheme = (theme: ThemeOption) => {
  if (theme === "system") {
    UnistylesRuntime.setAdaptiveThemes(true);
  } else if (theme === "light") {
    UnistylesRuntime.setAdaptiveThemes(false);
    UnistylesRuntime.setTheme("light");
  } else if (theme === "dark") {
    UnistylesRuntime.setAdaptiveThemes(false);
    UnistylesRuntime.setTheme("dark");
  } else if (theme === "auto") {
    UnistylesRuntime.setAdaptiveThemes(false);
    const hour = new Date().getHours();
    const isNight = hour < 6 || hour >= 18;
    UnistylesRuntime.setTheme(isNight ? "dark" : "light");
  }
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...defaultSettings,

      updateSetting: (key, value) => {
        set({ [key]: value });
        if (key === "theme") {
          applyTheme(value as ThemeOption);
        }
      },

      updateMultipleSettings: (settings) => {
        set(settings);
        if (settings.theme) {
          applyTheme(settings.theme);
        }
      },

      resetToDefaults: () => {
        set(defaultSettings);
        applyTheme(defaultSettings.theme);
      },
    }),
    {
      name: "app-settings",
      storage: createJSONStorage(() => mmkvStorage),
      partialize: (state) => {
        const {
          updateSetting,
          updateMultipleSettings,
          resetToDefaults,
          ...persistedState
        } = state;
        return persistedState;
      },
    }
  )
);
