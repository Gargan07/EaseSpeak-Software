import { useState } from "react";
import { Alert } from "react-native";
import * as FileSystem from "expo-file-system";
import { safeFetch } from "../services/api";

export function useAudioUploader(setTranscription) {
  const [loading, setLoading] = useState(false);

  const uploadAudio = async (recordingUri, clearUri) => {
    if (!recordingUri) {
      Alert.alert("Error", "No audio recorded!");
      return;
    }

    const fileInfo = await FileSystem.getInfoAsync(recordingUri);
    if (!fileInfo.exists) {
      Alert.alert("Error", "Recorded file does not exist!");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("file", {
      uri: recordingUri,
      name: "audio.wav",
      type: "audio/wav",
    });

    try {
      const response = await safeFetch(
        "https://karla-streamlined-nonreflectively.ngrok-free.dev/transcribe/?engine=wav2vec2",
        {
          method: "POST",
          body: formData,
          headers: { "Content-Type": "multipart/form-data" },
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

      await FileSystem.deleteAsync(recordingUri, { idempotent: true });
      clearUri();
    } catch (error) {
      console.error("Error uploading audio:", error);
      Alert.alert("Upload Failed", "Could not upload audio.");
    } finally {
      setLoading(false);
    }
  };

  return { uploadAudio, loading };
}
