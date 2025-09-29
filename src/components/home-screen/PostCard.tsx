import { api } from "@/convex/_generated/api";
import { useUserStore } from "@/store/useUserStore";
import { EnrichedPost } from "@/types";
import { useMutation } from "convex/react";
import { format } from "date-fns";
import { Link, router } from "expo-router";
import React, { useEffect, useState } from "react";
import { DeviceEventEmitter, TouchableOpacity, View } from "react-native";
import AnimatedNumbers from "react-native-animated-numbers";
import * as IconsOutline from "react-native-heroicons/outline";
import * as IconsSolid from "react-native-heroicons/solid";
import Toast from "react-native-toast-message";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import { SECONDARY_COLOR, TERTIARY_COLOR } from "unistyles";
import MenuOptionsModal from "../post-details/MenuOptionsModal";

import { sharePost } from "@/utils/shareUtils";
import { ConvexError } from "convex/values";
import CustomText from "../ui/CustomText";
import UserAvatar from "../ui/UserAvatar";

type PostCardProps = {
  post: EnrichedPost;
  showFullContent?: boolean;
  inSearchScreen?: boolean;
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
  color: theme.colors.secondary,
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
const ThemedFireIcon = withUnistyles(IconsSolid.FireIcon, (theme) => ({
  size: theme.gap(3),
  color: theme.colors.secondary,
}));

const PostCard = ({
  post,
  showFullContent = false,
  inSearchScreen = false,
}: PostCardProps) => {
  const { currentUser } = useUserStore();

  const togglePostLike = useMutation(api.likes.togglePostLike);

  const [likes, setLikes] = useState(post.likesCount || 0);
  const [hasLiked, setHasLiked] = useState(post.hasLiked || false);
  const [showMenu, setShowMenu] = useState(false);
  const [isTrending] = useState(false);

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
      router.navigate("/(drawer)/(tabs)/profile");
    } else {
      router.navigate({
        pathname: "/(drawer)/user/[id]",
        params: { id: post.author._id },
      });
    }
  };

  const handleSharePost = async () => {
    try {
      if (typeof sharePost !== "function") {
        Toast.show({
          type: "error",
          text1: "Share Failed",
          text2: "Share function not available",
        });
        return;
      }

      const result = await sharePost(
        post._id,
        post.title ? post.title : undefined,
        post.content,
        post.author?.userName || "Anonymous"
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

  useEffect(() => {
    setLikes(post.likesCount || 0);
  }, [post.likesCount]);
  useEffect(() => {
    setHasLiked(post.hasLiked);
  }, [post.hasLiked]);

  if (!post.author) return null;

  return (
    <>
      <TouchableOpacity
        style={styles.card(isTrending)}
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
              indicatorSize="medium"
            />
          </TouchableOpacity>

          {/* User Info */}
          <View style={styles.userInfo}>
            <CustomText variant="label" semibold color="onSurface">
              {post.author?.userName}
            </CustomText>

            <CustomText variant="small" color="grey500">
              {post.author?.age}
              {"•"}
              {post.author?.gender}
            </CustomText>
          </View>

          {isTrending && (
            <View style={styles.trending}>
              <ThemedFireIcon />
              <CustomText variant="small">Hot</CustomText>
            </View>
          )}
          {/* Menu Button */}
          {isMyPost && (
            <TouchableOpacity
              onPress={handleMenuPress}
              hitSlop={10}
              style={styles.menu}
            >
              <ThemedMenuIcon />
            </TouchableOpacity>
          )}
        </View>

        {/* Title */}
        {post.title && (
          <CustomText
            variant="label"
            bold
            color="onSurface"
            numberOfLines={showFullContent ? undefined : 2}
          >
            {post.title}
          </CustomText>
        )}

        {/* Content */}
        <CustomText
          variant="label"
          color="grey800"
          numberOfLines={showFullContent ? undefined : 3}
        >
          {post.content}
        </CustomText>

        {/* Tags */}

        {post.tagsText && (
          <View style={styles.tagsContainer}>
            {post.tagsText
              .split("#") // split on "#"
              .filter((tag) => tag.trim().length > 0) // remove empty
              .map((tag, index) =>
                inSearchScreen ? (
                  <CustomText
                    key={index}
                    variant="tiny"
                    semibold
                    style={{ color: TERTIARY_COLOR }}
                  >
                    #{tag}
                  </CustomText>
                ) : (
                  <Link
                    key={index}
                    style={styles.tag}
                    href={{
                      pathname: "/(main)/(tabs)/search/[tag]",
                      params: { tag: tag.toLowerCase() },
                    }}
                  >
                    <CustomText
                      variant="small"
                      semibold
                      style={{ color: TERTIARY_COLOR }}
                    >
                      #{tag}
                    </CustomText>
                  </Link>
                )
              )}
          </View>
        )}

        <CustomText variant="tiny" color="grey500" style={styles.timeText}>
          {format(new Date(post._creationTime), "MMM d, yyyy • h:mm a")}
          {post.editedAt && " • edited"}
        </CustomText>
        {/* Actions */}
        <View style={styles.actions}>
          {/* Like Button */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              hasLiked && {
                backgroundColor: SECONDARY_COLOR + "20",
                paddingHorizontal: 5,
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
            />
          </TouchableOpacity>

          {/* View Count */}
          <TouchableOpacity style={styles.actionButton} disabled>
            <ThemedViewIcon />
            <AnimatedNumbers
              includeComma
              animateToNumber={post.viewsCount || 0}
              fontStyle={styles.actionText}
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
      {/* --- Post Options Modal --- */}
      {isMyPost && (
        <MenuOptionsModal
          post={post}
          onMenuRequestClose={() => setShowMenu(false)}
          showMenu={showMenu}
        />
      )}
    </>
  );
};

export default PostCard;

const styles = StyleSheet.create((theme) => ({
  card: (isTrending) => ({
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.regular,
    padding: theme.paddingHorizontal,
    borderWidth: isTrending ? 1 : 0,
    borderColor: isTrending ? theme.colors.secondary : undefined,
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
  timeText: {
    marginVertical: theme.gap(1),
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
    //fontFamily: theme.fonts.Medium,
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
