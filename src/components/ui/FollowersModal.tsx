import { Id } from "@/convex/_generated/dataModel";
import React, { useState } from "react";
import { Easing, Modal, Pressable, Text, View } from "react-native";
import AnimatedNumbers from "react-native-animated-numbers";
import * as IconsOutline from "react-native-heroicons/outline";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUnistyles } from "react-native-unistyles";
import { FollowersList } from "./FollowersList";
import { FollowingList } from "./FollowingList";

interface FollowersModalProps {
  visible: boolean;
  onClose: () => void;
  userId: Id<"users">;
  currentUserId?: Id<"users">;
  initialTab?: "followers" | "following";
  followersCount: number;
  followingCount: number;
}

export const FollowersModal: React.FC<FollowersModalProps> = ({
  visible,
  onClose,
  userId,
  currentUserId,
  initialTab = "followers",
  followersCount,
  followingCount,
}) => {
  const { theme } = useUnistyles();
  const [activeTab, setActiveTab] = useState<"followers" | "following">(
    initialTab
  );

  React.useEffect(() => {
    if (visible) {
      setActiveTab(initialTab);
    }
  }, [visible, initialTab]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={{ flex: 1, backgroundColor: theme.colors.background }}
      >
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomWidth: 1,
            borderBottomColor: theme.colors.grey300,
          }}
        >
          <View style={{ width: 40 }} />

          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: theme.colors.onBackground,
            }}
          >
            {activeTab === "followers" ? "Followers" : "Following"}
          </Text>

          <Pressable
            onPress={onClose}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: theme.colors.surface,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <IconsOutline.XMarkIcon
              size={20}
              color={theme.colors.onBackground}
            />
          </Pressable>
        </View>

        {/* Tab Selector */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: theme.colors.surface,
            marginHorizontal: 16,
            marginTop: 16,
            borderRadius: 8,
            padding: 4,
          }}
        >
          <Pressable
            onPress={() => setActiveTab("followers")}
            style={{
              flex: 1,
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 6,
              backgroundColor:
                activeTab === "followers"
                  ? theme.colors.primary
                  : "transparent",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color:
                  activeTab === "followers"
                    ? theme.colors.onPrimary
                    : theme.colors.onBackground,
              }}
            >
              Followers (
              <AnimatedNumbers
                includeComma
                animateToNumber={followersCount}
                fontStyle={{
                  fontSize: 14,
                  fontWeight: "600",
                  color:
                    activeTab === "followers"
                      ? theme.colors.onPrimary
                      : theme.colors.onBackground,
                }}
                easing={Easing.out(Easing.cubic)}
              />
              )
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab("following")}
            style={{
              flex: 1,
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 6,
              backgroundColor:
                activeTab === "following"
                  ? theme.colors.primary
                  : "transparent",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color:
                  activeTab === "following"
                    ? theme.colors.onPrimary
                    : theme.colors.onBackground,
              }}
            >
              Following (
              <AnimatedNumbers
                includeComma
                animateToNumber={followingCount}
                fontStyle={{
                  fontSize: 14,
                  fontWeight: "600",
                  color:
                    activeTab === "following"
                      ? theme.colors.onPrimary
                      : theme.colors.onBackground,
                }}
                easing={Easing.out(Easing.cubic)}
              />
              )
            </Text>
          </Pressable>
        </View>

        {/* Content */}
        <View style={{ flex: 1, marginTop: 8 }}>
          {activeTab === "followers" ? (
            <FollowersList userId={userId} currentUserId={currentUserId} />
          ) : (
            <FollowingList userId={userId} currentUserId={currentUserId} />
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};
