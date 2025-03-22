import React, { useState } from "react";
import { View, Text, Button, StyleSheet } from "react-native";

const TutorialScreen = ({ navigation }) => {
  const [step, setStep] = useState(0);

  const nextStep = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      navigation.replace("Home"); // Directs to HomeScreen after the last tutorial step
    }
  };

  const skipTutorial = () => {
    navigation.replace("Home"); // Skips tutorial and goes directly to Home
  };

  return (
    <View style={styles.container}>
      {step === 0 && <Text style={styles.text}>Step 1: Use a good microphone.</Text>}
      {step === 1 && <Text style={styles.text}>Step 2: Tap the microphone icon to begin recording</Text>}
      {step === 2 && <Text style={styles.text}>Step 3: Review the transcribe text on your screen.</Text>}

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
