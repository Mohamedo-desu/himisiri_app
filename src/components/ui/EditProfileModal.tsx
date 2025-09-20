import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUnistyles } from "react-native-unistyles";
import { USER_TABLE } from "../../../convex/schema";

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  currentUser: USER_TABLE;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  visible,
  onClose,
  currentUser,
}) => {
  const { theme } = useUnistyles();
  const updateProfile = useMutation(api.users.updateProfile);

  const [formData, setFormData] = useState({
    userName: currentUser?.userName || "",
    bio: currentUser?.bio || "",
    age: currentUser?.age?.toString() || "",
    gender: currentUser?.gender || "",
  });
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (visible && currentUser) {
      setFormData({
        userName: currentUser.userName || "",
        bio: currentUser.bio || "",
        age: currentUser.age?.toString() || "",
        gender: currentUser.gender || "",
      });
    }
  }, [visible, currentUser]);

  const handleSave = async () => {
    if (!formData.userName.trim()) {
      Alert.alert("Error", "Username is required");
      return;
    }

    setIsLoading(true);
    try {
      await updateProfile({
        userName: formData.userName.trim(),
        bio: formData.bio.trim() || undefined,
        age: formData.age ? parseInt(formData.age) : undefined,
        gender: formData.gender as "male" | "female" | "other" | undefined,
      });

      Alert.alert("Success", "Profile updated successfully!", [
        { text: "OK", onPress: onClose },
      ]);
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const GenderOption = ({ value, label }: { value: string; label: string }) => (
    <TouchableOpacity
      onPress={() => setFormData((prev) => ({ ...prev, gender: value }))}
      style={{
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor:
          formData.gender === value
            ? theme.colors.primary
            : theme.colors.surface,
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      <Text
        style={{
          color:
            formData.gender === value
              ? theme.colors.onPrimary
              : theme.colors.onBackground,
          fontWeight: formData.gender === value ? "600" : "normal",
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
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
            onPress={onClose}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 16,
            }}
          >
            <Text style={{ color: theme.colors.error, fontSize: 16 }}>
              Cancel
            </Text>
          </TouchableOpacity>

          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: theme.colors.onBackground,
            }}
          >
            Edit Profile
          </Text>

          <TouchableOpacity
            onPress={handleSave}
            disabled={isLoading}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 16,
              backgroundColor: theme.colors.primary,
              borderRadius: 8,
            }}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={theme.colors.onPrimary} />
            ) : (
              <Text
                style={{
                  color: theme.colors.onPrimary,
                  fontSize: 16,
                  fontWeight: "600",
                }}
              >
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={{ flex: 1, padding: 16 }}>
          {/* Username */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: theme.colors.onBackground,
                marginBottom: 8,
              }}
            >
              Username *
            </Text>
            <TextInput
              value={formData.userName}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, userName: text }))
              }
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: 12,
                padding: 16,
                fontSize: 16,
                color: theme.colors.onBackground,
                borderWidth: 1,
                borderColor: theme.colors.grey300,
              }}
              placeholder="Enter your username"
              placeholderTextColor={theme.colors.grey100}
              maxLength={50}
            />
          </View>

          {/* Bio */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: theme.colors.onBackground,
                marginBottom: 8,
              }}
            >
              Bio
            </Text>
            <TextInput
              value={formData.bio}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, bio: text }))
              }
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: 12,
                padding: 16,
                fontSize: 16,
                color: theme.colors.onBackground,
                borderWidth: 1,
                borderColor: theme.colors.grey300,
                minHeight: 100,
                textAlignVertical: "top",
              }}
              placeholder="Tell us about yourself..."
              placeholderTextColor={theme.colors.grey100}
              multiline
              maxLength={200}
            />
          </View>

          {/* Age */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: theme.colors.onBackground,
                marginBottom: 8,
              }}
            >
              Age
            </Text>
            <TextInput
              value={formData.age}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, age: text }))
              }
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: 12,
                padding: 16,
                fontSize: 16,
                color: theme.colors.onBackground,
                borderWidth: 1,
                borderColor: theme.colors.grey300,
              }}
              placeholder="Enter your age"
              placeholderTextColor={theme.colors.grey100}
              keyboardType="numeric"
              maxLength={3}
            />
          </View>

          {/* Gender */}
          <View style={{ marginBottom: 24 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: theme.colors.onBackground,
                marginBottom: 12,
              }}
            >
              Gender
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
              <GenderOption value="male" label="Male" />
              <GenderOption value="female" label="Female" />
              <GenderOption value="other" label="Other" />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};
