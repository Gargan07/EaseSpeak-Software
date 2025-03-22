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
      {step === 1 && (
        <View>
          <Text style={styles.text}>About</Text>
          <Text style={styles.aboutText}>
            EASE SPEAK is an innovative speech recognition system designed to assist 
            individuals with stuttering and speech impairments. Leveraging advanced 
            technology, EASE SPEAK provides near real-time support, enhancing communication 
            and boosting confidence. This mobile application adapts to individual speech 
            patterns, helping users articulate more clearly and effectively, fostering 
            greater independence and ease in everyday conversations.
          </Text>
        </View>
      )}
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
    paddingHorizontal: 20,
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  aboutText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 10,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 50,
  },
});

export default OnboardingScreen;
