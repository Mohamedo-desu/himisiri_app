import { Fonts } from "constants/Fonts";
import { StyleSheet } from "react-native-unistyles";

// Base spacing unit
export const BASE_GAP = 6;

// Primary color used in both themes
export const PRIMARY_COLOR = "#3C2A4D"; // deep purple for mystery & trust
export const SECONDARY_COLOR = "#FF7F50"; // coral accent for emotion & warmth
export const TERTIARY_COLOR = "#2196F3"; // friendly blue for calm balance
export const BADGE_COLOR = "#E53935"; // vivid red for alerts/urgent badges

export const Colors = {
  primary: PRIMARY_COLOR,
  secondary: SECONDARY_COLOR,
  tertiary: TERTIARY_COLOR,
  onPrimary: "#FFFFFF",
  onSecondary: "#FFFFFF",

  background: "#FFFFFF",
  onBackground: "#000000",
  surface: "#F5F5F5",
  onSurface: "#000000",
  backgroundOverlay: "rgba(0,0,0,0.8)",
  backgroundPrimaryOverlay: "rgba(255, 255, 255, 0.1)",

  error: "#D32F2F",
  onError: "#FFFFFF",
  success: "#388E3C",
  onSuccess: "#FFFFFF",
  warning: "#FBC02D",
  onWarning: "#ffffff",
  info: "#1976D2",
  onInfo: "#FFFFFF",

  grey100: "#F5F5F5",
  grey200: "#EEEEEE",
  grey300: "#E0E0E0",
  grey400: "#BDBDBD",
  grey500: "#757575",
  grey600: "#616161",
  grey700: "#424242",
  grey800: "#212121",
  grey900: "#121212",
};

export const DarkColors = {
  primary: PRIMARY_COLOR,
  secondary: SECONDARY_COLOR,
  tertiary: TERTIARY_COLOR,
  onPrimary: "#FFFFFF",
  onSecondary: "#FFFFFF",

  background: "#121212",
  onBackground: "#FFFFFF",
  surface: "#1E1E1E",
  onSurface: "#FFFFFF",
  backgroundOverlay: "rgba(0,0,0,0.8)",
  backgroundPrimaryOverlay: "rgba(255, 255, 255, 0.1)",

  error: "#EF5350",
  onError: "#ffffff",
  success: "#66BB6A",
  onSuccess: "#ffffff",
  warning: "#FFEB3B",
  onWarning: "#ffffff",
  info: "#2196F3",
  onInfo: "#ffffff",

  grey100: "#1E1E1E",
  grey200: "#2C2C2C",
  grey300: "#383838",
  grey400: "#424242",
  grey500: "#616161",
  grey600: "#757575",
  grey700: "#9E9E9E",
  grey800: "#BDBDBD",
  grey900: "#E0E0E0",
};

// Real-estate app theme
const lightTheme = {
  colors: Colors,
  fonts: Fonts,
  gap: (v: number) => v * BASE_GAP,
  paddingHorizontal: BASE_GAP * 2,
  spacing: {
    small: BASE_GAP * 0.5,
    regular: BASE_GAP,
    large: BASE_GAP * 2,
  },
  radii: {
    small: BASE_GAP * 0.5,
    regular: BASE_GAP,
    large: BASE_GAP * 2,
  },
} as const;

const darkTheme = {
  colors: DarkColors,
  fonts: Fonts,
  gap: (v: number) => v * BASE_GAP,
  paddingHorizontal: BASE_GAP * 2,
  spacing: {
    small: BASE_GAP * 0.5,
    regular: BASE_GAP,
    large: BASE_GAP * 2,
  },
  radii: {
    small: BASE_GAP * 0.5,
    regular: BASE_GAP,
    large: BASE_GAP * 2,
  },
} as const;

const appThemes = { light: lightTheme, dark: darkTheme };

const breakpoints = { phone: 0, largePhone: 400, tablet: 768 } as const;

type AppThemes = typeof appThemes;
type AppBreakpoints = typeof breakpoints;

declare module "react-native-unistyles" {
  export interface UnistylesThemes extends AppThemes {}
  export interface UnistylesBreakpoints extends AppBreakpoints {}
}

StyleSheet.configure({
  settings: { adaptiveThemes: true },
  themes: { light: lightTheme, dark: darkTheme },
  breakpoints,
});
