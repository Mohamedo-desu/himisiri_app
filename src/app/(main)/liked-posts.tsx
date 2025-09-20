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

const LikedPostsScreen = () => {
  const { theme } = useUnistyles();
  const likedPosts = useQuery(api.posts.getLikedPosts, {});

  const renderPost = ({ item }: { item: any }) => (
    <PostCard key={item._id} post={item} />
  );

  const renderEmptyState = () => (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 32,
      }}
    >
      <IconsOutline.HeartIcon
        size={64}
        color={theme.colors.grey100}
        style={{ marginBottom: 16 }}
      />
      <Text
        style={{
          fontSize: 18,
          fontWeight: "bold",
          color: theme.colors.onBackground,
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        No Liked Posts Yet
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: theme.colors.grey100,
          textAlign: "center",
          lineHeight: 20,
        }}
      >
        Posts you like will appear here. Start exploring and liking posts!
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.surface,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            marginRight: 16,
            padding: 8,
          }}
        >
          <IconsOutline.ArrowLeftIcon
            size={24}
            color={theme.colors.onBackground}
          />
        </TouchableOpacity>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "bold",
            color: theme.colors.onBackground,
            flex: 1,
          }}
        >
          Liked Posts
        </Text>
      </View>

      {/* Content */}
      {likedPosts === undefined ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text
            style={{
              marginTop: 16,
              fontSize: 16,
              color: theme.colors.grey100,
            }}
          >
            Loading liked posts...
          </Text>
        </View>
      ) : (
        <FlatList
          data={likedPosts}
          renderItem={renderPost}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{
            flexGrow: 1,
            padding: 16,
          }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
        />
      )}
    </SafeAreaView>
  );
};

export default LikedPostsScreen;
