import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  Animated,
  ActivityIndicator,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import * as FileSystem from "expo-file-system";
import * as Clipboard from "expo-clipboard";
import { Audio } from "expo-av";
import { FontAwesome5 } from "@expo/vector-icons";
import { Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen({ route }) {
  const [recording, setRecording] = useState(null);
  const [recordingUri, setRecordingUri] = useState(null);
  const [transcription, setTranscription] = useState("");
  const navigation = useNavigation();
  const [microphoneAllowed, setMicrophoneAllowed] = useState(
    route?.params?.microphoneAllowed ?? null
  );

  const [loading, setLoading] = useState(false);
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    clearCache();
  }, []);

  const requestPermissions = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    setMicrophoneAllowed(status === "granted");
  };

  const safeFetch = async (url, options, retries = 2, delay = 1000) => {
    try {
      return await fetch(url, options);
    } catch (err) {
      if (retries > 0) {
        console.warn(`Retrying... attempts left: ${retries}`);
        // wait before retrying
        await new Promise((res) => setTimeout(res, delay));
        return safeFetch(url, options, retries - 1, delay);
      }
      throw err;
    }
  };

  const startRecording = async () => {
    if (microphoneAllowed === null) {
      requestPermissions();
      return;
    }

    if (!microphoneAllowed) {
      Alert.alert(
        "Permission Denied",
        "Microphone access is required! Please enable it in settings."
      );
      return;
    }

    try {
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
      setRecording(newRecording);

      // Start the pulsing effect
      startPulseAnimation();
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) {
        console.warn("⚠️ No active recording to stop.");
        stopPulseAnimation(); // Always reset animation
        setRecording(null); // Ensure UI resets
        return;
      }

      // Check if it's actually recording
      const status = await recording.getStatusAsync();
      if (status.isRecording) {
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        setRecordingUri(uri);
        console.log("✅ Recording saved at:", uri);
      } else {
        console.warn("⚠️ Recording already stopped.");
      }

      setRecording(null); // Reset state
    } catch (error) {
      console.error("Error stopping recording:", error);
    } finally {
      stopPulseAnimation(); // Ensure pulse always stops
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1); // Reset scale
  };

  const uploadAudio = async () => {
    if (!recordingUri) {
      Alert.alert("Error", "No audio recorded!");
      return;
    }

    const fileInfo = await FileSystem.getInfoAsync(recordingUri);
    if (!fileInfo.exists) {
      Alert.alert("Error", "Recorded file does not exist!");
      return;
    }

    setLoading(true); // Show loading spinner

    const formData = new FormData();
    formData.append("file", {
      uri: recordingUri,
      name: "audio.wav",
      type: "audio/wav",
    });

    // const response = await fetch("http://192.168.1.9:8000/transcribe/"
    try {
      const response = await safeFetch(
        "http://192.168.1.2:8000/transcribe/?engine=wav2vec2",
        {
          method: "POST",
          body: formData,
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Server error ${response.status}: ${errText}`);
      }

      const data = await response.json();
      setTranscription(
        data.cleaned_transcription || "No transcription available"
      );
      console.log(transcription);

      setTimeout(async () => {
        try {
          await FileSystem.deleteAsync(recordingUri, { idempotent: true });
          console.log("Deleted recorded file:", recordingUri);
          setRecordingUri(null);
        } catch (deleteErr) {
          console.error("Error deleting file:", deleteErr);
        }
      }, 1000); // delay by 1 second

      setRecordingUri(null);
    } catch (error) {
      console.error("Error uploading audio:", error);
      // Alert.alert("Upload Failed", "Could not upload audio.");
    } finally {
      setLoading(false); // Hide loading spinner
    }
  };

  const redoRecording = async () => {
    if (recordingUri) {
      await FileSystem.deleteAsync(recordingUri, { idempotent: true });
      console.log("Deleted recorded file:", recordingUri);
      setRecordingUri(null);
    }
    setTranscription("");
    Alert.alert("Redo", "Recording and transcription cleared!");
  };

  const testConnection = async () => {
    if (transcription === "No transcription available") {
      Alert.alert("Nothing to Copy", "There is no transcription text yet.");
    } else if (transcription) {
      await Clipboard.setStringAsync(transcription);
      Alert.alert("Copied", "Transcription copied to clipboard!");
    } else {
      Alert.alert("Nothing to Copy", "Transcription is empty.");
    }

    // try {
    //   const response = await fetch("http://192.168.1.10:8000/test/", {
    //     method: "GET",
    //   });
    //   if (response.ok) {
    //     console.log("Successfully connected to FastAPI!");
    //     Alert.alert("Success", "Connected to FastAPI!");
    //   } else {
    //     console.error("Failed to connect to FastAPI:", response.status);
    //     Alert.alert("Error", "Could not connect to FastAPI.");
    //   }
    // } catch (error) {
    //   console.error("Error connecting:", error);
    //   Alert.alert("Error", "Could not reach FastAPI.");
    // }
  };

  const clearCache = async () => {
    try {
      const cacheDir = FileSystem.cacheDirectory;
      const files = await FileSystem.readDirectoryAsync(cacheDir);
      for (const file of files) {
        if (file.endsWith(".wav")) {
          await FileSystem.deleteAsync(`${cacheDir}${file}`, {
            idempotent: true,
          });
        }
      }
      console.log("Audio cache cleared!");
    } catch (error) {
      console.error("Error clearing cache:", error);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" />

        {/* Logo at the top */}
        <View style={styles.logoContainer}>
          <Image source={require("../assets/logo.png")} style={styles.logo} />
        </View>

        <View style={styles.container}>
          {/* Microphone Button */}
          {/* Mic Button with Pulsing Effect */}
          <TouchableOpacity
            style={[
              styles.micButton,
              { transform: [{ scale: pulseAnim }] }, // Apply animation here
            ]}
            onPress={recording ? stopRecording : startRecording}
          >
            <FontAwesome5 name="microphone" size={40} color="#6357F6" />
          </TouchableOpacity>

          <Text style={styles.statusText}>
            {recording ? "Listening..." : "Ready to listen..."}
          </Text>

          <View style={styles.transcriptionLabelContainer}>
            <Text style={styles.transcriptionLabel}>Transcription</Text>
          </View>
          {/* Transcription Box */}
          <View style={styles.transcriptionBox}>
            {loading ? (
              <ActivityIndicator size="large" color="#895FFF" />
            ) : (
              <TextInput
                style={styles.transcriptionText}
                value={transcription}
                onChangeText={setTranscription} // Updates state while typing
                placeholder="No transcription available"
                multiline
                editable
                textAlign="center"
              />
            )}

            {/* Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={uploadAudio}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.redoButton]}
                onPress={redoRecording}
              >
                <Text style={styles.buttonText}>Redo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.testButton]}
                onPress={testConnection}
              >
                <Text style={styles.buttonText}>Copy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
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
  logoContainer: {
    width: "100%",
    alignItems: "center",
    marginTop: -75, // Adjust spacing from the top
  },
  logo: {
    width: 600, // Make logo significantly bigger
    height: 250,
    resizeMode: "contain",
  },
  micContainer: {
    marginTop: 30, // Move mic closer to logo
    alignItems: "center",
  },
  micButton: {
    backgroundColor: "#FFFFFF",
    width: 120, // Increase mic button size
    height: 120,
    borderRadius: 60, // Keep circular shape
    alignItems: "center",
    justifyContent: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  statusText: {
    fontSize: 16,
    color: "white",
    marginTop: 20,
    marginBottom: 20,
  },
  transcriptionBox: {
    position: "absolute",
    bottom: 0,
    width: "114%",
    minHeight: 350,
    backgroundColor: "white",
    paddingTop: 25,
    paddingBottom: 20,
    paddingHorizontal: 0,
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
  saveButton: {
    backgroundColor: "#895FFF",
    padding: 10,
    borderRadius: 8,
  },
  redoButton: {
    backgroundColor: "#FFA500",
    padding: 10,
    borderRadius: 8,
  },
  testButton: {
    backgroundColor: "#E84855",
    padding: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: "#FFFFFF", // White text for contrast
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  transcriptionLabelContainer: {
    position: "absolute",
    bottom: 330 + 20, // match transcriptionBox height + spacing
    alignSelf: "center",
    backgroundColor: "#895FFF", // same as screen background
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },

  transcriptionLabel: {
    fontSize: 25,
    fontWeight: "bold",
    color: "white",
  },
});
