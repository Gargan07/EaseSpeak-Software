import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
} from "react-native";
import * as FileSystem from "expo-file-system";
import { Audio } from "expo-av";
import { FontAwesome5 } from "@expo/vector-icons";

export default function HomeScreen({ route }) {
  const [recording, setRecording] = useState(null);
  const [recordingUri, setRecordingUri] = useState(null);
  const [transcription, setTranscription] = useState("");
  const [microphoneAllowed, setMicrophoneAllowed] = useState(
    route?.params?.microphoneAllowed ?? null
  );

  useEffect(() => {
    clearCache();
  }, []);

  const requestPermissions = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    setMicrophoneAllowed(status === "granted");
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
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_DEFAULT,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_DEFAULT,
          sampleRate: 16000,
          numberOfChannels: 1,
          bitRate: 128000,
        },
        ios: {
          extension: ".wav",
          outputFormat: Audio.RECORDING_OPTION_IOS_OUTPUT_FORMAT_LINEARPCM,
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 16000,
          numberOfChannels: 1,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      });

      await newRecording.startAsync();
      setRecording(newRecording);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = async () => {
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordingUri(uri);
      setRecording(null);
      console.log("Recording saved at:", uri);
    } catch (error) {
      console.error("Error stopping recording:", error);
    }
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

    const formData = new FormData();
    formData.append("file", {
      uri: recordingUri,
      name: "audio.wav",
      type: "audio/wav",
    });

    try {
      const response = await fetch("http://192.168.100.2:8000/transcribe/", {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const data = await response.json();
      setTranscription(data.cleaned_transcription || "No transcription available");
      console.log(transcription);

      await FileSystem.deleteAsync(recordingUri, { idempotent: true });
      console.log("Deleted recorded file:", recordingUri);
      setRecordingUri(null);
    } catch (error) {
      console.error("Error uploading audio:", error);
      Alert.alert("Upload Failed", "Could not upload audio.");
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
    try {
      const response = await fetch("http://192.168.100.2:8000/test/", {
        method: "GET",
      });
      if (response.ok) {
        console.log("Successfully connected to FastAPI!");
        Alert.alert("Success", "Connected to FastAPI!");
      } else {
        console.error("Failed to connect to FastAPI:", response.status);
        Alert.alert("Error", "Could not connect to FastAPI.");
      }
    } catch (error) {
      console.error("Error connecting:", error);
      Alert.alert("Error", "Could not reach FastAPI.");
    }
  };

  const clearCache = async () => {
    try {
      const cacheDir = FileSystem.cacheDirectory;
      const files = await FileSystem.readDirectoryAsync(cacheDir);
      for (const file of files) {
        if (file.endsWith(".wav")) {
          await FileSystem.deleteAsync(`${cacheDir}${file}`, { idempotent: true });
        }
      }
      console.log("Audio cache cleared!");
    } catch (error) {
      console.error("Error clearing cache:", error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        {/* Header */}
        <Text style={styles.title}>EASE SPEAK.</Text>

        {/* Microphone Button */}
        <TouchableOpacity
          style={styles.micButton}
          onPress={recording ? stopRecording : startRecording}
        >
          <FontAwesome5 name="microphone" size={40} color="#6357F6" />
        </TouchableOpacity>

        <Text style={styles.statusText}>
          {recording ? "Listening..." : "Ready to listen..."}
        </Text>

        {/* Transcription Box */}
        <View style={styles.transcriptionBox}>
          <Text style={styles.transcriptionText}>
            {transcription || "No transcription available"}
          </Text>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.saveButton} onPress={uploadAudio}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.redoButton} onPress={redoRecording}>
              <Text style={styles.buttonText}>Redo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.testButton} onPress={testConnection}>
              <Text style={styles.buttonText}>Test API</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#9376E0",
    alignItems: "center",
    justifyContent: "center",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 22,
    color: "white",
    fontWeight: "bold",
    marginBottom: 20,
  },
  micButton: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    elevation: 5,
  },
  statusText: {
    fontSize: 16,
    color: "white",
    marginBottom: 20,
  },
  transcriptionBox: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    minHeight: 280, // Increased height for buttons
    backgroundColor: "white",
    paddingTop: 25,
    paddingBottom: 20, // Ensuring enough space for buttons
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "space-between", // Adjusts spacing
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  transcriptionText: {
    fontSize: 18,
    color: "#333",
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 10,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between", // Distributes buttons evenly
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
    backgroundColor: "#6357F6",
  },
  redoButton: {
    backgroundColor: "#FFA500",
  },
  testButton: {
    backgroundColor: "#E84855",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});


