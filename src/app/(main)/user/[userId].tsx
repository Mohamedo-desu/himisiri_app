import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
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
import PostCard from "../../../components/home-screen/PostCard";
import CommentCard from "../../../components/post-details/CommentCard";

const UserDetailsScreen = () => {
  const { theme } = useUnistyles();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [activeTab, setActiveTab] = useState<"posts" | "comments" | "replies">(
    "posts"
  );

  // Get current user to check if viewing own profile
  const currentUser = useQuery(api.users.getCurrentUser, {});

  // Get user details
  const userDetails = useQuery(
    api.users.getUserById,
    userId ? { userId: userId as Id<"users"> } : "skip"
  );

  // Get user's posts
  const userPosts = useQuery(
    api.posts.getPostsByAuthor,
    userId ? { authorId: userId as Id<"users"> } : "skip"
  );

  // Get user's comments (you'll need to create this query)
  const userComments = useQuery(
    api.comments.getCommentsByUser,
    userId ? { userId: userId as Id<"users"> } : "skip"
  );

  // Get user's replies (you'll need to create this query)
  const userReplies = useQuery(
    api.replies.getRepliesByUser,
    userId ? { userId: userId as Id<"users"> } : "skip"
  );

  // Follow/unfollow mutations
  const followUser = useMutation(api.users.followUser);
  const unfollowUser = useMutation(api.users.unfollowUser);

  // Check if current user follows this user
  const followStatus = useQuery(
    api.users.getFollowStatus,
    currentUser && userId ? { targetUserId: userId as Id<"users"> } : "skip"
  );

  const handleFollowToggle = async () => {
    if (!userId) return;

    try {
      if (followStatus?.isFollowing) {
        await unfollowUser({ userId: userId as Id<"users"> });
      } else {
        await followUser({ userId: userId as Id<"users"> });
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
    }
  };

  const isOwnProfile = currentUser?._id === userId;

  if (!userId) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ color: theme.colors.onBackground }}>
            User not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (userDetails === undefined) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ marginTop: 16, color: theme.colors.grey100 }}>
            Loading user profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!userDetails) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Text style={{ color: theme.colors.onBackground }}>
            User not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "posts":
        if (userPosts === undefined) {
          return (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          );
        }
        return (
          <FlatList
            data={userPosts}
            renderItem={({ item }) => <PostCard post={item} />}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => (
              <View style={{ padding: 32, alignItems: "center" }}>
                <IconsOutline.DocumentTextIcon
                  size={48}
                  color={theme.colors.grey100}
                />
                <Text style={{ marginTop: 16, color: theme.colors.grey100 }}>
                  No posts yet
                </Text>
              </View>
            )}
          />
        );

      case "comments":
        if (userComments === undefined) {
          return (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          );
        }
        return (
          <FlatList
            data={userComments}
            renderItem={({ item }) => <CommentCard comment={item} />}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => (
              <View style={{ padding: 32, alignItems: "center" }}>
                <IconsOutline.ChatBubbleLeftIcon
                  size={48}
                  color={theme.colors.grey100}
                />
                <Text style={{ marginTop: 16, color: theme.colors.grey100 }}>
                  No comments yet
                </Text>
              </View>
            )}
          />
        );

      case "replies":
        if (userReplies === undefined) {
          return (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
          );
        }
        return (
          <FlatList
            data={userReplies}
            renderItem={({ item }) => (
              <View
                style={{
                  padding: 16,
                  backgroundColor: theme.colors.surface,
                  margin: 8,
                  borderRadius: 8,
                }}
              >
                <Text style={{ color: theme.colors.onBackground }}>
                  {item.content}
                </Text>
              </View>
            )}
            keyExtractor={(item) => item._id}
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => (
              <View style={{ padding: 32, alignItems: "center" }}>
                <IconsOutline.ArrowUturnLeftIcon
                  size={48}
                  color={theme.colors.grey100}
                />
                <Text style={{ marginTop: 16, color: theme.colors.grey100 }}>
                  No replies yet
                </Text>
              </View>
            )}
          />
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.surface,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            marginRight: 16,
            padding: 8,
          }}
        >
          <IconsOutline.ArrowLeftIcon
            size={24}
            color={theme.colors.onBackground}
          />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "bold",
            color: theme.colors.onBackground,
            flex: 1,
          }}
        >
          {userDetails.userName}
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }}>
        {/* User Profile Header */}
        <View
          style={{
            backgroundColor: theme.colors.surface,
            padding: 20,
            alignItems: "center",
            marginBottom: 16,
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
            {userDetails.imageUrl ? (
              <SvgXml xml={userDetails.imageUrl} width={80} height={80} />
            ) : (
              <IconsSolid.UserIcon size={40} color={theme.colors.onPrimary} />
            )}
          </View>

          {/* User Info */}
          <View style={{ alignItems: "center", marginBottom: 16 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 4,
              }}
            >
              <IconsOutline.UserIcon
                size={16}
                color={theme.colors.primary}
                style={{ marginRight: 6 }}
              />
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: "bold",
                  color: theme.colors.onBackground,
                }}
              >
                {userDetails.userName}
              </Text>
            </View>

            {userDetails.bio && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  maxWidth: "80%",
                }}
              >
                <IconsOutline.InformationCircleIcon
                  size={14}
                  color={theme.colors.grey100}
                  style={{ marginRight: 6, marginTop: 2 }}
                />
                <Text
                  style={{
                    fontSize: 14,
                    color: theme.colors.grey100,
                    textAlign: "center",
                    flex: 1,
                  }}
                >
                  {userDetails.bio}
                </Text>
              </View>
            )}
          </View>

          {/* Follow/Edit Button */}
          {isOwnProfile ? (
            <TouchableOpacity
              onPress={() => router.push("/(main)/(tabs)/profile")}
              style={{
                backgroundColor: theme.colors.surface,
                borderWidth: 1,
                borderColor: theme.colors.primary,
                paddingHorizontal: 24,
                paddingVertical: 8,
                borderRadius: 20,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <IconsOutline.UserIcon
                size={16}
                color={theme.colors.primary}
                style={{ marginRight: 6 }}
              />
              <Text
                style={{
                  color: theme.colors.primary,
                  fontWeight: "600",
                }}
              >
                View Profile
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleFollowToggle}
              style={{
                backgroundColor: followStatus?.isFollowing
                  ? theme.colors.surface
                  : theme.colors.primary,
                borderWidth: followStatus?.isFollowing ? 1 : 0,
                borderColor: followStatus?.isFollowing
                  ? theme.colors.primary
                  : "transparent",
                paddingHorizontal: 24,
                paddingVertical: 8,
                borderRadius: 20,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              {followStatus?.isFollowing ? (
                <IconsOutline.UserMinusIcon
                  size={16}
                  color={theme.colors.primary}
                  style={{ marginRight: 6 }}
                />
              ) : (
                <IconsOutline.UserPlusIcon
                  size={16}
                  color={theme.colors.onPrimary}
                  style={{ marginRight: 6 }}
                />
              )}
              <Text
                style={{
                  color: followStatus?.isFollowing
                    ? theme.colors.primary
                    : theme.colors.onPrimary,
                  fontWeight: "600",
                }}
              >
                {followStatus?.isFollowing ? "Unfollow" : "Follow"}
              </Text>
            </TouchableOpacity>
          )}

          {/* Stats */}
          <View style={{ flexDirection: "row", marginTop: 16, gap: 24 }}>
            <TouchableOpacity style={{ alignItems: "center" }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <IconsOutline.DocumentTextIcon
                  size={16}
                  color={theme.colors.primary}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    color: theme.colors.onBackground,
                  }}
                >
                  {userDetails.postsPublished || 0}
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: theme.colors.grey100 }}>
                Posts
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ alignItems: "center" }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <IconsOutline.UsersIcon
                  size={16}
                  color={theme.colors.primary}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    color: theme.colors.onBackground,
                  }}
                >
                  {userDetails.followers || 0}
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: theme.colors.grey100 }}>
                Followers
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ alignItems: "center" }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <IconsOutline.UserPlusIcon
                  size={16}
                  color={theme.colors.primary}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    color: theme.colors.onBackground,
                  }}
                >
                  {userDetails.following || 0}
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: theme.colors.grey100 }}>
                Following
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: theme.colors.surface,
            marginHorizontal: 16,
            borderRadius: 8,
            padding: 4,
            marginBottom: 16,
          }}
        >
          {[
            {
              key: "posts",
              label: "Posts",
              icon: IconsOutline.DocumentTextIcon,
            },
            {
              key: "comments",
              label: "Comments",
              icon: IconsOutline.ChatBubbleLeftIcon,
            },
            {
              key: "replies",
              label: "Replies",
              icon: IconsOutline.ArrowUturnLeftIcon,
            },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key as any)}
              style={{
                flex: 1,
                paddingVertical: 8,
                paddingHorizontal: 16,
                borderRadius: 6,
                backgroundColor:
                  activeTab === tab.key ? theme.colors.primary : "transparent",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <tab.icon
                size={16}
                color={
                  activeTab === tab.key
                    ? theme.colors.onPrimary
                    : theme.colors.onBackground
                }
                style={{ marginRight: 6 }}
              />
              <Text
                style={{
                  color:
                    activeTab === tab.key
                      ? theme.colors.onPrimary
                      : theme.colors.onBackground,
                  fontWeight: activeTab === tab.key ? "600" : "400",
                  fontSize: 12,
                }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        <View style={{ flex: 1, minHeight: 400 }}>{renderTabContent()}</View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default UserDetailsScreen;
