import { api } from "@/convex/_generated/api";
import { useUserStore } from "@/store/useUserStore";
import { EnrichedPost } from "@/types";
import { moderateContent } from "@/utils/moderateContent";
import { useMutation } from "convex/react";
import { formatDistanceToNowStrict } from "date-fns";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  DeviceEventEmitter,
  Modal,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AnimatedNumbers from "react-native-animated-numbers";
import * as IconsOutline from "react-native-heroicons/outline";
import * as IconsSolid from "react-native-heroicons/solid";
import { Easing } from "react-native-reanimated";
import Toast from "react-native-toast-message";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { PRIMARY_COLOR } from "unistyles";
import { BlockUserButton } from "../ui/BlockUserComponents";
import CustomText from "../ui/CustomText";
import UserAvatar from "../ui/UserAvatar";

type PostCardProps = {
  post: EnrichedPost;
  showFullContent?: boolean;
};

const ThemedMenuIcon = withUnistyles(
  IconsOutline.EllipsisVerticalIcon,
  (theme) => ({
    size: theme.gap(3),
    color: theme.colors.grey500,
  })
);
const ThemedLikeIcon = withUnistyles(IconsSolid.HeartIcon, (theme) => ({
  size: theme.gap(3),
  color: theme.colors.primary,
}));
const ThemedUnlikeIcon = withUnistyles(IconsOutline.HeartIcon, (theme) => ({
  size: theme.gap(3),
  color: theme.colors.grey500,
}));
const ThemedShareIcon = withUnistyles(IconsSolid.ShareIcon, (theme) => ({
  size: theme.gap(3),
  color: theme.colors.grey500,
}));
const ThemedCommentIcon = withUnistyles(
  IconsSolid.ChatBubbleLeftRightIcon,
  (theme) => ({
    size: theme.gap(3),
    color: theme.colors.grey500,
  })
);
const ThemedViewIcon = withUnistyles(IconsSolid.EyeIcon, (theme) => ({
  size: theme.gap(3),
  color: theme.colors.grey500,
}));

