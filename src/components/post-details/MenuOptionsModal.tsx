import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import React from "react";
import { Alert, Modal, TouchableOpacity, View } from "react-native";
import * as IconsSolid from "react-native-heroicons/solid";
import Toast from "react-native-toast-message";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import CustomText from "../ui/CustomText";

const ThemedHideIcon = withUnistyles(IconsSolid.EyeSlashIcon, (theme) => ({
  size: theme.gap(3),
  color: theme.colors.warning,
}));
const ThemedDeleteIcon = withUnistyles(IconsSolid.TrashIcon, (theme) => ({
  size: theme.gap(3),
  color: theme.colors.error,
}));

const MenuOptionsModal = ({ showMenu, onMenuRequestClose, post }) => {
  const updatePost = useMutation(api.posts.updatePost);
  const deletePost = useMutation(api.posts.deletePost);

  const handleDeletePost = () => {
    onMenuRequestClose();

    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post? This action cannot be undone.",
      [
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePost({ postId: post._id });
              Toast.show({
                type: "success",
                text1: "Post Deleted",
                text2: "Your post has been deleted successfully",
              });
            } catch (error) {
              if (error instanceof ConvexError) {
                Toast.show({
                  type: "error",
                  text1: "Failed to delete post",
                  text2: error.data,
                });
              } else {
                Toast.show({
                  type: "error",
                  text1: "Failed to delete post",
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

  const handleHidePost = () => {
    onMenuRequestClose();
    Alert.alert("Hide Post", "Hide this post from the public feed?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Hide",
        onPress: async () => {
          try {
            await updatePost({
              postId: post._id,
              visibility: "private",
            });
            Toast.show({
              type: "success",
              text1: "Post Hidden",
              text2: "Your post has been hidden from public feed",
            });
          } catch (error) {
            if (error instanceof ConvexError) {
              Toast.show({
                type: "error",
                text1: "Failed to hide post",
                text2: error.data,
              });
            } else {
              Toast.show({
                type: "error",
                text1: "Failed to hide post",
                text2: "Something went wrong, please try again.",
              });
            }
          }
        },
      },
    ]);
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
          <CustomText variant="subtitle1" bold style={styles.menuTitle}>
            Post Options
          </CustomText>

          <TouchableOpacity style={styles.menuOption} onPress={handleHidePost}>
            <ThemedHideIcon />
            <CustomText style={[styles.menuText, styles.menuTextWarning]}>
              Hide from Feed
            </CustomText>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuOption}
            onPress={handleDeletePost}
          >
            <ThemedDeleteIcon />
            <CustomText style={[styles.menuText, styles.menuTextError]}>
              Delete Post
            </CustomText>
          </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity
            style={styles.menuCancelButton}
            onPress={onMenuRequestClose}
          >
            <CustomText style={styles.menuCancelButtonText}>Cancel</CustomText>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default MenuOptionsModal;

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
    fontSize: 18,
    fontWeight: "700",
    color: theme.colors.onSurface,
    textAlign: "center",
    marginBottom: theme.gap(2),
  },

  menuOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.gap(1.5),
    paddingHorizontal: theme.gap(1.5),
    borderRadius: theme.radii.regular,
    marginBottom: theme.gap(1),
    backgroundColor: theme.colors.background,
  },

  menuText: {
    fontSize: 16,
    fontWeight: "500",
    color: theme.colors.onSurface,
    marginLeft: theme.gap(1.5),
    flex: 1,
  },

  menuTextWarning: {
    color: theme.colors.warning,
  },

  menuTextError: {
    color: theme.colors.error,
  },

  blockUserWrapper: {
    marginTop: theme.gap(1),
  },

  blockUserButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: theme.colors.error,
    paddingVertical: theme.gap(1),
    paddingHorizontal: theme.gap(2),
    borderRadius: theme.radii.regular,
  },

  blockUserText: {
    color: theme.colors.error,
    fontSize: 14,
    fontWeight: "500",
  },

  menuCancelButton: {
    marginTop: theme.gap(2),
    paddingVertical: theme.gap(1.5),
    borderRadius: theme.radii.large,
    alignItems: "center",
    backgroundColor: theme.colors.grey200,
  },

  menuCancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.grey700,
  },
}));
