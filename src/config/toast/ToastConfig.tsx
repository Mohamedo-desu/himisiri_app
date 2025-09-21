import React from "react";

import { BaseToast, ToastProps } from "react-native-toast-message";
import { StyleSheet } from "react-native-unistyles";

const successToastStyles = StyleSheet.create((theme) => ({
  style: {
    borderLeftColor: theme.colors.success,
    backgroundColor: theme.colors.background,
    elevation: 5,
  },
  text1Style: {
    color: theme.colors.success,
    fontSize: 12,
    fontFamily: theme.fonts.Bold,
  },
  text2Style: {
    color: theme.colors.grey800,
    fontSize: 11,
    fontFamily: theme.fonts.Regular,
  },
}));
const errorToastStyles = StyleSheet.create((theme) => ({
  style: {
    borderLeftColor: theme.colors.error,
    backgroundColor: theme.colors.background,
    elevation: 5,
  },
  text1Style: {
    color: theme.colors.error,
    fontSize: 12,
    fontFamily: theme.fonts.Bold,
  },
  text2Style: {
    color: theme.colors.grey800,
    fontSize: 11,
    fontFamily: theme.fonts.Regular,
  },
}));
const infoToastStyles = StyleSheet.create((theme) => ({
  style: {
    borderLeftColor: theme.colors.info,
    backgroundColor: theme.colors.background,
    elevation: 5,
  },
  text1Style: {
    color: theme.colors.info,
    fontSize: 12,
    fontFamily: theme.fonts.Bold,
  },
  text2Style: {
    color: theme.colors.grey800,
    fontSize: 11,
    fontFamily: theme.fonts.Regular,
  },
}));
const warningToastStyles = StyleSheet.create((theme) => ({
  style: {
    borderLeftColor: theme.colors.warning,
    backgroundColor: theme.colors.background,
    elevation: 5,
  },
  text1Style: {
    color: theme.colors.warning,
    fontSize: 12,
    fontFamily: theme.fonts.Bold,
  },
  text2Style: {
    color: theme.colors.grey800,
    fontSize: 11,
    fontFamily: theme.fonts.Regular,
  },
}));

const BaseToastStyles = StyleSheet.create((theme) => ({
  contentContainerStyle: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
}));

export default {
  success: (props: ToastProps) => (
    <BaseToast
      {...props}
      {...successToastStyles}
      text1NumberOfLines={1}
      text2NumberOfLines={2}
      contentContainerStyle={BaseToastStyles.contentContainerStyle}
    />
  ),
  error: (props: ToastProps) => (
    <BaseToast
      {...props}
      {...errorToastStyles}
      text1NumberOfLines={1}
      text2NumberOfLines={2}
      contentContainerStyle={BaseToastStyles.contentContainerStyle}
    />
  ),
  info: (props: ToastProps) => (
    <BaseToast
      {...props}
      {...infoToastStyles}
      text1NumberOfLines={1}
      text2NumberOfLines={2}
      contentContainerStyle={BaseToastStyles.contentContainerStyle}
    />
  ),
  warning: (props: ToastProps) => (
    <BaseToast
      {...props}
      {...warningToastStyles}
      text1NumberOfLines={1}
      text2NumberOfLines={2}
      contentContainerStyle={BaseToastStyles.contentContainerStyle}
    />
  ),
};
