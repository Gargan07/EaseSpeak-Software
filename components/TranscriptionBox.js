import React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import ActionButtons from "./ActionButtons";

export default function TranscriptionBox({
  transcription,
  setTranscription,
  uploadAudio,
  loading,
  onRedo,
  onCopy,
}) {
  return (
    <View style={styles.transcriptionBox}>
      {/* Fixed label at top */}
      <Text style={styles.transcriptionLabel}>Transcription</Text>

      {/* Text input or loader */}
      {loading ? (
        <ActivityIndicator size="large" color="#895FFF" />
      ) : (
        <TextInput
          style={styles.transcriptionText}
          value={transcription}
          onChangeText={setTranscription}
          placeholder="No transcription available"
          multiline
          textAlign="center"
        />
      )}

      {/* Action buttons */}
      <ActionButtons
        onTranscribe={uploadAudio}
        onRedo={onRedo}
        onCopy={onCopy}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  transcriptionBox: {
    position: "absolute",
    bottom: 50,
    width: "114%",
    minHeight: 350,
    backgroundColor: "white",
    paddingTop: 25, // leave space for the fixed label
    paddingBottom: 20,
    alignItems: "center",
    justifyContent: "space-between",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  transcriptionLabel: {
    position: "absolute",
    top: -50, // fixed from top of the box
    fontSize: 30,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    width: "100%",
  },
  transcriptionText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "black",
    textAlign: "center",
    width: "95%",
  },
});
