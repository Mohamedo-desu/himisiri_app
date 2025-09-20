import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { router } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as IconsOutline from "react-native-heroicons/outline";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUnistyles } from "react-native-unistyles";
import PostCard from "../../components/home-screen/PostCard";

const MyPostsScreen = () => {
  const { theme } = useUnistyles();
  const currentUser = useQuery(api.users.getCurrentUser, {});
  const myPosts = useQuery(
    api.posts.getPostsByAuthor,
    currentUser ? { authorId: currentUser._id } : "skip"
  );

  if (!currentUser) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ marginTop: 16, color: theme.colors.grey100 }}>
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.grey300,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.colors.surface,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconsOutline.ArrowLeftIcon
            size={20}
            color={theme.colors.onBackground}
          />
        </TouchableOpacity>

        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: theme.colors.onBackground,
          }}
        >
          My Posts
        </Text>

        <View style={{ width: 40 }} />
      </View>

      {/* Content */}
      {myPosts === undefined ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ marginTop: 16, color: theme.colors.grey100 }}>
            Loading your posts...
          </Text>
        </View>
      ) : myPosts.length === 0 ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 32,
          }}
        >
          <IconsOutline.DocumentTextIcon
            size={64}
            color={theme.colors.grey300}
          />
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: theme.colors.onBackground,
              marginTop: 16,
              marginBottom: 8,
            }}
          >
            No posts yet
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: theme.colors.grey400,
              textAlign: "center",
            }}
          >
            Your posts will appear here once you start sharing your thoughts.
          </Text>
        </View>
      ) : (
        <FlatList
          data={myPosts}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <PostCard post={item} showFullContent={false} />
          )}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

export default MyPostsScreen;
