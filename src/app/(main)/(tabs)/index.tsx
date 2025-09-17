import { TAB_BAR_HEIGHT } from "@/components/CustomTabBar";
import Empty from "@/components/Empty";
import ScrollToTopFab from "@/components/ScrollToTopFab";
import HomeListHeader from "@/components/home-screen/HomeListHeader";
import StickyHeaderContainer from "@/components/home-screen/StickyHeaderContainer";
import PropertyCard from "@/components/ui/PropertyCard";
import { api } from "@/convex/_generated/api";
import { usePropertyStore } from "@/store/usePropertyStore";
import { useUserStore } from "@/store/useUserStore";
import { useMutation, usePaginatedQuery } from "convex/react";
import React, { useEffect, useRef } from "react";
import type { FlatList, ViewToken } from "react-native";
import { ActivityIndicator, View } from "react-native";
import Animated, {
  LinearTransition,
  useAnimatedScrollHandler,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";
import { PRIMARY_COLOR } from "unistyles";
import { TabScrollYContext } from "./_layout";

// Set HEADER_HEIGHT to the total height of your header (location card + filter + sort)
const HEADER_HEIGHT = 200; // Adjust this value to match your actual header height
const STICKY_HEIGHT = 56; // Adjust to your sticky bar's height

const HomeScreen = () => {
  const scrollY = React.useContext(TabScrollYContext);
  const listRef = useRef<FlatList<any>>(null);
  const hasInitializedLocation = useRef(false);

  const filters = usePropertyStore((s) => s.filters);
  const searchedProperties = usePropertyStore((s) => s.searchedProperties);
  const setSearchedProperties = usePropertyStore(
    (s) => s.setSearchedProperties
  );

  const { results, status, loadMore, isLoading } = usePaginatedQuery(
    api.properties.searchProperties,
    { ...filters },
    { initialNumItems: 10 }
  );

  const initializeFiltersWithUserLocation = usePropertyStore(
    (s) => s.initializeFiltersWithUserLocation
  );

  const currentUser = useUserStore((state) => state.currentUser);

  // Track property views when they become visible
  const trackPropertyView = useMutation(api.properties.trackPropertyView);
  const viewedProperties = useRef(new Set<string>());

  // Track property views when items become visible on screen
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      viewableItems.forEach((viewableItem) => {
        const propertyId = viewableItem.item?._id;
        if (propertyId && !viewedProperties.current.has(propertyId)) {
          viewedProperties.current.add(propertyId);
          trackPropertyView({ propertyId });
        }
      });
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50, // Item needs to be at least 50% visible
    waitForInteraction: false,
  }).current;

  const renderItem = ({ item }: { item: any }) => <PropertyCard item={item} />;

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const scrollToTop = () => {
    if (listRef.current) {
      listRef.current.scrollToOffset({ offset: 0, animated: true });
    }
  };

  // Initialize filters with user location when user data is available (only once)
  useEffect(() => {
    if (currentUser?.location && !hasInitializedLocation.current) {
      hasInitializedLocation.current = true;
      initializeFiltersWithUserLocation();
    }
  }, [currentUser, initializeFiltersWithUserLocation]);

  useEffect(() => {
    setSearchedProperties(results);
  }, [results]);

  return (
    <>
      <View style={styles.statusBg} />
      <StickyHeaderContainer
        scrollY={scrollY}
        headerHeight={HEADER_HEIGHT}
        stickyHeight={STICKY_HEIGHT}
      />

      <Animated.FlatList
        ref={listRef}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapperStyle}
        contentContainerStyle={styles.contentContainerStyle}
        showsVerticalScrollIndicator={false}
        style={styles.screen}
        data={searchedProperties}
        renderItem={renderItem}
        ListHeaderComponent={HomeListHeader}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onEndReachedThreshold={0.5}
        onEndReached={() => loadMore(10)}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="small" color={PRIMARY_COLOR} />
          ) : !isLoading && results.length === 0 ? (
            <Empty text="No properties found. Try adjusting your filters or search criteria." />
          ) : null
        }
        ListFooterComponent={
          status === "LoadingMore" ? (
            <ActivityIndicator size="small" color={PRIMARY_COLOR} />
          ) : status === "Exhausted" && results.length !== 0 ? (
            <Empty text="You've reached the end of the list." />
          ) : null
        }
        itemLayoutAnimation={LinearTransition}
      />

      <ScrollToTopFab onPress={scrollToTop} scrollY={scrollY} />
    </>
  );
};

export default HomeScreen;

const styles = StyleSheet.create((theme, rt) => ({
  screen: {
    flex: 1,
    paddingTop: rt.insets.top,
    paddingHorizontal: theme.paddingHorizontal,
    backgroundColor: theme.colors.background,
  },

  contentContainerStyle: {
    flexGrow: 1,
    gap: theme.gap(0.5),
    paddingBottom: rt.insets.bottom + TAB_BAR_HEIGHT + 25,
  },
  columnWrapperStyle: {
    gap: theme.gap(0.5),
  },
  statusBg: {
    position: "absolute",
    top: 0,
    zIndex: 1000,
    backgroundColor: theme.colors.primary,
    height: rt.insets.top,
    width: "100%",
  },
}));
