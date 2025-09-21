import PostCard from "@/components/home-screen/PostCard";
import ScrollToTopFab from "@/components/home-screen/ScrollToTopFab";
import { TAB_BAR_HEIGHT } from "@/components/tabs/CustomTabBar";
import CustomText from "@/components/ui/CustomText";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { useUserStore } from "@/store/useUserStore";
import { LegendListRef, LegendListRenderItemProps } from "@legendapp/list";
import { AnimatedLegendList } from "@legendapp/list/animated";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import React, { FC, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ViewToken,
} from "react-native";
import {
  ActivityIndicator,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { PRIMARY_COLOR } from "unistyles";
import { TabScrollYContext } from "./_layout";

// Type for enriched post data from getPaginatedPosts
type EnrichedPost = Doc<"posts"> & {
  author?: {
    _id: string;
    userName: string;
    imageUrl?: string;
  } | null;
  hasLiked: boolean;
};

const ListFooterComponent = ({
  status,
  results,
}: {
  status: string;
  results: EnrichedPost[];
}) => {
  const { t } = useTranslation();

  return status === "LoadingMore" ? (
    <View style={styles.listEmptyComponent}>
      <ActivityIndicator size="small" color={PRIMARY_COLOR} />
    </View>
  ) : status === "Exhausted" && results.length > 0 ? (
    <View style={styles.listEmptyComponent}>
      <CustomText variant="caption" color="grey500">
        {t("homeScreen.exhausted")}
      </CustomText>
    </View>
  ) : null;
};
const ListEmptyComponent = ({
  isLoading,
  results,
}: {
  isLoading: boolean;
  results: EnrichedPost[];
}) => {
  const { t } = useTranslation();

  return isLoading ? (
    <View style={styles.listEmptyComponent}>
      <ActivityIndicator size="small" color={PRIMARY_COLOR} />
      <CustomText variant="caption" color="grey500" style={{ marginTop: 10 }}>
        Loading posts...
      </CustomText>
    </View>
  ) : results.length === 0 ? (
    <View style={styles.listEmptyComponent}>
      <CustomText variant="body1" color="grey500">
        {t("homeScreen.noResults")}
      </CustomText>
      <CustomText variant="caption" color="grey400" style={{ marginTop: 5 }}>
        Be the first to share something!
      </CustomText>
    </View>
  ) : null;
};

const HomeScreen = () => {
  const scrollY = React.useContext(TabScrollYContext);
  const listRef = useRef<LegendListRef>(null);
  const { currentUser } = useUserStore();

  const [refreshing, setRefreshing] = useState(false);
  const [viewedPosts, setViewedPosts] = useState<Set<string>>(new Set());
  const [viewTimers, setViewTimers] = useState<Map<string, NodeJS.Timeout>>(
    new Map()
  );
  const [includeViewedPosts, setIncludeViewedPosts] = useState(false);
  const [lastResponseMetadata, setLastResponseMetadata] = useState<any>(null);
  const [processingViews, setProcessingViews] = useState<Set<string>>(
    new Set()
  );

  const { results, status, isLoading, loadMore } = usePaginatedQuery(
    api.posts.getPaginatedPosts,
    { includeViewed: includeViewedPosts },
    { initialNumItems: 10 }
  );

  const markPostAsViewed = useMutation(api.postViews.markPostAsViewed);

  // Check if non-viewed posts are available (only if authenticated)
  const nonViewedPostsQuery = useQuery(
    api.posts.hasNonViewedPosts,
    currentUser ? {} : "skip"
  );

  // Auto-switch to include viewed posts if no non-viewed posts available
  useEffect(() => {
    if (currentUser && nonViewedPostsQuery) {
      if (!nonViewedPostsQuery.hasNonViewedPosts && !includeViewedPosts) {
        console.log(
          "No non-viewed posts available, switching to include viewed posts"
        );
        setIncludeViewedPosts(true);
      }
    }
  }, [currentUser, nonViewedPostsQuery, includeViewedPosts]);

  // Log metadata when results change
  useEffect(() => {
    if (results && (results as any).metadata) {
      const metadata = (results as any).metadata;
      setLastResponseMetadata(metadata);
      console.log("Posts query metadata:", metadata);
    }
  }, [results]);

  // Handle viewport changes for posts
  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (!currentUser) {
        console.log("No current user, skipping view tracking");
        return;
      }

      console.log(`Processing ${viewableItems.length} viewable items`);

      viewableItems.forEach((viewableItem) => {
        const post = viewableItem.item as EnrichedPost;
        const postId = post._id.toString();

        // Skip if already viewed, processing, or if it's the user's own post
        if (
          viewedPosts.has(postId) ||
          processingViews.has(postId) ||
          post.authorId === currentUser._id
        ) {
          console.log(
            `Skipping post ${postId} - already processed or own post`
          );
          return;
        }

        // Check if item is actually visible (50% threshold)
        if (!viewableItem.isViewable) {
          console.log(`Post ${postId} not properly viewable, skipping`);
          return;
        }

        console.log(`Starting view timer for post ${postId}`);

        // Clear existing timer if any
        const existingTimer = viewTimers.get(postId);
        if (existingTimer) {
          clearTimeout(existingTimer);
          setViewTimers((prev) => {
            const newMap = new Map(prev);
            newMap.delete(postId);
            return newMap;
          });
        }

        // Mark as processing to prevent duplicate timers
        setProcessingViews((prev) => new Set(prev).add(postId));

        // Set new timer for 2 seconds
        const timer = setTimeout(async () => {
          // Double-check conditions before marking as viewed
          if (viewedPosts.has(postId)) {
            console.log(`Post ${postId} already marked as viewed, skipping`);
            setProcessingViews((prev) => {
              const newSet = new Set(prev);
              newSet.delete(postId);
              return newSet;
            });
            return;
          }

          console.log(
            `Marking post ${postId} as viewed by user ${currentUser._id}`
          );

          try {
            const result = await markPostAsViewed({
              postId: post._id,
              viewDuration: 2000, // 2 seconds minimum view time
            });

            if (result?.success) {
              // Mark as viewed locally to prevent re-tracking
              setViewedPosts((prev) => new Set(prev).add(postId));
              console.log(`Post view tracking successful: ${postId}`, result);
            } else {
              console.log(
                `Post view tracking failed or skipped: ${postId}`,
                result
              );
            }
          } catch (error) {
            console.error(`Failed to mark post ${postId} as viewed:`, error);
          } finally {
            // Clean up processing state and timer
            setProcessingViews((prev) => {
              const newSet = new Set(prev);
              newSet.delete(postId);
              return newSet;
            });
            setViewTimers((prev) => {
              const newMap = new Map(prev);
              newMap.delete(postId);
              return newMap;
            });
          }
        }, 2000);

        // Store timer
        setViewTimers((prev) => new Map(prev).set(postId, timer as any));
      });

      // Clean up timers for items that are no longer viewable
      const currentViewableIds = new Set(
        viewableItems
          .filter((item) => item.isViewable)
          .map((item) => (item.item as EnrichedPost)._id.toString())
      );

      setViewTimers((prev) => {
        const newTimers = new Map<string, NodeJS.Timeout>();
        prev.forEach((timer, postId) => {
          if (currentViewableIds.has(postId)) {
            // Keep timer for still-viewable items
            newTimers.set(postId, timer);
          } else {
            // Clear timer for no-longer-viewable items
            console.log(
              `Clearing timer for post ${postId} - no longer viewable`
            );
            clearTimeout(timer);

            // Also remove from processing state
            setProcessingViews((prevProcessing) => {
              const newSet = new Set(prevProcessing);
              newSet.delete(postId);
              return newSet;
            });
          }
        });
        return newTimers;
      });
    },
    [currentUser, viewedPosts, viewTimers, processingViews, markPostAsViewed]
  );

  // Configuration for viewport detection
  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50, // 50% of the item must be visible
    waitForInteraction: false,
    minimumViewTime: 250, // Minimum time to be considered viewable (React Native internal)
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    // Clear view tracking state on refresh to allow re-tracking
    console.log("Refreshing - clearing view tracking state");
    viewTimers.forEach((timer) => clearTimeout(timer));
    setViewTimers(new Map());
    setViewedPosts(new Set());
    setProcessingViews(new Set());

    // Simulate refresh delay
    setTimeout(() => setRefreshing(false), 1000);
  }, [viewTimers]);

  const scrollHandler = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.value = event.nativeEvent.contentOffset.y;
  };

  const scrollToTop = () => {
    if (listRef.current) {
      listRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  };

  const renderItem: React.FC<
    LegendListRenderItemProps<EnrichedPost, string | undefined>
  > = ({ item }) => <PostCard post={item} />;

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      console.log("HomeScreen unmounting, cleaning up view timers");
      viewTimers.forEach((timer, postId) => {
        console.log(`Clearing timer for post ${postId} on unmount`);
        clearTimeout(timer);
      });
      setViewTimers(new Map());
      setProcessingViews(new Set());
    };
  }, []);

  // Clean up timers when user changes (login/logout)
  useEffect(() => {
    if (!currentUser) {
      console.log("User logged out, clearing all view timers");
      viewTimers.forEach((timer) => clearTimeout(timer));
      setViewTimers(new Map());
      setViewedPosts(new Set());
      setProcessingViews(new Set());
    }
  }, [currentUser]);

  return (
    <>
      {/* Strategy Indicator - only show for authenticated users */}
      {currentUser && lastResponseMetadata && (
        <View style={styles.strategyIndicator}>
          <Text style={styles.strategyText}>
            Strategy: {lastResponseMetadata.strategy} | Non-viewed:{" "}
            {lastResponseMetadata.nonViewedPostsCount} | Viewed:{" "}
            {lastResponseMetadata.viewedPostsCount}
          </Text>
          {/* View Tracking Debug Info */}
          {__DEV__ && (
            <Text style={styles.debugText}>
              Tracked: {viewedPosts.size} | Timers: {viewTimers.size} |
              Processing: {processingViews.size}
            </Text>
          )}
          {!includeViewedPosts &&
            lastResponseMetadata.nonViewedPostsCount === 0 && (
              <TouchableOpacity
                style={styles.switchButton}
                onPress={() => setIncludeViewedPosts(true)}
              >
                <Text style={styles.switchButtonText}>Show Viewed Posts</Text>
              </TouchableOpacity>
            )}
          {includeViewedPosts && (
            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => setIncludeViewedPosts(false)}
            >
              <Text style={styles.switchButtonText}>Hide Viewed Posts</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <AnimatedLegendList
        ref={listRef}
        keyExtractor={(item) => (item as EnrichedPost)._id.toString()}
        contentContainerStyle={styles.contentContainerStyle}
        showsVerticalScrollIndicator={false}
        style={styles.screen}
        data={results as EnrichedPost[]}
        renderItem={
          renderItem as FC<
            LegendListRenderItemProps<unknown, string | undefined>
          >
        }
        onScroll={scrollHandler}
        onEndReached={() => loadMore(10)}
        onEndReachedThreshold={0.1}
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[PRIMARY_COLOR]}
            tintColor={PRIMARY_COLOR}
          />
        }
        ListEmptyComponent={
          <ListEmptyComponent isLoading={isLoading} results={results} />
        }
        ListFooterComponent={
          <ListFooterComponent status={status} results={results} />
        }
      />

      <ScrollToTopFab onPress={scrollToTop} scrollY={scrollY} />
    </>
  );
};

export default HomeScreen;

const styles = StyleSheet.create((theme, rt) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  contentContainerStyle: {
    flexGrow: 1,
    gap: theme.gap(1),
    paddingHorizontal: theme.paddingHorizontal,
    paddingBottom: rt.insets.bottom + TAB_BAR_HEIGHT + 25,
    paddingTop: theme.gap(2),
  },

  listEmptyComponent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: theme.gap(2),
  },

  strategyIndicator: {
    backgroundColor: theme.colors.surface,
    padding: theme.gap(2),
    marginHorizontal: theme.paddingHorizontal,
    marginTop: theme.gap(1),
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.grey200,
  },

  strategyText: {
    fontSize: 12,
    color: theme.colors.grey600,
    marginBottom: theme.gap(1),
  },

  debugText: {
    fontSize: 10,
    color: theme.colors.grey500,
    fontFamily: "monospace",
    marginBottom: theme.gap(1),
  },

  switchButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.gap(2),
    paddingVertical: theme.gap(1),
    borderRadius: 6,
    alignSelf: "flex-start",
  },

  switchButtonText: {
    color: theme.colors.onPrimary,
    fontSize: 12,
    fontWeight: "600",
  },
}));
