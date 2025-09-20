import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUserStore } from "@/store/useUserStore";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import React, { useRef, useState } from "react";
import {
  Alert,
  Platform,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StyleSheet } from "react-native-unistyles";
import CustomText from "../ui/CustomText";

type CommentInputProps = {
  postId: Id<"posts">;
  onCommentPosted?: () => void;
  placeholder?: string;
};

const CommentInput = ({
  postId,
  onCommentPosted,
  placeholder = "Write a comment...",
}: CommentInputProps) => {
  const { currentUser } = useUserStore();
  const [comment, setComment] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const textInputRef = useRef<TextInput>(null);

  const createComment = useMutation(api.comments.createComment);

  const handleSubmit = async () => {
    if (!currentUser) {
      Alert.alert(
        "Authentication Required",
        "Please sign in to post comments."
      );
      return;
    }

    const trimmedComment = comment.trim();
    if (!trimmedComment) {
      Alert.alert("Empty Comment", "Please write something before posting.");
      return;
    }

    if (trimmedComment.length > 2000) {
      Alert.alert(
        "Comment Too Long",
        "Comments cannot exceed 2000 characters."
      );
      return;
    }

    try {
      setIsPosting(true);
      await createComment({
        postId,
        content: trimmedComment,
      });

      // Clear the input and notify parent
      setComment("");
      textInputRef.current?.blur();
      onCommentPosted?.();

      // Show success feedback
      if (Platform.OS === "web") {
        // Simple success indication for web
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
      <View style={styles.inputContainer}>
        <TextInput
          ref={textInputRef}
          style={styles.textInput}
          placeholder={placeholder}
          placeholderTextColor="#999"
          value={comment}
          onChangeText={setComment}
          multiline
          maxLength={2000}
          editable={!isPosting && !!currentUser}
          textAlignVertical="top"
        />
        <TouchableOpacity
          style={[
            styles.submitButton,
            isSubmitDisabled && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isSubmitDisabled}
        >
          {isPosting ? (
            <Ionicons name="hourglass-outline" size={20} color="#999" />
          ) : (
            <Ionicons
              name="send"
              size={20}
              color={isSubmitDisabled ? "#999" : "#007AFF"}
            />
          )}
        </TouchableOpacity>
      </View>

      {!currentUser && (
        <View style={styles.signInPrompt}>
          <CustomText variant="caption" color="muted" textAlign="center">
            Please sign in to post comments
          </CustomText>
        </View>
      )}
    </View>
  );
};

export default CommentInput;

const styles = StyleSheet.create((theme) => ({
  container: {
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.grey300,
    padding: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.grey300,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 44,
    maxHeight: 120,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.onBackground,
    lineHeight: 20,
    paddingVertical: 8,
    paddingRight: 8,
    minHeight: 28,
    maxHeight: 88,
  },
  submitButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.grey200,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonDisabled: {
    backgroundColor: theme.colors.grey200,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
  },
  anonymousToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  characterCount: {
    alignItems: "flex-end",
  },
  signInPrompt: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.grey200,
    borderRadius: 8,
  },
}));