const PostCard = ({ post, showFullContent = false }: PostCardProps) => {
  const { currentUser } = useUserStore();

  const togglePostLike = useMutation(api.likes.togglePostLike);
  const updatePost = useMutation(api.posts.updatePost);
  const deletePost = useMutation(api.posts.deletePost);

  const [likes, setLikes] = useState(post.likesCount || 0);
  const [hasLiked, setHasLiked] = useState(post.hasLiked || false);
  const [showMenu, setShowMenu] = useState(false);

  const isMyPost =
    currentUser &&
    (post.authorId === currentUser._id ||
      (post.author && post.author._id === currentUser._id));

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
      await togglePostLike({ postId: post._id });
    } catch {
      Toast.show({
        type: "error",
        text1: "Failed to Like",
        text2: "Please try again later",
      });
    }
  };

  const handleView = () => {
    router.navigate({
      pathname: "/(main)/post/[id]",
      params: { id: post._id },
    });
  };

  const handleMenuPress = () => {
    if (!currentUser) {
      DeviceEventEmitter.emit("showLoginPrompt");
      return;
    }
    setShowMenu(true);
  };

  const handleUserPress = () => {
    if (!post.author) return;
    if (post.author._id === currentUser?._id) {
      router.navigate("/(main)/(tabs)/profile");
    } else {
      router.navigate({
        pathname: "/(main)/user/[userId]",
        params: { userId: post.author._id },
      });
    }
  };

  if (!post.author) return null;

  return (
    <>
      <TouchableOpacity
        style={styles.card}
        onPress={handleView}
        activeOpacity={0.8}
      >
        {/* Header */}
        <View style={styles.header}>
          {/* Avatar */}
          <TouchableOpacity style={styles.avatar} onPress={handleUserPress}>
            <UserAvatar
              imageUrl={post.author.imageUrl as string}
              size={40}
              userId={post.author._id}
            />
          </TouchableOpacity>

          {/* User Info */}
          <View style={styles.userInfo}>
            <CustomText variant="label" semibold color="onSurface">
              {post.author?.userName}
            </CustomText>

            <CustomText variant="caption" color="grey500">
              {post.author?.age}
              {post.author?.gender?.charAt(0)}
            </CustomText>
          </View>

          {/* Menu Button */}
          <TouchableOpacity onPress={handleMenuPress} hitSlop={10}>
            <ThemedMenuIcon />
          </TouchableOpacity>
        </View>

        {/* Title */}
        {post.title && (
          <CustomText
            variant="subtitle2"
            bold
            color="onSurface"
            numberOfLines={showFullContent ? undefined : 2}
          >
            {moderateContent(post.title)}
          </CustomText>
        )}

        {/* Content */}
        <CustomText
          variant="body2"
          color="grey800"
          numberOfLines={showFullContent ? undefined : 3}
        >
          {moderateContent(post.content)}
        </CustomText>
        <CustomText variant="caption" color="grey500" style={styles.timeText}>
          {formatDistanceToNowStrict(post._creationTime)}
          {post.editedAt && " • edited"}
        </CustomText>
        {/* Actions */}
        <View style={styles.actions}>
          {/* Like Button */}
          <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
            {hasLiked ? <ThemedLikeIcon /> : <ThemedUnlikeIcon />}
            <AnimatedNumbers
              includeComma
              animateToNumber={likes || 0}
              fontStyle={[
                styles.actionText,
                hasLiked && { color: PRIMARY_COLOR },
              ]}
            />
          </TouchableOpacity>

          {/* Comment Button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => undefined}
          >
            <ThemedCommentIcon />
            <AnimatedNumbers
              includeComma
              animateToNumber={post.commentsCount || 0}
              fontStyle={styles.actionText}
              easing={Easing.out(Easing.cubic)}
            />
          </TouchableOpacity>

          {/* View Count */}
          <TouchableOpacity style={styles.actionButton} disabled>
            <ThemedViewIcon />
            <AnimatedNumbers
              includeComma
              animateToNumber={post.viewsCount || 0}
              fontStyle={styles.actionText}
              easing={Easing.out(Easing.cubic)}
            />
          </TouchableOpacity>

          {/* Share Button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => undefined}
          >
            <ThemedShareIcon />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setShowMenu(false)}
          activeOpacity={1}
        >
          <View style={styles.menuModal}>
            <CustomText variant="subtitle1" bold textAlign="center">
              Post Options
            </CustomText>

            {isMyPost ? (
              <>
                <TouchableOpacity
                  style={styles.menuOption}
                  onPress={() => undefined}
                >
                  <IconsOutline.PencilIcon
                    size={20}
                    color="#4B50B2"
                    style={styles.menuIcon}
                  />
                  <Text style={[styles.menuText, styles.menuTextPrimary]}>
                    Edit Post
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuOption}
                  onPress={() => undefined}
                >
                  <IconsOutline.ShareIcon
                    size={20}
                    color="#4B50B2"
                    style={styles.menuIcon}
                  />
                  <Text style={[styles.menuText, styles.menuTextPrimary]}>
                    Share Post
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuOption}
                  onPress={() => undefined}
                >
                  <IconsOutline.EyeSlashIcon
                    size={20}
                    color="#FFA726"
                    style={styles.menuIcon}
                  />
                  <Text style={[styles.menuText, styles.menuTextWarning]}>
                    Hide from Feed
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuOption}
                  onPress={() => undefined}
                >
                  <IconsOutline.TrashIcon
                    size={20}
                    color="#FF6B6B"
                    style={styles.menuIcon}
                  />
                  <Text style={[styles.menuText, styles.menuTextError]}>
                    Delete Post
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Other User's Post Options */}
                <TouchableOpacity
                  style={styles.menuOption}
                  onPress={() => undefined}
                >
                  <IconsOutline.ShareIcon
                    size={20}
                    color="#4B50B2"
                    style={styles.menuIcon}
                  />
                  <Text style={[styles.menuText, styles.menuTextPrimary]}>
                    Share Post
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuOption}
                  onPress={() => undefined}
                >
                  <IconsOutline.FlagIcon
                    size={20}
                    color="#FF6B6B"
                    style={styles.menuIcon}
                  />
                  <Text style={[styles.menuText, styles.menuTextError]}>
                    Report Post
                  </Text>
                </TouchableOpacity>

                {post.author?._id && (
                  <View style={[styles.menuOption, { paddingVertical: 8 }]}>
                    <BlockUserButton
                      userId={post.author._id as any}
                      userName={post.author.userName}
                      onBlockStatusChange={() => setShowMenu(false)}
                      style={{
                        backgroundColor: "transparent",
                        borderWidth: 1,
                        borderColor: "#FF6B6B",
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                      }}
                      textStyle={{
                        color: "#FF6B6B",
                        fontSize: 14,
                        fontWeight: "500",
                      }}
                    />
                  </View>
                )}
              </>
            )}

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.menuCancelButton}
              onPress={() => setShowMenu(false)}
            >
              <Text style={styles.menuCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

export default PostCard;

const styles = StyleSheet.create((theme) => ({
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.small,
    padding: theme.paddingHorizontal,
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
    marginTop: theme.gap(0.5),
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
    gap: theme.gap(1),
  },
  actionIcon: {
    marginRight: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.grey500,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: theme.paddingHorizontal,
  },
  menuModal: {
    backgroundColor: theme.colors.background,
    padding: theme.paddingHorizontal,
    borderRadius: theme.radii.regular,
    width: "100%",
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.onSurface,
    marginBottom: 16,
    textAlign: "center",
  },

  // Menu options
  menuOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  menuIcon: {
    marginRight: 12,
  },
  menuText: {
    fontSize: 16,
    flex: 1,
  },
  menuTextDefault: {
    color: theme.colors.onSurface,
  },
  menuTextPrimary: {
    color: theme.colors.primary,
  },
  menuTextWarning: {
    color: theme.colors.warning || "#FFA726",
  },
  menuTextError: {
    color: theme.colors.error || "#FF6B6B",
  },

  // Cancel button in menu
  menuCancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.grey100,
    borderRadius: 8,
    alignItems: "center",
  },
  menuCancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.grey600,
  },
}));
