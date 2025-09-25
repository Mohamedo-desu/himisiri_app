import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { ConvexError } from "convex/values";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as IconsOutline from "react-native-heroicons/outline";
import Toast from "react-native-toast-message";
import { StyleSheet, withUnistyles } from "react-native-unistyles";
import CustomText from "../ui/CustomText";

type ReportReason =
  | "inappropriate_content"
  | "false_information"
  | "hate_speech"
  | "sexual_content"
  | "violence_threats"
  | "self_harm_content"
  | "doxxing_personal_info"
  | "illegal_activity"
  | "spam_repetitive"
  | "copyright_violation"
  | "other";

type ContentType = "post" | "comment" | "confession" | "story" | "other";

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  contentId: string;
  contentType: ContentType;
  contentAuthorId: Id<"users">;
  contentAuthorName?: string;
}

const REPORT_REASONS = [
  {
    key: "inappropriate_content",
    label: "Inappropriate Content",
    description: "General inappropriate or offensive content",
  },
  {
    key: "false_information",
    label: "False Information",
    description: "Misinformation, fake stories, or misleading content",
  },
  {
    key: "hate_speech",
    label: "Hate Speech",
    description: "Discriminatory language or harassment based on identity",
  },
  {
    key: "sexual_content",
    label: "Sexual Content",
    description: "Inappropriate sexual or adult content",
  },
  {
    key: "violence_threats",
    label: "Violence or Threats",
    description: "Content promoting violence or containing threats",
  },
  {
    key: "self_harm_content",
    label: "Self-Harm Content",
    description: "Content promoting self-harm or dangerous activities",
  },
  {
    key: "doxxing_personal_info",
    label: "Personal Information",
    description: "Sharing personal information without consent",
  },
  {
    key: "illegal_activity",
    label: "Illegal Activity",
    description: "Content about or promoting illegal activities",
  },
  {
    key: "spam_repetitive",
    label: "Spam",
    description: "Spam, repetitive, or promotional content",
  },
  {
    key: "copyright_violation",
    label: "Copyright Violation",
    description: "Unauthorized use of copyrighted material",
  },
  {
    key: "other",
    label: "Other",
    description: "Other issues not covered by the above categories",
  },
];

const ThemedCloseIcon = withUnistyles(IconsOutline.XMarkIcon, (theme) => ({
  size: theme.gap(3),
  color: theme.colors.grey500,
}));

