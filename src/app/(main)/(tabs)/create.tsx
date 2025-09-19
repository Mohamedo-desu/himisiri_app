import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as IconsOutline from "react-native-heroicons/outline";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUnistyles } from "react-native-unistyles";

const CreateScreen = () => {
  const { theme } = useUnistyles();
  const scrollViewRef = useRef<ScrollView>(null);
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [selectedType, setSelectedType] = useState<
    "confession" | "story" | "question" | "advice" | "other"
  >("confession");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createPost = useMutation(api.posts.createPost);

  const postTypes = [
    {
      id: "confession",
      label: "Confession",
      icon: IconsOutline.ChatBubbleLeftIcon,
    },
    { id: "story", label: "Story", icon: IconsOutline.BookOpenIcon },
    {
      id: "question",
      label: "Question",
      icon: IconsOutline.QuestionMarkCircleIcon,
    },
    { id: "advice", label: "Advice", icon: IconsOutline.LightBulbIcon },
    { id: "other", label: "Other", icon: IconsOutline.EllipsisHorizontalIcon },
  ] as const;

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim()) && tags.length < 5) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = async () => {
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
        type: selectedType,
        isAnonymous,
        tags: tags.length > 0 ? tags : undefined,
        visibility: "public", // Default to public, you can add UI for this later
      });

      Alert.alert("Success", "Your post has been created!", [
        {
          text: "OK",
          onPress: () => {
            // Reset form after success
            setContent("");
            setTitle("");
            setSelectedType("confession");
            setIsAnonymous(true);
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
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1, padding: 16 }}
          showsVerticalScrollIndicator={false}
          bounces={true}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Post Type Selection */}
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                color: theme.colors.onBackground,
                marginBottom: 12,
              }}
            >
              What would you like to share?
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              bounces={true}
              decelerationRate="fast"
              contentContainerStyle={{ paddingHorizontal: 4 }}
            >
              {postTypes.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  onPress={() => setSelectedType(type.id)}
                  style={{
                    backgroundColor:
                      selectedType === type.id
                        ? theme.colors.primary
                        : theme.colors.surface,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRadius: 20,
                    marginRight: 12,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <type.icon
                    size={18}
                    color={
                      selectedType === type.id
                        ? theme.colors.onPrimary
                        : theme.colors.onSurface
                    }
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={{
                      color:
                        selectedType === type.id
                          ? theme.colors.onPrimary
                          : theme.colors.onSurface,
                      fontWeight: "600",
                    }}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Title Input (Optional) */}
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: theme.colors.onBackground,
                marginBottom: 8,
              }}
            >
              Title (Optional)
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              onFocus={() => {
                setTimeout(() => {
                  scrollViewRef.current?.scrollTo({ y: 150, animated: true });
                }, 100);
              }}
              placeholder="Give your post a title..."
              placeholderTextColor={theme.colors.grey100}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: 12,
                padding: 16,
                color: theme.colors.onBackground,
                fontSize: 16,
              }}
              maxLength={100}
            />
          </View>

          {/* Content Input */}
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: theme.colors.onBackground,
                marginBottom: 8,
              }}
            >
              Your {selectedType} *
            </Text>
            <TextInput
              value={content}
              onChangeText={setContent}
              onFocus={() => {
                setTimeout(() => {
                  scrollViewRef.current?.scrollTo({ y: 300, animated: true });
                }, 100);
              }}
              placeholder={`Write your ${selectedType} here...`}
              placeholderTextColor={theme.colors.grey100}
              multiline
              numberOfLines={8}
              style={{
                backgroundColor: theme.colors.surface,
                borderRadius: 12,
                padding: 16,
                color: theme.colors.onBackground,
                fontSize: 16,
                textAlignVertical: "top",
                minHeight: 120,
              }}
              maxLength={5000}
            />
            <Text
              style={{
                color:
                  content.length < 10 || content.length > 5000
                    ? theme.colors.error || "#ff4757"
                    : theme.colors.grey100,
                fontSize: 12,
                textAlign: "right",
                marginTop: 4,
              }}
            >
              {content.length}/5000
            </Text>
            {content.length < 10 && content.length > 0 && (
              <Text
                style={{
                  color: theme.colors.error || "#ff4757",
                  fontSize: 11,
                  textAlign: "right",
                  marginTop: 2,
                }}
              >
                Minimum 10 characters required
              </Text>
            )}
          </View>

          {/* Tags */}
          <View style={{ marginBottom: 16 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: theme.colors.onBackground,
                marginBottom: 8,
              }}
            >
              Tags (Optional)
            </Text>

            {/* Existing Tags */}
            {tags.length > 0 && (
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  marginBottom: 8,
                  gap: 8,
                }}
              >
                {tags.map((tag, index) => (
                  <View
                    key={index}
                    style={{
                      backgroundColor: theme.colors.primary,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 16,
                      flexDirection: "row",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: theme.colors.onPrimary,
                        fontSize: 14,
                        marginRight: 4,
                      }}
                    >
                      #{tag}
                    </Text>
                    <TouchableOpacity onPress={() => handleRemoveTag(tag)}>
                      <IconsOutline.XMarkIcon
                        size={14}
                        color={theme.colors.onPrimary}
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Add Tag Input */}
            {tags.length < 5 && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <TextInput
                  value={newTag}
                  onChangeText={setNewTag}
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollTo({
                        y: 500,
                        animated: true,
                      });
                    }, 100);
                  }}
                  placeholder="Add a tag..."
                  placeholderTextColor={theme.colors.grey100}
                  style={{
                    flex: 1,
                    backgroundColor: theme.colors.surface,
                    borderRadius: 8,
                    padding: 12,
                    color: theme.colors.onBackground,
                  }}
                  maxLength={20}
                  onSubmitEditing={handleAddTag}
                />
                <TouchableOpacity
                  onPress={handleAddTag}
                  disabled={!newTag.trim()}
                  style={{
                    backgroundColor: newTag.trim()
                      ? theme.colors.primary
                      : theme.colors.grey100,
                    padding: 12,
                    borderRadius: 8,
                  }}
                >
                  <IconsOutline.PlusIcon
                    size={16}
                    color={
                      newTag.trim()
                        ? theme.colors.onPrimary
                        : theme.colors.grey300
                    }
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!content.trim() || content.length < 10 || isSubmitting}
            style={{
              backgroundColor:
                content.trim() && content.length >= 10 && !isSubmitting
                  ? theme.colors.primary
                  : theme.colors.grey100,
              padding: 16,
              borderRadius: 12,
              alignItems: "center",
              marginBottom: 32,
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting ? (
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <ActivityIndicator
                  color={theme.colors.onPrimary}
                  size="small"
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{
                    color: theme.colors.onPrimary,
                    fontSize: 16,
                    fontWeight: "bold",
                  }}
                >
                  Posting...
                </Text>
              </View>
            ) : (
              <Text
                style={{
                  color:
                    content.trim() && content.length >= 10
                      ? theme.colors.onPrimary
                      : theme.colors.grey300,
                  fontSize: 16,
                  fontWeight: "bold",
                }}
              >
                Share Your{" "}
                {selectedType.charAt(0).toUpperCase() + selectedType.slice(1)}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreateScreen;
