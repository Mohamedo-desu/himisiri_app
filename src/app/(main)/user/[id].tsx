import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as IconsOutline from "react-native-heroicons/outline";
import * as IconsSolid from "react-native-heroicons/solid";
import { SafeAreaView } from "react-native-safe-area-context";
import { SvgXml } from "react-native-svg";
import { useUnistyles } from "react-native-unistyles";
import { FollowersModal } from "../../../components/ui/FollowersModal";

const UserProfileScreen = () => {
  const { theme } = useUnistyles();
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return null;
  }

  const userId = id as Id<"users">;

  // Get user data
  const user = useQuery(api.users.getUserById, { userId });
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const isFollowing = useQuery(
    api.users.isFollowing,
    currentUser ? { userId } : "skip"
  );

  // Mutations
  const followUser = useMutation(api.users.followUser);
  const unfollowUser = useMutation(api.users.unfollowUser);

  // State
  const [followersModalVisible, setFollowersModalVisible] = useState(false);
  const [followersModalTab, setFollowersModalTab] = useState<
    "followers" | "following"
  >("followers");
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  const handleFollowToggle = async () => {
    if (!currentUser || isFollowLoading) return;

    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        await unfollowUser({ userId });
      } else {
        await followUser({ userId });
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      Alert.alert("Error", "Failed to update follow status. Please try again.");
    } finally {
      setIsFollowLoading(false);
    }
  };

  if (!user || !currentUser) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text
            style={{
              marginTop: 16,
              fontSize: 16,
              color: theme.colors.grey100,
            }}
          >
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const StatCard = ({
    label,
    value,
    IconComponent,
    onPress,
  }: {
    label: string;
    value: number;
    IconComponent: React.ComponentType<{ size: number; color: string }>;
    onPress?: () => void;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={{
        backgroundColor: theme.colors.surface,
        padding: 16,
        borderRadius: 12,
        alignItems: "center",
        flex: 1,
      }}
    >
      <IconComponent size={24} color={theme.colors.primary} />
      <Text
        style={{
          fontSize: 20,
          fontWeight: "bold",
          color: theme.colors.onBackground,
          marginTop: 8,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: 12,
          color: theme.colors.grey100,
          textAlign: "center",
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const isCurrentUser = currentUser._id === userId;

  console.log("user.imageUrl:", user.imageUrl);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.grey300,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.colors.surface,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconsOutline.ArrowLeftIcon
            size={20}
            color={theme.colors.onBackground}
          />
        </TouchableOpacity>

        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: theme.colors.onBackground,
          }}
        >
          Profile
        </Text>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={{ flex: 1, padding: 16 }}>
        {/* Profile Header */}
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: 16,
            padding: 20,
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          {/* Profile Image */}
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: theme.colors.primary,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            {user.imageUrl ? (
              <SvgXml xml={user.imageUrl} width={40} height={40} />
            ) : (
              <IconsSolid.UserIcon size={40} color={theme.colors.onPrimary} />
            )}
          </View>

          {/* User Info */}
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              color: theme.colors.onBackground,
              marginBottom: 4,
            }}
          >
            {user.userName}
          </Text>

          {user.bio && (
            <Text
              style={{
                fontSize: 14,
                color: theme.colors.grey100,
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              {user.bio}
            </Text>
          )}

          {/* Follow Button */}
          {!isCurrentUser && (
            <TouchableOpacity
              onPress={handleFollowToggle}
              disabled={isFollowLoading}
              style={{
                backgroundColor: isFollowing
                  ? theme.colors.background
                  : theme.colors.primary,
                borderColor: theme.colors.primary,
                borderWidth: 1,
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 25,
                minWidth: 120,
                alignItems: "center",
              }}
            >
              {isFollowLoading ? (
                <ActivityIndicator
                  size="small"
                  color={
                    isFollowing ? theme.colors.primary : theme.colors.onPrimary
                  }
                />
              ) : (
                <Text
                  style={{
                    color: isFollowing
                      ? theme.colors.primary
                      : theme.colors.onPrimary,
                    fontWeight: "600",
                    fontSize: 16,
                  }}
                >
                  {isFollowing ? "Unfollow" : "Follow"}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Stats */}
        <View
          style={{
            flexDirection: "row",
            gap: 12,
            marginBottom: 24,
          }}
        >
          <StatCard
            label="Posts"
            value={user.postsPublished}
            IconComponent={IconsOutline.DocumentTextIcon}
          />
          <StatCard
            label="Followers"
            value={user.followers}
            IconComponent={IconsOutline.UserGroupIcon}
            onPress={() => {
              setFollowersModalTab("followers");
              setFollowersModalVisible(true);
            }}
          />
          <StatCard
            label="Following"
            value={user.following}
            IconComponent={IconsOutline.HeartIcon}
            onPress={() => {
              setFollowersModalTab("following");
              setFollowersModalVisible(true);
            }}
          />
        </View>

        {/* Additional Info Section */}
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: 12,
            padding: 16,
            marginBottom: 24,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: theme.colors.onBackground,
              marginBottom: 12,
            }}
          >
            About
          </Text>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <IconsOutline.CalendarDaysIcon
              size={16}
              color={theme.colors.grey100}
            />
            <Text
              style={{
                fontSize: 14,
                color: theme.colors.grey100,
                marginLeft: 8,
              }}
            >
              Joined recently
            </Text>
          </View>

          {user.age && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <IconsOutline.UserIcon size={16} color={theme.colors.grey100} />
              <Text
                style={{
                  fontSize: 14,
                  color: theme.colors.grey100,
                  marginLeft: 8,
                }}
              >
                {user.age} years old
              </Text>
            </View>
          )}

          {user.gender && (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <IconsOutline.IdentificationIcon
                size={16}
                color={theme.colors.grey100}
              />
              <Text
                style={{
                  fontSize: 14,
                  color: theme.colors.grey100,
                  marginLeft: 8,
                  textTransform: "capitalize",
                }}
              >
                {user.gender}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Followers Modal */}
      <FollowersModal
        visible={followersModalVisible}
        onClose={() => setFollowersModalVisible(false)}
        userId={userId}
        currentUserId={currentUser._id}
        initialTab={followersModalTab}
        followersCount={user.followers}
        followingCount={user.following}
      />
    </SafeAreaView>
  );
};

export default UserProfileScreen;
