import { EnrichedPost } from "@/types";
import { format } from "date-fns";
import React, { useState } from "react";
import { View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { StyleSheet } from "react-native-unistyles";
import CustomText from "../ui/CustomText";
import UserAvatar from "../ui/UserAvatar";

const PostStickyHeader = ({
  post,
  scrollY,
}: {
  post: EnrichedPost;
  scrollY: any;
}) => {
  // Store the measured height of the header
  const [headerHeight, setHeaderHeight] = useState(0);

  // Capture the layout height on mount / change
  const onLayoutHeader = (event) => {
    const { height } = event.nativeEvent.layout;
    setHeaderHeight(height);
  };

  const stickyHeaderStyle = useAnimatedStyle(() => {
    if (!headerHeight || headerHeight <= 0) {
      return { transform: [{ translateY: -50 }] }; // initial hidden state
    }

    const lowerThreshold = headerHeight * 0.95;
    const upperThreshold = headerHeight * 1.6;

    // interpolate scrollY into a translateY that moves the header into view
    const translateY = interpolate(
      scrollY.value,
      [lowerThreshold, upperThreshold], // scroll range
      [-headerHeight, 0], // from hidden (-height) to visible (0)
      Extrapolation.CLAMP
    );

    return {
      transform: [{ translateY }],
      opacity: 1, // always visible (just sliding)
    };
  }, [headerHeight]);

  if (!post) {
    return null;
  }

  return (
    <Animated.View
      style={[styles.stickyHeader, stickyHeaderStyle]}
      onLayout={onLayoutHeader}
    >
      <View style={styles.header}>
        {/* Avatar */}
        <View style={styles.avatar}>
          <UserAvatar
            imageUrl={post.author?.imageUrl as string}
            size={40}
            userId={post.author?._id}
            indicatorSize="medium"
          />
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <CustomText variant="label" semibold color="onSurface">
            {post.author?.userName}
          </CustomText>
          <CustomText variant="tiny" color="grey500">
            {format(new Date(post._creationTime), "MMM d, yyyy • h:mm a")}
          </CustomText>
        </View>
      </View>
      <CustomText variant="label" color="grey800" numberOfLines={3}>
        {post.content}
      </CustomText>
    </Animated.View>
  );
};

export default PostStickyHeader;

const styles = StyleSheet.create((theme) => ({
  stickyHeader: {
    alignItems: "flex-start",
    backgroundColor: theme.colors.background,
    borderBottomColor: theme.colors.primary,
    justifyContent: "center",
    padding: theme.paddingHorizontal,
    position: "absolute",
    elevation: 10,
    left: 0,
    right: 0,
    top: 0,
    zIndex: 1000,
    borderBottomWidth: 1.5,
  },
  userInfo: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: theme.gap(1),
  },

  avatar: {
    marginRight: theme.gap(1),
  },
}));
