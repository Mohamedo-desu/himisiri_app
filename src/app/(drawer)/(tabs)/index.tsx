import ListEmptyComponent from "@/components/home-screen/ListEmptyComponent";
import ListFooterComponent from "@/components/home-screen/ListFooterComponent";
import PostCard from "@/components/home-screen/PostCard";
import ScrollToTopFab from "@/components/home-screen/ScrollToTopFab";
import { TAB_BAR_HEIGHT } from "@/components/tabs/CustomTabBar";
import { api } from "@/convex/_generated/api";
import { useUserStore } from "@/store/useUserStore";
import { EnrichedPost } from "@/types";
import { LegendListRef, LegendListRenderItemProps } from "@legendapp/list";
import { AnimatedLegendList } from "@legendapp/list/animated";
import { useMutation, usePaginatedQuery } from "convex/react";
import React, { FC, useCallback, useEffect, useRef, useState } from "react";
import type {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ViewToken,
} from "react-native";
import { RefreshControl } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { PRIMARY_COLOR } from "unistyles";
import { TabScrollYContext } from "./_layout";

const HomeScreen = () => {
  const scrollY = React.useContext(TabScrollYContext);
  const listRef = useRef<LegendListRef>(null);
  const { currentUser } = useUserStore();
  const [refreshing, setRefreshing] = useState(false);
  const [viewedPosts, setViewedPosts] = useState<Set<string>>(new Set());
  const [viewTimers, setViewTimers] = useState<Map<string, NodeJS.Timeout>>(
    new Map()
  );

  const [processingViews, setProcessingViews] = useState<Set<string>>(
    new Set()
  );

  const { results, status, isLoading, loadMore } = usePaginatedQuery(
    api.posts.getPaginatedPosts,
    { includeViewed: true },
    { initialNumItems: 10 }
  );

  const markPostAsViewed = useMutation(api.postViews.markPostAsViewed);

  // Handle viewport changes for posts
  const handleViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (!currentUser) {
        return;
      }

      viewableItems.forEach((viewableItem) => {
        const post = viewableItem.item as EnrichedPost;
        const postId = post._id.toString();

        // Skip if already viewed, processing, or if it's the user's own post
        if (
          viewedPosts.has(postId) ||
          processingViews.has(postId) ||
          post.authorId === currentUser._id
        ) {
          return;
        }

        // Check if item is actually visible (50% threshold)
        if (!viewableItem.isViewable) {
          return;
        }

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
            setProcessingViews((prev) => {
              const newSet = new Set(prev);
              newSet.delete(postId);
              return newSet;
            });
            return;
          }

          try {
            const result = await markPostAsViewed({
              postId: post._id,
              viewDuration: 2000, // 2 seconds minimum view time
            });

            if (result?.success) {
              // Mark as viewed locally to prevent re-tracking
              setViewedPosts((prev) => new Set(prev).add(postId));
            } else {
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
    itemVisiblePercentThreshold: 50,
    waitForInteraction: false,
    minimumViewTime: 250,
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

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
      viewTimers.forEach((timer, postId) => {
        clearTimeout(timer);
      });
      setViewTimers(new Map());
      setProcessingViews(new Set());
    };
  }, []);

  useEffect(() => {
    if (!currentUser) {
      viewTimers.forEach((timer) => clearTimeout(timer));
      setViewTimers(new Map());
      setViewedPosts(new Set());
      setProcessingViews(new Set());
    }
  }, [currentUser]);

  return (
    <>
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
        bounces={false}
        directionalLockEnabled
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
    gap: theme.gap(0.5),
    paddingHorizontal: theme.paddingHorizontal,
    paddingBottom: rt.insets.bottom + TAB_BAR_HEIGHT + 25,
    paddingTop: theme.gap(2),
  },
}));
