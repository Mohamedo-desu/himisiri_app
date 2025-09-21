# Share Functionality Documentation

## Overview

The app now has comprehensive share functionality that allows users to share posts, comments, and user profiles with proper deep linking support.

## Features

### 1. Post Sharing

- Share posts with title, content preview, and author information
- Deep links to specific posts: `himisiri://main/post/{postId}`
- Web fallback links: `https://himisiri.expo.app/main/post/{postId}`
- Accessible from PostCard menu and action buttons

### 2. Comment Sharing

- Share comments with content and author information
- Deep links to highlight specific comments: `himisiri://main/post/{postId}?highlight={commentId}&type=comment`
- Web fallback links: `https://himisiri.expo.app/main/post/{postId}?highlight={commentId}&type=comment`
- Falls back to generic sharing when postId is not available (user profile, my-comments screens)

### 3. User Profile Sharing

- Share user profiles with username and bio
- Deep links: `himisiri://main/user/{userId}`
- Web fallback: `https://himisiri.expo.app/main/user/{userId}`

### 4. App Sharing

- Generic app sharing functionality
- Includes download links and app description

## Technical Implementation

### Utilities

#### `shareUtils.ts`

Contains all sharing functions:

- `sharePost(postId, title?, content?, authorName?)`
- `shareComment(postId, commentId, content, authorName?)`
- `shareUser(userId, userName, userBio?)`
- `shareApp(downloadUrl?)`
- `shareGenericContent(content, title?)`

#### `deepLinkHandler.ts`

Handles incoming deep links:

- `handleDeepLink(url)` - Processes deep links and navigates accordingly
- `setupDeepLinking()` - Sets up event listeners for deep link handling

### Platform Support

#### iOS

- Uses custom app scheme for deep links
- Native share sheet integration
- Associated domains configured for universal links

#### Android

- Intent filters configured for both app scheme and web links
- Auto-verification enabled for web links
- Native share functionality

#### Web

- Uses Web Share API when available
- Falls back to clipboard copy
- Proper error handling and user feedback

### App Configuration

The app is configured with:

- App scheme: `himisiri`
- Web domain: `himisiri.expo.app`
- Intent filters for both custom scheme and web links
- Associated domains for iOS universal links

## Usage Examples

### Sharing a Post

```typescript
import { sharePost } from "@/utils/shareUtils";

await sharePost("post123", "Post Title", "Post content...", "username");
```

### Sharing a Comment

```typescript
import { shareComment } from "@/utils/shareUtils";

await shareComment("post123", "comment456", "Comment content...", "username");
```

### Setting up Deep Link Handling

```typescript
import { setupDeepLinking } from "@/utils/deepLinkHandler";

useEffect(() => {
  const cleanup = setupDeepLinking();
  return cleanup;
}, []);
```

## Error Handling

All share functions include:

- Try-catch blocks for error handling
- User-friendly toast notifications
- Graceful fallbacks for different platforms
- Platform-specific share methods

## Testing

To test the share functionality:

1. **Posts**: Navigate to any post and use the share button
2. **Comments**: Navigate to post details and share any comment
3. **Deep Links**: Share content and test the links on different devices
4. **Fallbacks**: Test on web browsers without native share support

## Future Enhancements

Potential improvements:

- Share analytics tracking
- Custom share preview images
- Social media platform-specific optimizations
- Shortened URLs for better sharing experience
