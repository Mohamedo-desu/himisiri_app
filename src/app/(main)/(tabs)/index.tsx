import HomeListHeader from "@/components/home-screen/HomeListHeader";
import ScrollToTopFab from "@/components/home-screen/ScrollToTopFab";
import StickyHeaderContainer from "@/components/home-screen/StickyHeaderContainer";
import { TAB_BAR_HEIGHT } from "@/components/tabs/CustomTabBar";
import CustomText from "@/components/ui/CustomText";
import { LegendListRef } from "@legendapp/list";
import { AnimatedLegendList } from "@legendapp/list/animated";
import React, { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";
import { ActivityIndicator, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";
import { PRIMARY_COLOR } from "unistyles";
import { TabScrollYContext } from "./_layout";

type HomeScreenProps = {
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

const DATA = [];

const HomeScreen = ({ onScroll }: HomeScreenProps) => {
  const scrollY = React.useContext(TabScrollYContext);
  const listRef = useRef<LegendListRef>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState([]);

  const [status, setStatus] = useState<"Idle" | "LoadingMore" | "Exhausted">(
    "Idle"
  );
  const { t } = useTranslation();

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
    return (
      <View
        style={{
          flex: 1,
          height: 100,
          backgroundColor: "#ccc",
          justifyContent: "center",
          alignItems: "center",
        }}
      />
    );
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
        data={DATA}
        renderItem={renderItem}
        ListHeaderComponent={HomeListHeader}
        onScroll={scrollHandler}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator size="small" color={PRIMARY_COLOR} />
          ) : !isLoading && results.length === 0 ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <CustomText variant="caption" color="grey500">
                {t("homeScreen.noResults")}
              </CustomText>
            </View>
          ) : null
        }
        ListFooterComponent={
          status === "LoadingMore" ? (
            <ActivityIndicator size="small" color={PRIMARY_COLOR} />
          ) : status === "Exhausted" && results.length !== 0 ? (
            <CustomText> {t("homeScreen.exhausted")}</CustomText>
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
