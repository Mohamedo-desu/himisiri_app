import { useOnlineUsers } from "@/hooks/useUserPresence";
import React from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import OnlineStatusIndicator from "./OnlineStatusIndicator";

const OnlineUsersList: React.FC = () => {
  const { theme } = useUnistyles();
  const { users, isLoading } = useOnlineUsers(20);

  const renderUser = ({ item }: { item: any }) => (
    <View
      style={[styles.userItem, { borderBottomColor: theme.colors.grey200 }]}
    >
      <View style={styles.userInfo}>
        <Text style={[styles.userName, { color: theme.colors.onSurface }]}>
          {item.userName}
        </Text>
        <Text style={[styles.lastActiveText, { color: theme.colors.grey500 }]}>
          {item.lastActiveAt
            ? `Active ${formatLastActive(item.lastActiveAt)}`
            : "Recently online"}
        </Text>
      </View>
      <OnlineStatusIndicator userId={item._id} size="medium" showText />
    </View>
  );

  const formatLastActive = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (minutes < 1) return "now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      padding: 16,
      margin: 16,
    },
    title: {
      fontSize: 18,
      fontWeight: "600",
      color: theme.colors.onSurface,
      marginBottom: 12,
    },
    userItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      borderBottomWidth: 1,
    },
    userInfo: {
      flex: 1,
    },
    userName: {
      fontSize: 14,
      fontWeight: "600",
    },
    lastActiveText: {
      fontSize: 12,
      marginTop: 2,
    },
    emptyText: {
      textAlign: "center",
      color: theme.colors.grey500,
      fontSize: 14,
      paddingVertical: 20,
    },
    loadingContainer: {
      paddingVertical: 20,
      alignItems: "center",
    },
  });

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Online Users</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={theme.colors.primary} />
          <Text style={[styles.emptyText, { marginTop: 8 }]}>Loading...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Online Users ({users.length})</Text>
      {users.length === 0 ? (
        <Text style={styles.emptyText}>No users online</Text>
      ) : (
        <FlatList
          data={users}
          renderItem={renderUser}
          keyExtractor={(item) => item._id}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default OnlineUsersList;
