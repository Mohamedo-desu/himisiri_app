import { useAuth } from "@clerk/clerk-expo";
import React from "react";
import { Button, View } from "react-native";

import { StyleSheet } from "react-native-unistyles";

const ProfileScreen = () => {
  const { signOut } = useAuth();
  return (
    <View>
      <Button
        title="Log out"
        onPress={() => {
          signOut();
        }}
      />
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({});
