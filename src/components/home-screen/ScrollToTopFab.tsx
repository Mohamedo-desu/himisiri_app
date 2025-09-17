import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { TouchableOpacity } from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StyleSheet } from "react-native-unistyles";
import { TAB_BAR_HEIGHT } from "../tabs/CustomTabBar";

interface ScrollToTopFabProps {
  onPress: () => void;
  scrollY: SharedValue<number>;
}

const ScrollToTopFab: React.FC<ScrollToTopFabProps> = ({
  onPress,
  scrollY,
}) => {
  const insets = useSafeAreaInsets();
  const animatedStyle = useAnimatedStyle(() => {
    const visible = scrollY.value > 80;
    return {
      opacity: withTiming(visible ? 1 : 0, { duration: 160 }),
      transform: [
        { translateY: withTiming(visible ? 0 : 80, { duration: 160 }) },
      ],
      pointerEvents: visible ? "auto" : "none",
    };
  });
  const fabStyle = [
    styles.fabContainer,
    { bottom: TAB_BAR_HEIGHT + insets.bottom + 0 },
  ];
  return (
    <Animated.View style={[fabStyle, animatedStyle]}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={styles.fab}
      >
        <Ionicons name="arrow-up-circle-sharp" size={24} color="#fff" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create((theme, rt) => ({
  fabContainer: {
    position: "absolute",
    right: theme.paddingHorizontal,
    // bottom is set dynamically
    backgroundColor: theme.colors.primary,
    borderRadius: theme.gap(5),
    width: theme.gap(7),
    height: theme.gap(7),
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
    overflow: "hidden",
    borderCurve: "continuous",
  },
  fab: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
}));

export default ScrollToTopFab;
