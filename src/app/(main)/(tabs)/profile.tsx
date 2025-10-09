import { TAB_BAR_HEIGHT } from "@/components/tabs/CustomTabBar";
import CustomText from "@/components/ui/CustomText";
import UserAvatar from "@/components/ui/UserAvatar";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { PushTokenService } from "@/services/pushTokenService";
import { getFromLocalStorage } from "@/store/storage";
import { useSettingsStore } from "@/store/useSettingsStore";
import { useUserStore } from "@/store/useUserStore";
import { useAuth } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useAction } from "convex/react";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  DeviceEventEmitter,
  ScrollView,
  Switch,
  TouchableOpacity,
  View,
} from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { PRIMARY_COLOR } from "unistyles";

const sections = [
  {
    title: "Legal & Privacy",
    description: "Read our terms of service and privacy policy",
    onPress: () => console.log("Navigate to Legal & Privacy"),
  },
];

const ProfileScreen = () => {
  const { signOut } = useAuth();
  const { currentUser } = useUserStore();
  const { hideOffensiveWords, setHideOffensiveWords } = useSettingsStore();
  const deleteAccountAction = useAction(api.users.initiateAccountDeletion);

  const [cachedVersion, setCachedVersion] = useState<string | null>("");

  useEffect(() => {
    const { cachedVersion } = getFromLocalStorage(["cachedVersion"]);
    setCachedVersion(cachedVersion);
  }, []);

  const handleLogout = async () => {
    try {
      Alert.alert("Log out", "Are you sure you want to log out?", [
        {
          text: "log out",
          style: "cancel",
          onPress: async () => {
            try {
              await PushTokenService.unregisterPushToken();
              await signOut();
            } catch (err) {
              console.error("error logging out", err);
              Alert.alert("Error", "Could not log out");
            }
          },
        },
        {
          text: "Cancel",
          style: "destructive",
          isPreferred: true,
        },
      ]);
    } catch (error) {
      console.log("Logout error", error);
    }
  };
  const handleDeleteAccount = async () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const result = await deleteAccountAction();

              if (result.success) {
                try {
                  await signOut();
                } catch (signOutError) {
                  console.error("Error signing out:", signOutError);
                }

                router.replace("/(main)/(tabs)");

                setTimeout(() => {
                  Alert.alert(
                    "Account Deleted",
                    "Your account has been successfully deleted."
                  );
                }, 500);
              } else {
                throw new Error("Deletion failed");
              }
            } catch (error) {
              console.error("Error deleting account:", error);

              let errorMsg = "Failed to delete account.";
              if (error instanceof Error) {
                errorMsg += " " + error.message;
              }

              Alert.alert("Error", errorMsg);
            }
          },
        },
      ]
    );
  };

  if (!currentUser) {
    return (
      <View style={styles.centeredScreen}>
        <CustomText variant="label" semibold color="onSurface">
          You’re not logged in
        </CustomText>
        <CustomText variant="small" color="grey500" style={styles.subtitle}>
          Sign in to view and manage your profile
        </CustomText>
        <TouchableOpacity
          style={styles.primaryButton}
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
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Header */}
      <View style={styles.header}>
        <UserAvatar
          imageUrl={(currentUser.imageUrl as unknown as string) || ""}
          size={96}
          userId={currentUser._id as Id<"users">}
          indicatorSize="large"
        />
        <CustomText
          variant="subtitle1"
          bold
          color="onSurface"
          style={styles.username}
        >
          {currentUser.userName}
        </CustomText>
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <CustomText
          variant="label"
          semibold
          color="grey700"
          style={styles.sectionTitle}
        >
          Settings
        </CustomText>

        {/* Integrated Hide Offensive Words Toggle */}
        <View style={styles.settingToggle}>
          <View style={styles.settingInfo}>
            <CustomText variant="label" semibold>
              Hide Offensive Words
            </CustomText>
            <CustomText
              style={styles.settingDescription}
              variant="small"
              color="grey500"
            >
              Automatically replace strong language with symbols (e.g. ****).
            </CustomText>
          </View>
          <Switch
            value={hideOffensiveWords}
            onValueChange={setHideOffensiveWords}
            thumbColor={PRIMARY_COLOR}
            trackColor={{ true: PRIMARY_COLOR, false: "gray" }}
          />
        </View>

        {/* Other settings */}
        {sections.map((section, index) => (
          <TouchableOpacity
            key={index}
            style={styles.settingItem}
            onPress={section.onPress}
            activeOpacity={0.7}
          >
            <View style={styles.settingInfo}>
              <CustomText style={styles.settingLabel} variant="label" semibold>
                {section.title}
              </CustomText>
              <CustomText style={styles.settingDescription} variant="small">
                {section.description}
              </CustomText>
            </View>
            <Ionicons
              name="chevron-forward-outline"
              size={20}
              color={PRIMARY_COLOR}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Account actions */}
      <View style={styles.section}>
        <CustomText
          variant="label"
          semibold
          color="grey700"
          style={styles.sectionTitle}
        >
          Account
        </CustomText>
        <TouchableOpacity
          style={styles.secondaryButton}
          activeOpacity={0.85}
          onPress={handleLogout}
        >
          <CustomText variant="label" semibold color="primary">
            Log out
          </CustomText>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.destructiveButton}
          activeOpacity={0.85}
          onPress={handleDeleteAccount}
        >
          <CustomText variant="label" semibold color="onPrimary">
            Delete Account
          </CustomText>
        </TouchableOpacity>
      </View>
      <View style={{ flex: 1 }} />
      <CustomText variant="small" textAlign="center">
        version {cachedVersion}
      </CustomText>
    </ScrollView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create((theme, rt) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: theme.paddingHorizontal,
    paddingBottom: rt.insets.bottom + TAB_BAR_HEIGHT,
  },
  centeredScreen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
    padding: theme.paddingHorizontal,
  },
  subtitle: {
    marginTop: 6,
    textAlign: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: theme.gap(4),
  },
  username: {
    marginTop: theme.gap(1.5),
  },
  section: {
    marginTop: theme.gap(3),
  },
  sectionTitle: {
    marginBottom: theme.gap(1.5),
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.regular,
    paddingHorizontal: theme.gap(3),
    paddingVertical: theme.gap(1.5),
    marginTop: 16,
  },
  secondaryButton: {
    marginTop: theme.gap(1.5),
    borderWidth: 1,
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + "15",
    borderRadius: theme.radii.regular,
    paddingHorizontal: theme.gap(3),
    paddingVertical: theme.gap(1.5),
    alignItems: "center",
  },
  destructiveButton: {
    marginTop: theme.gap(1.5),
    backgroundColor: theme.colors.error,
    borderRadius: theme.radii.regular,
    paddingHorizontal: theme.gap(3),
    paddingVertical: theme.gap(1.5),
    alignItems: "center",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.gap(1.75),
    paddingHorizontal: theme.gap(2),
    borderRadius: theme.radii.regular,
    borderWidth: 1,
    borderColor: theme.colors.grey200,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.gap(1.25),
  },
  settingToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: theme.gap(1.75),
    paddingHorizontal: theme.gap(2),
    borderRadius: theme.radii.regular,
    borderWidth: 1,
    borderColor: theme.colors.grey200,
    backgroundColor: theme.colors.surface,
    marginBottom: theme.gap(1.25),
  },
  settingInfo: {
    flex: 1,
    marginRight: theme.gap(2),
  },
  settingLabel: {
    marginBottom: theme.gap(0.5),
  },
  settingDescription: {
    color: theme.colors.grey600,
  },
}));
