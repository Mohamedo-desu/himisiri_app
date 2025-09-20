import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import React from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { useUnistyles } from "react-native-unistyles";
import { UserCard } from "../ui/UserCard";

interface FollowingListProps {
  userId: Id<"users">;
  currentUserId?: Id<"users">;
}

export const FollowingList: React.FC<FollowingListProps> = ({
  userId,
  currentUserId,
}) => {
  const { theme } = useUnistyles();
  const following = useQuery(api.users.getFollowing, { userId });

  if (following === undefined) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 32,
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
          Loading following...
        </Text>
      </View>
    );
  }

  if (following.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 32,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: theme.colors.onBackground,
            marginBottom: 8,
          }}
        >
          Not following anyone yet
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: theme.colors.grey100,
            textAlign: "center",
          }}
        >
          When you follow people, they'll appear here.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={following}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => (
        <UserCard
          user={item}
          showFollowButton={true}
          currentUserId={currentUserId}
        />
      )}
      contentContainerStyle={{ padding: 16 }}
      showsVerticalScrollIndicator={false}
    />
  );
};
