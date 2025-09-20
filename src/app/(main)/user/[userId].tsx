import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  Text,
  TextInput,
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
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showReportUserModal, setShowReportUserModal] = useState(false);
  const [reportReason, setReportReason] = useState<string>("");
  const [reportDescription, setReportDescription] = useState("");

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

  // Report user mutation
  const reportUser = useMutation(api.reports.reportUser);

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

  const handleReportUser = async () => {
    if (!userId || !reportReason) return;

    try {
      await reportUser({
        reportedUserId: userId as Id<"users">,
        reason: reportReason as any,
        description: reportDescription || undefined,
      });

      Alert.alert(
        "Report Submitted",
        "Thank you for your report. We'll review it shortly.",
        [{ text: "OK", onPress: () => setShowReportUserModal(false) }]
      );

      // Reset form
      setReportReason("");
      setReportDescription("");
    } catch (error) {
      console.error("Error reporting user:", error);
      Alert.alert(
        "Error",
        error instanceof Error ? error.message : "Failed to submit report",
        [{ text: "OK" }]
      );
    }
  };

  const handleBlockUser = () => {
    Alert.alert(
      "Block User",
      `Are you sure you want to block ${userDetails?.userName}? They will no longer be able to interact with your content.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Block",
          style: "destructive",
          onPress: () => {
            // TODO: Implement block functionality when it's available
            Alert.alert(
              "Feature Coming Soon",
              "Block functionality will be available in a future update."
            );
          },
        },
      ]
    );
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
        {!isOwnProfile && (
          <View style={{ position: "relative" }}>
            <TouchableOpacity
              onPress={() => setShowUserMenu(!showUserMenu)}
              style={{
                padding: 8,
                borderRadius: 20,
              }}
            >
              <IconsOutline.EllipsisVerticalIcon
                size={24}
                color={theme.colors.onBackground}
              />
            </TouchableOpacity>

            {showUserMenu && (
              <View
                style={{
                  position: "absolute",
                  top: 40,
                  right: 0,
                  backgroundColor: theme.colors.surface,
                  borderRadius: 8,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84,
                  elevation: 5,
                  minWidth: 160,
                  zIndex: 1000,
                }}
              >
                <TouchableOpacity
                  onPress={() => {
                    setShowUserMenu(false);
                    setShowReportUserModal(true);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.background,
                  }}
                >
                  <IconsOutline.FlagIcon
                    size={18}
                    color={theme.colors.error}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={{ color: theme.colors.error, fontSize: 16 }}>
                    Report User
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setShowUserMenu(false);
                    handleBlockUser();
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 12,
                  }}
                >
                  <IconsOutline.NoSymbolIcon
                    size={18}
                    color={theme.colors.error}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={{ color: theme.colors.error, fontSize: 16 }}>
                    Block User
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
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

      {/* Overlay to close menu when clicking outside */}
      {showUserMenu && (
        <TouchableOpacity
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999,
          }}
          onPress={() => setShowUserMenu(false)}
          activeOpacity={1}
        />
      )}

      {/* Report User Modal */}
      <Modal
        visible={showReportUserModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowReportUserModal(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: 12,
              width: "100%",
              maxWidth: 400,
              height: "80%",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 20,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.background,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  color: theme.colors.onSurface || theme.colors.onBackground,
                }}
              >
                Report User
              </Text>
              <TouchableOpacity
                onPress={() => setShowReportUserModal(false)}
                style={{ padding: 4 }}
              >
                <IconsOutline.XMarkIcon
                  size={24}
                  color={theme.colors.onSurface || theme.colors.onBackground}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ flex: 1 }}
              contentContainerStyle={{ padding: 20 }}
              nestedScrollEnabled={true}
            >
              <Text
                style={{
                  fontSize: 16,
                  color: theme.colors.onSurface || theme.colors.onBackground,
                  marginBottom: 16,
                }}
              >
                Why are you reporting {userDetails?.userName}?
              </Text>

              {/* Report Reasons */}
              {[
                {
                  key: "harassment_bullying",
                  title: "Harassment or Bullying",
                  description: "Harassing or bullying behavior towards others",
                },
                {
                  key: "impersonation",
                  title: "Impersonation",
                  description: "Pretending to be someone else",
                },
                {
                  key: "spam_account",
                  title: "Spam Account",
                  description: "Spam or bot account behavior",
                },
                {
                  key: "fake_account",
                  title: "Fake Account",
                  description: "Fake or fraudulent account",
                },
                {
                  key: "inappropriate_behavior",
                  title: "Inappropriate Behavior",
                  description: "General inappropriate behavior",
                },
                {
                  key: "violation_guidelines",
                  title: "Violating Guidelines",
                  description: "Violating community guidelines",
                },
                {
                  key: "other",
                  title: "Other",
                  description: "Other user-related issues",
                },
              ].map((reason) => (
                <TouchableOpacity
                  key={reason.key}
                  onPress={() => setReportReason(reason.key)}
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    padding: 16,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor:
                      reportReason === reason.key
                        ? theme.colors.primary
                        : theme.colors.background,
                    backgroundColor:
                      reportReason === reason.key
                        ? theme.colors.surface
                        : "transparent",
                    marginBottom: 8,
                  }}
                >
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      borderWidth: 2,
                      borderColor:
                        reportReason === reason.key
                          ? theme.colors.primary
                          : theme.colors.grey100,
                      backgroundColor:
                        reportReason === reason.key
                          ? theme.colors.primary
                          : "transparent",
                      marginRight: 12,
                      marginTop: 2,
                    }}
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "500",
                        color:
                          theme.colors.onSurface || theme.colors.onBackground,
                        marginBottom: 4,
                      }}
                    >
                      {reason.title}
                    </Text>
                    <Text
                      style={{
                        fontSize: 14,
                        color: theme.colors.grey100,
                        opacity: 0.8,
                      }}
                    >
                      {reason.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}

              {/* Additional Details */}
              <View style={{ marginTop: 16 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "500",
                    color: theme.colors.onSurface || theme.colors.onBackground,
                    marginBottom: 8,
                  }}
                >
                  Additional Details (Optional)
                </Text>
                <TextInput
                  value={reportDescription}
                  onChangeText={setReportDescription}
                  placeholder="Provide more details about your report..."
                  placeholderTextColor={theme.colors.grey100}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  style={{
                    borderWidth: 1,
                    borderColor: theme.colors.grey100,
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 16,
                    color: theme.colors.onSurface || theme.colors.onBackground,
                    minHeight: 80,
                    backgroundColor: theme.colors.background,
                  }}
                />
              </View>
            </ScrollView>

            {/* Action Buttons */}
            <View
              style={{
                flexDirection: "row",
                padding: 20,
                gap: 12,
                borderTopWidth: 1,
                borderTopColor: theme.colors.background,
              }}
            >
              <TouchableOpacity
                onPress={() => setShowReportUserModal(false)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: theme.colors.grey100,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color: theme.colors.onSurface || theme.colors.onBackground,
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleReportUser}
                disabled={!reportReason}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  backgroundColor: reportReason
                    ? theme.colors.error
                    : theme.colors.grey100,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    color: reportReason ? "#fff" : "#999",
                    fontWeight: "600",
                  }}
                >
                  Submit Report
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default UserDetailsScreen;
