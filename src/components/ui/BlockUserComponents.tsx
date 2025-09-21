import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import React, { useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import * as IconsSolid from "react-native-heroicons/solid";
import { SvgXml } from "react-native-svg";
import { useUnistyles } from "react-native-unistyles";

interface BlockUserButtonProps {
  userId: Id<"users">;
  userName?: string;
  onBlockStatusChange?: (isBlocked: boolean) => void;
  style?: any;
  textStyle?: any;
}

export const BlockUserButton: React.FC<BlockUserButtonProps> = ({
  userId,
  userName,
  onBlockStatusChange,
  style,
  textStyle,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  // Check if user is blocked
  const isBlocked = useQuery(api.userBlocking.isUserBlocked, { userId });

  // Mutations
  const blockUser = useMutation(api.userBlocking.blockUser);
  const unblockUser = useMutation(api.userBlocking.unblockUser);

  const handlePress = async () => {
    if (isLoading || isBlocked === undefined) return;

    setIsLoading(true);
    try {
      if (isBlocked) {
        // Unblock user
        await unblockUser({ userId });
        Alert.alert("Success", `${userName || "User"} has been unblocked`);
        onBlockStatusChange?.(false);
      } else {
        // Block user - show confirmation
        Alert.alert(
          "Block User",
          `Are you sure you want to block ${userName || "this user"}? You will no longer see their posts, comments, or replies, and they won't be able to interact with your content.`,
          [
            {
              text: "Cancel",
              style: "cancel",
            },
            {
              text: "Block",
              style: "destructive",
              onPress: async () => {
                try {
                  await blockUser({ userId });
                  Alert.alert(
                    "Success",
                    `${userName || "User"} has been blocked`
                  );
                  onBlockStatusChange?.(true);
                } catch (error) {
                  Alert.alert(
                    "Error",
                    "Failed to block user. Please try again."
                  );
                  console.error("Block user error:", error);
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert("Error", "Failed to update block status. Please try again.");
      console.error("Block/unblock error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isBlocked === undefined) {
    return null; // Loading state
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isLoading}
      style={[
        {
          paddingHorizontal: 16,
          paddingVertical: 8,
          borderRadius: 8,
          backgroundColor: isBlocked ? "#22C55E" : "#EF4444",
          opacity: isLoading ? 0.6 : 1,
        },
        style,
      ]}
    >
      <Text
        style={[
          {
            color: "white",
            fontWeight: "600",
            textAlign: "center",
          },
          textStyle,
        ]}
      >
        {isLoading ? "..." : isBlocked ? "Unblock" : "Block"}
      </Text>
    </TouchableOpacity>
  );
};

interface BlockedUsersListProps {
  style?: any;
}

export const BlockedUsersList: React.FC<BlockedUsersListProps> = ({
  style,
}) => {
  const { theme } = useUnistyles();
  const blockedUsers = useQuery(api.userBlocking.getBlockedUsers);
  const unblockUser = useMutation(api.userBlocking.unblockUser);

  console.log("BlockedUsersList rendered, blockedUsers:", blockedUsers);

  const handleUnblock = async (userId: Id<"users">, userName: string) => {
    Alert.alert(
      "Unblock User",
      `Are you sure you want to unblock ${userName}?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Unblock",
          onPress: async () => {
            try {
              await unblockUser({ userId });
              Alert.alert("Success", `${userName} has been unblocked`);
            } catch (error) {
              Alert.alert("Error", "Failed to unblock user. Please try again.");
              console.error("Unblock user error:", error);
            }
          },
        },
      ]
    );
  };

  if (!blockedUsers) {
    return (
      <View style={[{ padding: 16 }, style]}>
        <Text style={{ textAlign: "center", color: theme.colors.grey100 }}>
          Loading...
        </Text>
      </View>
    );
  }

  if (blockedUsers.length === 0) {
    return (
      <View style={[{ padding: 16, alignItems: "center" }, style]}>
        <IconsSolid.NoSymbolIcon
          size={48}
          color={theme.colors.grey100}
          style={{ marginBottom: 12 }}
        />
        <Text
          style={{
            textAlign: "center",
            color: theme.colors.grey100,
            fontSize: 16,
            fontWeight: "600",
            marginBottom: 4,
          }}
        >
          No blocked users
        </Text>
        <Text
          style={{
            textAlign: "center",
            color: theme.colors.grey100,
            fontSize: 14,
          }}
        >
          Users you block will appear here
        </Text>
      </View>
    );
  }

  return (
    <View style={style}>
      {blockedUsers.map((user) => (
        <View
          key={user._id}
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.background,
          }}
        >
          {/* User Avatar */}
          <View
            style={{
              width: 50,
              height: 50,
              borderRadius: 25,
              backgroundColor: theme.colors.primary,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            {user.imageUrl ? (
              <SvgXml xml={user.imageUrl} width={50} height={50} />
            ) : (
              <IconsSolid.UserIcon size={25} color={theme.colors.onPrimary} />
            )}
          </View>

          {/* User Info */}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontWeight: "600",
                fontSize: 16,
                color: theme.colors.onBackground,
              }}
            >
              {user.userName}
            </Text>
            {user.blockedAt && (
              <Text
                style={{
                  color: theme.colors.grey100,
                  fontSize: 12,
                  marginTop: 2,
                }}
              >
                Blocked {new Date(user.blockedAt).toLocaleDateString()}
              </Text>
            )}
          </View>

          {/* Unblock Button */}
          <TouchableOpacity
            onPress={() => handleUnblock(user._id, user.userName)}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 6,
              backgroundColor: "#22C55E",
            }}
          >
            <Text style={{ color: "white", fontWeight: "600" }}>Unblock</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};
