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
        <Text style={[styles.sessionsText, { color: theme.colors.grey500 }]}>
          {item.activeSessions} session{item.activeSessions !== 1 ? "s" : ""}
        </Text>
      </View>
      <OnlineStatusIndicator userId={item._id} size="medium" showText />
    </View>
  );

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
    sessionsText: {
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
