import { Id } from "@/convex/_generated/dataModel";
import { useUserOnlineStatus } from "@/hooks/useUserPresence";
import { formatDistanceToNowStrict } from "date-fns";
import React from "react";
import { View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import CustomText from "./CustomText";

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
  const { isOnline, lastSeenAt, lastActiveAt, isLoading } =
    useUserOnlineStatus(userId);

  // Don't render if no userId
  if (!userId) {
    return null;
  }

  const getStatusText = () => {
    if (isLoading) return "Loading...";

    // For online users: Show lastActiveAt → "Active 2 minutes ago"
    if (isOnline) {
      if (lastActiveAt) {
        const timeAgo = formatDistanceToNowStrict(new Date(lastActiveAt), {
          addSuffix: false,
        });
        return `Active ${timeAgo} ago`;
      }
      return "Online";
    }

    // For offline users: Show lastSeenAt → "Last seen 2 hours ago"
    if (lastSeenAt) {
      const timeAgo = formatDistanceToNowStrict(new Date(lastSeenAt), {
        addSuffix: false,
      });
      return `Last seen ${timeAgo} ago`;
    }

    return "Offline";
  };

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
      {showText && <CustomText>{getStatusText()}</CustomText>}
    </View>
  );
};

export default OnlineStatusIndicator;

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  indicator: {
    borderRadius: 50,
    borderWidth: 2,
    borderColor: theme.colors.surface,
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
    width: 14,
    height: 14,
  },
  online: {
    backgroundColor: theme.colors.success,
  },
  offline: {
    backgroundColor: theme.colors.grey400,
  },
}));
