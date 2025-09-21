import { api } from "@/convex/_generated/api";
import { useAuth } from "@clerk/clerk-expo";
import { useMutation, useQuery } from "convex/react";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Easing,
  Modal,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AnimatedNumbers from "react-native-animated-numbers";
import * as IconsOutline from "react-native-heroicons/outline";
import * as IconsSolid from "react-native-heroicons/solid";
import { SafeAreaView } from "react-native-safe-area-context";
import { SvgXml } from "react-native-svg";
import Toast from "react-native-toast-message";
import { useUnistyles } from "react-native-unistyles";
import { EditProfileModal } from "../../../components/ui/EditProfileModal";
import { FollowersModal } from "../../../components/ui/FollowersModal";

const ProfileScreen = () => {
  const { theme } = useUnistyles();
  const { signOut } = useAuth();

  // Get current user data from convex
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const blockedUsers = useQuery(api.userBlocking.getBlockedUsers);
  const unblockUser = useMutation(api.userBlocking.unblockUser);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [followersModalVisible, setFollowersModalVisible] = useState(false);
  const [editProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [blockedUsersModalVisible, setBlockedUsersModalVisible] =
    useState(false);
  const [followersModalTab, setFollowersModalTab] = useState<
    "followers" | "following"
  >("followers");

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => signOut(),
      },
    ]);
  };

  const handleUnblock = async (userId: string, userName: string) => {
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
              await unblockUser({ userId: userId as any });
              Toast.show({
                type: "success",
                text1: "User Unblocked",
                text2: `${userName} has been unblocked successfully`,
              });
            } catch (error) {
              Toast.show({
                type: "error",
                text1: "Failed to Unblock",
                text2: "Please try again later",
              });
            }
          },
        },
      ]
    );
  };

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

  const MenuButton = ({
    IconComponent,
    title,
    subtitle,
    onPress,
    rightComponent,
    showChevron = true,
  }: {
    IconComponent: React.ComponentType<{ size: number; color: string }>;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightComponent?: React.ReactNode;
    showChevron?: boolean;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        marginBottom: 8,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: theme.colors.primary + "20",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 16,
        }}
      >
        <IconComponent size={20} color={theme.colors.primary} />
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: theme.colors.onBackground,
          }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={{
              fontSize: 14,
              color: theme.colors.grey100,
              marginTop: 2,
            }}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {rightComponent ||
        (showChevron && (
          <IconsOutline.ChevronRightIcon
            size={20}
            color={theme.colors.grey100}
          />
        ))}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
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
          <View>
            {currentUser?.imageUrl ? (
              <SvgXml xml={currentUser.imageUrl} width={100} height={100} />
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
            {currentUser?.userName || "Loading..."}
          </Text>

          {currentUser?.bio && (
            <Text
              style={{
                fontSize: 14,
                color: theme.colors.grey100,
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              {currentUser.bio}
            </Text>
          )}

          {/* Edit Profile Button */}
          <TouchableOpacity
            onPress={() => setEditProfileModalVisible(true)}
            style={{
              backgroundColor: theme.colors.primary,
              paddingHorizontal: 24,
              paddingVertical: 8,
              borderRadius: 20,
            }}
          >
            <Text
              style={{
                color: theme.colors.onPrimary,
                fontWeight: "600",
              }}
            >
              Edit Profile
            </Text>
          </TouchableOpacity>
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
            value={currentUser?.postsPublished || 0}
            IconComponent={IconsOutline.DocumentTextIcon}
          />
          <StatCard
            label="Followers"
            value={currentUser?.followers || 0}
            IconComponent={IconsOutline.UsersIcon}
            onPress={() => {
              setFollowersModalTab("followers");
              setFollowersModalVisible(true);
            }}
          />
          <StatCard
            label="Following"
            value={currentUser?.following || 0}
            IconComponent={IconsOutline.UserPlusIcon}
            onPress={() => {
              setFollowersModalTab("following");
              setFollowersModalVisible(true);
            }}
          />
        </View>

        {/* Menu Section - My Content */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              color: theme.colors.onBackground,
              marginBottom: 12,
            }}
          >
            My Content
          </Text>

          <MenuButton
            IconComponent={IconsOutline.DocumentTextIcon}
            title="My Posts"
            subtitle="View and manage your posts"
            onPress={() => router.push("/my-posts")}
          />

          <MenuButton
            IconComponent={IconsOutline.ChatBubbleLeftIcon}
            title="My Comments"
            subtitle="Comments you've made"
            onPress={() => router.push("/my-comments")}
          />

          <MenuButton
            IconComponent={IconsOutline.ArrowUturnLeftIcon}
            title="My Replies"
            subtitle="Replies you've written"
            onPress={() => router.push("/my-replies")}
          />

          <MenuButton
            IconComponent={IconsOutline.HeartIcon}
            title="Liked Posts"
            subtitle="Posts you've liked"
            onPress={() => router.push("/liked-posts")}
          />
        </View>

        {/* Menu Section - Settings */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              color: theme.colors.onBackground,
              marginBottom: 12,
            }}
          >
            Settings
          </Text>

          <MenuButton
            IconComponent={IconsOutline.BellIcon}
            title="Notifications"
            subtitle="Push notifications and alerts"
            showChevron={false}
            rightComponent={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{
                  false: theme.colors.grey300,
                  true: theme.colors.primary,
                }}
                thumbColor={theme.colors.onPrimary}
              />
            }
          />

          <MenuButton
            IconComponent={IconsOutline.MoonIcon}
            title="Dark Mode"
            subtitle="Toggle dark theme"
            showChevron={false}
            rightComponent={
              <Switch
                value={darkModeEnabled}
                onValueChange={setDarkModeEnabled}
                trackColor={{
                  false: theme.colors.grey300,
                  true: theme.colors.primary,
                }}
                thumbColor={theme.colors.onPrimary}
              />
            }
          />

          <MenuButton
            IconComponent={IconsOutline.ShieldCheckIcon}
            title="Privacy & Security"
            subtitle="Manage your privacy settings"
            onPress={() => console.log("Navigate to Privacy Settings")}
          />

          <MenuButton
            IconComponent={IconsOutline.NoSymbolIcon}
            title="Blocked Users"
            subtitle={
              blockedUsers
                ? `${blockedUsers.length} blocked users`
                : "View and manage blocked users"
            }
            onPress={() => setBlockedUsersModalVisible(true)}
          />

          <MenuButton
            IconComponent={IconsOutline.UserIcon}
            title="Account Settings"
            subtitle="Email, password, and account info"
            onPress={() => console.log("Navigate to Account Settings")}
          />
        </View>

        {/* Menu Section - Support */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "bold",
              color: theme.colors.onBackground,
              marginBottom: 12,
            }}
          >
            Support
          </Text>

          <MenuButton
            IconComponent={IconsOutline.QuestionMarkCircleIcon}
            title="Help & FAQ"
            subtitle="Get help and find answers"
            onPress={() => console.log("Navigate to Help")}
          />

          <MenuButton
            IconComponent={IconsOutline.ChatBubbleLeftEllipsisIcon}
            title="Contact Support"
            subtitle="Get in touch with our team"
            onPress={() => console.log("Navigate to Contact Support")}
          />

          <MenuButton
            IconComponent={IconsOutline.DocumentIcon}
            title="Terms & Privacy"
            subtitle="Legal information"
            onPress={() => console.log("Navigate to Terms")}
          />
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          onPress={handleSignOut}
          style={{
            backgroundColor: "#ef4444",
            padding: 16,
            borderRadius: 12,
            alignItems: "center",
            marginBottom: 32,
          }}
        >
          <Text
            style={{
              color: "white",
              fontSize: 16,
              fontWeight: "bold",
            }}
          >
            Sign Out
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Followers Modal */}
      {currentUser && (
        <FollowersModal
          visible={followersModalVisible}
          onClose={() => setFollowersModalVisible(false)}
          userId={currentUser._id}
          currentUserId={currentUser._id}
          initialTab={followersModalTab}
          followersCount={currentUser.followers}
          followingCount={currentUser.following}
        />
      )}

      {/* Edit Profile Modal */}
      {currentUser && (
        <EditProfileModal
          visible={editProfileModalVisible}
          onClose={() => setEditProfileModalVisible(false)}
          currentUser={currentUser}
        />
      )}

      {/* Blocked Users Modal */}
      <Modal
        visible={blockedUsersModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setBlockedUsersModalVisible(false)}
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
              height: 500,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
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
                Blocked Users {blockedUsers ? `(${blockedUsers.length})` : ""}
              </Text>
              <TouchableOpacity
                onPress={() => setBlockedUsersModalVisible(false)}
                style={{ padding: 4 }}
              >
                <IconsOutline.XMarkIcon
                  size={24}
                  color={theme.colors.onSurface || theme.colors.onBackground}
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ maxHeight: 400 }}
              contentContainerStyle={{ flexGrow: 1 }}
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
            >
              {/* Blocked users list */}
              {blockedUsers && blockedUsers.length > 0 ? (
                blockedUsers.map((user) => (
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
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: theme.colors.primary,
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: 12,
                        overflow: "hidden",
                      }}
                    >
                      {user.imageUrl ? (
                        <SvgXml xml={user.imageUrl} width={40} height={40} />
                      ) : (
                        <IconsSolid.UserIcon
                          size={20}
                          color={theme.colors.onPrimary}
                        />
                      )}
                    </View>
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
                      <Text
                        style={{
                          color: theme.colors.grey100,
                          fontSize: 12,
                          marginTop: 2,
                        }}
                      >
                        Blocked{" "}
                        {user.blockedAt
                          ? new Date(user.blockedAt).toLocaleDateString()
                          : "recently"}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleUnblock(user._id, user.userName)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 6,
                        backgroundColor: "#22C55E",
                      }}
                    >
                      <Text style={{ color: "white", fontWeight: "600" }}>
                        Unblock
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <View style={{ padding: 40, alignItems: "center" }}>
                  <IconsOutline.NoSymbolIcon
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
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ProfileScreen;
