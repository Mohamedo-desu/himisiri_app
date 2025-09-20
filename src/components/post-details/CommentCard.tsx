import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUserStore } from "@/store/useUserStore";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { formatDistanceToNowStrict } from "date-fns";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Share,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SvgXml } from "react-native-svg";
import { StyleSheet } from "react-native-unistyles";
import CustomText from "../ui/CustomText";

type CommentCardProps = {
  comment: {
    _id: Id<"comments">;
    _creationTime: number;
    content: string;
    likesCount: number;
    hasLiked: boolean;
    author?: {
      _id: string;
      userName: string;
      imageUrl?: string;
    } | null;
    isAnonymous: boolean;
  };
  onPress?: () => void;
};

const CommentCard = ({ comment, onPress }: CommentCardProps) => {
  const { currentUser } = useUserStore();
  const [liking, setLiking] = useState(false);

  const toggleCommentLike = useMutation(api.likes.toggleCommentLike);

  const handleLike = async () => {
    if (!currentUser) {
      Alert.alert(
        "Authentication Required",
        "Please sign in to like comments."
      );
      return;
    }

    if (liking) return;

    try {
      setLiking(true);
      await toggleCommentLike({ commentId: comment._id });
    } catch (error) {
      console.error("Error liking comment:", error);
      Alert.alert("Error", "Failed to like comment. Please try again.");
    } finally {
      setLiking(false);
    }
  };

  const handleShare = async () => {
    try {
      const shareContent = {
        title: "Comment from Himisiri",
        message: `Check out this comment: "${comment.content.substring(0, 100)}${
          comment.content.length > 100 ? "..." : ""
        }"`,
      };

      if (Platform.OS === "web") {
        if (navigator.share) {
          await navigator.share({
            title: shareContent.title,
            text: shareContent.message,
          });
        } else {
          await navigator.clipboard.writeText(shareContent.message);
          Alert.alert("Copied!", "Comment copied to clipboard.");
        }
      } else {
        await Share.share({
          title: shareContent.title,
          message: shareContent.message,
        });
      }
    } catch (error) {
      console.error("Error sharing comment:", error);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080)
      return `${Math.floor(diffInMinutes / 1440)}d ago`;

    return date.toLocaleDateString();
  };

  const displayAuthor = comment.isAnonymous
    ? "Anonymous"
    : comment.author?.userName || "Unknown User";
  const authorImage = comment.isAnonymous ? null : comment.author?.imageUrl;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        {/* Avatar */}
        <View style={styles.avatar}>
          {authorImage ? (
            <SvgXml xml={authorImage} width={40} height={40} />
          ) : (
            <Text style={styles.avatarText}>
              {displayAuthor.charAt(0).toUpperCase() || "?"}
            </Text>
          )}
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{displayAuthor}</Text>
          <Text style={styles.timestamp}>
            {formatDistanceToNowStrict(comment._creationTime)}
            {comment.editedAt && " • edited"}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <CustomText
          variant="body1"
          color="onBackground"
          style={styles.commentText}
        >
          {comment.content}
        </CustomText>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, comment.hasLiked && styles.liked]}
          onPress={handleLike}
          disabled={liking}
        >
          <Ionicons
            name={comment.hasLiked ? "heart" : "heart-outline"}
            size={18}
            color={comment.hasLiked ? "#FF6B6B" : "#666"}
          />
          <CustomText
            variant="caption"
            color={comment.hasLiked ? "error" : "muted"}
            style={styles.actionText}
          >
            {comment.likesCount}
          </CustomText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={18} color="#666" />
          <CustomText variant="caption" color="muted" style={styles.actionText}>
            Share
          </CustomText>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

export default CommentCard;

const styles = StyleSheet.create((theme) => ({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 16,
    shadowColor: theme.colors.grey500,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: theme.colors.onPrimary,
    fontSize: 16,
    fontWeight: "bold",
  }, // User info
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.onSurface,
  },
  timestamp: {
    fontSize: 12,
    color: theme.colors.grey500,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  authorSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  authorImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  anonymousAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.grey200,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  authorInfo: {
    flex: 1,
  },
  content: {
    marginBottom: 16,
  },
  commentText: {
    lineHeight: 22,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.grey300,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 16,
    borderRadius: 6,
  },
  liked: {
    backgroundColor: theme.colors.grey200,
  },
  actionText: {
    marginLeft: 4,
  },
}));
