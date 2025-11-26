import { useState, useRef } from "react";
import { Audio } from "expo-av";
import { Alert, Vibration } from "react-native";
import { playAlertSound } from "../services/soundUtils";

export function useAudioRecorder() {
  const [recording, setRecording] = useState(null);
  const [recordingUri, setRecordingUri] = useState(null);
  const [microphoneAllowed, setMicrophoneAllowed] = useState(null);
  const [alreadyAsked, setAlreadyAsked] = useState(false);
  const intervalRef = useRef(null);

  // --- Request microphone permission safely ---
  const requestPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      // Safe state update, no React warnings
      setMicrophoneAllowed(status === "granted");
      return status === "granted";
    } catch (err) {
      console.error("Error requesting mic permissions:", err);
      return false;
    }
  };

  // --- Start recording ---
  const startRecording = async (onPulseStart, onPulseStop) => {
    try {
      if (microphoneAllowed === null) {
        // Avoid state updates before React finishes rendering
        requestAnimationFrame(async () => {
          const granted = await requestPermissions();
          if (!granted) return;
        });
        return;
      }

      if (!microphoneAllowed) {
        Alert.alert(
          "Microphone Access Required",
          "Do you allow this app to access the microphone?",
          [
            {
              text: "No",
              style: "cancel",
              onPress: () => setTimeout(() => setMicrophoneAllowed(false), 0),
            },
            {
              text: "Yes",
              onPress: async () => {
                const granted = await requestPermissions();
                if (!granted) return;
              },
            },
          ]
        );
        return;
      }

      // Stop any existing recording first
      if (recording) {
        try {
          await recording.unloadAsync();
        } catch (err) {
          console.warn("No active recording to stop:", err);
        }
        setTimeout(() => setRecording(null), 0);
      }

      // Configure audio mode
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      // Create and prepare a new recording
      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync({
        isMeteringEnabled: true,
        android: {
          extension: ".wav",
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_WAV,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_PCM,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: ".wav",
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_WAV,
          audioEncoder: Audio.RECORDING_OPTION_IOS_AUDIO_ENCODER_PCM,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
      });

      await newRecording.startAsync();
      setTimeout(() => setRecording(newRecording), 0);
      onPulseStart?.();

      // --- Continuous noise check (every 0.5s for 2s) ---
      intervalRef.current = setInterval(async () => {
        try {
          const status = await newRecording.getStatusAsync();
          if (status?.metering > -45 && !alreadyAsked) {
            playAlertSound();
            Vibration.vibrate();

            Alert.alert(
              "Too Noisy!",
              "Transcription may not be accurate. Do you still want to continue recording?",
              [
                {
                  text: "Cancel",
                  style: "cancel",
                  onPress: async () => {
                    // Stop everything and reset
                    clearInterval(intervalRef.current);
                    await newRecording.stopAndUnloadAsync();
                    onPulseStop?.();
                    setRecording(null);
                  },
                },
                {
                  text: "OK",
                  onPress: async () => {
                    // Mark that we already asked once
                    setAlreadyAsked(true);

                    // Still stop current recording just like "Cancel"
                    clearInterval(intervalRef.current);
                    await newRecording.stopAndUnloadAsync();
                    onPulseStop?.();
                    setRecording(null);
                  },
                },
              ]
            );
          }
        } catch (err) {
          console.warn("Metering check error:", err);
        }
      }, 500);

      // Stop checking after 2 seconds
      setTimeout(() => clearInterval(intervalRef.current), 2000);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  // --- Stop recording ---
  const stopRecording = async (onPulseStop) => {
    try {
      clearInterval(intervalRef.current);
      if (!recording) {
        onPulseStop?.();
        setTimeout(() => setRecording(null), 0);
        return;
      }

      const status = await recording.getStatusAsync();
      if (status.isRecording) {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setTimeout(() => setRecordingUri(uri), 0);
      }
    } catch (error) {
      console.error("Error stopping recording:", error);
    } finally {
      onPulseStop?.();
      setTimeout(() => setRecording(null), 0);
    }
  };

  return {
    recording,
    recordingUri,
    startRecording,
    stopRecording,
    setRecordingUri,
  };
}
