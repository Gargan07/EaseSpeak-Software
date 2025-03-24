import React, { useState, useEffect } from "react";
import {
  View,
  Button,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
} from "react-native";
import * as FileSystem from "expo-file-system";
import { Audio } from "expo-av";

export default function HomeScreen() {
  const [recording, setRecording] = useState(null);
  const [recordingUri, setRecordingUri] = useState(null);
  const [transcription, setTranscription] = useState("");

  useEffect(() => {
    requestPermissions();
    clearCache();
  }, []);

  const requestPermissions = async () => {
    const { status } = await Audio.requestPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Microphone access is required!");
    }
  };

  const startRecording = async () => {
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
      setTranscription(data.cleaned_transcription);
      console.log(transcription);

      await FileSystem.deleteAsync(recordingUri, { idempotent: true });
      console.log("Deleted recorded file:", recordingUri);
      setRecordingUri(null);
    } catch (error) {
      console.error("Error uploading audio:", error);
      Alert.alert("Upload Failed", "Could not upload audio.");
    }
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      <View style={styles.container}>
        <Text style={styles.header}>EASE SPEAK</Text>
        <View style={styles.buttonContainer}>
          <Button
            title={recording ? "Recording..." : "Start Recording"}
            onPress={startRecording}
            disabled={recording !== null}
          />
          <Button
            title="Stop Recording"
            onPress={stopRecording}
            disabled={recording === null}
          />
          <Button title="Upload & Transcribe" onPress={uploadAudio} />
          <Button title="Test API Connection" onPress={testConnection} />
        </View>
        <Text style={styles.transcription}>
          Transcription: {transcription || "Waiting for transcription..."}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8f9fa",
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  buttonContainer: {
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  transcription: {
    marginTop: 20,
    fontSize: 16,
    fontStyle: "italic",
    textAlign: "center",
  },
});
