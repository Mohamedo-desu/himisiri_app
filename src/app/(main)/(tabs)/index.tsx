import ListEmptyComponent from "@/components/home-screen/ListEmptyComponent";
import ListFooterComponent from "@/components/home-screen/ListFooterComponent";
import PostCard from "@/components/home-screen/PostCard";
import ScrollToTopFab from "@/components/home-screen/ScrollToTopFab";
import { TAB_BAR_HEIGHT } from "@/components/tabs/CustomTabBar";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { EnrichedPost } from "@/types";
import { LegendListRef, LegendListRenderItemProps } from "@legendapp/list";
import { AnimatedLegendList } from "@legendapp/list/animated";
import { usePaginatedQuery } from "convex/react";
import React, { FC, useCallback, useRef, useState } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { RefreshControl } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { PRIMARY_COLOR } from "unistyles";
import { TabScrollYContext } from "./_layout";

// Local type matching server response for home screen
type HomeEnrichedPost = Doc<"posts"> & {
  author?: {
    _id: string;
    userName: string;
    imageUrl?: string;
    age?: number;
    gender?: "male" | "female" | "other";
  } | null;
  hasLiked: boolean;
};

const HomeScreen = () => {
  const scrollY = React.useContext(TabScrollYContext);
  const listRef = useRef<LegendListRef>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { results, status, isLoading, loadMore } = usePaginatedQuery(
    api.posts.getPaginatedPosts,
    { visibility: "public" },
    { initialNumItems: 10 }
  );
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const scrollHandler = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.value = event.nativeEvent.contentOffset.y;
  };

  const scrollToTop = () => {
    if (listRef.current) {
      listRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  };

  const renderItem: React.FC<
    LegendListRenderItemProps<HomeEnrichedPost, string | undefined>
  > = ({ item }) => <PostCard post={item as unknown as EnrichedPost} />;

  return (
    <>
      <AnimatedLegendList
        ref={listRef}
        keyExtractor={(item) => (item as HomeEnrichedPost)._id.toString()}
        contentContainerStyle={styles.contentContainerStyle}
        showsVerticalScrollIndicator={false}
        style={styles.screen}
        data={results as unknown as EnrichedPost[]}
        renderItem={
          renderItem as FC<
            LegendListRenderItemProps<unknown, string | undefined>
          >
        }
        onScroll={scrollHandler}
        scrollEventThrottle={8}
        onEndReached={() => loadMore(10)}
        onEndReachedThreshold={0.1}
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
