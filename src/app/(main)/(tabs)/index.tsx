import PostCard from "@/components/home-screen/PostCard";
import ScrollToTopFab from "@/components/home-screen/ScrollToTopFab";
import { TAB_BAR_HEIGHT } from "@/components/tabs/CustomTabBar";
import CustomText from "@/components/ui/CustomText";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { LegendListRef, LegendListRenderItemProps } from "@legendapp/list";
import { AnimatedLegendList } from "@legendapp/list/animated";
import { usePaginatedQuery } from "convex/react";
import React, { FC, useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { ActivityIndicator, RefreshControl, View } from "react-native";
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

  const { results, status, isLoading, loadMore } = usePaginatedQuery(
    api.posts.getPaginatedPosts,
    {},
    { initialNumItems: 10 }
  );

  const [refreshing, setRefreshing] = useState(false);

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
    LegendListRenderItemProps<EnrichedPost, string | undefined>
  > = ({ item }) => <PostCard post={item} />;

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
}));
