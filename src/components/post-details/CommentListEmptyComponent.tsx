import CustomText from "@/components/ui/CustomText";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import {
  ArrowLongDownIcon,
  ChatBubbleLeftEllipsisIcon,
} from "react-native-heroicons/outline";
import { StyleSheet } from "react-native-unistyles";
import { PRIMARY_COLOR } from "unistyles";

type Comment = {
  _id: string;
  content: string;
  authorId: string;
  postId: string;
  likesCount: number;
  repliesCount: number;
  status: string;
  _creationTime: number;
  author?: {
    _id: string;
    userName: string;
    imageUrl?: string;
    age?: number;
    gender?: string;
  };
  hasLiked: boolean;
};

const CommentListEmptyComponent = ({
  isLoading,
  results,
  currentUser,
  customMessage,
  customSubMessage,
}: {
  isLoading: boolean;
  results: Comment[];
  currentUser: any;
  customMessage?: string;
  customSubMessage?: string;
}) => {
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={PRIMARY_COLOR} />
        <CustomText variant="caption" color="grey500" style={{ marginTop: 10 }}>
          Loading comments...
        </CustomText>
      </View>
    );
  }

  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyContent}>
        <View style={styles.emptyIconContainer}>
          <ChatBubbleLeftEllipsisIcon size={72} color={PRIMARY_COLOR} />
        </View>
        <CustomText
          variant="label"
          bold
          color="onBackground"
          style={styles.emptyTitle}
        >
          {customMessage || "No Comments Yet"}
        </CustomText>
        <CustomText
          variant="small"
          color="muted"
          textAlign="center"
          style={styles.emptyDescription}
        >
          {customSubMessage ||
            (currentUser
              ? "Be the first to share your thoughts and start the conversation!"
              : "Sign in to share your thoughts and join the conversation!")}
        </CustomText>
        <View style={styles.emptyActionContainer}>
          <ArrowLongDownIcon size={20} color={PRIMARY_COLOR} />
          <CustomText variant="small" color="primary" fontWeight="medium">
            Scroll down to add a comment
          </CustomText>
        </View>
      </View>
    </View>
  );
};

export default CommentListEmptyComponent;

const styles = StyleSheet.create((theme) => ({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: theme.gap(2),
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    marginTop: 20,
  },
  emptyContent: {
    alignItems: "center",
    gap: 16,
    maxWidth: 300,
  },
  emptyIconContainer: {
    padding: 20,
    backgroundColor: theme.colors.primary + "10",
    borderRadius: 50,
  },
  emptyTitle: {
    textAlign: "center",
  },
  emptyDescription: {
    lineHeight: 22,
  },
  emptyActionContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
}));
