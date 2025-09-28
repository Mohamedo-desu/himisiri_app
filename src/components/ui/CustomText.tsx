import { Fonts } from "@/constants/Fonts";
import React, { FC } from "react";
import { Platform, Text, TextProps, TextStyle } from "react-native";
import { StyleSheet } from "react-native-unistyles";

/**
 * CustomText Component - Comprehensive Typography System
 *
 * A highly flexible and feature-rich text component for complex applications.
 * Supports multiple variants, font weights, colors, and advanced typography features.
 *
 * @example
 * // Basic usage
 * <CustomText variant="h1">Main Heading</CustomText>
 *
 * // Advanced usage
 * <CustomText
 *   variant="body1"
 *   fontWeight="medium"
 *   color="primary"
 *   textAlign="center"
 *   letterSpacing={0.5}
 *   maxLines={2}
 * >
 *   Your content here
 * </CustomText>
 *
 * // Using convenience components
 * <TitleText bold color="accent">Page Title</TitleText>
 * <BodyText color="muted" truncate>Long description text...</BodyText>
 */

// Typography variants for different use cases
type Variant =
  // Headings
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  // Body text
  | "body1"
  | "body2"
  | "body3"
  // UI elements
  | "button"
  | "caption"
  | "overline"
  | "subtitle1"
  | "subtitle2"
  // Special cases
  | "display"
  | "headline"
  | "title"
  | "label"
  | "small"
  | "tiny";

// Text weight variants
type FontWeight =
  | "light"
  | "regular"
  | "medium"
  | "semibold"
  | "bold"
  | "black";

// Text alignment options
type TextAlign = "left" | "center" | "right" | "justify";

// Text transform options
type TextTransform = "none" | "uppercase" | "lowercase" | "capitalize";

// Color variants - aligned with your theme system
type ColorVariant =
  | "primary"
  | "onPrimary"
  | "secondary"
  | "tertiary"
  | "onSecondary"
  | "background"
  | "onBackground"
  | "surface"
  | "onSurface"
  | "error"
  | "onError"
  | "success"
  | "onSuccess"
  | "warning"
  | "onWarning"
  | "info"
  | "onInfo"
  | "grey100"
  | "grey200"
  | "grey300"
  | "grey400"
  | "grey500"
  | "grey600"
  | "grey700"
  | "grey800"
  | "grey900"
  | "white"
  | "black"
  | "muted"
  | "disabled";

type PlatformType = "ios" | "android";

// Extend TextProps with comprehensive customization options
interface CustomTextProps extends TextProps {
  variant?: Variant;
  fontFamily?: Fonts;
  fontWeight?: FontWeight;
  fontSize?: number;
  lineHeight?: number;
  letterSpacing?: number;
  textAlign?: TextAlign;
  textTransform?: TextTransform;
  color?: ColorVariant;
  opacity?: number;
  underline?: boolean;
  strikethrough?: boolean;
  italic?: boolean;
  truncate?: boolean;
  maxLines?: number;
  bold?: boolean;
  semibold?: boolean;
  medium?: boolean;
  light?: boolean;
}

// Comprehensive font size mapping for all variants
const fontSizeMap: Record<Variant, Record<PlatformType, number>> = {
  // Display and headline sizes
  display: { android: 32, ios: 30 },
  headline: { android: 28, ios: 26 },

  // Traditional headings
  h1: { android: 24, ios: 22 },
  h2: { android: 22, ios: 20 },
  h3: { android: 20, ios: 18 },
  h4: { android: 18, ios: 16 },
  h5: { android: 16, ios: 14 },
  h6: { android: 14, ios: 12 },

  // Title and subtitle
  title: { android: 20, ios: 18 },
  subtitle1: { android: 16, ios: 14 },
  subtitle2: { android: 14, ios: 12 },

  // Body text
  body1: { android: 16, ios: 14 },
  body2: { android: 14, ios: 12 },
  body3: { android: 12, ios: 10 },

  // UI elements
  button: { android: 14, ios: 12 },
  label: { android: 12, ios: 10 },
  caption: { android: 12, ios: 10 },
  overline: { android: 10, ios: 9 },
  small: { android: 10, ios: 9 },
  tiny: { android: 8, ios: 7 },
};

// Font weight mapping
const fontWeightMap: Record<FontWeight, Fonts> = {
  light: Fonts.Regular, // Assuming Regular is the lightest available
  regular: Fonts.Regular,
  medium: Fonts.Medium,
  semibold: Fonts.SemiBold,
  bold: Fonts.Bold,
  black: Fonts.Black,
};

// Line height mapping based on font size
const getLineHeight = (fontSize: number, variant?: Variant): number => {
  const baseMultiplier = 1.4;

  switch (variant) {
    case "display":
    case "headline":
    case "h1":
    case "h2":
      return fontSize * 1.2; // Tighter line height for large headings
    case "h3":
    case "h4":
    case "h5":
    case "h6":
    case "title":
      return fontSize * 1.3;
    case "body1":
    case "body2":
    case "body3":
      return fontSize * 1.5; // More readable line height for body text
    case "caption":
    case "overline":
    case "small":
    case "tiny":
      return fontSize * 1.3;
    default:
      return fontSize * baseMultiplier;
  }
};
// Helper function to get theme-based color style
const getThemeColorStyle = (colorVariant: ColorVariant, styles: any) => {
  const validColorKeys: (keyof typeof styles)[] = [
    "primary",
    "onPrimary",
    "secondary",
    "tertiary",
    "onSecondary",
    "background",
    "onBackground",
    "surface",
    "onSurface",
    "error",
    "onError",
    "success",
    "onSuccess",
    "warning",
    "onWarning",
    "info",
    "onInfo",
    "grey100",
    "grey200",
    "grey300",
    "grey400",
    "grey500",
    "grey600",
    "grey700",
    "grey800",
    "grey900",
  ];

  if (validColorKeys.includes(colorVariant as keyof typeof styles)) {
    return styles[colorVariant as keyof typeof styles];
  }
  return null;
};

