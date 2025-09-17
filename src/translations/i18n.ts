import { getFromLocalStorage } from "@/store/storage";
import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { en } from "./languages/en";
import { so } from "./languages/so";
import { sw } from "./languages/sw";

// Retrieve the stored language from your storage
const stored = getFromLocalStorage(["language"]);
let defaultLanguage = "en";

if (stored.language) {
  try {
    const parsed = JSON.parse(stored.language);
    defaultLanguage = parsed.code || "en";
  } catch (error) {
    console.error("Error parsing stored language:", error);
  }
}

i18next.use(initReactI18next).init({
  resources: {
    en,
    so,
    sw,
  },
  lng: defaultLanguage, // Set default language dynamically
  fallbackLng: "en",
  interpolation: {
    escapeValue: false, // React already escapes by default
  },
});

export default i18next;
