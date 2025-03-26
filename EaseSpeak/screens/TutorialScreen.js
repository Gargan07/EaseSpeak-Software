import React, { useState } from "react";
import { View, Text, Button, StyleSheet, Alert, Image } from "react-native";

const TutorialScreen = ({ navigation }) => {
  const [step, setStep] = useState(0);
  const [microphoneAllowed, setMicrophoneAllowed] = useState(null);

  const requestMicrophonePermission = () => {
    Alert.alert(
      '"EASE SPEAK" Would Like To Access The Microphone',
      'Allow EASE SPEAK to access your microphone to start recording.',
      [
        {
          text: "Don't Allow",
          style: "cancel",
          onPress: () => setMicrophoneAllowed(false),
        },
        {
          text: "Allow",
          onPress: () => setMicrophoneAllowed(true),
        },
      ]
    );
  };

  const nextStep = () => {
    if (step === 0) {
      requestMicrophonePermission();
    }
    if (step < 2) {
      setStep(step + 1);
    } else {
      navigation.replace("Home");
    }
  };

  const skipTutorial = () => {
    navigation.replace("Home");
  };

  return (
    <View style={styles.container}>
      {step === 0 && (
        <View style={styles.stepContainer}>
          <Image source={require("../assets/mic.png")} style={styles.image} />
          <Text style={styles.text}>Step 1: Use a good microphone.</Text>
        </View>
      )}
      {step === 1 && <Text style={styles.text}>Step 2: Tap the microphone icon to begin recording</Text>}
      {step === 2 && <Text style={styles.text}>Step 3: Review the transcribed text on your screen.</Text>}

      {/* Buttons and Indicator Container */}
      <View style={styles.footerContainer}>
        <Button title="Next" onPress={nextStep} />
        <View style={styles.indicatorContainer}>
          {[0, 1, 2].map((index) => (
            <View
              key={index}
              style={[styles.indicator, step === index && styles.activeIndicator]}
            />
          ))}
        </View>
        <Button title="Skip" onPress={skipTutorial} color="gray" />
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
  stepContainer: {
    alignItems: "center",
  },
  image: {
    width: 200,
    height: 200,
    marginBottom: 20,
  },
  text: {
    fontSize: 20,
    textAlign: "center",
    marginBottom: 20,
  },
  footerContainer: {
    position: "absolute",
    bottom: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 20,
  },
  indicatorContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  indicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ccc",
    marginHorizontal: 5,
  },
  activeIndicator: {
    backgroundColor: "#895FFF",
  },
});

export default TutorialScreen;
