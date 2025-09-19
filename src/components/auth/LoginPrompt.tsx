import { useSSO } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { APP_NAME, TAGLINE } from "constants/device";
import * as Linking from "expo-linking";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  TouchableOpacity,
  View,
} from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { PRIMARY_COLOR } from "unistyles";
import CustomText from "../ui/CustomText";

interface LoginPromptProps {
  visible: boolean;
  onClose: () => void;
}

interface ExtendedLoginPromptProps extends LoginPromptProps {
  onGuestSignIn?: () => void;
}

const LoginPrompt: React.FC<ExtendedLoginPromptProps> = ({
  visible,
  onClose,
  onGuestSignIn,
}) => {
  const { startSSOFlow } = useSSO();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);

      const redirectUrl = Linking.createURL("/");

      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
        redirectUrl,
      });

      if (setActive && createdSessionId) {
        setActive({ session: createdSessionId });
      }
    } catch (error) {
      console.log("OAuth error", error);
      Alert.alert("Error", "An error occurred during the sign-in process.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Content */}
          <View style={styles.content}>
            {/* Close button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={10} color={PRIMARY_COLOR} />
            </TouchableOpacity>
            <CustomText
              variant="h3"
              semibold
              textAlign="center"
              color="onPrimary"
            >
              Welcome to {APP_NAME}
            </CustomText>

            <CustomText
              variant="caption"
              color="grey700"
              textAlign="center"
              style={{ marginTop: 8, marginBottom: 28 }}
            >
              {TAGLINE}
            </CustomText>

            {/* Login button */}
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleGoogleSignIn}
              activeOpacity={0.85}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.row}>
                  <Ionicons
                    name="logo-google"
                    size={18}
                    color={PRIMARY_COLOR}
                  />
                  <CustomText
                    variant="button"
                    bold
                    color="primary"
                    style={{ marginLeft: 8 }}
                  >
                    Continue with Google
                  </CustomText>
                </View>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.line} />
              <CustomText
                variant="caption"
                color="grey700"
                style={{ marginHorizontal: 8 }}
              >
                OR
              </CustomText>
              <View style={styles.line} />
            </View>

            {/* Guest option */}
            <TouchableOpacity
              style={styles.skipButton}
              onPress={() => {
                onGuestSignIn?.();
                onClose();
              }}
              activeOpacity={0.7}
            >
              <CustomText variant="body2" semibold color="secondary">
                Continue as Guest
              </CustomText>
            </TouchableOpacity>

            {/* Footer message */}
            <CustomText
              variant="caption"
              color="grey700"
              textAlign="center"
              italic
              style={{ marginTop: 20 }}
            >
              Signing in helps you unlock full personalization
            </CustomText>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create((theme) => ({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.paddingHorizontal,
    backgroundColor: theme.colors.backgroundOverlay,
  },
  modalContainer: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.regular,
    padding: theme.paddingHorizontal,
  },
  closeButton: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 20,
    padding: 6,
    zIndex: 1,
  },
  content: {
    alignItems: "center",
    paddingTop: theme.spacing.large,
  },
  loginButton: {
    borderRadius: theme.radii.small,
    marginBottom: theme.spacing.large,
    backgroundColor: theme.colors.onPrimary,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: 48,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: theme.spacing.large,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.grey300,
  },
  skipButton: {
    borderRadius: theme.radii.small,
    marginBottom: theme.spacing.large,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: 48,
  },
}));

export default LoginPrompt;
