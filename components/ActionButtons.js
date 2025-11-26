import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";

export default function ActionButtons({ onTranscribe, onRedo, onCopy }) {
  return React.createElement(
    View,
    { style: styles.buttonRow },
    React.createElement(
      TouchableOpacity,
      { style: [styles.button, styles.saveButton], onPress: onTranscribe },
      React.createElement(Text, { style: styles.buttonText }, "Transcribe")
    ),
    React.createElement(
      TouchableOpacity,
      { style: [styles.button, styles.redoButton], onPress: onRedo },
      React.createElement(Text, { style: styles.buttonText }, "Redo")
    ),
    React.createElement(
      TouchableOpacity,
      { style: [styles.button, styles.testButton], onPress: onCopy },
      React.createElement(Text, { style: styles.buttonText }, "Copy")
    )
  );
}

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 5,
  },
  saveButton: { backgroundColor: "#895FFF" },
  redoButton: { backgroundColor: "#FFA500" },
  testButton: { backgroundColor: "#E84855" },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
});
