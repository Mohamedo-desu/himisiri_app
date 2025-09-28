import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUserStore } from "@/store/useUserStore";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import React, { useRef, useState } from "react";
import {
  Alert,
  DeviceEventEmitter,
  Platform,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { PaperAirplaneIcon } from "react-native-heroicons/outline";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import CustomText from "../ui/CustomText";

// Themed send icon
const ThemedSendIcon = withUnistyles(PaperAirplaneIcon, (theme) => ({
  size: 18,
  color: theme.colors.onPrimary,
}));

type CommentInputProps = {
  postId: Id<"posts">;
  onCommentPosted?: () => void;
  placeholder?: string;
};

const CommentInput = ({
  postId,
  onCommentPosted,
  placeholder = "Share your thoughts...",
}: CommentInputProps) => {
  const { currentUser } = useUserStore();
  const [comment, setComment] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const textInputRef = useRef<TextInput>(null);

  const createComment = useMutation(api.comments.createComment);

  const handleSubmit = async () => {
    if (!currentUser) {
      DeviceEventEmitter.emit("showLoginPrompt");
      return;
    }

    const trimmedComment = comment.trim();
    if (!trimmedComment) {
      Alert.alert("Empty Comment", "Please write something before posting.");
      return;
    }

    try {
      setIsPosting(true);

      await createComment({
        postId,
        content: trimmedComment,
      });

      setComment("");
      textInputRef.current?.blur();
      onCommentPosted?.();

      if (Platform.OS === "web") {
        console.log("Comment posted successfully");
      }
    } catch (error) {
      console.error("Error posting comment:", error);
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to post comment. Please try again."
      );
    } finally {
      setIsPosting(false);
    }
  };

  const isSubmitDisabled = isPosting || !comment.trim() || !currentUser;

  return (
    <View style={styles.container}>
      {currentUser ? (
        <>
          {/* --- Text Input at the top --- */}
          <View
            style={[
              styles.inputContainer,
              isFocused && styles.inputContainerFocused,
            ]}
          >
            <TextInput
              ref={textInputRef}
              style={styles.textInput}
              placeholder={placeholder}
              placeholderTextColor={"gray"}
              value={comment}
              onChangeText={setComment}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              multiline
              editable={!isPosting}
              textAlignVertical="top"
            />
          </View>

          {/* --- Send button at the bottom --- */}
          <TouchableOpacity
            disabled={isSubmitDisabled}
            onPress={handleSubmit}
            style={[styles.sendButton, isSubmitDisabled && styles.sendDisabled]}
          >
            <ThemedSendIcon />
            <CustomText
              variant="label"
              fontWeight="semibold"
              color="onPrimary"
              style={{ marginLeft: 6 }}
            >
              {isPosting ? "Posting..." : "Send"}
            </CustomText>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.signInPrompt}>
          <View style={styles.signInContent}>
            <Ionicons
              name="chatbubble-outline"
              size={22}
              color={stylesVars.primary}
              style={{ marginRight: 8 }}
            />
            <View style={styles.signInTextContainer}>
              <CustomText
                variant="label"
                fontWeight="semibold"
                color="onBackground"
              >
                Join the Conversation
              </CustomText>
              <CustomText variant="small" color="muted">
                Sign in to share your thoughts and connect with others
              </CustomText>
            </View>
            <TouchableOpacity
              style={styles.signInButton}
              onPress={() => DeviceEventEmitter.emit("showLoginPrompt")}
            >
              <CustomText variant="label" fontWeight="semibold" color="primary">
                Sign In
              </CustomText>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

export default CommentInput;

const styles = StyleSheet.create((theme, rt) => {
  stylesVars = {
    primary: theme.colors.primary,
  };

  return {
    container: {
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.grey200,
      padding: theme.paddingHorizontal,
      paddingBottom: rt.insets.bottom + 12,
    },

    // --- Input field ---
    inputContainer: {
      backgroundColor: theme.colors.background,
      borderRadius: theme.radii.regular,
      borderWidth: 1,
      borderColor: theme.colors.grey300,
      padding: theme.paddingHorizontal,
      marginBottom: 12,
    },
    inputContainerFocused: {
      borderColor: theme.colors.primary,
    },
    textInput: {
      minHeight: 80, // paragraph-like initial height
      maxHeight: 140,
      fontSize: 12,
      color: theme.colors.onBackground,
      paddingVertical: 8,
      fontFamily: theme.fonts.Regular,
    },

    // --- Send button ---
    sendButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.colors.primary,
      borderRadius: theme.radii.regular,
      padding: theme.paddingHorizontal,
    },
    sendDisabled: {
      opacity: 0.5,
    },

    // --- Sign-in prompt ---
    signInPrompt: {
      paddingVertical: 12,
    },
    signInContent: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.colors.background,
      borderRadius: theme.radii.regular,
      borderWidth: 1,
      borderColor: theme.colors.grey200,
      padding: theme.paddingHorizontal,
    },
    signInTextContainer: {
      flex: 1,
    },
    signInButton: {
      padding: theme.paddingHorizontal,
      borderRadius: theme.radii.regular,
      borderWidth: 1,
      borderColor: theme.colors.primary,
    },
  };
});

let stylesVars: { primary: string };
