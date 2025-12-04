import { useState, useRef } from "react";
import { Audio } from "expo-av";
import { Alert, Vibration } from "react-native";
import { playAlertSound } from "../services/soundUtils";

export function useAudioRecorder() {
  const [recording, setRecording] = useState(null);
  const [recordingUri, setRecordingUri] = useState(null);
  const [microphoneAllowed, setMicrophoneAllowed] = useState(null);
  const [volumeLevel, setVolumeLevel] = useState(null); // real-time metering
  const alreadyAskedRef = useRef(false);
  const intervalRef = useRef(null);
  const noiseCheckActiveRef = useRef(true);

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
  const startRecording = async (onPulseStart, onPulseStop, resetSilence) => {
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

      noiseCheckActiveRef.current = true;

      setTimeout(() => {
        noiseCheckActiveRef.current = false; // stop noise detection after 3s
      }, 3000);

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

          if (!noiseCheckActiveRef.current) return;

          // --- Noise alert logic still works ---
          if (status?.metering > -45 && !alreadyAskedRef.current) {
            alreadyAskedRef.current = true;

            // STOP interval immediately to prevent repeated alerts
            clearInterval(intervalRef.current);

            playAlertSound();
            Vibration.vibrate();

            await newRecording.stopAndUnloadAsync();
            onPulseStop?.();
            setRecording(null);
            setVolumeLevel(null);

            Alert.alert(
              "Too Noisy!",
              "Transcription may not be accurate. Continue recording?",
              [
                {
                  text: "Cancel",
                  style: "cancel",
                  onPress: async () => {
                    alreadyAskedRef.current = false;
                    clearInterval(intervalRef.current);
                    resetSilence?.();
                  },
                },
                {
                  text: "OK",
                  onPress: async () => {
                    clearInterval(intervalRef.current);
                    resetSilence?.();
                    // same here, do not reset
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

  const stopRecording = async (onPulseStop) => {
    try {
      clearInterval(intervalRef.current);
      setVolumeLevel(null);

      if (!recording) {
        onPulseStop?.();
        setRecording(null);
        return null;
      }

      const status = await recording.getStatusAsync();
      if (status.isRecording) {
        await recording.stopAndUnloadAsync();
      }

      const uri = recording.getURI();
      setRecordingUri(uri);
      return uri;
    } catch (error) {
      console.error("Error stopping recording:", error);
      return null;
    } finally {
      onPulseStop?.();
      setRecording(null);
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
