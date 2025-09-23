import PostCard from "@/components/home-screen/PostCard";
import { api } from "@/convex/_generated/api";
import {
  RecentSearch,
  RecentSearchesService,
} from "@/services/recentSearchesService";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Easing,
  FlatList,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AnimatedNumbers from "react-native-animated-numbers";
import * as IconsOutline from "react-native-heroicons/outline";
import * as IconsSolid from "react-native-heroicons/solid";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

const ExploreScreen = () => {
  const { theme } = useUnistyles();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [timeframe, setTimeframe] = useState<"day" | "week" | "month">("week");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

  // Fetch popular posts with enhanced parameters
  const popularPosts = useQuery(api.posts.getPopularPosts, {
    limit: 10,
    timeframe: timeframe,
  });

  // Fetch trending topics with enhanced parameters
  const trendingTopics = useQuery(api.posts.getTrendingTopics, {
    limit: 6,
    timeframe: timeframe,
  });

  // Fetch trending posts (rapidly gaining engagement)
  const trendingPosts = useQuery(api.posts.getTrendingPosts, {
    limit: 3,
    timeframe: timeframe === "month" ? "week" : timeframe, // Trending posts work better with shorter timeframes
  });

  // Load recent searches on component mount
  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    const searches = await RecentSearchesService.getRecentSearches();
    setRecentSearches(searches);
  };

  // Search functionality
  const handleSearch = async () => {
    if (searchQuery.trim()) {
      // Save to recent searches
      await RecentSearchesService.addRecentSearch(searchQuery.trim());
      // Reload recent searches
      await loadRecentSearches();

      console.log("Search for:", searchQuery.trim());
      // TODO: Navigate to search results
      setIsSearchFocused(false);
    }
  };

  const handleRecentSearchPress = async (search: RecentSearch) => {
    setSearchQuery(search.query);
    setIsSearchFocused(false);

    // Move this search to the top of recent searches
    await RecentSearchesService.addRecentSearch(search.query);
    await loadRecentSearches();

    console.log("Search for recent:", search.query);
    // TODO: Navigate to search results
  };

  const handleRemoveRecentSearch = async (searchId: string) => {
    await RecentSearchesService.removeRecentSearch(searchId);
    await loadRecentSearches();
  };

  const handleClearAllSearches = () => {
    Alert.alert(
      "Clear Search History",
      "Are you sure you want to clear all recent searches?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            await RecentSearchesService.clearAllRecentSearches();
            await loadRecentSearches();
          },
        },
      ]
    );
  };

  const categories = [
    {
      name: "Confessions",
      icon: IconsOutline.ChatBubbleLeftIcon,
      activeIcon: IconsSolid.ChatBubbleLeftIcon,
      color: "#FF6B6B",
      description: "Share your secrets",
    },
    {
      name: "Stories",
      icon: IconsOutline.BookOpenIcon,
      activeIcon: IconsSolid.BookOpenIcon,
      color: "#4ECDC4",
      description: "Life experiences",
    },
    {
      name: "Questions",
      icon: IconsOutline.QuestionMarkCircleIcon,
      activeIcon: IconsSolid.QuestionMarkCircleIcon,
      color: "#45B7D1",
      description: "Ask anything",
    },
    {
      name: "Advice",
      icon: IconsOutline.LightBulbIcon,
      activeIcon: IconsSolid.LightBulbIcon,
      color: "#F7DC6F",
      description: "Get guidance",
    },
    {
      name: "Relationships",
      icon: IconsOutline.HeartIcon,
      activeIcon: IconsSolid.HeartIcon,
      color: "#FF8A80",
      description: "Love & dating",
    },
    {
      name: "Work & Career",
      icon: IconsOutline.BriefcaseIcon,
      activeIcon: IconsSolid.BriefcaseIcon,
      color: "#9575CD",
      description: "Professional life",
    },
  ];

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <IconsOutline.MagnifyingGlassIcon
          size={20}
          color={theme.colors.grey400}
          style={styles.searchIcon}
        />
        <TextInput
          placeholder="Search confessions, topics..."
          placeholderTextColor={theme.colors.grey400}
          style={[styles.searchInput, { color: theme.colors.onBackground }]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <IconsOutline.XMarkIcon size={18} color={theme.colors.grey400} />
          </TouchableOpacity>
        )}
      </View>

      {/* Recent Searches */}
      {isSearchFocused && recentSearches.length > 0 && (
        <View style={styles.recentSearchesContainer}>
          <View style={styles.recentSearchesHeader}>
            <Text
              style={[
                styles.recentSearchesTitle,
                { color: theme.colors.onBackground },
              ]}
            >
              Recent Searches
            </Text>
            <TouchableOpacity onPress={handleClearAllSearches}>
              <Text
                style={[styles.clearAllText, { color: theme.colors.primary }]}
              >
                Clear All
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.recentSearchesList}>
            {recentSearches.map((search) => (
              <TouchableOpacity
                key={search.id}
                style={[
                  styles.recentSearchItem,
                  { backgroundColor: theme.colors.surface },
                ]}
                onPress={() => handleRecentSearchPress(search)}
              >
                <View style={styles.recentSearchContent}>
                  <IconsOutline.ClockIcon
                    size={16}
                    color={theme.colors.grey400}
                  />
                  <Text
                    style={[
                      styles.recentSearchText,
                      { color: theme.colors.onBackground },
                    ]}
                    numberOfLines={1}
                  >
                    {search.query}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleRemoveRecentSearch(search.id)}
                  style={styles.removeSearchButton}
                >
                  <IconsOutline.XMarkIcon
                    size={14}
                    color={theme.colors.grey400}
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Show main content only when search is not focused */}
      {!isSearchFocused && (
        <>
          {/* Trending Topics */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <IconsSolid.FireIcon size={20} color="#FF6B6B" />
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.colors.onBackground },
                ]}
              >
                Trending Now
              </Text>
            </View>

            {/* Timeframe Selector */}
            <View style={styles.timeframeContainer}>
              {(["day", "week", "month"] as const).map((period) => (
                <TouchableOpacity
                  key={period}
                  style={[
                    styles.timeframeButton,
                    {
                      backgroundColor:
                        timeframe === period
                          ? theme.colors.primary
                          : theme.colors.background,
                      borderColor: theme.colors.primary,
                    },
                  ]}
                  onPress={() => setTimeframe(period)}
                >
                  <Text
                    style={[
                      styles.timeframeText,
                      {
                        color:
                          timeframe === period
                            ? theme.colors.onPrimary
                            : theme.colors.primary,
                      },
                    ]}
                  >
                    {period === "day"
                      ? "Today"
                      : period === "week"
                        ? "This Week"
                        : "This Month"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.topicsContainer}
            >
              {trendingTopics?.length
                ? trendingTopics.map((topic: string, index: number) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.topicChip,
                        { backgroundColor: theme.colors.primary },
                      ]}
                      onPress={() => console.log("Search for topic:", topic)}
                    >
                      <Text
                        style={[
                          styles.topicText,
                          { color: theme.colors.onPrimary },
                        ]}
                      >
                        #{topic}
                      </Text>
                    </TouchableOpacity>
                  ))
                : [
                    "Love",
                    "Work",
                    "Family",
                    "Secrets",
                    "Dreams",
                    "Regrets",
                  ].map((topic, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.topicChip,
                        { backgroundColor: theme.colors.primary },
                      ]}
                      onPress={() => console.log("Search for topic:", topic)}
                    >
                      <Text
                        style={[
                          styles.topicText,
                          { color: theme.colors.onPrimary },
                        ]}
                      >
                        #{topic}
                      </Text>
                    </TouchableOpacity>
                  ))}
            </ScrollView>
          </View>

          {/* Trending Posts */}
          {trendingPosts && trendingPosts.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <IconsSolid.BoltIcon size={20} color="#FF9500" />
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: theme.colors.onBackground },
                  ]}
                >
                  🚀 Trending Posts
                </Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.trendingPostsContainer}
              >
                {trendingPosts.map((post: any, index: number) => (
                  <TouchableOpacity
                    key={post._id}
                    style={[
                      styles.trendingPostCard,
                      { backgroundColor: theme.colors.surface },
                    ]}
                    onPress={() => router.push(`/post/${post._id}`)}
                  >
                    <Text
                      style={[
                        styles.trendingPostContent,
                        { color: theme.colors.onSurface },
                      ]}
                      numberOfLines={3}
                    >
                      {post.content}
                    </Text>
                    <View style={styles.trendingPostMeta}>
                      <View style={styles.trendingPostStats}>
                        <IconsSolid.HeartIcon size={12} color="#FF6B6B" />
                        <AnimatedNumbers
                          includeComma
                          animateToNumber={post.likesCount || 0}
                          fontStyle={[
                            styles.trendingPostStat,
                            { color: theme.colors.grey500 },
                          ]}
                          easing={Easing.out(Easing.cubic)}
                        />
                        <IconsSolid.ChatBubbleLeftIcon
                          size={12}
                          color="#4ECDC4"
                        />
                        <Text
                          style={[
                            styles.trendingPostStat,
                            { color: theme.colors.grey500 },
                          ]}
                        >
                          Hot
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Categories */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <IconsSolid.Squares2X2Icon
                size={20}
                color={theme.colors.primary}
              />
              <Text
                style={[
                  styles.sectionTitle,
                  { color: theme.colors.onBackground },
                ]}
              >
                Explore Categories
              </Text>
            </View>

            <View style={styles.categoriesGrid}>
              {categories.map((category, index) => {
                const IconComponent =
                  selectedCategory === category.name
                    ? category.activeIcon
                    : category.icon;
                const isSelected = selectedCategory === category.name;

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.categoryCard,
                      { backgroundColor: theme.colors.surface },
                      isSelected && {
                        backgroundColor: category.color + "20",
                        borderColor: category.color,
                        borderWidth: 2,
                      },
                    ]}
                    onPress={() => {
                      setSelectedCategory(isSelected ? null : category.name);
                      console.log("Selected category:", category.name);
                    }}
                  >
                    <View
                      style={[
                        styles.categoryIconContainer,
                        { backgroundColor: category.color + "20" },
                      ]}
                    >
                      <IconComponent size={24} color={category.color} />
                    </View>
                    <Text
                      style={[
                        styles.categoryName,
                        { color: theme.colors.onBackground },
                      ]}
                    >
                      {category.name}
                    </Text>
                    <Text
                      style={[
                        styles.categoryDescription,
                        { color: theme.colors.grey500 },
                      ]}
                    >
                      {category.description}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Popular Posts Header */}
          <View style={styles.sectionHeader}>
            <IconsSolid.TrophyIcon size={20} color="#FFD700" />
            <Text
              style={[
                styles.sectionTitle,
                { color: theme.colors.onBackground },
              ]}
            >
              Popular{" "}
              {timeframe === "day"
                ? "Today"
                : timeframe === "week"
                  ? "This Week"
                  : "This Month"}
            </Text>
          </View>
        </>
      )}
    </View>
  );

  const renderPost = ({ item }: { item: any }) => <PostCard post={item} />;

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <IconsOutline.DocumentTextIcon size={48} color={theme.colors.grey400} />
      <Text style={[styles.emptyTitle, { color: theme.colors.onBackground }]}>
        No posts found
      </Text>
      <Text style={[styles.emptyDescription, { color: theme.colors.grey500 }]}>
        Be the first to share something interesting!
      </Text>
    </View>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingState}>
      <ActivityIndicator size="large" color={theme.colors.primary} />
      <Text style={[styles.loadingText, { color: theme.colors.grey500 }]}>
        Loading popular posts...
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <FlatList
        data={popularPosts || []}
        renderItem={renderPost}
        keyExtractor={(item) => item._id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          popularPosts === undefined ? renderLoadingState : renderEmptyState
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
};

