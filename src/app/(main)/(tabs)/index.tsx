import HomeListHeader from "@/components/home-screen/HomeListHeader";
import PostCard from "@/components/home-screen/PostCard";
import ScrollToTopFab from "@/components/home-screen/ScrollToTopFab";
import StickyHeaderContainer from "@/components/home-screen/StickyHeaderContainer";
import { TAB_BAR_HEIGHT } from "@/components/tabs/CustomTabBar";
import CustomText from "@/components/ui/CustomText";
import { api } from "@/convex/_generated/api";
import { LegendListRef } from "@legendapp/list";
import { AnimatedLegendList } from "@legendapp/list/animated";
import { usePaginatedQuery } from "convex/react";
import React, { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { ActivityIndicator, RefreshControl, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { PRIMARY_COLOR } from "unistyles";
import { TabScrollYContext } from "./_layout";

type HomeScreenProps = {
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

const HomeScreen = ({ onScroll }: HomeScreenProps) => {
  const scrollY = React.useContext(TabScrollYContext);
  const listRef = useRef<LegendListRef>(null);
  const { t } = useTranslation();

  // Fetch paginated posts from backend
  const { results, status, isLoading, loadMore } = usePaginatedQuery(
    api.posts.getPaginatedPosts,
    {},
    { initialNumItems: 10 }
  );

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // The query will automatically refresh
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const scrollHandler = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.value = event.nativeEvent.contentOffset.y;
    if (onScroll) {
      onScroll(event);
    }
  };

  const scrollToTop = () => {
    if (listRef.current) {
      listRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    try {
      return (
        <PostCard
          post={item}
          onPress={() => {
            // TODO: Navigate to post details screen
            console.log("Tapped post:", item._id);
          }}
        />
      );
    } catch (error) {
      console.error("Error rendering post item:", error);
      return (
        <View
          style={{
            padding: 16,
            backgroundColor: "#ffebee",
            borderRadius: 8,
            margin: 8,
          }}
        >
          <CustomText variant="caption" color="grey500">
            Error loading post
          </CustomText>
        </View>
      );
    }
  };

  return (
    <>
      <StickyHeaderContainer scrollY={scrollY} />

      <AnimatedLegendList
        ref={listRef}
        columnWrapperStyle={styles.columnWrapperStyle}
        contentContainerStyle={styles.contentContainerStyle}
        showsVerticalScrollIndicator={false}
        style={styles.screen}
        data={results}
        renderItem={renderItem}
        ListHeaderComponent={HomeListHeader}
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
          isLoading ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                paddingVertical: 50,
              }}
            >
              <ActivityIndicator size="large" color={PRIMARY_COLOR} />
              <CustomText
                variant="caption"
                color="grey500"
                style={{ marginTop: 10 }}
              >
                Loading posts...
              </CustomText>
            </View>
          ) : results.length === 0 ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                paddingVertical: 50,
              }}
            >
              <CustomText variant="body1" color="grey500">
                {t("homeScreen.noResults")}
              </CustomText>
              <CustomText
                variant="caption"
                color="grey400"
                style={{ marginTop: 5 }}
              >
                Be the first to share something!
              </CustomText>
            </View>
          ) : null
        }
        ListFooterComponent={
          status === "LoadingMore" ? (
            <View style={{ paddingVertical: 20, alignItems: "center" }}>
              <ActivityIndicator size="small" color={PRIMARY_COLOR} />
            </View>
          ) : status === "Exhausted" && results.length > 0 ? (
            <View style={{ paddingVertical: 20, alignItems: "center" }}>
              <CustomText variant="caption" color="grey500">
                {t("homeScreen.exhausted")}
              </CustomText>
            </View>
          ) : null
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
    paddingHorizontal: theme.paddingHorizontal,
    backgroundColor: theme.colors.background,
  },

  contentContainerStyle: {
    flexGrow: 1,
    gap: theme.gap(2),
    paddingBottom: rt.insets.bottom + TAB_BAR_HEIGHT + 25,
  },
  columnWrapperStyle: {
    gap: theme.gap(1),
  },
}));
