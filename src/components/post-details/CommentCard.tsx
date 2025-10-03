import { useUserStore } from "@/store/useUserStore";
import { format } from "date-fns";
import React, { useState } from "react";
import { DeviceEventEmitter, TouchableOpacity, View } from "react-native";
import * as IconsOutline from "react-native-heroicons/outline";
import * as IconsSolid from "react-native-heroicons/solid";
import Toast from "react-native-toast-message";
import { StyleSheet, withUnistyles } from "react-native-unistyles";

import { CommentCardProps } from "@/types";
import { shareComment } from "@/utils/shareUtils";
import { ConvexError } from "convex/values";
import CustomText from "../ui/CustomText";
import UserAvatar from "../ui/UserAvatar";
import CommentMenuOptionsModal from "./CommentMenuOptionsModal";

const ThemedMenuIcon = withUnistyles(
  IconsOutline.EllipsisVerticalIcon,
  (theme) => ({
    size: theme.gap(2.5),
    color: theme.colors.grey500,
  })
);

const ThemedShareIcon = withUnistyles(IconsSolid.ShareIcon, (theme) => ({
  size: theme.gap(2.5),
  color: theme.colors.grey500,
}));

const MAX_LINES = 3;

const CommentCard = ({
  comment,
  postId,
  isHighlighted = false,
  onCommentUpdated,
}: CommentCardProps & { onCommentUpdated?: () => void }) => {
  const currentUser = useUserStore((state) => state.currentUser);

  const [showMenu, setShowMenu] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const shouldShowToggle = comment.content.length > 100;

  const isMyComment = !!(
    currentUser &&
    comment?.author &&
    comment.author._id === currentUser._id
  );

  const handleMenuPress = () => {
    if (!currentUser) {
      DeviceEventEmitter.emit("showLoginPrompt");
      return;
    }
    setShowMenu(true);
  };

  const handleSharePost = async () => {
    try {
      if (typeof shareComment !== "function") {
        Toast.show({
          type: "error",
          text1: "Share Failed",
          text2: "Share function not available",
        });
        return;
      }

      const result = await shareComment(
        postId as string,
        comment._id as unknown as string,
        comment.content,
        comment.author?.userName || "Anonymous"
      );
      console.log("Share result:", result);

      if (result) {
        Toast.show({
          type: "success",
          text1: "Shared Successfully",
          text2: "Post has been shared",
        });
      }
    } catch (error) {
      if (error instanceof ConvexError) {
        Toast.show({
          type: "error",
          text1: "Failed to share post",
          text2: error.data,
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Failed to share post",
          text2: "Something went wrong, please try again.",
        });
      }
    }
  };

  if (!comment) return null;
  if (!comment.author) return null;

  return (
    <>
      <TouchableOpacity style={styles.card(isHighlighted)} activeOpacity={0.8}>
        {/* Header */}
        <View style={styles.header}>
          {/* Avatar */}
          <View style={styles.avatar}>
            <UserAvatar
              imageUrl={comment.author.imageUrl as string}
              size={30}
              userId={comment.author._id}
              indicatorSize={"small"}
            />
          </View>

          {/* User Info */}
          <View style={styles.userInfo}>
            <CustomText variant="small" semibold color="onSurface">
              {comment.author?.userName}
            </CustomText>
            <CustomText variant="tiny" color="grey500" style={styles.timeText}>
              {format(new Date(comment._creationTime), "MMM d, yyyy • h:mm a")}
            </CustomText>
          </View>

          {/* Menu Button */}
          {isMyComment && (
            <TouchableOpacity
              onPress={handleMenuPress}
              hitSlop={10}
              style={styles.menu}
            >
              <ThemedMenuIcon />
            </TouchableOpacity>
          )}
        </View>

        {/* Content */}
        <CustomText
          variant="small"
          color="onSurface"
          numberOfLines={expanded ? undefined : MAX_LINES}
        >
          {comment.content}
        </CustomText>
        {shouldShowToggle && (
          <TouchableOpacity onPress={() => setExpanded((prev) => !prev)}>
            <CustomText
              variant="tiny"
              semibold
              color="primary"
              style={{ marginTop: 2 }}
            >
              {expanded ? "See less" : "See more"}
            </CustomText>
          </TouchableOpacity>
        )}
        {/* Actions */}
        <View style={styles.actions}>
          {/* Share Button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleSharePost}
          >
            <ThemedShareIcon />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {/* Comment Menu Modal */}
      <CommentMenuOptionsModal
        showMenu={showMenu}
        onMenuRequestClose={() => setShowMenu(false)}
        comment={comment as any}
        onCommentUpdated={onCommentUpdated}
      />
    </>
  );
};

export default CommentCard;

const styles = StyleSheet.create((theme) => ({
  card: (isHighlighted) => ({
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.small,
    padding: theme.paddingHorizontal,
    width: "95%",
    alignSelf: "center",
    borderWidth: isHighlighted ? 1 : 0,
    borderColor: isHighlighted ? theme.colors.secondary : undefined,
  }),

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.gap(1),
  },

  avatar: {
    marginRight: theme.gap(1),
  },

  userInfo: {
    flex: 1,
  },
  timeText: {},

  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: theme.gap(1),
  },

  // Action buttons
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: theme.gap(1),
  },
  actionIcon: {
    marginRight: 6,
  },
  actionText: {
    fontSize: 12,
    //fontFamily: theme.fonts.Regular,
    color: theme.colors.grey500,
  },

  menu: {},
}));
