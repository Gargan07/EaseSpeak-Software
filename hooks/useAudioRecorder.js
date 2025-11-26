import { useState, useRef } from "react";
import { Audio } from "expo-av";
import { Alert, Vibration } from "react-native";
import { playAlertSound } from "../services/soundUtils";

export function useAudioRecorder() {
  const [recording, setRecording] = useState(null);
  const [recordingUri, setRecordingUri] = useState(null);
  const [microphoneAllowed, setMicrophoneAllowed] = useState(null);
  const [alreadyAsked, setAlreadyAsked] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(null); // real-time metering

  const intervalRef = useRef(null);

  // Request microphone permission
  const requestPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      setMicrophoneAllowed(status === "granted");
      return status === "granted";
    } catch (err) {
      console.error("Error requesting mic permissions:", err);
      return false;
    }
  };

  // Start audio recording
  const startRecording = async (onPulseStart, onPulseStop) => {
    try {
      if (microphoneAllowed === null) {
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

      // Stop existing recording if any
      if (recording) {
        try {
          await recording.unloadAsync();
        } catch {}
        setTimeout(() => setRecording(null), 0);
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

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

      // --- REAL-TIME METERING LOOP (every 100ms) ---
      intervalRef.current = setInterval(async () => {
        try {
          const status = await newRecording.getStatusAsync();

          // update dB level (-160 = silence, 0 = loud)
          if (status?.metering !== undefined) {
            setVolumeLevel(status.metering);
          }

          // --- Noise alert logic still works ---
          if (status?.metering > -45 && !alreadyAsked) {
            playAlertSound();
            Vibration.vibrate();

            Alert.alert(
              "Too Noisy!",
              "Transcription may not be accurate. Continue recording?",
              [
                {
                  text: "Cancel",
                  style: "cancel",
                  onPress: async () => {
                    clearInterval(intervalRef.current);
                    await newRecording.stopAndUnloadAsync();
                    onPulseStop?.();
                    setRecording(null);
                    setVolumeLevel(null);
                  },
                },
                {
                  text: "OK",
                  onPress: async () => {
                    setAlreadyAsked(true);
                    clearInterval(intervalRef.current);
                    await newRecording.stopAndUnloadAsync();
                    onPulseStop?.();
                    setRecording(null);
                    setVolumeLevel(null);
                  },
                },
              ]
            );
          }
        } catch (err) {
          console.warn("Metering check error:", err);
        }
      }, 100);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  // Stop recording
  const stopRecording = async (onPulseStop) => {
    try {
      clearInterval(intervalRef.current);
      setVolumeLevel(null);

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
    volumeLevel, // EXPORTED
  };
}
