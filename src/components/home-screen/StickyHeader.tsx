import React, { useState } from "react";
import { ViewProps } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";

interface StickyHeaderProps extends ViewProps {
  scrollY: any; // SharedValue<number>
  headerHeight: number;
  stickyHeight: number;
  children: React.ReactNode;
}

const StickyHeader: React.FC<StickyHeaderProps> = ({
  scrollY,
  headerHeight,
  stickyHeight,
  children,
  ...rest
}) => {
  const isStickyVisible = useDerivedValue(() => scrollY.value > headerHeight);
  const [renderChildren, setRenderChildren] = useState(false);
  const [pointerEvents, setPointerEvents] = useState<"auto" | "none">("none");

  useAnimatedReaction(
    () => isStickyVisible.value,
    (visible, prev) => {
      if (visible !== prev) {
        runOnJS(setPointerEvents)(visible ? "auto" : "none");

        if (visible) {
          runOnJS(setRenderChildren)(true);
        }
      }
    },
    [isStickyVisible]
  );

  const animatedStyle = useAnimatedStyle(() => {
    const translateY = isStickyVisible.value
      ? withTiming(0, { duration: 200 })
      : withTiming(-stickyHeight, { duration: 200 }, (finished) => {
          if (finished && !isStickyVisible.value) {
            // Unmount after hide animation completes
            runOnJS(setRenderChildren)(false);
          }
        });

    const opacity = isStickyVisible.value
      ? withTiming(1, { duration: 200 })
      : withTiming(0, { duration: 200 });

    return {
      transform: [{ translateY }],
      opacity,
      elevation: 8,
    };
  });

  return (
    <Animated.View
      style={[animatedStyle, styles.stickySortBar]}
      pointerEvents={pointerEvents}
      {...rest}
    >
      {renderChildren ? children : null}
    </Animated.View>
  );
};

export default StickyHeader;

const styles = StyleSheet.create((theme, rt) => ({
  stickySortBar: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: theme.paddingHorizontal,
    backgroundColor: theme.colors.grey200,
    paddingTop: rt.insets.top + theme.spacing.large,
    paddingBottom: theme.gap(2),
    elevation: 3,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.primary,
    gap: theme.gap(2),
  },
}));
