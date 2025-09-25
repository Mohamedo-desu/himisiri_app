import { Id } from "@/convex/_generated/dataModel";
import React from "react";
import { View } from "react-native";
import { SvgXml } from "react-native-svg";
import { StyleSheet } from "react-native-unistyles";
import OnlineStatusIndicator from "./OnlineStatusIndicator";

const UserAvatar = ({
  imageUrl,
  size,
  userId,
  indicatorSize,
}: {
  imageUrl: string;
  size: number;
  userId: Id<"users">;
  indicatorSize: "medium" | "small" | "large" | undefined;
}) => {
  return (
    <View style={{ width: size, height: size }}>
      <SvgXml xml={imageUrl} width={size} height={size} />
      <View style={styles.indicatorWrapper}>
        <OnlineStatusIndicator userId={userId} size={indicatorSize} />
      </View>
    </View>
  );
};

export default UserAvatar;

const styles = StyleSheet.create((theme) => ({
  indicatorWrapper: {
    position: "absolute",
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
}));
