import {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const SCROLL_THRESHOLD = 20;

export const useScrollAwareInput = (scrollY: any, hideHeight: number = 80) => {
  const translateY = useSharedValue(0);
  const lastScrollY = useSharedValue(0);
  const direction = useSharedValue<"up" | "down">("up");

  useDerivedValue(() => {
    const diff = scrollY.value - lastScrollY.value;

    if (scrollY.value <= 0) {
      translateY.value = withTiming(0, { duration: 200 });
      direction.value = "up";
    } else {
      if (diff > SCROLL_THRESHOLD && direction.value !== "down") {
        // scroll down → hide
        translateY.value = withTiming(hideHeight, { duration: 200 });
        direction.value = "down";
      } else if (diff < -SCROLL_THRESHOLD && direction.value !== "up") {
        // scroll up → show
        translateY.value = withTiming(0, { duration: 200 });
        direction.value = "up";
      }
    }

    lastScrollY.value = scrollY.value;
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: 1, // always visible
  }));

  return { animatedStyle };
};
