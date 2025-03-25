import React, { useState } from "react";
import { View, Text, Button, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons"; // Import Ionicons for the back arrow

const PURPLE = "#895FFF";
const WHITE = "#FFFFFF";
const BLACK = "#000000";

const OnboardingScreen = ({ navigation }) => {
  const [step, setStep] = useState(0);

  const nextStep = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      navigation.replace("Tutorial"); // Now directs to TutorialScreen instead of Home
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      navigation.goBack(); // Go back if on the first step
    }
  };

  return (
    <View style={styles.container}>
      {/* Back button at the top left, hidden on the last step */}
      {step !== 0 && (
        <TouchableOpacity style={styles.backButton} onPress={prevStep}>
          <Ionicons name="chevron-back" size={24} color={BLACK} />
        </TouchableOpacity>
      )}

      {step === 0 && <Text style={styles.text}>Let's Get Started</Text>}
      {step === 1 && (
        <View>
          <Text style={styles.text}>About Ease Speak</Text>
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
          <Button title="Next" onPress={nextStep} color={PURPLE} />
        ) : (
          <Button title="Get Started" onPress={nextStep} color={PURPLE} />
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
    backgroundColor: WHITE, // Updated background color
    paddingHorizontal: 20,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: BLACK, // Updated text color
  },
  aboutText: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 10,
    lineHeight: 22,
    color: BLACK, // Updated text color
  },
  buttonContainer: {
    position: "absolute",
    bottom: 50,
    flexDirection: "row",
    gap: 10,
  },
});

export default OnboardingScreen;