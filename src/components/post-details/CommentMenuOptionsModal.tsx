import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import React from "react";
import { Alert, Modal, TouchableOpacity, View } from "react-native";
import * as IconsSolid from "react-native-heroicons/solid";
import Toast from "react-native-toast-message";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import CustomText from "../ui/CustomText";

const ThemedDeleteIcon = withUnistyles(IconsSolid.TrashIcon, (theme) => ({
  size: theme.gap(3),
  color: theme.colors.error,
}));

interface Comment {
  _id: string;
  content: string;
  likesCount: number;
  hasLiked: boolean;
  _creationTime: number;
  editedAt?: number;
  author?: {
    _id: string;
    userName: string;
    imageUrl?: string;
    age?: number;
    gender?: string;
  } | null;
}

interface CommentMenuOptionsModalProps {
  showMenu: boolean;
  onMenuRequestClose: () => void;
  comment: Comment;
  onCommentUpdated?: () => void;
}

const CommentMenuOptionsModal = ({
  showMenu,
  onMenuRequestClose,
  comment,
  onCommentUpdated,
}: CommentMenuOptionsModalProps) => {
  const deleteComment = useMutation(api.triggers.deleteCommentCascade);

  const handleDeleteComment = () => {
    onMenuRequestClose();

    Alert.alert(
      "Delete Comment",
      "Are you sure you want to delete this comment? This action cannot be undone.",
      [
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteComment({ commentId: comment._id as any });
              Toast.show({
                type: "success",
                text1: "Comment Deleted",
                text2: "Your comment has been deleted successfully",
              });
              onCommentUpdated?.();
            } catch (error) {
              if (error instanceof ConvexError) {
                Toast.show({
                  type: "error",
                  text1: "Failed to delete comment",
                  text2: error.data,
                });
              } else {
                Toast.show({
                  type: "error",
                  text1: "Failed to delete comment",
                  text2: "Something went wrong, please try again.",
                });
              }
            }
          },
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  return (
    <Modal
      visible={showMenu}
      transparent
      animationType="fade"
      onRequestClose={onMenuRequestClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onMenuRequestClose}
      >
        <View style={styles.menuModal}>
          <CustomText
            variant="subtitle1"
            bold
            textAlign="center"
            style={styles.menuTitle}
          >
            Comment Options
          </CustomText>

          <TouchableOpacity
            style={styles.menuOption}
            onPress={handleDeleteComment}
          >
            <CustomText variant="label" style={styles.menuText} color="error">
              Delete Comment
            </CustomText>
            <ThemedDeleteIcon />
          </TouchableOpacity>

          {/* Cancel Button */}

          <TouchableOpacity
            style={styles.menuCancelButton}
            onPress={onMenuRequestClose}
          >
            <CustomText variant="label">Cancel</CustomText>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default CommentMenuOptionsModal;

const styles = StyleSheet.create((theme) => ({
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.backgroundOverlay,
    justifyContent: "center",
    alignItems: "center",
    padding: theme.gap(2),
  },

  menuModal: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.large,
    paddingVertical: theme.gap(2),
    paddingHorizontal: theme.gap(2),
    width: "100%",
    maxWidth: 380,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },

  menuTitle: {
    marginBottom: theme.gap(2),
  },

  menuOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: theme.gap(1.5),
    paddingHorizontal: theme.gap(1.5),
    borderRadius: theme.radii.regular,
    marginBottom: theme.gap(1),
    backgroundColor: theme.colors.background,
  },

  menuText: {
    flex: 1,
  },

  editContainer: {
    marginBottom: theme.gap(2),
  },

  editLabel: {
    marginBottom: theme.gap(1),
  },

  editInput: {
    backgroundColor: theme.colors.background,
    borderRadius: theme.radii.regular,
    padding: theme.gap(1.5),
    borderWidth: 1,
    borderColor: theme.colors.grey200,
    color: theme.colors.onBackground,
    fontSize: 16,
    textAlignVertical: "top",
    minHeight: 100,
  },

  editActions: {
    flexDirection: "row",
    gap: theme.gap(1),
    marginTop: theme.gap(1.5),
  },

  editButton: {
    flex: 1,
    paddingVertical: theme.gap(1.5),
    borderRadius: theme.radii.regular,
    alignItems: "center",
  },

  cancelButton: {
    backgroundColor: theme.colors.grey200,
  },

  saveButton: {
    backgroundColor: theme.colors.primary + "20",
  },

  menuCancelButton: {
    marginTop: theme.gap(2),
    paddingVertical: theme.gap(2),
    borderRadius: theme.radii.regular,
    alignItems: "center",
    backgroundColor: theme.colors.grey200,
  },
}));
