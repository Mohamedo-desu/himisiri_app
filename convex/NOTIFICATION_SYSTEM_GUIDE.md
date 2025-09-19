# 🔔 Notification & Push Notification System

## Overview

Complete notification system with in-app notifications and push notifications for your confession app. This system automatically triggers notifications for user interactions and account/content status changes.

## 📁 File Structure

```
convex/
├── notifications.ts           # In-app notification queries/mutations
├── pushNotifications.ts       # Push notification functionality
├── notificationTriggers.ts    # Automatic notification triggers
└── schema.ts                  # Notifications table definition
```

## 🚀 Features Implemented

### ✅ **Automatic Notifications**

- **Post Likes**: Notify when someone likes your post
- **Comment Likes**: Notify when someone likes your comment
- **Reply Likes**: Notify when someone likes your reply
- **New Comments**: Notify when someone comments on your post
- **New Replies**: Notify when someone replies to your comment
- **Account Status Changes**: Notify about pauses, suspensions, restorations
- **Content Status Changes**: Notify about post approval/removal

### ✅ **Push Notifications**

- Uses Expo's push service: `https://exp.host/--/api/v2/push/send`
- Automatically handles invalid tokens
- Supports all device types (iOS, Android, Web)
- Includes custom data for deep linking

### ✅ **In-App Notifications**

- Real-time notification count badges
- Paginated notification list
- Read/unread status management
- Rich notification metadata

## 🔧 How to Use

### 1. **Enable Notification Triggers**

To use the notification triggers in your mutations, import the notification mutation wrapper:

```typescript
// In your existing mutation files (posts.ts, likes.ts, etc.)
import { notificationMutation } from "./notificationTriggers";

// Use notificationMutation instead of regular mutation
export const likePost = notificationMutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    // Your existing like logic here
    // Notifications will automatically trigger
  },
});
```

### 2. **Frontend Integration**

The notification count is already integrated into your tab layout:

```typescript
// In src/app/(main)/(tabs)/_layout.tsx
const notificationCount = useQuery(api.notifications.getUnreadCount);
// This automatically shows badge on Notifications tab
```

### 3. **Using Notifications in Your App**

```typescript
// Get notifications for current user
const notifications = useQuery(api.notifications.getUserNotifications, {
  paginationOpts: { numItems: 20 },
});

// Mark notification as read
const markAsRead = useMutation(api.notifications.markAsRead);

// Mark all as read
const markAllAsRead = useMutation(api.notifications.markAllAsRead);
```

## 📱 Push Notification Setup

### Prerequisites

1. Users must have push tokens registered in the `pushTokens` table
2. Expo app must be configured for push notifications

### Push Token Registration

```typescript
// Register user's push token (usually in app initialization)
await ctx.db.insert("pushTokens", {
  userId: user._id,
  pushToken: expoPushToken,
  deviceId: device.id,
  platform: device.platform,
  // ... other device info
});
```

## 🔄 Notification Flow

### 1. **User Interaction** (e.g., likes a post)

```
User likes post → Database insert → Trigger fires → Notification created → Push sent
```

### 2. **Account Status Change**

```
Admin changes status → Database update → Trigger fires → Notification created → Push sent
```

### 3. **Content Moderation**

```
Post status changes → Database update → Trigger fires → Notification created → Push sent
```

## 📊 Notification Types

| Type              | Trigger                          | Example Message                |
| ----------------- | -------------------------------- | ------------------------------ |
| `like`            | Post/comment/reply liked         | "John liked your post"         |
| `comment`         | New comment on post              | "Jane commented on your post"  |
| `reply`           | New reply to comment             | "Mike replied to your comment" |
| `follow`          | User followed (when implemented) | "Sarah started following you"  |
| `account_warning` | Account status changed           | "Your account has been paused" |
| `system`          | Content status changed           | "Your post has been approved"  |

## 🎯 Smart Features

### **Prevents Self-Notifications**

- Users don't get notified for their own actions
- Example: Liking your own post won't trigger a notification

### **Automatic Token Cleanup**

- Invalid push tokens are automatically removed
- Handles device uninstalls and token changes

### **Rich Metadata**

- Notifications include relevant context (post titles, comment content)
- Supports deep linking to specific content

### **Content Preview**

- Long content is automatically truncated with "..."
- First 50 characters shown in notification

## 🔧 Customization

### **Adding New Notification Types**

1. Add new type to schema unions
2. Create trigger in `notificationTriggers.ts`
3. Add helper function in `pushNotifications.ts`

### **Changing Notification Preferences**

Extend the `getUserNotificationPreferences` function to support user preferences:

```typescript
// Future enhancement: User notification settings table
export const notificationPreferences = defineTable({
  userId: v.id("users"),
  likes: v.boolean(),
  comments: v.boolean(),
  follows: v.boolean(),
  // ... other preferences
});
```

## 🚨 Important Notes

### **Performance Considerations**

- Triggers run asynchronously to avoid blocking user actions
- Push notifications are batched when possible
- Invalid tokens are cleaned up automatically

### **Testing**

- Test with real devices for push notifications
- Use Expo development tools for debugging
- Check notification permissions in app settings

### **Error Handling**

- Failed push notifications are logged but don't block user actions
- Invalid tokens are automatically removed
- Network failures are gracefully handled

## 🔜 Future Enhancements

1. **User Notification Preferences**: Allow users to customize notification types
2. **Notification Scheduling**: Digest notifications for less spam
3. **Rich Push Notifications**: Include images and action buttons
4. **Analytics**: Track notification open rates and engagement
5. **Follow System**: Add user following with notifications

## 📝 Example Usage

```typescript
// Example: Using the notification system in a like mutation
export const likePost = notificationMutation({
  args: { postId: v.id("posts") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    // Create the like (this will automatically trigger notification)
    const likeId = await ctx.db.insert("postLikes", {
      userId: user._id,
      postId: args.postId,
    });

    // Update post like count
    await ctx.db.patch(args.postId, {
      likesCount: post.likesCount + 1,
    });

    return likeId;
    // Notification and push notification will be sent automatically!
  },
});
```

The system is now ready to provide rich, real-time notifications for all user interactions in your confession app! 🎉
