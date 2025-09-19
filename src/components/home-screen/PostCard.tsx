import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import React from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import * as IconsOutline from "react-native-heroicons/outline";
import * as IconsSolid from "react-native-heroicons/solid";
import { SvgXml } from "react-native-svg";
import { useUnistyles } from "react-native-unistyles";

type PostCardProps = {
  post: Doc<"posts"> & {
    author?: {
      _id: string;
      userName: string;
      imageUrl?: string;
    } | null;
    hasLiked: boolean;
  };
  onPress?: () => void;
};

const PostCard = ({ post, onPress }: PostCardProps) => {
  const { theme } = useUnistyles();
  const togglePostLike = useMutation(api.likes.togglePostLike);

  const handleLike = async () => {
    try {
      await togglePostLike({ postId: post._id });
    } catch (error) {
      Alert.alert("Error", "Failed to update like. Please try again.");
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case "confession":
        return "#FF6B6B";
      case "story":
        return "#4ECDC4";
      case "question":
        return "#45B7D1";
      case "advice":
        return "#FFA726";
      case "other":
        return "#9C27B0";
      default:
        return theme.colors.primary;
    }
  };

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case "confession":
        return IconsOutline.HeartIcon;
      case "story":
        return IconsOutline.BookOpenIcon;
      case "question":
        return IconsOutline.QuestionMarkCircleIcon;
      case "advice":
        return IconsOutline.LightBulbIcon;
      case "other":
        return IconsOutline.ChatBubbleLeftIcon;
      default:
        return IconsOutline.ChatBubbleLeftIcon;
    }
  };

  const PostTypeIcon = getPostTypeIcon(post.type);

  return (
    <TouchableOpacity
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        {/* Avatar */}
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.colors.primary,
            justifyContent: "center",
            alignItems: "center",
            marginRight: 12,
          }}
        >
          {post.author?.imageUrl ? (
            <SvgXml xml={post.author.imageUrl} width={40} height={40} />
          ) : (
            <Text
              style={{
                color: theme.colors.onPrimary,
                fontSize: 16,
                fontWeight: "bold",
              }}
            >
              {post.author?.userName?.charAt(0).toUpperCase() || "?"}
            </Text>
          )}
        </View>

        {/* User Info */}
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: theme.colors.onSurface,
            }}
          >
            {post.author?.userName}
          </Text>
          <Text
            style={{
              fontSize: 12,
              color: theme.colors.grey500,
            }}
          >
            {formatTimeAgo(post._creationTime)}
          </Text>
        </View>

        {/* Post Type Badge */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: getPostTypeColor(post.type),
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 12,
          }}
        >
          <PostTypeIcon size={14} color="white" style={{ marginRight: 4 }} />
          <Text
            style={{
              fontSize: 12,
              fontWeight: "600",
              color: "white",
              textTransform: "capitalize",
            }}
          >
            {post.type}
          </Text>
        </View>
      </View>

      {/* Title */}
      {post.title && (
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: theme.colors.onSurface,
            marginBottom: 8,
          }}
        >
          {post.title}
        </Text>
      )}

      {/* Content */}
      <Text
        style={{
          fontSize: 14,
          color: theme.colors.onSurface,
          lineHeight: 20,
          marginBottom: 12,
        }}
        numberOfLines={4}
      >
        {post.content}
      </Text>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            marginBottom: 12,
            gap: 6,
          }}
        >
          {post.tags.slice(0, 3).map((tag, index) => (
            <View
              key={index}
              style={{
                backgroundColor: theme.colors.grey100,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: theme.colors.grey600,
                }}
              >
                #{tag}
              </Text>
            </View>
          ))}
          {post.tags.length > 3 && (
            <View
              style={{
                backgroundColor: theme.colors.grey100,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 8,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color: theme.colors.grey600,
                }}
              >
                +{post.tags.length - 3}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Actions */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: 12,
          borderTopWidth: 1,
          borderTopColor: theme.colors.grey100,
        }}
      >
        {/* Like Button */}
        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 8,
            backgroundColor: post.hasLiked
              ? theme.colors.primary + "20"
              : "transparent",
          }}
          onPress={handleLike}
        >
          {post.hasLiked ? (
            <IconsSolid.HeartIcon
              size={18}
              color={theme.colors.primary}
              style={{ marginRight: 6 }}
            />
          ) : (
            <IconsOutline.HeartIcon
              size={18}
              color={theme.colors.grey500}
              style={{ marginRight: 6 }}
            />
          )}
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: post.hasLiked
                ? theme.colors.primary
                : theme.colors.grey500,
            }}
          >
            {post.likesCount || 0}
          </Text>
        </TouchableOpacity>

        {/* Comment Button */}
        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 8,
          }}
          onPress={onPress}
        >
          <IconsOutline.ChatBubbleLeftIcon
            size={18}
            color={theme.colors.grey500}
            style={{ marginRight: 6 }}
          />
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: theme.colors.grey500,
            }}
          >
            {post.commentsCount || 0}
          </Text>
        </TouchableOpacity>

        {/* Share Button */}
        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 8,
          }}
        >
          <IconsOutline.ShareIcon size={18} color={theme.colors.grey500} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default PostCard;
