import React from "react";
import { TouchableOpacity, Animated, StyleSheet } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";

export default function MicButton({
  onPress,
  isRecording,
  pulseAnim,
  disabled,
}) {
  return React.createElement(
    Animated.View,
    { style: { transform: [{ scale: pulseAnim }] } },
    React.createElement(
      TouchableOpacity,
      {
        testID: "mic-button", // ✅ ADDED THIS
        style: [
          styles.micButton,
          {
            backgroundColor: isRecording ? "#ffffff" : "#FFF",
            opacity: disabled ? 0.6 : 1,
          },
        ],
        onPress: disabled ? null : onPress,
        activeOpacity: 0.7,
      },
      React.createElement(FontAwesome5, {
        name: "microphone",
        size: 40,
        color: "#6357F6",
      })
    )
  );
}

const styles = StyleSheet.create({
  micButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
});
