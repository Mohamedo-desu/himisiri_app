import { Id } from "@/convex/_generated/dataModel";
import { useUserOnlineStatus } from "@/hooks/useUserPresence";
import React from "react";
import { Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

interface OnlineStatusIndicatorProps {
  userId: Id<"users"> | null | undefined;
  showText?: boolean;
  size?: "small" | "medium" | "large";
  style?: any;
}

const OnlineStatusIndicator: React.FC<OnlineStatusIndicatorProps> = ({
  userId,
  showText = false,
  size = "medium",
  style,
}) => {
  const { theme } = useUnistyles();
  const { isOnline, lastSeenAt, isLoading } = useUserOnlineStatus(userId);

  // Don't render if no userId
  if (!userId) {
    return null;
  }

  const getStatusText = () => {
    if (isLoading) return "Loading...";
    if (isOnline) return "Online";

    if (lastSeenAt) {
      const now = Date.now();
      const timeDiff = now - lastSeenAt;
      const minutes = Math.floor(timeDiff / (1000 * 60));
      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

      if (minutes < 1) return "Just now";
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;
      return "Offline";
    }

    return "Offline";
  };

  const styles = StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
    },
    indicator: {
      borderRadius: 50,
      borderWidth: 2,
      borderColor: theme.colors.background,
    },
    indicatorSmall: {
      width: 8,
      height: 8,
    },
    indicatorMedium: {
      width: 12,
      height: 12,
    },
    indicatorLarge: {
      width: 16,
      height: 16,
    },
    online: {
      backgroundColor: "#4CAF50", // Green
    },
    offline: {
      backgroundColor: "#9E9E9E", // Gray
    },
    statusText: {
      marginLeft: 6,
      fontSize: size === "small" ? 10 : size === "medium" ? 12 : 14,
      fontWeight: "500",
    },
    onlineText: {
      color: "#4CAF50",
    },
    offlineText: {
      color: theme.colors.grey500,
    },
  });

  if (isLoading && !showText) {
    return null;
  }

  const getSizeStyle = () => {
    switch (size) {
      case "small":
        return styles.indicatorSmall;
      case "large":
        return styles.indicatorLarge;
      default:
        return styles.indicatorMedium;
    }
  };

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.indicator,
          getSizeStyle(),
          isOnline ? styles.online : styles.offline,
        ]}
      />
      {showText && (
        <Text
          style={[
            styles.statusText,
            isOnline ? styles.onlineText : styles.offlineText,
          ]}
        >
          {getStatusText()}
        </Text>
      )}
    </View>
  );
};

export default OnlineStatusIndicator;
