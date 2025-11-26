import React from "react";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  useWindowDimensions,
} from "react-native";

export default function ActionButtons({ onTranscribe, onRedo, onCopy }) {
  const { width } = useWindowDimensions();
  const isTablet = width > 600;

  return (
    <View
      style={[
        styles.buttonRow,
        {
          paddingHorizontal: isTablet ? 20 : 10,
          maxWidth: 700, // Prevent stretching on large screens
          alignSelf: "center",
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.button,
          styles.saveButton,
          {
            paddingVertical: isTablet ? 18 : 12,
          },
        ]}
        onPress={onTranscribe}
      >
        <Text style={[styles.buttonText, { fontSize: isTablet ? 20 : 16 }]}>
          Transcribe
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          styles.redoButton,
          {
            paddingVertical: isTablet ? 18 : 12,
          },
        ]}
        onPress={onRedo}
      >
        <Text style={[styles.buttonText, { fontSize: isTablet ? 20 : 16 }]}>
          Redo
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          styles.testButton,
          {
            paddingVertical: isTablet ? 18 : 12,
          },
        ]}
        onPress={onCopy}
      >
        <Text style={[styles.buttonText, { fontSize: isTablet ? 20 : 16 }]}>
          Copy
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  button: {
    flex: 1,
    borderRadius: 5,
    alignItems: "center",
    marginHorizontal: 6,
  },
  saveButton: { backgroundColor: "#895FFF" },
  redoButton: { backgroundColor: "#FFA500" },
  testButton: { backgroundColor: "#E84855" },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "bold",
    textAlign: "center",
  },
});
