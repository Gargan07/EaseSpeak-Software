import React from "react";
import {
  TouchableOpacity,
  Animated,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";

export default function MicButton({
  onPress,
  isRecording,
  pulseAnim,
  disabled,
}) {
  const { width } = useWindowDimensions();
  const isTablet = width > 600;

  // Button scales with screen size
  const size = isTablet ? width * 0.18 : width * 0.28;
  const iconSize = isTablet ? size * 0.35 : size * 0.33;

  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
      <TouchableOpacity
        testID="mic-button"
        style={[
          styles.micButton,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: isRecording ? "#ffffff" : "#FFF",
            opacity: disabled ? 0.6 : 1,
          },
        ]}
        onPress={disabled ? null : onPress}
        activeOpacity={0.7}
      >
        <FontAwesome5 name="microphone" size={iconSize} color="#6357F6" />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  micButton: {
    alignItems: "center",
    justifyContent: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
});
