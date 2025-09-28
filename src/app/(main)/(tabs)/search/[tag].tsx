import ListEmptyComponent from "@/components/home-screen/ListEmptyComponent";
import ListFooterComponent from "@/components/home-screen/ListFooterComponent";
import PostCard from "@/components/home-screen/PostCard";
import CustomText from "@/components/ui/CustomText";
import { api } from "@/convex/_generated/api";
import {
  deleteFromLocalStorage,
  getFromLocalStorage,
  saveToLocalStorage,
} from "@/store/storage";
import { EnrichedPost } from "@/types";
import { LegendListRenderItemProps } from "@legendapp/list";
import { AnimatedLegendList } from "@legendapp/list/animated";
import { usePaginatedQuery } from "convex/react";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { FlatList, TextInput, TouchableOpacity, View } from "react-native";
import * as IconsOutline from "react-native-heroicons/outline";
import { StyleSheet, withUnistyles } from "react-native-unistyles";

const ThemedClearIcon = withUnistyles(IconsOutline.XMarkIcon, (theme) => ({
  size: 20,
  color: theme.colors.grey500,
}));
const ThemedSearchIcon = withUnistyles(
  IconsOutline.MagnifyingGlassIcon,
  (theme) => ({
    size: 20,
    color: theme.colors.grey500,
  })
);

const RECENT_KEY = "recent_searches";

const SearchScreen = () => {
  const { tag } = useLocalSearchParams();

  // Always prepend "#" to initial tag
  const initialTag = useMemo(() => (tag ? `#${tag}` : "#"), [tag]);
  const [inputValue, setInputValue] = useState(initialTag);
  const [debouncedQuery, setDebouncedQuery] = useState(initialTag);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches
  useEffect(() => {
    const { recentSearches } = getFromLocalStorage([RECENT_KEY]);
    if (recentSearches) setRecentSearches(JSON.parse(recentSearches));
  }, []);

  // Save search to recents
  useEffect(() => {
    if (debouncedQuery && debouncedQuery !== "#") {
      setRecentSearches((prev) => {
        const next = [
          debouncedQuery,
          ...prev.filter((t) => t !== debouncedQuery),
        ].slice(0, 5);

        saveToLocalStorage([{ key: RECENT_KEY, value: JSON.stringify(next) }]);
        return next;
      });
    }
  }, [debouncedQuery]);

  // Debounce search
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(inputValue.trim());
    }, 400);
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [inputValue]);

  const handleClear = () => setInputValue("#");

  const handleQueryChange = (text: string) => {
    // Always enforce "#" prefix
    if (!text.startsWith("#")) {
      setInputValue(`#${text}`);
    } else {
      setInputValue(text);
    }
  };

  const handleClearRecents = async () => {
    setRecentSearches([]);
    deleteFromLocalStorage([RECENT_KEY]);
  };

  return (
    <View style={styles.screen}>
      {/* Search input */}
      <View style={styles.inputWrapper}>
        <ThemedSearchIcon style={styles.leftIcon} />
        <TextInput
          value={inputValue}
          onChangeText={handleQueryChange}
          placeholder="#Search by tag"
          placeholderTextColor={"gray"}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {inputValue.trim().length > 1 && (
          <TouchableOpacity onPress={handleClear} hitSlop={10}>
            <ThemedClearIcon style={styles.rightIcon} />
          </TouchableOpacity>
        )}
      </View>

      {/* Results */}
      <Results
        query={debouncedQuery}
        recentSearches={recentSearches}
        onClearRecents={handleClearRecents}
        onSelectRecent={setInputValue}
      />
    </View>
  );
};

const Results = ({
  query,
  recentSearches,
  onClearRecents,
  onSelectRecent,
}: {
  query: string;
  recentSearches: string[];
  onClearRecents: () => void;
  onSelectRecent: (tag: string) => void;
}) => {
  const { results, loadMore, status, isLoading } = usePaginatedQuery(
    api.posts.searchByTag,
    { tag: query },
    { initialNumItems: 10 }
  );

  const renderItem = ({ item }: LegendListRenderItemProps<EnrichedPost>) => (
    <PostCard post={item as EnrichedPost} />
  );

  if (!query || query === "#") {
    // Show recent searches
    if (recentSearches.length === 0) return null;
    return (
      <View style={{ padding: 16 }}>
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <CustomText variant="subtitle2">Recent searches</CustomText>
          <TouchableOpacity onPress={onClearRecents}>
            <CustomText variant="body2" color="primary">
              Clear all
            </CustomText>
          </TouchableOpacity>
        </View>
        <FlatList
          data={recentSearches}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={{ paddingVertical: 8 }}
              onPress={() => onSelectRecent(item)}
            >
              <CustomText variant="body2">{item}</CustomText>
            </TouchableOpacity>
          )}
        />
      </View>
    );
  }

  return (
    <AnimatedLegendList
      data={results}
      keyExtractor={(item) => (item as EnrichedPost)._id.toString()}
      renderItem={renderItem as any}
      contentContainerStyle={{ padding: 16, gap: 8 }}
      onEndReached={() => loadMore(10)}
      onEndReachedThreshold={0.1}
      ListEmptyComponent={
        <ListEmptyComponent
          isLoading={isLoading}
          results={results as EnrichedPost[]}
          customMessage={
            results.length === 0 && !isLoading
              ? `No results for "${query}"`
              : undefined
          }
          customSubMessage={
            results.length === 0 && !isLoading
              ? "Try searching for a different tag"
              : undefined
          }
        />
      }
      ListFooterComponent={
        <ListFooterComponent
          status={status}
          results={results as EnrichedPost[]}
        />
      }
    />
  );
};

export default SearchScreen;

const styles = StyleSheet.create((theme) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    margin: theme.gap(2),
    paddingHorizontal: theme.gap(1.5),
    paddingVertical: theme.gap(2),
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.regular,
    borderWidth: 1,
    borderColor: theme.colors.grey200,
  },
  leftIcon: {
    marginRight: theme.gap(1),
  },
  rightIcon: {
    marginLeft: theme.gap(1),
  },
  input: {
    flex: 1,
    color: theme.colors.onBackground,
    paddingVertical: theme.gap(0.5),
  },
}));
