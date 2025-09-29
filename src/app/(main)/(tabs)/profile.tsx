import CustomText from "@/components/ui/CustomText";
import UserAvatar from "@/components/ui/UserAvatar";
import { Id } from "@/convex/_generated/dataModel";
import { PushTokenService } from "@/services/pushTokenService";
import { useUserStore } from "@/store/useUserStore";
import { useAuth } from "@clerk/clerk-expo";
import React, { useMemo } from "react";
import { DeviceEventEmitter, TouchableOpacity, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

const ProfileScreen = () => {
  const { signOut } = useAuth();
  const { currentUser } = useUserStore();

  const stats = useMemo(() => {
    return {
      posts: currentUser?.postsPublished || 0,
      followers: currentUser?.followers || 0,
      following: currentUser?.following || 0,
    };
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await PushTokenService.unregisterPushToken();
      await signOut();
    } catch (_) {}
  };

  if (!currentUser) {
    return (
      <View style={styles.centeredScreen}>
        <CustomText variant="label" semibold color="onSurface">
          You’re not logged in
        </CustomText>
        <CustomText variant="small" color="grey500" style={{ marginTop: 6 }}>
          Sign in to view and manage your profile
        </CustomText>
        <TouchableOpacity
          style={[styles.primaryButton, { marginTop: 16 }]}
          onPress={() => DeviceEventEmitter.emit("showLoginPrompt")}
          activeOpacity={0.8}
        >
          <CustomText variant="label" semibold color="onPrimary">
            Log in
          </CustomText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarWrapper}>
          <UserAvatar
            imageUrl={(currentUser.imageUrl as unknown as string) || ""}
            size={86}
            userId={currentUser._id as Id<"users">}
            indicatorSize="large"
          />
        </View>
        <View style={styles.headerInfo}>
          <CustomText variant="subtitle1" bold color="onSurface">
            {currentUser.userName}
          </CustomText>
          <CustomText variant="subtitle1" bold color="grey500">
            {currentUser.age}
          </CustomText>
          <CustomText variant="subtitle1" bold color="grey500">
            {currentUser.gender}
          </CustomText>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <CustomText variant="subtitle1" semibold color="onSurface">
            {stats.posts}
          </CustomText>
          <CustomText variant="small" color="grey500">
            Posts
          </CustomText>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <CustomText variant="subtitle1" semibold color="onSurface">
            {stats.followers}
          </CustomText>
          <CustomText variant="small" color="grey500">
            Followers
          </CustomText>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <CustomText variant="subtitle1" semibold color="onSurface">
            {stats.following}
          </CustomText>
          <CustomText variant="small" color="grey500">
            Following
          </CustomText>
        </View>
      </View>

      {/* Bio */}
      {(currentUser.bio || currentUser.thoughts) && (
        <View style={styles.bioCard}>
          {currentUser.bio ? (
            <CustomText variant="label" color="onSurface">
              {currentUser.bio}
            </CustomText>
          ) : null}
          {currentUser.thoughts ? (
            <CustomText
              variant="small"
              color="grey600"
              style={{ marginTop: 6 }}
            >
              {currentUser.thoughts}
            </CustomText>
          ) : null}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85}>
          <CustomText variant="label" semibold color="primary">
            Edit Profile
          </CustomText>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.destructiveButton}
          activeOpacity={0.85}
          onPress={handleLogout}
        >
          <CustomText variant={{} as any} semibold color="onPrimary">
            Log out
          </CustomText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create((theme) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.paddingHorizontal,
    paddingTop: theme.gap(2),
  },
  centeredScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
    padding: theme.paddingHorizontal,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.gap(2),
  },
  avatarWrapper: {
    borderRadius: 999,
    overflow: "hidden",
  },
  headerInfo: {
    flex: 1,
    justifyContent: "center",
  },
  statusRow: {
    marginTop: 6,
  },
  statsBar: {
    marginTop: theme.gap(2),
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.regular,
    borderWidth: 1,
    borderColor: theme.colors.grey200,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.gap(2),
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  divider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: theme.colors.grey200,
    marginHorizontal: theme.gap(2),
  },
  bioCard: {
    marginTop: theme.gap(2),
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.regular,
    borderWidth: 1,
    borderColor: theme.colors.grey200,
    padding: theme.gap(2),
  },
  actionsRow: {
    marginTop: theme.gap(2),
    flexDirection: "row",
    gap: theme.gap(1),
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.small,
    paddingHorizontal: theme.gap(2),
    paddingVertical: theme.gap(1.25),
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: theme.colors.primary + "15",
    borderRadius: theme.radii.small,
    paddingHorizontal: theme.gap(2),
    paddingVertical: theme.gap(1.25),
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.primary + "40",
  },
  destructiveButton: {
    backgroundColor: theme.colors.error,
    borderRadius: theme.radii.small,
    paddingHorizontal: theme.gap(2),
    paddingVertical: theme.gap(1.25),
    alignItems: "center",
  },
}));
