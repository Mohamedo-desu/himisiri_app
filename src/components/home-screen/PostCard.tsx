import { api } from "@/convex/_generated/api";
import { POST_TABLE } from "@/convex/schema";
import { useUserStore } from "@/store/useUserStore";
import { useMutation } from "convex/react";
import { formatDistanceToNowStrict } from "date-fns";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as IconsOutline from "react-native-heroicons/outline";
import * as IconsSolid from "react-native-heroicons/solid";
import { SvgXml } from "react-native-svg";
import { StyleSheet } from "react-native-unistyles";
import { BlockUserButton } from "../ui/BlockUserComponents";
import OnlineStatusIndicator from "../ui/OnlineStatusIndicator";
import { ReportModal } from "../ui/ReportModal";

type PostCardProps = {
  post: POST_TABLE & {
    author?: {
      _id: string;
      userName: string;
      imageUrl?: string;
    } | null;
    hasLiked: boolean;
  };
  onPress?: () => void;
  showFullContent?: boolean;
};

const PostCard = ({
  post,
  onPress,
  showFullContent = false,
}: PostCardProps) => {
  const { currentUser } = useUserStore();
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title || "");
  const [editContent, setEditContent] = useState(post.content);
  const [editTags, setEditTags] = useState<string[]>(post.tags || []);

  const togglePostLike = useMutation(api.likes.togglePostLike);
  const updatePost = useMutation(api.posts.updatePost);
  const deletePost = useMutation(api.posts.deletePost);

  const isMyPost =
    currentUser &&
    (post.authorId === currentUser._id ||
      (post.author && post.author._id === currentUser._id));

  const handleLike = async () => {
    try {
      await togglePostLike({ postId: post._id });
    } catch (error) {
      Alert.alert("Error", "Failed to update like. Please try again.");
    }
  };

  const handleEditPost = () => {
    setShowMenu(false);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      if (editContent.length < 10 || editContent.length > 5000) {
        Alert.alert(
          "Error",
          "Post content must be between 10 and 5000 characters"
        );
        return;
      }

      await updatePost({
        postId: post._id,
        content: editContent,
        title: editTitle || undefined,
        tags: editTags.length > 0 ? editTags : undefined,
      });

      setShowEditModal(false);
      Alert.alert("Success", "Post updated successfully!");
    } catch (error) {
      Alert.alert("Error", "Failed to update post. Please try again.");
    }
  };

  const handleDeletePost = () => {
    setShowMenu(false);
    Alert.alert(
      "Delete Post",
      "Are you sure you want to delete this post? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePost({ postId: post._id });
              Alert.alert("Success", "Post deleted successfully!");
            } catch (error) {
              Alert.alert("Error", "Failed to delete post. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleHidePost = () => {
    setShowMenu(false);
    Alert.alert("Hide Post", "Hide this post from the public feed?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Hide",
        onPress: async () => {
          try {
            // Change visibility to private to "hide" it from public feed
            await updatePost({
              postId: post._id,
              visibility: "private",
            });
            Alert.alert("Success", "Post hidden from public feed!");
          } catch (error) {
            Alert.alert("Error", "Failed to hide post. Please try again.");
          }
        },
      },
    ]);
  };

  const handleSharePost = () => {
    setShowMenu(false);
    // TODO: Implement share functionality
    Alert.alert("Share", "Share functionality coming soon!");
  };

  const handleViewStats = () => {
    setShowMenu(false);
    Alert.alert(
      "Post Statistics",
      `Likes: ${post.likesCount || 0}\nComments: ${post.commentsCount || 0}\nViews: Coming soon\nCreated: ${new Date(post._creationTime).toLocaleDateString()}`
    );
  };

  const handleReportPost = () => {
    setShowMenu(false);
    setShowReportModal(true);
  };

  const getPostTypeColor = (type: string) => {
    switch (type) {
      case "confession":
        return "#FF6B6B";
      case "story":
        return "#4ECDC4";
      case "question":
        return "#45B7D1";
      case "advice":
        return "#FFA726";
      case "other":
        return "#9C27B0";
      default:
        return "#4B50B2"; // PRIMARY_COLOR from unistyles
    }
  };

  const getPostTypeIcon = (type: string) => {
    switch (type) {
      case "confession":
        return IconsOutline.HeartIcon;
      case "story":
        return IconsOutline.BookOpenIcon;
      case "question":
        return IconsOutline.QuestionMarkCircleIcon;
      case "advice":
        return IconsOutline.LightBulbIcon;
      case "other":
        return IconsOutline.ChatBubbleLeftIcon;
      default:
        return IconsOutline.ChatBubbleLeftIcon;
    }
  };

  const PostTypeIcon = getPostTypeIcon(post.type);

  const handleView = () => {
    router.navigate({
      pathname: "/(main)/post/[id]",
      params: { id: post._id },
    });
  };
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handleView}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.header}>
        {/* Avatar */}
        <TouchableOpacity
          style={styles.avatar}
          onPress={() => {
            if (post.author?._id) {
              if (post.author._id === currentUser?._id) {
                // Navigate to own profile
                router.push("/(main)/(tabs)/profile");
              } else {
                // Navigate to user details
                router.push({
                  pathname: "/(main)/user/[userId]",
                  params: { userId: post.author._id },
                });
              }
            }
          }}
        >
          {post.author?.imageUrl ? (
            <SvgXml xml={post.author.imageUrl} width={40} height={40} />
          ) : (
            <Text style={styles.avatarText}>
              {post.author?.userName?.charAt(0).toUpperCase() || "?"}
            </Text>
          )}
        </TouchableOpacity>

        {/* User Info */}
        <View style={styles.userInfo}>
          <View style={styles.userNameContainer}>
            <Text style={styles.userName}>{post.author?.userName}</Text>
            {post.author?._id && (
              <OnlineStatusIndicator
                userId={post.author._id as any}
                size="small"
                style={styles.onlineStatus}
              />
            )}
          </View>
          <Text style={styles.timestamp}>
            {formatDistanceToNowStrict(post._creationTime)}
            {post.editedAt && " • edited"}
          </Text>
        </View>

        {/* Post Type Badge */}
        <View
          style={[
            styles.typeBadge,
            {
              backgroundColor: getPostTypeColor(post.type),
              marginRight: isMyPost ? 8 : 0,
            },
          ]}
        >
          <PostTypeIcon size={14} color="white" style={styles.typeIcon} />
          <Text style={styles.typeBadgeText}>{post.type}</Text>
        </View>

        {/* Menu Button */}
        <TouchableOpacity
          onPress={() => setShowMenu(true)}
          style={styles.menuButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <IconsOutline.EllipsisVerticalIcon size={18} color="#616161" />
        </TouchableOpacity>
      </View>

      {/* Title */}
      {post.title && (
        <Text
          style={styles.title}
          numberOfLines={showFullContent ? undefined : 2}
        >
          {post.title}
        </Text>
      )}

      {/* Content */}
      <Text
        style={styles.content}
        numberOfLines={showFullContent ? undefined : 3}
      >
        {post.content}
      </Text>

      {/* Tags */}
      {post.tags && post.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {post.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
          {post.tags.length > 3 && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>+{post.tags.length - 3}</Text>
            </View>
          )}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        {/* Like Button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            post.hasLiked && { backgroundColor: "#4B50B2" + "20" },
          ]}
          onPress={handleLike}
        >
          {post.hasLiked ? (
            <IconsSolid.HeartIcon
              size={18}
              color="#4B50B2"
              style={styles.actionIcon}
            />
          ) : (
            <IconsOutline.HeartIcon
              size={18}
              color="#757575"
              style={styles.actionIcon}
            />
          )}
          <Text
            style={[styles.actionText, post.hasLiked && { color: "#4B50B2" }]}
          >
            {post.likesCount || 0}
          </Text>
        </TouchableOpacity>

        {/* Comment Button */}
        <TouchableOpacity style={styles.actionButton} onPress={onPress}>
          <IconsOutline.ChatBubbleLeftIcon
            size={18}
            color="#757575"
            style={styles.actionIcon}
          />
          <Text style={styles.actionText}>{post.commentsCount || 0}</Text>
        </TouchableOpacity>

        {/* Share Button */}
        <TouchableOpacity style={styles.actionButton}>
          <IconsOutline.ShareIcon size={18} color="#757575" />
        </TouchableOpacity>
      </View>

      {/* Edit Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editModal}>
            <Text style={styles.editModalTitle}>Edit Post</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Title Input */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Title (Optional)</Text>
                <TextInput
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder="Give your post a title..."
                  placeholderTextColor="#BDBDBD"
                  style={styles.textInput}
                  maxLength={100}
                />
              </View>

              {/* Content Input */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Content</Text>
                <TextInput
                  value={editContent}
                  onChangeText={setEditContent}
                  placeholder="What's on your mind..."
                  placeholderTextColor="#BDBDBD"
                  multiline
                  numberOfLines={6}
                  style={[styles.textInput, styles.contentInput]}
                  maxLength={5000}
                />
                <Text style={styles.characterCount}>
                  {editContent.length}/5000
                </Text>
              </View>

              {/* Tags Section */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Tags</Text>
                {editTags.length > 0 && (
                  <View style={styles.editTagsContainer}>
                    {editTags.map((tag, index) => (
                      <View key={index} style={styles.editTag}>
                        <Text style={styles.editTagText}>#{tag}</Text>
                        <TouchableOpacity
                          onPress={() => {
                            setEditTags(editTags.filter((_, i) => i !== index));
                          }}
                        >
                          <IconsOutline.XMarkIcon size={12} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
                <Text style={styles.tagHint}>Tap a tag to remove it</Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.modalButtonsContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowEditModal(false);
                    // Reset values
                    setEditTitle(post.title || "");
                    setEditContent(post.content);
                    setEditTags(post.tags || []);
                  }}
                >
                  <Text
                    style={[styles.modalButtonText, styles.cancelButtonText]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modalButton,
                    styles.saveButton,
                    editContent.length < 10 && styles.disabledButton,
                  ]}
                  onPress={handleSaveEdit}
                  disabled={editContent.length < 10}
                >
                  <Text style={[styles.modalButtonText, styles.saveButtonText]}>
                    Save Changes
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Menu Modal */}
      <Modal
        visible={showMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowMenu(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setShowMenu(false)}
          activeOpacity={1}
        >
          <View style={styles.menuModal}>
            <Text style={styles.menuTitle}>Post Options</Text>

            {/* Menu Options */}
            {isMyPost ? (
              <>
                {/* My Post Options */}
                <TouchableOpacity
                  style={styles.menuOption}
                  onPress={handleViewStats}
                >
                  <IconsOutline.ChartBarIcon
                    size={20}
                    color="#4B50B2"
                    style={styles.menuIcon}
                  />
                  <Text style={[styles.menuText, styles.menuTextPrimary]}>
                    View Statistics
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuOption}
                  onPress={handleEditPost}
                >
                  <IconsOutline.PencilIcon
                    size={20}
                    color="#4B50B2"
                    style={styles.menuIcon}
                  />
                  <Text style={[styles.menuText, styles.menuTextPrimary]}>
                    Edit Post
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuOption}
                  onPress={handleSharePost}
                >
                  <IconsOutline.ShareIcon
                    size={20}
                    color="#4B50B2"
                    style={styles.menuIcon}
                  />
                  <Text style={[styles.menuText, styles.menuTextPrimary]}>
                    Share Post
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuOption}
                  onPress={handleHidePost}
                >
                  <IconsOutline.EyeSlashIcon
                    size={20}
                    color="#FFA726"
                    style={styles.menuIcon}
                  />
                  <Text style={[styles.menuText, styles.menuTextWarning]}>
                    Hide from Feed
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuOption}
                  onPress={handleDeletePost}
                >
                  <IconsOutline.TrashIcon
                    size={20}
                    color="#FF6B6B"
                    style={styles.menuIcon}
                  />
                  <Text style={[styles.menuText, styles.menuTextError]}>
                    Delete Post
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Other User's Post Options */}
                <TouchableOpacity
                  style={styles.menuOption}
                  onPress={handleSharePost}
                >
                  <IconsOutline.ShareIcon
                    size={20}
                    color="#4B50B2"
                    style={styles.menuIcon}
                  />
                  <Text style={[styles.menuText, styles.menuTextPrimary]}>
                    Share Post
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuOption}
                  onPress={handleReportPost}
                >
                  <IconsOutline.FlagIcon
                    size={20}
                    color="#FF6B6B"
                    style={styles.menuIcon}
                  />
                  <Text style={[styles.menuText, styles.menuTextError]}>
                    Report Post
                  </Text>
                </TouchableOpacity>

                {post.author?._id && (
                  <View style={[styles.menuOption, { paddingVertical: 8 }]}>
                    <BlockUserButton
                      userId={post.author._id as any}
                      userName={post.author.userName}
                      onBlockStatusChange={() => setShowMenu(false)}
                      style={{
                        backgroundColor: "transparent",
                        borderWidth: 1,
                        borderColor: "#FF6B6B",
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                      }}
                      textStyle={{
                        color: "#FF6B6B",
                        fontSize: 14,
                        fontWeight: "500",
                      }}
                    />
                  </View>
                )}
              </>
            )}

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.menuCancelButton}
              onPress={() => setShowMenu(false)}
            >
              <Text style={styles.menuCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Report Modal */}
      <ReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        contentId={post._id}
        contentType="post"
        contentAuthorId={post.author?._id as any}
        contentAuthorName={post.author?.userName}
      />
    </TouchableOpacity>
  );
};

