import { api } from "@/convex/_generated/api";
import { useUserStore } from "@/store/useUserStore";
import { moderateContent } from "@/utils/moderateContent";
import { useMutation } from "convex/react";
import { format } from "date-fns";
import { router } from "expo-router";
import React, { useState } from "react";
import { DeviceEventEmitter, TouchableOpacity, View } from "react-native";
import AnimatedNumbers from "react-native-animated-numbers";
import * as IconsOutline from "react-native-heroicons/outline";
import * as IconsSolid from "react-native-heroicons/solid";
import Toast from "react-native-toast-message";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { SECONDARY_COLOR } from "unistyles";

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
const ThemedLikeIcon = withUnistyles(IconsSolid.HeartIcon, (theme) => ({
  size: theme.gap(2.5),
  color: theme.colors.secondary,
}));
const ThemedUnlikeIcon = withUnistyles(IconsOutline.HeartIcon, (theme) => ({
  size: theme.gap(2.5),
  color: theme.colors.grey500,
}));
const ThemedShareIcon = withUnistyles(IconsSolid.ShareIcon, (theme) => ({
  size: theme.gap(2.5),
  color: theme.colors.grey500,
}));

const CommentCard = ({
  comment,
  postId,
  onPress,
  isHighlighted = false,
  onCommentUpdated,
}: CommentCardProps & { onCommentUpdated?: () => void }) => {
  const currentUser = useUserStore((state) => state.currentUser);

  const toggleCommentLike = useMutation(api.likes.toggleCommentLike);

  const [likes, setLikes] = useState(comment?.likesCount || 0);
  const [hasLiked, setHasLiked] = useState(comment?.hasLiked || false);
  const [showMenu, setShowMenu] = useState(false);

  const isMyComment = !!(
    currentUser &&
    comment?.author &&
    comment.author._id === currentUser._id
  );

  const handleLike = async () => {
    if (!currentUser) {
      DeviceEventEmitter.emit("showLoginPrompt");
      return;
    }

    if (hasLiked) {
      setLikes((prev) => prev - 1);
      setHasLiked(false);
    } else {
      setLikes((prev) => prev + 1);
      setHasLiked(true);
    }

    try {
      await toggleCommentLike({ commentId: comment._id });
    } catch (error) {
      if (error instanceof ConvexError) {
        Toast.show({
          type: "error",
          text1: "Failed to like/unlike post",
          text2: error.data,
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Failed to like/unlike post",
          text2: "Something went wrong, please try again.",
        });
      }
    }
  };

  const handleMenuPress = () => {
    if (!currentUser) {
      DeviceEventEmitter.emit("showLoginPrompt");
      return;
    }
    setShowMenu(true);
  };

  const handleUserPress = () => {
    if (!comment.author) return;
    if (comment.author._id === currentUser?._id) {
      router.navigate("/(main)/(tabs)/profile");
    } else {
      router.navigate({
        pathname: "/(main)/user/[id]",
        params: { id: comment.author._id },
      });
    }
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
        moderateContent(comment.content),
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
      <TouchableOpacity style={styles.card} activeOpacity={0.8}>
        {/* Header */}
        <View style={styles.header}>
          {/* Avatar */}
          <TouchableOpacity style={styles.avatar} onPress={handleUserPress}>
            <UserAvatar
              imageUrl={comment.author.imageUrl as string}
              size={30}
              userId={comment.author._id}
              indicatorSize={"small"}
            />
          </TouchableOpacity>

          {/* User Info */}
          <View style={styles.userInfo}>
            <CustomText variant="small" semibold color="onSurface">
              {comment.author?.userName}
            </CustomText>

            <CustomText variant="small" color="grey500">
              {comment.author?.age}
              {comment.author?.gender?.charAt(0)}
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
        <CustomText variant="small" color="onSurface">
          {moderateContent(comment.content)}
        </CustomText>

        <CustomText variant="tiny" color="grey500" style={styles.timeText}>
          {format(new Date(comment._creationTime), "MMM d, yyyy • h:mm a")}
          {comment.editedAt && " • edited"}
        </CustomText>
        {/* Actions */}
        <View style={styles.actions}>
          {/* Like Button */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              hasLiked && {
                backgroundColor: SECONDARY_COLOR + "20",
                paddingHorizontal: 3,
                borderRadius: 3,
              },
            ]}
            onPress={handleLike}
          >
            {hasLiked ? <ThemedLikeIcon /> : <ThemedUnlikeIcon />}
            <AnimatedNumbers
              includeComma
              animateToNumber={likes || 0}
              fontStyle={[
                styles.actionText,
                hasLiked && { color: SECONDARY_COLOR },
              ]}
            />
          </TouchableOpacity>

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
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.small,
    padding: theme.paddingHorizontal,
    width: "95%",
    alignSelf: "center",
  },

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
  timeText: {
    marginTop: theme.gap(1),
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: theme.gap(1),
    gap: theme.gap(1),
  },

  tag: {
    borderRadius: theme.radii.small,
    paddingHorizontal: theme.gap(0.5),
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    fontFamily: theme.fonts.Regular,
    color: theme.colors.grey500,
  },
  trending: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SECONDARY_COLOR + "20",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 30,
  },
  menu: { marginLeft: 10 },
}));
