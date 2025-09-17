import React from "react";
import { View } from "react-native";
import { SharedValue } from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";
import StickyHeader from "./StickyHeader";

const HEADER_HEIGHT = 200; // Adjust this value to match your actual header height
const STICKY_HEIGHT = 56; // Adjust to your sticky bar's height

const StickyHeaderContainer = ({
  scrollY,
}: {
  scrollY: SharedValue<number>;
}) => {
  return (
    <StickyHeader
      scrollY={scrollY}
      headerHeight={HEADER_HEIGHT}
      stickyHeight={STICKY_HEIGHT}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          width: "100%",
          justifyContent: "space-between",
        }}
      ></View>
    </StickyHeader>
  );
};

export default StickyHeaderContainer;

const styles = StyleSheet.create((theme) => ({
  stickyNotf: {
    backgroundColor: theme.colors.grey800 + "22",
  },
}));
