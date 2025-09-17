import React from "react";
import { useTranslation } from "react-i18next";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

const HomeListHeader = () => {
  const { t } = useTranslation();
  return (
    <View style={styles.headerContainer}>
      <View style={styles.container}></View>
    </View>
  );
};

export default HomeListHeader;

const styles = StyleSheet.create((theme) => ({
  headerContainer: {
    marginVertical: theme.gap(2),
    gap: theme.gap(2),
  },
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.small,
    padding: theme.paddingHorizontal,
    gap: theme.gap(2),
  },
  requestContainer: {
    backgroundColor: theme.colors.primary,
    height: theme.gap(10),
    paddingHorizontal: theme.paddingHorizontal,
    borderRadius: theme.radii.small,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderStyle: "dashed",
    borderWidth: 1,
    borderColor: theme.colors.onPrimary,
    elevation: 3,
  },
  clickHereImage: {
    width: 60,
    aspectRatio: 1,
  },
}));
