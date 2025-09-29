import CustomText from "@/components/ui/CustomText";
import React from "react";
import { ActivityIndicator, View } from "react-native";
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

const CommentListFooterComponent = ({
  status,
  results,
}: {
  status: string;
  results: Comment[];
}) => {
  if (status === "CanLoadMore") {
    return (
      <View style={styles.loadMoreContainer}>
        <ActivityIndicator size="small" color={PRIMARY_COLOR} />
        <CustomText variant="label" color="muted" style={styles.loadMoreText}>
          Loading more comments...
        </CustomText>
      </View>
    );
  }

  if (status === "Exhausted" && results.length > 0) {
    return (
      <View style={styles.endContainer}>
        <CustomText variant="small" color="muted">
          You&apos;ve reached at the end of the comments.
        </CustomText>
      </View>
    );
  }

  return null;
};

export default CommentListFooterComponent;

const styles = StyleSheet.create((theme) => ({
  loadMoreContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: theme.gap(2),
  },
  loadMoreText: {
    color: theme.colors.grey500,
  },
  endContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: theme.gap(2),
  },
}));
