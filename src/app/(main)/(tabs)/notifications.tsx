import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as IconsOutline from "react-native-heroicons/outline";
import * as IconsSolid from "react-native-heroicons/solid";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUnistyles } from "react-native-unistyles";

interface NotificationWithSender {
  _id: Id<"notifications">;
  type:
    | "like"
    | "comment"
    | "reply"
    | "follow"
    | "mention"
    | "report_resolved"
    | "account_warning"
    | "post_featured"
    | "system";
  title: string;
  message: string;
  isRead: boolean;
  _creationTime: number;
  senderId?: Id<"users">;
  entityId?: string;
  entityType?: "post" | "comment" | "reply" | "user";
  metadata?: any;
  sender?: {
    _id: Id<"users">;
    userName: string;
    imageUrl?: string;
  } | null;
}

const NotificationsScreen = () => {
  const { theme } = useUnistyles();
  const [activeTab, setActiveTab] = useState<"all" | "unread" | "mentions">(
    "all"
  );

  // Convex queries and mutations
  const notificationsResult = useQuery(api.notifications.getUserNotifications, {
    paginationOpts: { numItems: 50 },
  });
  const unreadCount = useQuery(api.notifications.getUnreadCount) || 0;
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  const notifications: NotificationWithSender[] =
    notificationsResult?.page || [];
  const isLoading = notificationsResult === undefined;

  const getIcon = (type: NotificationWithSender["type"]) => {
    switch (type) {
      case "like":
        return <IconsSolid.HeartIcon size={24} color="#ef4444" />;
      case "comment":
        return <IconsSolid.ChatBubbleLeftIcon size={24} color="#3b82f6" />;
      case "reply":
        return <IconsSolid.ArrowUturnLeftIcon size={24} color="#8b5cf6" />;
      case "follow":
        return <IconsSolid.UserPlusIcon size={24} color="#10b981" />;
      case "mention":
        return <IconsSolid.AtSymbolIcon size={24} color="#f59e0b" />;
      case "report_resolved":
        return <IconsSolid.CheckCircleIcon size={24} color="#10b981" />;
      case "account_warning":
        return <IconsSolid.ExclamationTriangleIcon size={24} color="#f59e0b" />;
      case "post_featured":
        return <IconsSolid.StarIcon size={24} color="#fbbf24" />;
      case "system":
        return (
          <IconsSolid.InformationCircleIcon
            size={24}
            color={theme.colors.primary}
          />
        );
      default:
        return <IconsSolid.BellIcon size={24} color={theme.colors.grey100} />;
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      // await markAsRead({ notificationId });
      console.log("Mark as read:", notificationId);
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const markedCount = await markAllAsRead();
      Alert.alert("Success", `Marked ${markedCount} notifications as read`);
    } catch (error) {
      console.error("Error marking all as read:", error);
      Alert.alert("Error", "Failed to mark all notifications as read");
    }
  };

  const handleNotificationPress = async (
    notification: NotificationWithSender
  ) => {
    try {
      // Mark as read if not already read
      if (!notification.isRead) {
        await markAsRead({ notificationId: notification._id });
      }

      // Handle navigation based on notification type and entity
      if (notification.entityType === "post" && notification.entityId) {
        console.log("Navigate to post:", notification.entityId);
      } else if (
        notification.entityType === "comment" &&
        notification.metadata?.postId
      ) {
        console.log(
          "Navigate to comment in post:",
          notification.metadata.postId
        );
      } else if (notification.entityType === "user" && notification.entityId) {
        console.log("Navigate to user profile:", notification.entityId);
      }
    } catch (error) {
      console.error("Error handling notification press:", error);
      Alert.alert("Error", "Failed to open notification");
    }
  };

  const onRefresh = async () => {
    // Convex queries will automatically refetch
    // No manual refresh needed, but show feedback
  };

  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === "unread") return !notification.isRead;
    if (activeTab === "mentions")
      return notification.type === "mention" || notification.type === "reply";
    return true;
  });

  // Use the real unread count from the backend
  const filteredNotificationCount = filteredNotifications.length;
  const filteredUnreadCount = filteredNotifications.filter(
    (n) => !n.isRead
  ).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: theme.colors.grey300,
        }}
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: "bold",
            color: theme.colors.onBackground,
          }}
        >
          Notifications
        </Text>

        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={handleMarkAllAsRead}
            style={{
              backgroundColor: theme.colors.primary,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 16,
            }}
          >
            <Text
              style={{
                color: theme.colors.onPrimary,
                fontSize: 12,
                fontWeight: "600",
              }}
            >
              Mark all read
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View
        style={{
          flexDirection: "row",
          paddingHorizontal: 16,
          paddingVertical: 12,
          gap: 8,
        }}
      >
        {[
          { id: "all", label: "All", count: notifications.length },
          { id: "unread", label: "Unread", count: unreadCount },
          {
            id: "mentions",
            label: "Mentions",
            count: notifications.filter(
              (n) => n.type === "mention" || n.type === "reply"
            ).length,
          },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id as any)}
            style={{
              backgroundColor:
                activeTab === tab.id
                  ? theme.colors.primary
                  : theme.colors.surface,
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 20,
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color:
                  activeTab === tab.id
                    ? theme.colors.onPrimary
                    : theme.colors.onSurface,
                fontWeight: "600",
                marginRight: tab.count > 0 ? 6 : 0,
              }}
            >
              {tab.label}
            </Text>
            {tab.count > 0 && (
              <View
                style={{
                  backgroundColor:
                    activeTab === tab.id
                      ? theme.colors.onPrimary
                      : theme.colors.primary,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                  borderRadius: 10,
                  minWidth: 18,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    color:
                      activeTab === tab.id
                        ? theme.colors.primary
                        : theme.colors.onPrimary,
                    fontSize: 10,
                    fontWeight: "bold",
                  }}
                >
                  {tab.count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Notifications List */}
      {isLoading ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text
            style={{
              marginTop: 16,
              fontSize: 16,
              color: theme.colors.onBackground,
            }}
          >
            Loading notifications...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleNotificationPress(item)}
              style={{
                flexDirection: "row",
                padding: 16,
                backgroundColor: item.isRead
                  ? "transparent"
                  : theme.colors.surface,
                borderBottomWidth: 1,
                borderBottomColor: theme.colors.grey300,
              }}
            >
              {/* Icon */}
              <View
                style={{
                  marginRight: 16,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {getIcon(item.type)}
              </View>

              {/* Content */}
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: item.isRead ? "500" : "bold",
                    color: theme.colors.onBackground,
                    marginBottom: 4,
                  }}
                >
                  {item.title}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: theme.colors.grey100,
                    marginBottom: 8,
                    lineHeight: 20,
                  }}
                >
                  {item.message}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: theme.colors.grey300,
                    }}
                  >
                    {formatTimestamp(item._creationTime)}
                  </Text>
                  {item.sender && (
                    <Text
                      style={{
                        fontSize: 12,
                        color: theme.colors.primary,
                        fontWeight: "500",
                      }}
                    >
                      {item.sender.userName}
                    </Text>
                  )}
                </View>
              </View>

              {/* Unread Indicator */}
              {!item.isRead && (
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: theme.colors.primary,
                    marginLeft: 8,
                    alignSelf: "center",
                  }}
                />
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 60,
              }}
            >
              <IconsOutline.BellIcon size={48} color={theme.colors.grey100} />
              <Text
                style={{
                  fontSize: 18,
                  color: theme.colors.grey100,
                  marginTop: 16,
                  textAlign: "center",
                }}
              >
                No notifications yet
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: theme.colors.grey300,
                  marginTop: 8,
                  textAlign: "center",
                  paddingHorizontal: 32,
                }}
              >
                When someone interacts with your posts, you'll see it here
              </Text>
            </View>
          )}
          refreshing={false}
          onRefresh={onRefresh}
          contentContainerStyle={{
            flexGrow: 1,
          }}
        />
      )}
    </SafeAreaView>
  );
};

export default NotificationsScreen;
