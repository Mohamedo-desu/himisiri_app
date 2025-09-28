import CustomText from "@/components/ui/CustomText";
import { EnrichedPost } from "@/types";
import React from "react";
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
  return status === "LoadingMore" ? (
    <View style={styles.listEmptyComponent}>
      <ActivityIndicator size="small" color={PRIMARY_COLOR} />
    </View>
  ) : status === "Exhausted" && results.length > 0 ? (
    <View style={styles.listEmptyComponent}>
      <CustomText variant="caption" color="grey500">
        You've reached at the end of the list.
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