export default PostCard;

const styles = StyleSheet.create((theme) => ({
  // Main card container
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Header section
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  // Avatar
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: theme.colors.onPrimary,
    fontSize: 16,
    fontWeight: "bold",
  },

  // User info
  userInfo: {
    flex: 1,
  },
  userNameContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.onSurface,
  },
  onlineStatus: {
    marginLeft: 6,
  },
  timestamp: {
    fontSize: 12,
    color: theme.colors.grey500,
  },

  // Post type badge
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "white",
    textTransform: "capitalize",
  },
  typeIcon: {
    marginRight: 4,
  },

  // Menu button
  menuButton: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: theme.colors.grey100,
  },

  // Content
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.onSurface,
    marginBottom: 8,
  },
  content: {
    fontSize: 14,
    color: theme.colors.onSurface,
    lineHeight: 20,
    marginBottom: 12,
  },

  // Tags
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
    gap: 6,
  },
  tag: {
    backgroundColor: theme.colors.grey100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    color: theme.colors.grey600,
  },

  // Actions section
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.grey100,
  },

  // Action buttons
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  actionIcon: {
    marginRight: 6,
  },
  actionText: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.grey500,
  },

  // Modal overlays
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Edit modal
  editModal: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    margin: 20,
    width: "90%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.onSurface,
    marginBottom: 16,
    textAlign: "center",
  },

  // Form sections
  formSection: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.onSurface,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    padding: 12,
    color: theme.colors.onSurface,
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme.colors.grey200,
  },
  contentInput: {
    textAlignVertical: "top",
    minHeight: 120,
  },
  characterCount: {
    fontSize: 12,
    color: theme.colors.grey500,
    textAlign: "right",
    marginTop: 4,
  },

  // Edit tags
  editTagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
    gap: 6,
  },
  editTag: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  editTagText: {
    color: theme.colors.onPrimary,
    fontSize: 12,
    marginRight: 4,
  },
  tagHint: {
    fontSize: 12,
    color: theme.colors.grey500,
    marginBottom: 4,
  },

  // Modal buttons
  modalButtonsContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: theme.colors.grey100,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
  },
  disabledButton: {
    opacity: 0.5,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButtonText: {
    color: theme.colors.grey600,
  },
  saveButtonText: {
    color: theme.colors.onPrimary,
  },

  // Menu modal
  menuModal: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    margin: 20,
    minWidth: 250,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.onSurface,
    marginBottom: 16,
    textAlign: "center",
  },

  // Menu options
  menuOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  menuIcon: {
    marginRight: 12,
  },
  menuText: {
    fontSize: 16,
    flex: 1,
  },
  menuTextDefault: {
    color: theme.colors.onSurface,
  },
  menuTextPrimary: {
    color: theme.colors.primary,
  },
  menuTextWarning: {
    color: theme.colors.warning || "#FFA726",
  },
  menuTextError: {
    color: theme.colors.error || "#FF6B6B",
  },

  // Cancel button in menu
  menuCancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.grey100,
    borderRadius: 8,
    alignItems: "center",
  },
  menuCancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.grey600,
  },
}));