const CustomText: FC<CustomTextProps> = ({
  variant = "body1",
  fontFamily,
  fontWeight,
  fontSize,
  lineHeight,
  letterSpacing,
  textAlign = "left",
  textTransform = "none",
  color = "onBackground",
  opacity = 1,
  underline = false,
  strikethrough = false,
  italic = false,
  truncate = false,
  maxLines,
  bold = false,
  semibold = false,
  medium = false,
  light = false,
  style,
  children,
  ...props
}) => {
  // Create styles inside component to ensure theme is available
  const styles = StyleSheet.create((theme) => ({
    text: {
      color: theme.colors.onBackground,
    },
    // Theme color variants
    primary: {
      color: theme.colors.primary,
    },
    onPrimary: {
      color: theme.colors.onPrimary,
    },
    secondary: {
      color: theme.colors.secondary,
    },
    tertiary: {
      color: theme.colors.tertiary,
    },
    onSecondary: {
      color: theme.colors.onSecondary,
    },
    background: {
      color: theme.colors.background,
    },
    onBackground: {
      color: theme.colors.onBackground,
    },
    surface: {
      color: theme.colors.surface,
    },
    onSurface: {
      color: theme.colors.onSurface,
    },
    error: {
      color: theme.colors.error,
    },
    onError: {
      color: theme.colors.onError,
    },
    success: {
      color: theme.colors.success,
    },
    onSuccess: {
      color: theme.colors.onSuccess,
    },
    warning: {
      color: theme.colors.warning,
    },
    onWarning: {
      color: theme.colors.onWarning,
    },
    info: {
      color: theme.colors.info,
    },
    onInfo: {
      color: theme.colors.onInfo,
    },
    // Grey scale variants
    grey100: {
      color: theme.colors.grey100,
    },
    grey200: {
      color: theme.colors.grey200,
    },
    grey300: {
      color: theme.colors.grey300,
    },
    grey400: {
      color: theme.colors.grey400,
    },
    grey500: {
      color: theme.colors.grey500,
    },
    grey600: {
      color: theme.colors.grey600,
    },
    grey700: {
      color: theme.colors.grey700,
    },
    grey800: {
      color: theme.colors.grey800,
    },
    grey900: {
      color: theme.colors.grey900,
    },
  }));
  // Determine font size
  let computedFontSize: number = fontSize || 14;
  if (!fontSize && variant && fontSizeMap[variant]) {
    const defaultSize = fontSizeMap[variant][Platform.OS as PlatformType];
    computedFontSize = defaultSize;
  }

  // Determine font family/weight
  let computedFontFamily = fontFamily || Fonts.Regular;

  // Priority order for font weight determination
  if (fontWeight) {
    computedFontFamily = fontWeightMap[fontWeight];
  } else if (bold) {
    computedFontFamily = Fonts.Bold;
  } else if (semibold) {
    computedFontFamily = Fonts.SemiBold;
  } else if (medium) {
    computedFontFamily = Fonts.Medium;
  } else if (light) {
    computedFontFamily = Fonts.Regular; // Assuming Regular is lightest
  }

  // Determine line height
  const computedLineHeight =
    lineHeight || getLineHeight(computedFontSize, variant);

  // Build comprehensive text style
  const textStyle: TextStyle = {
    fontFamily: computedFontFamily,
    fontSize: computedFontSize,
    lineHeight: computedLineHeight,
    textAlign,
    textTransform,
    opacity,
    fontStyle: italic ? "italic" : "normal",
    textDecorationLine: (() => {
      if (underline && strikethrough) return "underline line-through";
      if (underline) return "underline";
      if (strikethrough) return "line-through";
      return "none";
    })(),
    ...(letterSpacing && { letterSpacing }),
  };

  // Handle text truncation
  const textProps = {
    ...props,
    ...(truncate && { numberOfLines: 1, ellipsizeMode: "tail" as const }),
    ...(maxLines && { numberOfLines: maxLines }),
  };

  return (
    <Text
      style={[
        styles.text,
        getThemeColorStyle(color, styles),
        getColorStyle(color),
        textStyle,
        style,
      ]}
      {...textProps}
    >
      {children}
    </Text>
  );
};

// Helper function to get color styles based on theme
const getColorStyle = (colorVariant: ColorVariant) => {
  switch (colorVariant) {
    case "white":
      return { color: "#FFFFFF" };
    case "black":
      return { color: "#000000" };
    case "muted":
      return { opacity: 0.6 };
    case "disabled":
      return { opacity: 0.4 };
    default:
      // Return empty object - let the theme styles handle the color
      // The actual theme color will be applied in the StyleSheet
      return {};
  }
};

export default CustomText;

// Export types for external use
export type { ColorVariant, CustomTextProps, Variant };
