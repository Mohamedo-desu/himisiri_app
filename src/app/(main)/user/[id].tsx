import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Easing,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AnimatedNumbers from "react-native-animated-numbers";
import * as IconsOutline from "react-native-heroicons/outline";
import * as IconsSolid from "react-native-heroicons/solid";
import { SafeAreaView } from "react-native-safe-area-context";
import { SvgXml } from "react-native-svg";
import { useUnistyles } from "react-native-unistyles";
import { BlockUserButton } from "../../../components/ui/BlockUserComponents";
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

  // Check blocking status
  const blockingStatus = useQuery(
    api.userBlocking.getBlockingStatus,
    currentUser ? { userId } : "skip"
  );

  // Mutations
  const followUser = useMutation(api.users.followUser);
  const unfollowUser = useMutation(api.users.unfollowUser);
  const reportUser = useMutation(api.reports.reportUser);

  // State
  const [followersModalVisible, setFollowersModalVisible] = useState(false);
  const [followersModalTab, setFollowersModalTab] = useState<
    "followers" | "following"
  >("followers");
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showReportUserModal, setShowReportUserModal] = useState(false);
  const [reportReason, setReportReason] = useState<string>("");
  const [reportDescription, setReportDescription] = useState("");

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

  const handleReportUser = async () => {
    if (!reportReason) return;

    try {
      await reportUser({
        reportedUserId: userId,
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
      <AnimatedNumbers
        includeComma
        animateToNumber={value}
        fontStyle={{
          fontSize: 20,
          fontWeight: "bold",
          color: theme.colors.onBackground,
          marginTop: 8,
        }}
        easing={Easing.out(Easing.cubic)}
      />
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

        {!isCurrentUser ? (
          <View style={{ position: "relative" }}>
            <TouchableOpacity
              onPress={() => setShowUserMenu(!showUserMenu)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: theme.colors.surface,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconsOutline.EllipsisVerticalIcon
                size={20}
                color={theme.colors.onBackground}
              />
            </TouchableOpacity>

            {showUserMenu && (
              <View
                style={{
                  position: "absolute",
                  top: 45,
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

                <View style={{ padding: 12 }}>
                  <BlockUserButton
                    userId={userId}
                    userName={user?.userName}
                    onBlockStatusChange={() => setShowUserMenu(false)}
                    style={{
                      backgroundColor: "transparent",
                      borderWidth: 1,
                      borderColor: theme.colors.error,
                      paddingVertical: 8,
                    }}
                    textStyle={{
                      color: theme.colors.error,
                      fontSize: 16,
                    }}
                  />
                </View>
              </View>
            )}
          </View>
        ) : (
          <View style={{ width: 40 }} />
        )}
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
                Why are you reporting {user?.userName}?
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
