import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
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
import { StyleSheet } from "react-native-unistyles";

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

const REPORT_REASONS: {
  key: ReportReason;
  label: string;
  description: string;
}[] = [
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
        "Please provide a detailed description for 'Other' reports (minimum 10 characters)."
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
        "Thank you for your report. Our moderation team will review this content.",
        [{ text: "OK", onPress: handleClose }]
      );
    } catch (error) {
      console.error("Error submitting report:", error);
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to submit report. Please try again."
      );
    } finally {
      setIsSubmitting(false);
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
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Report {contentType}</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <IconsOutline.XMarkIcon size={24} color="#616161" />
            </TouchableOpacity>
          </View>

          {contentAuthorName && (
            <Text style={styles.subtitle}>
              Reporting content from @{contentAuthorName}
            </Text>
          )}

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            {/* Reason Selection */}
            <Text style={styles.sectionTitle}>
              Why are you reporting this {contentType}?
            </Text>

            {REPORT_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason.key}
                style={[
                  styles.reasonOption,
                  selectedReason === reason.key && styles.reasonOptionSelected,
                ]}
                onPress={() => setSelectedReason(reason.key)}
              >
                <View style={styles.reasonContent}>
                  <View style={styles.reasonHeader}>
                    <Text
                      style={[
                        styles.reasonLabel,
                        selectedReason === reason.key &&
                          styles.reasonLabelSelected,
                      ]}
                    >
                      {reason.label}
                    </Text>
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
                  <Text style={styles.reasonDescription}>
                    {reason.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}

            {/* Additional Description */}
            <View style={styles.descriptionSection}>
              <Text style={styles.sectionTitle}>
                Additional Details{" "}
                {selectedReason === "other" ? "(Required)" : "(Optional)"}
              </Text>
              <TextInput
                style={styles.descriptionInput}
                placeholder="Provide additional context about this report..."
                placeholderTextColor="#BDBDBD"
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
                maxLength={500}
              />
              <Text style={styles.characterCount}>
                {description.length}/500
              </Text>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleClose}
              disabled={isSubmitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
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
              <Text
                style={[
                  styles.submitButtonText,
                  (!selectedReason || isSubmitting) &&
                    styles.submitButtonTextDisabled,
                ]}
              >
                {isSubmitting ? "Submitting..." : "Submit Report"}
              </Text>
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  modalContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    marginHorizontal: 16,
    width: "90%",
    height: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    display: "flex",
    flexDirection: "column",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.grey100,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.onSurface,
    textTransform: "capitalize",
  },
  closeButton: {
    padding: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.grey500,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.onSurface || "#000000",
    marginBottom: 16,
  },
  reasonOption: {
    borderWidth: 1,
    borderColor: theme.colors.grey200,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  reasonOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + "10",
  },
  reasonContent: {
    flex: 1,
  },
  reasonHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  reasonLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: theme.colors.onSurface || "#000000",
    flex: 1,
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
    fontSize: 14,
    color: theme.colors.grey500 || "#666666",
    lineHeight: 18,
  },
  descriptionSection: {
    marginTop: 20,
    marginBottom: 10,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: theme.colors.grey200,
    borderRadius: 8,
    padding: 12,
    color: theme.colors.onSurface,
    fontSize: 16,
    textAlignVertical: "top",
    minHeight: 100,
  },
  characterCount: {
    fontSize: 12,
    color: theme.colors.grey500,
    textAlign: "right",
    marginTop: 4,
  },
  footer: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.grey100,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.grey100,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.grey600,
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: theme.colors.grey300,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.onPrimary,
  },
  submitButtonTextDisabled: {
    color: theme.colors.grey500,
  },
}));
