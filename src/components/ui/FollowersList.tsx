import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import React from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { useUnistyles } from "react-native-unistyles";
import { UserCard } from "../ui/UserCard";

interface FollowersListProps {
  userId: Id<"users">;
  currentUserId?: Id<"users">;
}

export const FollowersList: React.FC<FollowersListProps> = ({
  userId,
  currentUserId,
}) => {
  const { theme } = useUnistyles();
  const followers = useQuery(api.users.getFollowers, { userId });

  if (followers === undefined) {
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
          Loading followers...
        </Text>
      </View>
    );
  }

  if (followers.length === 0) {
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
          No followers yet
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: theme.colors.grey100,
            textAlign: "center",
          }}
        >
          When people follow this account, they'll appear here.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={followers}
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
