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
import { Image } from 'react-native';
import { useNavigation } from "@react-navigation/native";

export default function HomeScreen({ route }) {
  const [recording, setRecording] = useState(null);
  const [recordingUri, setRecordingUri] = useState(null);
  const [transcription, setTranscription] = useState("");
  const navigation = useNavigation();
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
      const response = await fetch("http://192.168.1.5:8000/transcribe/", {
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
      const response = await fetch("http://192.168.1.5:8000/test/", {
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
      
      {/* Logo at the top */}
      <View style={styles.logoContainer}>
        <Image source={require('../assets/logo.png')} style={styles.logo} />
      </View>
  
      <View style={styles.container}>
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
            <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={uploadAudio}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
  
            <TouchableOpacity style={[styles.button, styles.redoButton]} onPress={redoRecording}>
              <Text style={styles.buttonText}>Redo</Text>
            </TouchableOpacity>
  
            <TouchableOpacity style={[styles.button, styles.testButton]} onPress={testConnection}>
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
    width: 600,  // Make logo significantly bigger
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
});