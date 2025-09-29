import CustomText from "@/components/ui/CustomText";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { PRIMARY_COLOR } from "unistyles";

type Props<T> = {
  isLoading: boolean;
  results: T[];
  loadingText?: string;
  emptyText?: string;
  emptySubText?: string;
};

const ListEmptyComponent = <T,>({
  isLoading,
  results,
  loadingText = "Loading notifications...",
  emptyText = "No notifications yet",
  emptySubText = "When someone interacts with your posts, you’ll see it here",
}: Props<T>) => {
  return isLoading ? (
    <View style={styles.listEmptyComponent}>
      <ActivityIndicator size="small" color={PRIMARY_COLOR} />
      <CustomText variant="label" color="grey500" style={{ marginTop: 10 }}>
        {loadingText}
      </CustomText>
    </View>
  ) : results.length === 0 ? (
    <View style={styles.listEmptyComponent}>
      <CustomText variant="small" color="grey500">
        {emptyText}
      </CustomText>
      <CustomText variant="small" color="grey400" style={{ marginTop: 5 }}>
        {emptySubText}
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
