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
import CommentCard from "../../components/post-details/CommentCard";

const MyCommentsScreen = () => {
  const { theme } = useUnistyles();
  const myComments = useQuery(api.comments.getCommentsByAuthor, {});

  const renderComment = ({ item }: { item: any }) => (
    <View style={{ marginBottom: 16 }}>
      <CommentCard comment={item} />
      {/* Post Context */}
      {item.post && (
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: 8,
            padding: 12,
            marginTop: 8,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              color: theme.colors.grey100,
              marginBottom: 4,
            }}
          >
            Comment on:
          </Text>
          {item.post.title && (
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: theme.colors.onBackground,
                marginBottom: 4,
              }}
            >
              {item.post.title}
            </Text>
          )}
          <Text
            style={{
              fontSize: 14,
              color: theme.colors.grey100,
              lineHeight: 18,
            }}
          >
            {item.post.content}
          </Text>
        </View>
      )}
    </View>
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
      <IconsOutline.ChatBubbleLeftIcon
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
        No Comments Yet
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: theme.colors.grey100,
          textAlign: "center",
          lineHeight: 20,
        }}
      >
        Comments you write will appear here. Start engaging with posts!
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
          My Comments
        </Text>
      </View>

      {/* Content */}
      {myComments === undefined ? (
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
            Loading comments...
          </Text>
        </View>
      ) : (
        <FlatList
          data={myComments}
          renderItem={renderComment}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{
            flexGrow: 1,
            padding: 16,
          }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
        />
      )}
    </SafeAreaView>
  );
};

export default MyCommentsScreen;
