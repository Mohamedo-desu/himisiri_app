import React from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as IconsOutline from "react-native-heroicons/outline";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUnistyles } from "react-native-unistyles";

const ExploreScreen = () => {
  const { theme } = useUnistyles();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView style={{ flex: 1, padding: 16 }}>
        {/* Search Bar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: theme.colors.surface,
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 12,
            marginBottom: 20,
          }}
        >
          <IconsOutline.MagnifyingGlassIcon
            size={20}
            color={theme.colors.grey100}
            style={{ marginRight: 12 }}
          />
          <TextInput
            placeholder="Search confessions, topics..."
            placeholderTextColor={theme.colors.grey100}
            style={{
              flex: 1,
              color: theme.colors.onBackground,
              fontSize: 16,
            }}
          />
        </View>

        {/* Trending Topics */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              color: theme.colors.onBackground,
              marginBottom: 16,
            }}
          >
            Trending Topics
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {["Love", "Work", "Family", "Secrets", "Dreams", "Regrets"].map(
              (topic, index) => (
                <TouchableOpacity
                  key={index}
                  style={{
                    backgroundColor: theme.colors.primary,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 20,
                    marginRight: 12,
                  }}
                >
                  <Text
                    style={{
                      color: theme.colors.onPrimary,
                      fontWeight: "600",
                    }}
                  >
                    #{topic}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </ScrollView>
        </View>

        {/* Categories */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              color: theme.colors.onBackground,
              marginBottom: 16,
            }}
          >
            Categories
          </Text>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            {[
              { name: "Confessions", icon: IconsOutline.ChatBubbleLeftIcon },
              { name: "Stories", icon: IconsOutline.BookOpenIcon },
              { name: "Questions", icon: IconsOutline.QuestionMarkCircleIcon },
              { name: "Advice", icon: IconsOutline.LightBulbIcon },
            ].map((category, index) => (
              <TouchableOpacity
                key={index}
                style={{
                  backgroundColor: theme.colors.surface,
                  padding: 16,
                  borderRadius: 12,
                  alignItems: "center",
                  width: "48%",
                }}
              >
                <category.icon size={24} color={theme.colors.primary} />
                <Text
                  style={{
                    color: theme.colors.onBackground,
                    marginTop: 8,
                    fontWeight: "600",
                  }}
                >
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Popular Posts */}
        <View>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              color: theme.colors.onBackground,
              marginBottom: 16,
            }}
          >
            Popular This Week
          </Text>

          {/* Add your post feed component here */}
          <View
            style={{
              backgroundColor: theme.colors.surface,
              padding: 16,
              borderRadius: 12,
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                color: theme.colors.onBackground,
                textAlign: "center",
                fontStyle: "italic",
              }}
            >
              Popular posts will appear here
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ExploreScreen;
