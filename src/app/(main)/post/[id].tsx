import PostCard from "@/components/home-screen/PostCard";
import CommentCard from "@/components/post-details/CommentCard";
import CommentInput from "@/components/post-details/CommentInput";
import CustomText from "@/components/ui/CustomText";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUserStore } from "@/store/useUserStore";
import { Ionicons } from "@expo/vector-icons";
import { usePaginatedQuery, useQuery } from "convex/react";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Easing,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  View,
} from "react-native";
import AnimatedNumbers from "react-native-animated-numbers";
import { StyleSheet } from "react-native-unistyles";

const PostDetailsScreen = () => {
  const { id, highlight, type } = useLocalSearchParams<{
    id: string;
    highlight?: string;
    type?: string;
  }>();
  const router = useRouter();
  const { currentUser } = useUserStore();
  const [refreshing, setRefreshing] = useState(false);
  const [highlightedCommentId, setHighlightedCommentId] = useState<
    string | null
  >(highlight || null);
  const flatListRef = useRef<FlatList>(null);

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
      // Find the index of the comment to highlight
      const commentIndex = comments.findIndex(
        (comment) => comment._id === highlightedCommentId
      );

      if (commentIndex !== -1) {
        // Scroll to the comment after a small delay to ensure rendering is complete
        setTimeout(() => {
          try {
            flatListRef.current?.scrollToIndex({
              index: commentIndex,
              viewPosition: 0.3, // Position comment at 30% from top
              animated: true,
            });
          } catch (error) {
            // Fallback to scrollToOffset if scrollToIndex fails
            const estimatedOffset = commentIndex * 120; // Approximate comment height
            flatListRef.current?.scrollToOffset({
              offset: estimatedOffset,
              animated: true,
            });
          }
        }, 500);

        // Clear the highlight after 3 seconds
        setTimeout(() => {
          setHighlightedCommentId(null);
        }, 3000);
      }
    }
  }, [highlightedCommentId, comments]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // The queries will automatically refetch when we trigger a refresh
    // We can simulate this by setting refreshing to false after a short delay
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleCommentPosted = useCallback(() => {
    // The comments query will automatically refetch due to Convex reactivity
    // Scroll to bottom to show the new comment
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, []);

  const handleCommentPress = useCallback((commentId: string) => {
    // Navigate to comment details or replies page
    // For now, we'll just show an alert
    Alert.alert(
      "Feature Coming Soon",
      "Comment details feature is coming soon!"
    );
  }, []);

  const renderComment = useCallback(
    ({ item: comment }: { item: any }) => (
      <CommentCard
        comment={comment}
        postId={id}
        onPress={() => handleCommentPress(comment._id)}
        isHighlighted={highlightedCommentId === comment._id}
      />
    ),
    [handleCommentPress, highlightedCommentId, id]
  );

  const renderFooter = useCallback(() => {
    if (commentsStatus !== "CanLoadMore") return null;

    return (
      <View style={styles.loadMoreContainer}>
        <ActivityIndicator size="small" color="#666" />
        <CustomText variant="caption" color="muted" style={styles.loadMoreText}>
          Loading more comments...
        </CustomText>
      </View>
    );
  }, [commentsStatus]);

  const renderEmpty = useCallback(() => {
    if (isLoadingComments) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <CustomText variant="body1" color="muted" style={styles.loadingText}>
            Loading comments...
          </CustomText>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="chatbubbles-outline" size={48} color="#ccc" />
        <CustomText variant="h3" color="muted" style={styles.emptyTitle}>
          No Comments Yet
        </CustomText>
        <CustomText variant="body1" color="muted" textAlign="center">
          {currentUser
            ? "Be the first to share your thoughts on this post!"
            : "Sign in to share your thoughts on this post!"}
        </CustomText>
      </View>
    );
  }, [isLoadingComments, currentUser]);

  const renderHeader = useCallback(() => {
    if (!post) return null;

    return (
      <View style={styles.postContainer}>
        <PostCard post={post} showFullContent={true} />
        <View style={styles.commentsHeader}>
          <CustomText variant="h3" fontWeight="semibold" color="onBackground">
            Comments
          </CustomText>
          <CustomText variant="caption" color="muted">
            <AnimatedNumbers
              includeComma
              animateToNumber={comments?.length || 0}
              fontStyle={{ fontSize: 14, color: "#666" }}
              easing={Easing.out(Easing.cubic)}
            />{" "}
            comments
          </CustomText>
        </View>
      </View>
    );
  }, [post, comments]);

  if (!id) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#FF6B6B" />
        <CustomText variant="h3" color="error">
          Invalid Post
        </CustomText>
        <CustomText variant="body1" color="muted" textAlign="center">
          The requested post could not be found.
        </CustomText>
      </View>
    );
  }

  if (post === undefined) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <CustomText variant="body1" color="muted" style={styles.loadingText}>
          Loading post...
        </CustomText>
      </View>
    );
  }

  if (post === null) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="document-outline" size={48} color="#FF6B6B" />
        <CustomText variant="h3" color="error">
          Post Not Found
        </CustomText>
        <CustomText variant="body1" color="muted" textAlign="center">
          This post may have been deleted or you don't have permission to view
          it.
        </CustomText>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        style={styles.flatList}
        data={comments || []}
        renderItem={renderComment}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
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
    </KeyboardAvoidingView>
  );
};

export default PostDetailsScreen;

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingBottom: 20,
  },
  flatList: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  postContainer: {
    marginVertical: 20,
  },
  commentsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey300,
    backgroundColor: theme.colors.surface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: theme.colors.background,
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    marginTop: 40,
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
  },
  loadMoreContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  loadMoreText: {
    marginLeft: 8,
  },
}));
