import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { router } from "expo-router";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import * as IconsSolid from "react-native-heroicons/solid";
import { useUnistyles } from "react-native-unistyles";

interface UserCardProps {
  user: {
    _id: Id<"users">;
    userName: string;
    imageUrl?: string;
    bio?: string;
    followers: number;
    following: number;
    postsPublished: number;
    followedAt?: number;
  };
  showFollowButton?: boolean;
  currentUserId?: Id<"users">;
}

export const UserCard: React.FC<UserCardProps> = ({
  user,
  showFollowButton = true,
  currentUserId,
}) => {
  const { theme } = useUnistyles();
  const followUser = useMutation(api.users.followUser);
  const unfollowUser = useMutation(api.users.unfollowUser);
  const isFollowing = useQuery(
    api.users.isFollowing,
    showFollowButton && currentUserId ? { userId: user._id } : "skip"
  );

  const handleFollowToggle = async () => {
    try {
      if (isFollowing) {
        await unfollowUser({ userId: user._id });
      } else {
        await followUser({ userId: user._id });
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    }
  };

  const isCurrentUser = currentUserId === user._id;

  const handleUserPress = () => {
    if (!isCurrentUser) {
      router.navigate({
        pathname: "/(main)/user/[id]",
        params: { id: user._id },
      });
    }
  };

  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      {/* Profile Image */}
      <TouchableOpacity onPress={handleUserPress} disabled={isCurrentUser}>
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
            <Image
              source={{ uri: user.imageUrl }}
              style={{ width: 50, height: 50, borderRadius: 25 }}
            />
          ) : (
            <IconsSolid.UserIcon size={25} color={theme.colors.onPrimary} />
          )}
        </View>
      </TouchableOpacity>

      {/* User Info */}
      <TouchableOpacity
        style={{ flex: 1 }}
        onPress={handleUserPress}
        disabled={isCurrentUser}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: theme.colors.onBackground,
            marginBottom: 2,
          }}
        >
          {user.userName}
        </Text>

        {user.bio && (
          <Text
            style={{
              fontSize: 14,
              color: theme.colors.grey100,
              marginBottom: 4,
            }}
            numberOfLines={1}
          >
            {user.bio}
          </Text>
        )}

        <View style={{ flexDirection: "row", gap: 16 }}>
          <Text
            style={{
              fontSize: 12,
              color: theme.colors.grey100,
            }}
          >
            {user.followers} followers
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: theme.colors.grey100,
            }}
          >
            {user.postsPublished} posts
          </Text>
        </View>
      </TouchableOpacity>

      {/* Follow Button */}
      {showFollowButton && !isCurrentUser && (
        <TouchableOpacity
          onPress={handleFollowToggle}
          style={{
            backgroundColor: isFollowing
              ? theme.colors.background
              : theme.colors.primary,
            borderColor: theme.colors.primary,
            borderWidth: 1,
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            minWidth: 80,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: isFollowing
                ? theme.colors.primary
                : theme.colors.onPrimary,
              fontWeight: "600",
              fontSize: 14,
            }}
          >
            {isFollowing ? "Unfollow" : "Follow"}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
