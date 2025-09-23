import CustomText from "@/components/ui/CustomText";
import { EnrichedPost } from "@/types";
import React from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { PRIMARY_COLOR } from "unistyles";

const ListFooterComponent = ({
  status,
  results,
}: {
  status: string;
  results: EnrichedPost[];
}) => {
  const { t } = useTranslation();

  return status === "LoadingMore" ? (
    <View style={styles.listEmptyComponent}>
      <ActivityIndicator size="small" color={PRIMARY_COLOR} />
    </View>
  ) : status === "Exhausted" && results.length > 0 ? (
    <View style={styles.listEmptyComponent}>
      <CustomText variant="caption" color="grey500">
        {t("homeScreen.exhausted")}
      </CustomText>
    </View>
  ) : null;
};

export default ListFooterComponent;

const styles = StyleSheet.create((theme) => ({
  listEmptyComponent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: theme.gap(2),
  },
}));
