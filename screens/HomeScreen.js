import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import MicButton from "../components/MicButton";
import TranscriptionBox from "../components/TranscriptionBox";
import LogoHeader from "../components/LogoHeader";
import { useAudioRecorder } from "../hooks/useAudioRecorder";
import { useAudioUploader } from "../hooks/useAudioUploader";
import { usePulseAnimation } from "../hooks/usePulseAnimation";
import { clearCache } from "../services/fileUtils";

export default function HomeScreen() {
  const [transcription, setTranscription] = useState("");
  const {
    recording,
    recordingUri,
    startRecording,
    stopRecording,
    setRecordingUri,
  } = useAudioRecorder();
  const { uploadAudio, loading } = useAudioUploader(setTranscription);
  const { pulseAnim, startPulse, stopPulse } = usePulseAnimation();
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);

  useEffect(() => {
    clearCache();
  }, []);

  const handleMicPress = async () => {
    if (isButtonDisabled) return; // ignore if button is temporarily disabled
    setIsButtonDisabled(true); // disable for a moment

    if (recording) {
      await stopRecording(stopPulse);
    } else {
      await startRecording(startPulse, stopPulse);
    }

    // Re-enable the button after 1 second
    setTimeout(() => setIsButtonDisabled(false), 300);
  };

  const handleRedo = () => {
    setTranscription("");
    setRecordingUri(null);
    Alert.alert("Redo", "Recording and transcription cleared!");
  };

  const handleCopy = async () => {
    if (!transcription) {
      Alert.alert("Nothing to Copy", "There is no transcription text yet.");
      return;
    }
    await Clipboard.setStringAsync(transcription);
    Alert.alert("Copied", "Transcription copied to clipboard!");
  };

  return React.createElement(
    TouchableWithoutFeedback,
    { onPress: Keyboard.dismiss, accessible: false },
    React.createElement(
      SafeAreaView,
      { style: styles.safeArea },
      React.createElement(LogoHeader, null),
      React.createElement(
        View,
        { style: styles.container },
        React.createElement(MicButton, {
          isRecording: !!recording,
          onPress: handleMicPress,
          pulseAnim,
          disabled: isButtonDisabled,
        }),
        React.createElement(
          Text,
          { style: styles.statusText },
          recording ? "Listening..." : "Ready to listen..."
        ),
        React.createElement(TranscriptionBox, {
          transcription,
          setTranscription,
          uploadAudio: () =>
            uploadAudio(recordingUri, () => setRecordingUri(null)),
          loading,
          onRedo: handleRedo,
          onCopy: handleCopy,
        })
      )
    )
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#895FFF",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  container: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 20,
  },
  statusText: {
    fontSize: 16,
    color: "white",
    marginTop: 20,
    marginBottom: 20,
  },
  transcriptionLabel: {
    fontSize: 30,
    fontWeight: "bold",
    color: "white",
    marginBottom: 10,
    paddingTop: 120,
  },
});