export default ExploreScreen;

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  headerContainer: {
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 24,
    shadowColor: theme.colors.grey500,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 8,
  },
  topicsContainer: {
    marginBottom: 8,
  },
  topicChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    marginRight: 12,
    shadowColor: theme.colors.grey500,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  topicText: {
    fontWeight: "600",
    fontSize: 14,
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  categoryCard: {
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    width: "48%",
    minHeight: 120,
    shadowColor: theme.colors.grey500,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  categoryName: {
    fontWeight: "600",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 4,
  },
  categoryDescription: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
  },
  separator: {
    height: 16,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  loadingState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  timeframeContainer: {
    flexDirection: "row",
    marginVertical: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 4,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    marginHorizontal: 2,
  },
  timeframeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  trendingPostsContainer: {
    marginTop: 12,
  },
  trendingPostCard: {
    width: 200,
    padding: 12,
    borderRadius: 12,
    marginRight: 12,
    borderWidth: 1,
    borderColor: theme.colors.grey200,
  },
  trendingPostContent: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  trendingPostMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  trendingPostStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  trendingPostStat: {
    fontSize: 11,
    fontWeight: "500",
  },
  recentSearchesContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    marginBottom: 20,
    shadowColor: theme.colors.grey500,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recentSearchesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey200,
  },
  recentSearchesTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: "500",
  },
  recentSearchesList: {
    gap: 6,
  },
  recentSearchItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.grey200,
    backgroundColor: theme.colors.background,
  },
  recentSearchContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  recentSearchText: {
    fontSize: 15,
    flex: 1,
    fontWeight: "400",
  },
  removeSearchButton: {
    padding: 4,
    marginLeft: 8,
  },
}));
