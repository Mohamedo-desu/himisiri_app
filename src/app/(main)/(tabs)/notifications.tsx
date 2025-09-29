import ListEmpty from "@/components/notifications/ListEmptyComponent";
import ListFooter from "@/components/notifications/ListFooterComponent";
import { TAB_BAR_HEIGHT } from "@/components/tabs/CustomTabBar";
import CustomText from "@/components/ui/CustomText";
import UserAvatar from "@/components/ui/UserAvatar";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import type { NOTIFICATION_TABLE } from "@/convex/schema";
import { groupNotifications } from "@/utils/notification";
import { useMutation, usePaginatedQuery, useQuery } from "convex/react";
import { format } from "date-fns";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, SectionList, TouchableOpacity, View } from "react-native";
import * as IconsSolid from "react-native-heroicons/solid";
import { StyleSheet, useUnistyles } from "react-native-unistyles";
import { BADGE_COLOR } from "unistyles";

type TabValue = "all" | "unread" | "mentions";

type NotificationWithSender = NOTIFICATION_TABLE & {
  sender?: {
    _id: Id<"users">;
    userName: string;
    imageUrl?: string;
  } | null;
};

const NotificationsScreen = () => {
  const { theme } = useUnistyles();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabValue>("all");

  // Convex queries and mutations (paginated)
  const {
    results: notifications,
    isLoading,
    status,
    loadMore,
  } = usePaginatedQuery(
    api.notifications.getUserNotifications,
    {},
    {
      initialNumItems: 10,
    }
  );
  const unreadCount = useQuery(api.notifications.getUnreadCount) || 0;
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  const getIcon = (type: NotificationWithSender["type"]) => {
    switch (type) {
      case "like":
        return <IconsSolid.HeartIcon size={18} color="#ef4444" />;
      case "comment":
        return <IconsSolid.ChatBubbleLeftIcon size={18} color="#3b82f6" />;
      case "reply":
        return <IconsSolid.ArrowUturnLeftIcon size={18} color="#8b5cf6" />;
      case "follow":
        return <IconsSolid.UserPlusIcon size={18} color="#10b981" />;
      case "mention":
        return <IconsSolid.AtSymbolIcon size={18} color="#f59e0b" />;
      case "report_resolved":
        return <IconsSolid.CheckCircleIcon size={18} color="#10b981" />;
      case "account_warning":
        return <IconsSolid.ExclamationTriangleIcon size={18} color="#f59e0b" />;
      case "post_featured":
        return <IconsSolid.StarIcon size={18} color="#fbbf24" />;
      case "system":
        return (
          <IconsSolid.InformationCircleIcon
            size={18}
            color={theme.colors.primary}
          />
        );
      default:
        return <IconsSolid.BellIcon size={18} color={theme.colors.grey100} />;
    }
  };

  // Relative time formatting removed; formatting handled via date-fns format below

  // Individual mark-as-read handled inside press handler

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
      if (!notification.isRead) {
        await markAsRead({ notificationId: notification._id });
      }

      if (notification.entityType === "post" && notification.entityId) {
        if (
          notification.type === "comment" &&
          notification.metadata?.commentId
        ) {
          router.push(
            `/(main)/post/${notification.entityId}?highlight=${notification.metadata.commentId}&type=comment`
          );
        } else {
          router.push(`/(main)/post/${notification.entityId}`);
        }
      } else if (
        (notification.entityType === "comment" ||
          notification.entityType === "reply") &&
        notification.metadata?.postId
      ) {
        let highlightId = notification.entityId;
        router.push(
          `/(main)/post/${notification.metadata.postId}?highlight=${highlightId}&type=${notification.entityType}`
        );
      } else if (notification.entityType === "user" && notification.entityId) {
        router.push(`/(main)/user/${notification.entityId}`);
      } else if (notification.type === "follow" && notification.senderId) {
        router.push(`/(main)/user/${notification.senderId}`);
      }
    } catch (error) {
      console.error("Error handling notification press:", error);
      Alert.alert("Error", "Failed to open notification");
    }
  };

  const onRefresh = async () => {
    // usePaginatedQuery auto-refetches; no manual cursor reset needed
  };

  const filteredNotifications = useMemo(
    () =>
      (notifications as NotificationWithSender[]).filter((notification) => {
        if (activeTab === "unread") return !notification.isRead;
        if (activeTab === "mentions")
          return (
            notification.type === "mention" || notification.type === "reply"
          );
        return true;
      }),
    [notifications, activeTab]
  );

  const sections = groupNotifications(filteredNotifications);

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <CustomText variant="label" bold>
          Notifications
        </CustomText>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={handleMarkAllAsRead}
            style={styles.markAllButton}
          >
            <CustomText variant="small">Mark all read</CustomText>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {[
          { id: "all", label: "All", count: notifications.length },
          { id: "unread", label: "Unread", count: unreadCount },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            onPress={() => setActiveTab(tab.id as any)}
            style={[
              styles.tab,
              {
                backgroundColor:
                  activeTab === tab.id
                    ? theme.colors.primary
                    : theme.colors.surface,
              },
            ]}
          >
            <CustomText
              style={[
                styles.tabLabel,
                {
                  color:
                    activeTab === tab.id
                      ? theme.colors.onPrimary
                      : theme.colors.onSurface,
                },
              ]}
              variant="label"
              bold
            >
              {tab.label}
            </CustomText>
            {tab.count > 0 && (
              <View
                style={[
                  styles.tabBadge,
                  {
                    backgroundColor:
                      activeTab === tab.id
                        ? theme.colors.onPrimary
                        : BADGE_COLOR,
                  },
                ]}
              >
                <CustomText
                  style={[
                    {
                      color:
                        activeTab === tab.id
                          ? theme.colors.primary
                          : theme.colors.onPrimary,
                    },
                  ]}
                  variant="small"
                >
                  {tab.count}
                </CustomText>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Notifications List */}

      <SectionList
        sections={sections}
        keyExtractor={(item) => item._id}
        showsVerticalScrollIndicator={false}
        renderSectionHeader={({ section }) =>
          section.data.length > 0 ? (
            <View style={styles.sectionHeader}>
              <CustomText variant="label" semibold>
                {section.title}
              </CustomText>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleNotificationPress(item)}
            style={[styles.notificationItem(item.isRead)]}
          >
            <View style={styles.iconContainer}>{getIcon(item.type)}</View>
            <View style={styles.content}>
              <CustomText
                style={[styles.title]}
                variant="label"
                fontWeight={item.isRead ? "regular" : "bold"}
              >
                {item.title}
              </CustomText>
              <CustomText style={styles.message} variant="small">
                {item.message}
              </CustomText>
              <View style={styles.footerRow}>
                <CustomText variant="tiny">
                  {format(new Date(item._creationTime), "MMM d, yyyy • h:mm a")}
                </CustomText>
                {item.sender && (
                  <View style={styles.senderRow}>
                    {item.sender.imageUrl && (
                      <UserAvatar
                        imageUrl={item.sender.imageUrl as string}
                        size={30}
                        userId={item.sender._id}
                        indicatorSize="small"
                      />
                    )}
                    <CustomText variant="small" semibold>
                      {item.sender.userName}
                    </CustomText>
                  </View>
                )}
              </View>
            </View>
            {!item.isRead && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <ListEmpty isLoading={isLoading} results={notifications} />
        }
        ListFooterComponent={
          <ListFooter status={status} results={notifications} />
        }
        onEndReached={() => loadMore(10)}
        onEndReachedThreshold={0.1}
        refreshing={false}
        onRefresh={onRefresh}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled
      />
    </View>
  );
};

export default NotificationsScreen;

const styles = StyleSheet.create((theme, rt) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.paddingHorizontal,
    paddingBottom: rt.insets.bottom + TAB_BAR_HEIGHT,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.paddingHorizontal,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey300,
  },

  markAllButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.paddingHorizontal,
    borderRadius: theme.radii.regular,
  },

  tabsContainer: {
    flexDirection: "row",
    padding: theme.paddingHorizontal,
    gap: theme.gap(1),
  },
  tab: {
    paddingHorizontal: theme.paddingHorizontal,
    paddingVertical: 8,
    borderRadius: theme.paddingHorizontal,
    flexDirection: "row",
    alignItems: "center",
  },
  tabLabel: {
    marginRight: theme.gap(1),
  },
  tabBadge: {
    paddingHorizontal: theme.paddingHorizontal,
    paddingVertical: 2,
    borderRadius: theme.paddingHorizontal,
    minWidth: 18,
    alignItems: "center",
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 16,
  },
  notificationItem: (isRead) => ({
    flexDirection: "row",
    padding: theme.paddingHorizontal,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey300,
    backgroundColor: isRead ? theme.colors.background : theme.colors.surface,
    borderRadius: theme.radii.regular,
    elevation: isRead ? 0 : 5,
  }),
  iconContainer: {
    marginRight: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  title: {
    marginBottom: 4,
  },
  message: {
    marginBottom: 4,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  senderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BADGE_COLOR,
    marginLeft: 8,
    alignSelf: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    marginTop: 16,
  },
  emptySubtitle: {
    marginTop: 8,
  },
  listContent: {
    flexGrow: 1,
    gap: theme.gap(1),
  },
  sectionHeader: {
    padding: theme.paddingHorizontal,
    backgroundColor: theme.colors.background,
  },
}));
