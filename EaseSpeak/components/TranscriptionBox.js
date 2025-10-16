import React from "react";
import { View, TextInput, StyleSheet, ActivityIndicator } from "react-native";
import ActionButtons from "./ActionButtons";

export default function TranscriptionBox({
  transcription,
  setTranscription,
  uploadAudio,
  loading,
  onRedo,
  onCopy,
}) {
  return React.createElement(
    View,
    { style: styles.transcriptionBox },
    loading
      ? React.createElement(ActivityIndicator, {
          size: "large",
          color: "#895FFF",
        })
      : React.createElement(TextInput, {
          style: styles.transcriptionText,
          value: transcription,
          onChangeText: setTranscription,
          placeholder: "No transcription available",
          multiline: true,
          textAlign: "center",
        }),
    React.createElement(ActionButtons, {
      onTranscribe: uploadAudio,
      onRedo,
      onCopy,
    })
  );
}

const styles = StyleSheet.create({
  transcriptionBox: {
    position: "absolute",
    bottom: 50,
    width: "114%",
    minHeight: 350,
    backgroundColor: "white",
    paddingTop: 25,
    paddingBottom: 20,
    alignItems: "center",
    justifyContent: "space-between",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  transcriptionText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "black",
    textAlign: "center",
    width: "95%",
  },
});
