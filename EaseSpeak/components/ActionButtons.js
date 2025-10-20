import React from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";

export default function ActionButtons({ onTranscribe, onRedo, onCopy }) {
  return (
    <View style={styles.buttonRow}>
      <TouchableOpacity
        testID="transcribe-button"
        style={[styles.button, styles.saveButton]}
        onPress={onTranscribe}
      >
        <Text style={styles.buttonText}>Transcribe</Text>
      </TouchableOpacity>

      <TouchableOpacity
        testID="redo-button"
        style={[styles.button, styles.redoButton]}
        onPress={onRedo}
      >
        <Text style={styles.buttonText}>Redo</Text>
      </TouchableOpacity>

      <TouchableOpacity
        testID="copy-button"
        style={[styles.button, styles.testButton]}
        onPress={onCopy}
      >
        <Text style={styles.buttonText}>Copy</Text>
      </TouchableOpacity>
    </View>
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
