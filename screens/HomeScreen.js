import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
  useWindowDimensions,
} from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";

import MicButton from "../components/MicButton";
import TranscriptionBox from "../components/TranscriptionBox";
import LogoHeader from "../components/LogoHeader";

import { useAudioRecorder } from "../hooks/useAudioRecorder";
import { useAudioUploader } from "../hooks/useAudioUploader";
import { usePulseAnimation } from "../hooks/usePulseAnimation";
import { clearCache } from "../services/fileUtils";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [transcription, setTranscription] = useState("");
  const { width } = useWindowDimensions();
  const isTablet = width > 600;

  const {
    recording,
    recordingUri,
    startRecording,
    stopRecording,
    setRecordingUri,
    volumeLevel,
  } = useAudioRecorder();

  const { uploadAudio, loading } = useAudioUploader(setTranscription);
  const { pulseAnim, startPulse, stopPulse } = usePulseAnimation();
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [statusText, setStatusText] = useState(
    "Press mic to start recording..."
  );

  const SILENCE_THRESHOLD = -35; // quiet enough
  const SILENCE_DURATION = 5000;
  const silenceStartRef = useRef(null);
  const resetSilence = () => {
    silenceStartRef.current = null;
  };

  useEffect(() => {
    clearCache();
  }, []);

  useEffect(() => {
    let timer;

    if (recording) {
      // Step 1: Immediately show "Start talking..."
      setStatusText("Start talking...");

      // Step 2: After 2 seconds, show "Listening..."
      timer = setTimeout(() => {
        setStatusText("Listening...");

        // Step 3: After 1 more second, show "Listening... Press mic to stop..."
        timer = setTimeout(() => {
          setStatusText("Listening... Press mic to stop...");
        }, 2000);
      }, 3000);
    } else {
      // Reset to initial state when recording stops
      setStatusText("Press mic to start recording...");
    }

    return () => clearTimeout(timer); // clears last timer if recording stops early
  }, [recording]);

  // --- AUTO STOP WHEN USER IS SILENT FOR 5 SECONDS ---
  useEffect(() => {
    if (!recording) return;

    let interval = setInterval(() => {
      if (volumeLevel !== null && volumeLevel < SILENCE_THRESHOLD) {
        if (!silenceStartRef.current) {
          silenceStartRef.current = Date.now();
        } else {
          const elapsed = Date.now() - silenceStartRef.current;

          if (elapsed >= SILENCE_DURATION) {
            console.log("AUTO STOP triggered");

            // STOP RECORDING
            stopRecording(stopPulse).then((uri) => {
              if (uri) {
                console.log("Uploading auto-stopped recording:", uri);

                uploadAudio(uri, () => {
                  setRecordingUri(null);
                });
              }
            });

            silenceStartRef.current = null;
            clearInterval(interval);
          }
        }
      } else {
        silenceStartRef.current = null;
      }
    }, 100);

    return () => clearInterval(interval);
  }, [recording, volumeLevel]);

  const handleMicPress = async () => {
    if (isButtonDisabled) return;
    setIsButtonDisabled(true);

    recording
      ? await stopRecording(stopPulse)
      : await startRecording(startPulse, stopPulse, resetSilence);

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

  return (
    <SafeAreaProvider>
      <KeyboardAvoidingView
        style={{ flex: 1, width: "100%", backgroundColor: "#895FFF" }}
        behavior="height"
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View
            style={[
              styles.container,
              { paddingBottom: insets.bottom, paddingTop: insets.top },
            ]}
          >
            <LogoHeader />

            <MicButton
              isRecording={!!recording}
              onPress={handleMicPress}
              pulseAnim={pulseAnim}
              disabled={isButtonDisabled}
              size={isTablet ? width * 0.2 : width * 0.25}
            />

            <Text style={[styles.statusText, { fontSize: isTablet ? 20 : 16 }]}>
              {statusText}
            </Text>

            <View style={styles.bottomBoxWrapper}>
              <TranscriptionBox
                transcription={transcription}
                setTranscription={setTranscription}
                uploadAudio={() =>
                  uploadAudio(recordingUri, () => setRecordingUri(null))
                }
                loading={loading}
                onRedo={handleRedo}
                onCopy={handleCopy}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 10,
    backgroundColor: "#895FFF",
  },
  statusText: {
    color: "white",
    marginVertical: 20,
    textAlign: "center",
  },
  bottomBoxWrapper: {
    width: "100%",
    alignItems: "center",
    justifyContent: "flex-end",
    flex: 1,
  },
});
