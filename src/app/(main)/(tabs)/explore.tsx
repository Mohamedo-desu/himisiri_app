import PostCard from "@/components/home-screen/PostCard";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as IconsOutline from "react-native-heroicons/outline";
import * as IconsSolid from "react-native-heroicons/solid";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, useUnistyles } from "react-native-unistyles";

const ExploreScreen = () => {
  const { theme } = useUnistyles();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch popular posts
  const popularPosts = useQuery(api.posts.getPopularPosts, {
    limit: 10,
  });

  // Fetch trending topics (we'll get this from posts with most engagement)
  const trendingTopics = useQuery(api.posts.getTrendingTopics, {
    limit: 6,
  });

  // Search functionality
  const handleSearch = () => {
    if (searchQuery.trim()) {
      // For now, just log the search - we'll implement search later
      console.log("Search for:", searchQuery.trim());
      // TODO: Navigate to search results
    }
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
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <IconsOutline.XMarkIcon size={18} color={theme.colors.grey400} />
          </TouchableOpacity>
        )}
      </View>

      {/* Trending Topics */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <IconsSolid.FireIcon size={20} color="#FF6B6B" />
          <Text
            style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
          >
            Trending Now
          </Text>
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
            : ["Love", "Work", "Family", "Secrets", "Dreams", "Regrets"].map(
                (topic, index) => (
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
                )
              )}
        </ScrollView>
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <IconsSolid.Squares2X2Icon size={20} color={theme.colors.primary} />
          <Text
            style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
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
          style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
        >
          Popular This Week
        </Text>
      </View>
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
}));
