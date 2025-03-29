import React, { useState, useEffect } from "react";
import { View, Text, Button, StyleSheet, Alert } from "react-native";

const TutorialScreen = ({ navigation }) => {
  const [step, setStep] = useState(0);
  const [microphoneAllowed, setMicrophoneAllowed] = useState(null);

  const requestMicrophonePermission = () => {
    setTimeout(() => {
      Alert.alert(
        '"EASE SPEAK" Would Like To Access The Microphone',
        "Allow EASE SPEAK to access your microphone to start recording.",
        [
          {
            text: "Don't Allow",
            style: "cancel",
            onPress: () => {
              console.log("Microphone permission denied");
              setMicrophoneAllowed(false);
            },
          },
          {
            text: "Allow",
            onPress: () => {
              console.log("Microphone permission granted");
              setMicrophoneAllowed(true);
            },
          },
        ]
      );
    }, 500); // Small delay ensures the alert is triggered properly
  };

  useEffect(() => {
    if (step === 1 && microphoneAllowed === null) {
      requestMicrophonePermission();
    }
  }, [step]);

  const nextStep = () => {
    if (step < 2) {
      setStep((prevStep) => prevStep + 1);
    } else {
      navigation.replace("Home", { microphoneAllowed });
    }
  };

  const skipTutorial = () => {
    navigation.replace("Home", { microphoneAllowed });
  };

  return (
    <View style={styles.container}>
      {step === 0 && <Text style={styles.text}>Step 1: Use a good microphone.</Text>}
      {step === 1 && <Text style={styles.text}>Step 2: Tap the microphone icon to begin recording.</Text>}
      {step === 2 && <Text style={styles.text}>Step 3: Review the transcribed text on your screen.</Text>}

      <View style={styles.buttonContainer}>
        {step < 2 ? (
          <>
            <Button title="Next" onPress={nextStep} />
            <Button title="Skip" onPress={skipTutorial} color="gray" />
          </>
        ) : (
          <Button title="Get Started" onPress={nextStep} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
  },
  text: {
    fontSize: 20,
    textAlign: "center",
    marginBottom: 20,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 50,
    flexDirection: "row",
    gap: 10,
  },
});

export default TutorialScreen;
