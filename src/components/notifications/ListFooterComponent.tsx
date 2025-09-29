import CustomText from "@/components/ui/CustomText";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { PRIMARY_COLOR } from "unistyles";

type Props<T> = {
  status: string;
  results: T[];
};

const ListFooterComponent = <T,>({ status, results }: Props<T>) => {
  return status === "LoadingMore" ? (
    <View style={styles.footer}>
      <ActivityIndicator size="small" color={PRIMARY_COLOR} />
    </View>
  ) : status === "Exhausted" && results.length > 0 ? (
    <View style={styles.footer}>
      <CustomText variant="small" color="grey500">
        You've reached at the end of the list.
      </CustomText>
    </View>
  ) : null;
};

export default ListFooterComponent;

const styles = StyleSheet.create((theme) => ({
  footer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: theme.gap(2),
  },
}));
