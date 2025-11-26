import React from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ActionButtons from "./ActionButtons";

export default function TranscriptionBox({
  transcription,
  setTranscription,
  uploadAudio,
  loading,
  onRedo,
  onCopy,
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isTablet = width > 600;

  return (
    <View
      style={[
        styles.wrapper,
        {
          paddingBottom: (isTablet ? -10 : -20) + insets.bottom, // respect safe area
          paddingTop: isTablet ? 30 : 20,
          minHeight: isTablet ? 470 : 350,
          maxWidth: 700,
        },
      ]}
    >
      {/* Label Floating Above Box */}
      <Text
        style={[styles.transcriptionLabel, { fontSize: isTablet ? 36 : 28 }]}
      >
        Transcription
      </Text>

      {/* Loader or Editable Text */}
      {loading ? (
        <ActivityIndicator size="large" color="#895FFF" />
      ) : (
        <TextInput
          style={[
            styles.transcriptionText,
            {
              fontSize: isTablet ? 24 : 18,
              width: "92%",
              maxHeight: height * 0.25,
            },
          ]}
          value={transcription}
          onChangeText={setTranscription}
          placeholder="No transcription available"
          multiline
          textAlign="center"
          blurOnSubmit
        />
      )}

      {/* Buttons */}
      <View style={{ width: "100%", marginTop: 10 }}>
        <ActionButtons
          onTranscribe={uploadAudio}
          onRedo={onRedo}
          onCopy={onCopy}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10, // Android shadow
  },
  transcriptionLabel: {
    position: "absolute",
    top: -45,
    fontWeight: "bold",
    color: "#ffffff",
    width: "100%",
    textAlign: "center",
  },
  transcriptionText: {
    fontWeight: "bold",
    color: "black",
    textAlign: "center",
  },
});