export const ReportModal: React.FC<ReportModalProps> = ({
  visible,
  onClose,
  contentId,
  contentType,
  contentAuthorId,
  contentAuthorName,
}) => {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(
    null
  );
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reportContent = useMutation(api.reports.reportContent);

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert("Error", "Please select a reason for reporting.");
      return;
    }

    if (selectedReason === "other" && description.trim().length < 10) {
      Alert.alert(
        "Error",
        "Please provide at least 10 characters for 'Other'."
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await reportContent({
        contentId,
        contentType,
        contentAuthorId,
        reason: selectedReason,
        description: description.trim() || undefined,
      });

      Alert.alert(
        "Report Submitted",
        "Thank you. Our moderation team will review this.",
        [{ text: "OK", onPress: handleClose }]
      );
    } catch (error) {
      if (error instanceof ConvexError) {
        Toast.show({
          type: "error",
          text1: "Failed to submit report.",
          text2: error.data,
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Failed to submit report.",
          text2: "Something went wrong, please try again.",
        });
      }
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedReason(null);
    setDescription("");
    setIsSubmitting(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <CustomText variant="subtitle1" bold style={styles.title}>
              Report {contentType}
            </CustomText>
            <TouchableOpacity onPress={handleClose} hitSlop={10}>
              <ThemedCloseIcon />
            </TouchableOpacity>
          </View>

          {contentAuthorName && (
            <CustomText
              variant="caption"
              color="grey500"
              style={styles.subtitle}
            >
              Reporting content from @{contentAuthorName}
            </CustomText>
          )}

          {/* Content */}
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            <CustomText variant="body1" semibold style={styles.sectionTitle}>
              Why are you reporting this {contentType}?
            </CustomText>

            {REPORT_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason.key}
                style={[
                  styles.reasonOption,
                  selectedReason === reason.key && styles.reasonOptionSelected,
                ]}
                onPress={() => setSelectedReason(reason.key as ReportReason)}
              >
                <View style={styles.reasonHeader}>
                  <CustomText
                    variant="body2"
                    semibold
                    style={[
                      styles.reasonLabel,
                      selectedReason === reason.key &&
                        styles.reasonLabelSelected,
                    ]}
                  >
                    {reason.label}
                  </CustomText>
                  <View
                    style={[
                      styles.radioButton,
                      selectedReason === reason.key &&
                        styles.radioButtonSelected,
                    ]}
                  >
                    {selectedReason === reason.key && (
                      <View style={styles.radioButtonInner} />
                    )}
                  </View>
                </View>
                <CustomText
                  variant="caption"
                  color="grey500"
                  style={styles.reasonDescription}
                >
                  {reason.description}
                </CustomText>
              </TouchableOpacity>
            ))}

            {/* Additional Description */}
            <View style={styles.descriptionSection}>
              <CustomText variant="body1" semibold style={styles.sectionTitle}>
                Additional Details{" "}
                {selectedReason === "other" ? "(Required)" : "(Optional)"}
              </CustomText>
              <TextInput
                style={styles.descriptionInput}
                placeholder="Provide additional context..."
                placeholderTextColor="#BDBDBD"
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
                maxLength={500}
              />
              <CustomText
                variant="caption"
                color="grey500"
                style={styles.characterCount}
              >
                {description.length}/500
              </CustomText>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={isSubmitting}
            >
              <CustomText semibold style={styles.cancelButtonText}>
                Cancel
              </CustomText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!selectedReason || isSubmitting) &&
                  styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!selectedReason || isSubmitting}
            >
              <CustomText
                semibold
                style={[
                  styles.submitButtonText,
                  (!selectedReason || isSubmitting) &&
                    styles.submitButtonTextDisabled,
                ]}
              >
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </CustomText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create((theme) => ({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: theme.gap(2),
  },
  modalContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.large,
    width: "100%",
    maxWidth: 400,
    height: "85%",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.gap(2),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey100,
  },
  title: {
    color: theme.colors.onSurface,
  },
  subtitle: {
    paddingHorizontal: theme.gap(2),
    marginTop: theme.gap(1),
  },
  content: { flex: 1 },
  scrollContent: {
    padding: theme.gap(2),
    paddingBottom: theme.gap(6),
  },
  sectionTitle: {
    marginBottom: theme.gap(1),
  },
  reasonOption: {
    borderWidth: 1,
    borderColor: theme.colors.grey200,
    borderRadius: theme.radii.regular,
    padding: theme.gap(1.5),
    marginBottom: theme.gap(1),
    backgroundColor: theme.colors.background,
  },
  reasonOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + "10",
  },
  reasonHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.gap(0.5),
  },
  reasonLabel: {
    color: theme.colors.onSurface,
  },
  reasonLabelSelected: {
    color: theme.colors.primary,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: theme.colors.grey300,
    alignItems: "center",
    justifyContent: "center",
  },
  radioButtonSelected: {
    borderColor: theme.colors.primary,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
  },
  reasonDescription: {
    marginTop: theme.gap(0.5),
  },
  descriptionSection: {
    marginTop: theme.gap(2),
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: theme.colors.grey200,
    borderRadius: theme.radii.regular,
    padding: theme.gap(1.5),
    minHeight: 100,
    fontSize: 16,
    textAlignVertical: "top",
    color: theme.colors.onSurface,
  },
  characterCount: {
    textAlign: "right",
    marginTop: theme.gap(0.5),
  },
  footer: {
    flexDirection: "row",
    padding: theme.gap(2),
    gap: theme.gap(1),
    borderTopWidth: 1,
    borderTopColor: theme.colors.grey100,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: theme.gap(1.5),
    borderRadius: theme.radii.regular,
    backgroundColor: theme.colors.grey100,
    alignItems: "center",
  },
  cancelButtonText: {
    color: theme.colors.grey700,
  },
  submitButton: {
    flex: 1,
    paddingVertical: theme.gap(1.5),
    borderRadius: theme.radii.regular,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: theme.colors.grey300,
  },
  submitButtonText: {
    color: theme.colors.onPrimary,
  },
  submitButtonTextDisabled: {
    color: theme.colors.grey500,
  },
}));
