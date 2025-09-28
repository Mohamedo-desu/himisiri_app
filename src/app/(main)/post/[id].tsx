import PostCard from "@/components/home-screen/PostCard";
import CommentCard from "@/components/post-details/CommentCard";
import CommentInput from "@/components/post-details/CommentInput";
import CommentListEmptyComponent from "@/components/post-details/CommentListEmptyComponent";
import CommentListFooterComponent from "@/components/post-details/CommentListFooterComponent";
import CustomText from "@/components/ui/CustomText";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUserStore } from "@/store/useUserStore";
import { LegendListRef } from "@legendapp/list";
import { AnimatedLegendList } from "@legendapp/list/animated";
import { usePaginatedQuery, useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ArrowLeftIcon,
  DocumentIcon,
  ExclamationCircleIcon,
} from "react-native-heroicons/outline";
import { StyleSheet } from "react-native-unistyles";
import { BADGE_COLOR, PRIMARY_COLOR } from "unistyles";

const PostDetailsScreen = () => {
  const { id, highlight } = useLocalSearchParams<{
    id: string;
    highlight?: string;
  }>();
  const router = useRouter();
  const { currentUser } = useUserStore();
  const [refreshing, setRefreshing] = useState(false);
  const [highlightedCommentId, setHighlightedCommentId] = useState<
    string | null
  >(highlight || null);
  const flatListRef = useRef<LegendListRef>(null);

  // Fetch the post details
  const post = useQuery(
    api.posts.getPostById,
    id ? { postId: id as Id<"posts"> } : "skip"
  );

  // Fetch comments for this post
  const {
    results: comments,
    status: commentsStatus,
    loadMore,
    isLoading: isLoadingComments,
  } = usePaginatedQuery(
    api.comments.getPaginatedComments,
    id ? { postId: id as Id<"posts"> } : "skip",
    { initialNumItems: 10 }
  );

  useEffect(() => {
    if (!id) {
      Alert.alert("Error", "Invalid post ID");
      router.back();
    }
  }, [id, router]);

  // Handle highlighting effect
  useEffect(() => {
    if (highlightedCommentId && comments && comments.length > 0) {
      const commentIndex = comments.findIndex(
        (comment) => comment._id === highlightedCommentId
      );

      if (commentIndex !== -1) {
        setTimeout(() => {
          try {
            flatListRef.current?.scrollToIndex({
              index: commentIndex,
              viewPosition: 0.3,
              animated: true,
            });
          } catch {
            const estimatedOffset = commentIndex * 120;
            flatListRef.current?.scrollToOffset({
              offset: estimatedOffset,
              animated: true,
            });
          }
        }, 500);

        setTimeout(() => {
          setHighlightedCommentId(null);
        }, 3000);
      }
    }
  }, [highlightedCommentId, comments]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleCommentPosted = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  const handleCommentUpdated = useCallback(() => {
    // Refresh the comments list when a comment is updated or deleted
    // The usePaginatedQuery will automatically refetch
  }, []);

  const handleCommentPress = useCallback((commentId: string) => {
    Alert.alert(
      "Feature Coming Soon",
      "Comment details feature is coming soon!"
    );
  }, []);

  const renderComment = useCallback(
    ({ item: comment }: { item: any }) => (
      <CommentCard
        comment={comment}
        postId={id as any}
        onPress={() => handleCommentPress(comment._id)}
        isHighlighted={highlightedCommentId === comment._id}
        onCommentUpdated={handleCommentUpdated}
      />
    ),
    [handleCommentPress, highlightedCommentId, id, handleCommentUpdated]
  );

  const renderHeader = () => {
    if (!post) return null;

    return (
      <View style={styles.postContainer}>
        <PostCard post={post as any} showFullContent={true} />
        <View style={styles.commentsHeader}>
          <View style={styles.commentsHeaderContent}>
            <View style={styles.commentsTitleContainer}>
              <CustomText
                variant="label"
                fontWeight="bold"
                color="onBackground"
              >
                Comments
              </CustomText>
            </View>
            <CustomText variant="small" color="muted">
              Share your thoughts and join the conversation
            </CustomText>
          </View>
        </View>
      </View>
    );
  };

  if (!id) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <View style={styles.errorIconContainer}>
            <ExclamationCircleIcon size={64} color={BADGE_COLOR} />
          </View>
          <CustomText
            variant="h2"
            fontWeight="bold"
            color="error"
            style={styles.errorTitle}
          >
            Invalid Post
          </CustomText>
          <CustomText
            variant="body1"
            color="muted"
            textAlign="center"
            style={styles.errorDescription}
          >
            The requested post could not be found.
          </CustomText>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeftIcon size={20} color={PRIMARY_COLOR} />
            <CustomText variant="body1" fontWeight="semibold" color="primary">
              Go Back
            </CustomText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (post === undefined) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <ActivityIndicator size="large" color={PRIMARY_COLOR} />
          <CustomText
            variant="h4"
            fontWeight="semibold"
            color="onBackground"
            style={styles.errorTitle}
          >
            Loading Post
          </CustomText>
          <CustomText variant="body2" color="muted" textAlign="center">
            Please wait while we fetch the post details...
          </CustomText>
        </View>
      </View>
    );
  }

  if (post === null) {
    return (
      <View style={styles.errorContainer}>
        <View style={styles.errorContent}>
          <View style={styles.errorIconContainer}>
            <DocumentIcon size={64} color={BADGE_COLOR} />
          </View>
          <CustomText
            variant="h2"
            fontWeight="bold"
            color="error"
            style={styles.errorTitle}
          >
            Post Not Found
          </CustomText>
          <CustomText
            variant="body1"
            color="muted"
            textAlign="center"
            style={styles.errorDescription}
          >
            This post may have been deleted or you don&apos;t have permission to
            view it.
          </CustomText>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeftIcon size={20} color={PRIMARY_COLOR} />
            <CustomText variant="body1" fontWeight="semibold" color="primary">
              Go Back
            </CustomText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  return (
    <View style={styles.container}>
      <AnimatedLegendList
        ref={flatListRef}
        style={styles.flatList}
        data={comments || []}
        renderItem={({ item }: { item: any }) => renderComment({ item })}
        keyExtractor={(item: any) => (item as any)._id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <CommentListEmptyComponent
            isLoading={isLoadingComments}
            results={comments || []}
            currentUser={currentUser}
          />
        }
        ListFooterComponent={
          <CommentListFooterComponent
            status={commentsStatus}
            results={comments || []}
          />
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={() => {
          if (commentsStatus === "CanLoadMore") {
            loadMore(10);
          }
        }}
        onEndReachedThreshold={0.1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      />
      {id && (
        <CommentInput
          postId={id as Id<"posts">}
          onCommentPosted={handleCommentPosted}
        />
      )}
    </View>
  );
};

export default PostDetailsScreen;

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flatList: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
    gap: theme.gap(1),
  },
  postContainer: {
    marginVertical: theme.gap(2),
  },
  commentsHeader: {
    backgroundColor: theme.colors.surface,
    padding: theme.paddingHorizontal,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey200,
    marginTop: theme.gap(1),
  },
  commentsHeaderContent: {
    gap: 8,
  },
  commentsTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  commentCountBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 32,
    alignItems: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    backgroundColor: theme.colors.background,
  },
  errorContent: {
    alignItems: "center",
    gap: 16,
    maxWidth: 300,
  },
  errorIconContainer: {
    padding: 20,
    backgroundColor: theme.colors.error + "10",
    borderRadius: 50,
  },
  errorTitle: {
    textAlign: "center",
  },
  errorDescription: {
    lineHeight: 22,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: theme.colors.primary + "10",
    borderRadius: 25,
    marginTop: 8,
  },
}));
