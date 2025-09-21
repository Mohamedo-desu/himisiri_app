import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUserStore } from "@/store/useUserStore";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { formatDistanceToNowStrict } from "date-fns";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Easing,
  Modal,
  Platform,
  ScrollView,
  Share,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import AnimatedNumbers from "react-native-animated-numbers";
import * as IconsOutline from "react-native-heroicons/outline";
import { SvgXml } from "react-native-svg";
import Toast from "react-native-toast-message";
import { StyleSheet } from "react-native-unistyles";
import CustomText from "../ui/CustomText";
import OnlineStatusIndicator from "../ui/OnlineStatusIndicator";
import { ReportModal } from "../ui/ReportModal";

type CommentCardProps = {
  comment: {
    _id: Id<"comments">;
    _creationTime: number;
    content: string;
    likesCount: number;
    hasLiked: boolean;
    editedAt?: number;
    author?: {
      _id: string;
      userName: string;
      imageUrl?: string;
    } | null;
    isAnonymous: boolean;
  };
  onPress?: () => void;
  isHighlighted?: boolean;
};

const CommentCard = ({
  comment,
  onPress,
  isHighlighted = false,
}: CommentCardProps) => {
  const { currentUser } = useUserStore();
  const [liking, setLiking] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const toggleCommentLike = useMutation(api.likes.toggleCommentLike);
  const updateComment = useMutation(api.comments.updateComment);
  const blockUser = useMutation(api.userBlocking.blockUser);
  const deleteComment = useMutation(api.comments.deleteComment);

  const isMyComment =
    currentUser && comment.author && comment.author._id === currentUser._id;

  const handleLike = async () => {
    if (!currentUser) {
      Toast.show({
        type: "warning",
        text1: "Sign In Required",
        text2: "Please sign in to like comments",
      });
      return;
    }

    if (liking) return;

    try {
      setLiking(true);
      await toggleCommentLike({ commentId: comment._id });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Failed to Like",
        text2: "Please try again later",
      });
    } finally {
      setLiking(false);
    }
  };

  const handleEditComment = () => {
    setShowMenu(false);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      if (editContent.length < 1 || editContent.length > 2000) {
        Toast.show({
          type: "warning",
          text1: "Invalid Content",
          text2: "Comment must be between 1 and 2000 characters",
        });
        return;
      }

      await updateComment({
        commentId: comment._id,
        content: editContent,
      });

      setShowEditModal(false);
      Toast.show({
        type: "success",
        text1: "Comment Updated",
        text2: "Your comment has been updated successfully",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Update Failed",
        text2: "Please try again later",
      });
    }
  };

  const handleDeleteComment = () => {
    setShowMenu(false);
    Alert.alert(
      "Delete Comment",
      "Are you sure you want to delete this comment? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteComment({ commentId: comment._id });
              Toast.show({
                type: "success",
                text1: "Comment Deleted",
                text2: "Your comment has been deleted successfully",
              });
            } catch (error) {
              Toast.show({
                type: "error",
                text1: "Delete Failed",
                text2: "Please try again later",
              });
            }
          },
        },
      ]
    );
  };

  const handleViewStats = () => {
    setShowMenu(false);
    Toast.show({
      type: "info",
      text1: "Comment Statistics",
      text2: `${comment.likesCount || 0} likes • Created ${new Date(comment._creationTime).toLocaleDateString()}`,
    });
  };

  const handleShareComment = () => {
    setShowMenu(false);
    handleShare();
  };

  const handleShare = async () => {
    try {
      const shareContent = {
        title: "Comment from Himisiri",
        message: `Check out this comment: "${comment.content.substring(0, 100)}${
          comment.content.length > 100 ? "..." : ""
        }"`,
      };

      if (Platform.OS === "web") {
        if (navigator.share) {
          await navigator.share({
            title: shareContent.title,
            text: shareContent.message,
          });
        } else {
          await navigator.clipboard.writeText(shareContent.message);
          Toast.show({
            type: "success",
            text1: "Copied to Clipboard",
            text2: "Comment has been copied successfully",
          });
        }
      } else {
        await Share.share({
          title: shareContent.title,
          message: shareContent.message,
        });
      }
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Share Failed",
        text2: "Unable to share comment at the moment",
      });
    }
  };

  const handleReportComment = () => {
    setShowMenu(false);
    setShowReportModal(true);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080)
      return `${Math.floor(diffInMinutes / 1440)}d ago`;

    return date.toLocaleDateString();
  };

  const displayAuthor = comment.isAnonymous
    ? "Anonymous"
    : comment.author?.userName || "Unknown User";
  const authorImage = comment.isAnonymous ? null : comment.author?.imageUrl;

  return (
    <TouchableOpacity
      style={[styles.container, isHighlighted && styles.highlightedContainer]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        {/* Avatar */}
        <TouchableOpacity
          style={styles.avatar}
          onPress={() => {
            if (!comment.isAnonymous && comment.author?._id) {
              if (comment.author._id === currentUser?._id) {
                // Navigate to own profile
                router.push("/(main)/(tabs)/profile");
              } else {
                // Navigate to user details
                router.push({
                  pathname: "/(main)/user/[userId]",
                  params: { userId: comment.author._id },
                });
              }
            }
          }}
        >
          {authorImage ? (
            <SvgXml xml={authorImage} width={40} height={40} />
          ) : (
            <Text style={styles.avatarText}>
              {displayAuthor.charAt(0).toUpperCase() || "?"}
            </Text>
          )}
        </TouchableOpacity>

        {/* User Info */}
        <View style={styles.userInfo}>
          <View style={styles.userNameContainer}>
            <Text style={styles.userName}>{displayAuthor}</Text>
            {!comment.isAnonymous && comment.author?._id && (
              <OnlineStatusIndicator
                userId={comment.author._id as any}
                size="small"
                style={styles.onlineStatus}
              />
            )}
          </View>
          <Text style={styles.timestamp}>
            {formatDistanceToNowStrict(comment._creationTime)}
            {comment.editedAt && " • edited"}
          </Text>
        </View>

        {/* Menu Button */}
        <TouchableOpacity
          onPress={() => setShowMenu(true)}
          style={styles.menuButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <IconsOutline.EllipsisVerticalIcon size={16} color="#616161" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <CustomText
          variant="body1"
          color="onBackground"
          style={styles.commentText}
        >
          {comment.content}
        </CustomText>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, comment.hasLiked && styles.liked]}
          onPress={handleLike}
          disabled={liking}
        >
          <Ionicons
            name={comment.hasLiked ? "heart" : "heart-outline"}
            size={18}
            color={comment.hasLiked ? "#FF6B6B" : "#666"}
          />
          <AnimatedNumbers
            includeComma
            animateToNumber={comment.likesCount || 0}
            fontStyle={[
              styles.actionText,
              comment.hasLiked && { color: "#FF6B6B" },
            ]}
            easing={Easing.out(Easing.cubic)}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={18} color="#666" />
          <CustomText variant="caption" color="muted" style={styles.actionText}>
            Share
          </CustomText>
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
            <Text style={styles.editModalTitle}>Edit Comment</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Content Input */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Content</Text>
                <TextInput
                  value={editContent}
                  onChangeText={setEditContent}
                  placeholder="What's on your mind..."
                  placeholderTextColor="#BDBDBD"
                  multiline
                  numberOfLines={4}
                  style={[styles.textInput, styles.contentInput]}
                  maxLength={2000}
                />
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 4,
                  }}
                >
                  <Text style={styles.characterCount}>
                    <AnimatedNumbers
                      includeComma
                      animateToNumber={editContent.length}
                      fontStyle={styles.characterCount}
                      easing={Easing.out(Easing.cubic)}
                    />
                    /2000
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.modalButtonsContainer}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowEditModal(false);
                    // Reset values
                    setEditContent(comment.content);
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
                    editContent.length < 1 && styles.disabledButton,
                  ]}
                  onPress={handleSaveEdit}
                  disabled={editContent.length < 1}
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
            <Text style={styles.menuTitle}>Comment Options</Text>

            {/* Menu Options */}
            {isMyComment ? (
              <>
                {/* My Comment Options */}
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
                  onPress={handleEditComment}
                >
                  <IconsOutline.PencilIcon
                    size={20}
                    color="#4B50B2"
                    style={styles.menuIcon}
                  />
                  <Text style={[styles.menuText, styles.menuTextPrimary]}>
                    Edit Comment
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuOption}
                  onPress={handleShareComment}
                >
                  <IconsOutline.ShareIcon
                    size={20}
                    color="#4B50B2"
                    style={styles.menuIcon}
                  />
                  <Text style={[styles.menuText, styles.menuTextPrimary]}>
                    Share Comment
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuOption}
                  onPress={handleDeleteComment}
                >
                  <IconsOutline.TrashIcon
                    size={20}
                    color="#FF6B6B"
                    style={styles.menuIcon}
                  />
                  <Text style={[styles.menuText, styles.menuTextError]}>
                    Delete Comment
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                {/* Other User's Comment Options */}
                <TouchableOpacity
                  style={styles.menuOption}
                  onPress={handleShareComment}
                >
                  <IconsOutline.ShareIcon
                    size={20}
                    color="#4B50B2"
                    style={styles.menuIcon}
                  />
                  <Text style={[styles.menuText, styles.menuTextPrimary]}>
                    Share Comment
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuOption}
                  onPress={handleReportComment}
                >
                  <IconsOutline.FlagIcon
                    size={20}
                    color="#FF6B6B"
                    style={styles.menuIcon}
                  />
                  <Text style={[styles.menuText, styles.menuTextError]}>
                    Report Comment
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuOption}
                  onPress={() => {
                    if (comment.author?._id) {
                      Alert.alert(
                        "Block User",
                        `Are you sure you want to block ${comment.author.userName}? You will no longer see their posts, comments, or replies, and they won't be able to interact with your content.`,
                        [
                          {
                            text: "Cancel",
                            style: "cancel",
                          },
                          {
                            text: "Block",
                            style: "destructive",
                            onPress: async () => {
                              try {
                                await blockUser({
                                  userId: comment.author!._id as Id<"users">,
                                });
                                Toast.show({
                                  type: "success",
                                  text1: "User Blocked",
                                  text2: `${comment.author!.userName} has been blocked successfully`,
                                });
                                setShowMenu(false);
                              } catch (error) {
                                Toast.show({
                                  type: "error",
                                  text1: "Failed to Block User",
                                  text2: "Please try again later",
                                });
                              }
                            },
                          },
                        ]
                      );
                    }
                  }}
                >
                  <IconsOutline.NoSymbolIcon
                    size={20}
                    color="#FF6B6B"
                    style={styles.menuIcon}
                  />
                  <Text style={[styles.menuText, styles.menuTextError]}>
                    Block User
                  </Text>
                </TouchableOpacity>
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
        contentId={comment._id}
        contentType="comment"
        contentAuthorId={comment.author?._id as any}
        contentAuthorName={comment.author?.userName}
      />
    </TouchableOpacity>
  );
};

export default CommentCard;

const styles = StyleSheet.create((theme) => ({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 16,
    shadowColor: theme.colors.grey500,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  highlightedContainer: {
    borderWidth: 3,
    borderColor: "#007AFF", // Use a fixed blue color for testing
    backgroundColor: "rgba(0, 122, 255, 0.1)", // Light blue background
    shadowColor: "#007AFF",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  authorSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  authorImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  anonymousAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.grey200,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  authorInfo: {
    flex: 1,
  },
  content: {
    marginBottom: 16,
  },
  commentText: {
    lineHeight: 22,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.grey300,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 16,
    borderRadius: 6,
  },
  liked: {
    backgroundColor: theme.colors.grey200,
  },
  actionText: {
    marginLeft: 4,
  },

  // Menu button
  menuButton: {
    padding: 4,
    borderRadius: 16,
    backgroundColor: theme.colors.grey100,
    marginLeft: 8,
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
    maxHeight: "70%",
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
    minHeight: 80,
  },
  characterCount: {
    fontSize: 12,
    color: theme.colors.grey500,
    textAlign: "right",
    marginTop: 4,
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
