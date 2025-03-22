import React, { useState } from "react";
import { View, Text, Button, StyleSheet } from "react-native";

const OnboardingScreen = ({ navigation }) => {
  const [step, setStep] = useState(0);

  const nextStep = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      navigation.replace("Home"); // Go to HomeScreen after last step
    }
  };

  return (
    <View style={styles.container}>
      {step === 0 && <Text style={styles.text}>Let's Get Started</Text>}
      {step === 1 && <Text style={styles.text}>About EaseSpeak</Text>}
      {step === 2 && <Text style={styles.text}>WELCOME TO EASE SPEAK</Text>}

      <View style={styles.buttonContainer}>
        {step < 2 ? (
          <Button title="Next" onPress={nextStep} />
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
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 50,
  },
});

export default OnboardingScreen;
