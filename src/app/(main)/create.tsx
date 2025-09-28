import CustomText from "@/components/ui/CustomText";
import { api } from "@/convex/_generated/api";
import { useUserStore } from "@/store/useUserStore";
import { useMutation } from "convex/react";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  DeviceEventEmitter,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as IconsOutline from "react-native-heroicons/outline";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { StyleSheet } from "react-native-unistyles";
import { PRIMARY_COLOR } from "unistyles";

const CreateScreen = () => {
  const { currentUser } = useUserStore();
  const scrollViewRef = useRef<ScrollView>(null);

  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createPost = useMutation(api.posts.createPost);

  const handleAddTag = () => {
    const cleaned = newTag.trim().toLowerCase();

    if (!cleaned) return;

    if (cleaned.length > 10) {
      Alert.alert("Error", "Each tag must be at most 10 characters.");
      return;
    }

    if (tags.includes(cleaned)) {
      Alert.alert("Error", "This tag is already added.");
      return;
    }

    if (tags.length >= 3) {
      Alert.alert("Error", "You can only add up to 3 tags.");
      return;
    }

    setTags([...tags, cleaned]);
    setNewTag("");
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      DeviceEventEmitter.emit("showLoginPrompt");
      return;
    }
    if (!content.trim()) {
      Alert.alert("Error", "Please write your post content");
      return;
    }
    if (content.trim().length < 10) {
      Alert.alert("Error", "Post content must be at least 10 characters long");
      return;
    }
    if (content.trim().length > 5000) {
      Alert.alert("Error", "Post content cannot exceed 5000 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      await createPost({
        content: content.trim(),
        title: title.trim() || undefined,
        tags: tags.length > 0 ? tags : undefined,
        visibility: "public",
        type: "other",
      });

      Alert.alert("Success", "Your post has been created!", [
        {
          text: "OK",
          onPress: () => {
            setContent("");
            setTitle("");
            setTags([]);
            setNewTag("");
          },
        },
      ]);
    } catch (error) {
      console.error("Create post error:", error);
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to create post. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAwareScrollView
      enableOnAndroid={true}
      enableAutomaticScroll={true}
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      bounces
    >
      {/* Title Input */}
      <View style={styles.section}>
        <CustomText style={styles.label} variant="label" bold>
          Title (Optional)
        </CustomText>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Give your post a title..."
          placeholderTextColor={"gray"}
          style={styles.input}
          maxLength={100}
        />
      </View>

      {/* Content Input */}
      <View style={styles.section}>
        <TextInput
          value={content}
          onChangeText={setContent}
          placeholder="Write your post here..."
          placeholderTextColor={"gray"}
          multiline
          numberOfLines={8}
          style={[styles.input, styles.contentInput]}
          maxLength={5000}
          textBreakStrategy="highQuality"
        />
        <CustomText
          style={[
            styles.charCount,
            (content.length < 10 || content.length > 5000) &&
              styles.charCountError,
          ]}
          variant="small"
        >
          {content.length}/5000
        </CustomText>
        {content.length < 10 && content.length > 0 && (
          <CustomText style={styles.charHint} variant="small" color="error">
            Minimum 10 characters required
          </CustomText>
        )}
      </View>

      {/* Tags */}
      <View style={styles.section}>
        <CustomText style={styles.label} variant="label" semibold>
          Tags (Optional)
        </CustomText>

        {tags.length > 0 && (
          <View style={styles.tagsWrapper}>
            {tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <CustomText style={styles.tagText} variant="small">
                  #{tag}
                </CustomText>
                <TouchableOpacity onPress={() => handleRemoveTag(tag)}>
                  <IconsOutline.XMarkIcon size={12} color={"white"} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        {tags.length < 3 && (
          <View style={styles.tagInputWrapper}>
            <TextInput
              value={newTag}
              onChangeText={setNewTag}
              placeholder="Add a tag..."
              placeholderTextColor={"gray"}
              style={styles.tagInput}
              maxLength={10}
              onSubmitEditing={handleAddTag}
            />
            <TouchableOpacity
              onPress={handleAddTag}
              disabled={!newTag.trim()}
              style={[
                styles.tagButton,
                !newTag.trim() && styles.tagButtonDisabled,
              ]}
            >
              <IconsOutline.PlusIcon
                size={16}
                color={newTag.trim() ? "white" : "gray"}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        onPress={handleSubmit}
        disabled={!content.trim() || content.length < 10 || isSubmitting}
        style={[
          styles.submitButton,
          (!content.trim() || content.length < 10 || isSubmitting) &&
            styles.submitButtonDisabled,
          isSubmitting && styles.submitButtonLoading,
        ]}
      >
        {isSubmitting ? (
          <View style={styles.submitLoadingWrapper}>
            <ActivityIndicator
              color={PRIMARY_COLOR}
              size="small"
              style={{ marginRight: 8 }}
            />
            <CustomText variant="label">Posting...</CustomText>
          </View>
        ) : (
          <CustomText
            style={[
              (!content.trim() || content.length < 10) &&
                styles.submitTextDisabled,
            ]}
            variant="label"
          >
            Share Your Confession
          </CustomText>
        )}
      </TouchableOpacity>
    </KeyboardAwareScrollView>
  );
};

export default CreateScreen;

const styles = StyleSheet.create((theme, rt) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  scrollContent: {
    padding: theme.paddingHorizontal,
    paddingBottom: rt.insets.bottom,
  },
  section: {
    marginBottom: theme.gap(4),
  },

  label: {
    marginBottom: theme.gap(2),
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.large,
    padding: theme.gap(4),
    fontSize: 12,
    color: theme.colors.onBackground,
    fontFamily: theme.fonts.Regular,
  },
  contentInput: {
    textAlignVertical: "top",
    minHeight: 120,
  },
  charCount: {
    textAlign: "right",
    marginTop: theme.gap(1),
  },
  charCountError: {
    color: theme.colors.error,
  },
  charHint: {
    textAlign: "right",
    marginTop: theme.gap(1),
  },
  tagsWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: theme.gap(2),
    gap: theme.gap(2),
  },
  tag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.gap(3),
    paddingVertical: theme.gap(1.5),
    borderRadius: theme.radii.large,
  },
  tagText: {
    marginRight: theme.gap(1),
  },
  tagInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.gap(2),
  },
  tagInput: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.regular,
    padding: theme.gap(3),
    color: theme.colors.onBackground,
    fontFamily: theme.fonts.Regular,
    fontSize: 12,
  },
  tagButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.gap(3),
    borderRadius: theme.radii.regular,
  },
  tagButtonDisabled: {
    backgroundColor: theme.colors.grey200,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.gap(4),
    borderRadius: theme.radii.large,
    alignItems: "center",
    marginBottom: theme.gap(8),
  },
  submitButtonDisabled: {
    backgroundColor: theme.colors.grey200,
  },
  submitButtonLoading: {
    opacity: 0.7,
  },
  submitLoadingWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },

  submitTextDisabled: {
    color: theme.colors.grey400,
  },
}));
