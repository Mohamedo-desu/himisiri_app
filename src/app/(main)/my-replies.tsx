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

const MyRepliesScreen = () => {
  const { theme } = useUnistyles();
  const myReplies = useQuery(api.replies.getRepliesByAuthor, {});

  const renderReply = ({ item }: { item: any }) => (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
      }}
    >
      {/* Reply Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <IconsOutline.ArrowUturnLeftIcon
          size={16}
          color={theme.colors.primary}
        />
        <Text
          style={{
            fontSize: 12,
            color: theme.colors.grey100,
            marginLeft: 4,
          }}
        >
          Reply to comment
        </Text>
      </View>

      {/* Reply Content */}
      <Text
        style={{
          fontSize: 16,
          color: theme.colors.onBackground,
          lineHeight: 22,
          marginBottom: 8,
        }}
      >
        {item.content}
      </Text>

      {/* Original Comment Preview */}
      {item.comment && (
        <View
          style={{
            backgroundColor: theme.colors.background,
            borderRadius: 8,
            padding: 12,
            marginTop: 8,
            marginBottom: 8,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              color: theme.colors.grey100,
              marginBottom: 4,
            }}
          >
            Original Comment:
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: theme.colors.grey100,
              lineHeight: 18,
            }}
          >
            {item.comment.content}
          </Text>
        </View>
      )}

      {/* Post Preview */}
      {item.post && (
        <View
          style={{
            backgroundColor: theme.colors.backgroundOverlay,
            borderRadius: 8,
            padding: 12,
            marginTop: 4,
          }}
        >
          <Text
            style={{
              fontSize: 12,
              color: theme.colors.grey100,
              marginBottom: 4,
            }}
          >
            From Post:
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

      {/* Reply Stats */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginTop: 12,
          gap: 16,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <IconsOutline.HeartIcon size={16} color={theme.colors.grey100} />
          <Text
            style={{
              fontSize: 12,
              color: theme.colors.grey100,
              marginLeft: 4,
            }}
          >
            {item.likesCount}
          </Text>
        </View>
        <Text
          style={{
            fontSize: 12,
            color: theme.colors.grey100,
            marginLeft: "auto",
          }}
        >
          {new Date(item._creationTime).toLocaleDateString()}
        </Text>
      </View>
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
      <IconsOutline.ArrowUturnLeftIcon
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
        No Replies Yet
      </Text>
      <Text
        style={{
          fontSize: 14,
          color: theme.colors.grey100,
          textAlign: "center",
          lineHeight: 20,
        }}
      >
        Replies you write will appear here. Start joining conversations!
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
          My Replies
        </Text>
      </View>

      {/* Content */}
      {myReplies === undefined ? (
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
            Loading replies...
          </Text>
        </View>
      ) : (
        <FlatList
          data={myReplies}
          renderItem={renderReply}
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

export default MyRepliesScreen;
