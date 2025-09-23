import CustomText from "@/components/ui/CustomText";
import { EnrichedPost } from "@/types";
import React from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { PRIMARY_COLOR } from "unistyles";

const ListEmptyComponent = ({
  isLoading,
  results,
}: {
  isLoading: boolean;
  results: EnrichedPost[];
}) => {
  const { t } = useTranslation();

  return isLoading ? (
    <View style={styles.listEmptyComponent}>
      <ActivityIndicator size="small" color={PRIMARY_COLOR} />
      <CustomText variant="caption" color="grey500" style={{ marginTop: 10 }}>
        Loading posts...
      </CustomText>
    </View>
  ) : results.length === 0 ? (
    <View style={styles.listEmptyComponent}>
      <CustomText variant="body1" color="grey500">
        {t("homeScreen.noResults")}
      </CustomText>
      <CustomText variant="caption" color="grey400" style={{ marginTop: 5 }}>
        Be the first to share something!
      </CustomText>
    </View>
  ) : null;
};

export default ListEmptyComponent;

const styles = StyleSheet.create((theme) => ({
  listEmptyComponent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: theme.gap(2),
  },
}));
