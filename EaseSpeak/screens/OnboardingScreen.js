import React, { useState, useRef, useEffect } from "react";
import { View, Text, Button, StyleSheet, TouchableOpacity, Animated, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const PURPLE = "#895FFF";
const WHITE = "#FFFFFF";
const BLACK = "#000000";

const OnboardingScreen = ({ navigation }) => {
  const [step, setStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const wordAnim = useRef(new Animated.Value(1)).current;
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  const words = ["clearly", "confidently", "freely", "effectively", "smoothly"];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    if (step === 1) {
      const interval = setInterval(() => {
        Animated.sequence([
          Animated.timing(wordAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(wordAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setCurrentWordIndex((prev) => (prev + 1) % words.length);
        });
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [step]);

  const nextStep = () => {
    if (step < 2) {
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
      setStep(step + 1);
    } else {
      navigation.replace("Tutorial");
    }
  };

  const prevStep = () => {
    if (step > 0) {
      fadeAnim.setValue(0);
      slideAnim.setValue(30);
      setStep(step - 1);
    } else {
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      {step !== 0 && (
        <TouchableOpacity style={styles.backButton} onPress={prevStep}>
          <Ionicons name="chevron-back" size={24} color={BLACK} />
        </TouchableOpacity>
      )}

      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }], alignItems: "center", marginTop: -50 }}>
        {step === 0 && <Text style={styles.text}>Let's Get Started</Text>}

        {step === 1 && (
          <View style={styles.aboutContainer}>
            <Image source={require("../assets/aboutpic.png")} style={styles.image} />
            
            {/* Keep Communicate and Animated Word on the Same Line */}
            <View style={styles.textRow}>
              <Text style={styles.text}>Communicate </Text>
              <Animated.Text style={[styles.animatedWord, { opacity: wordAnim }]}>
                {words[currentWordIndex]}
              </Animated.Text>
            </View>
            
            {/* "with Ease Speak" on a Separate Line */}
            <Text style={styles.text}>with Ease Speak</Text>

            <Text style={styles.aboutText}>
              Ease Speak is an advanced speech recognition system designed to support individuals with stuttering and speech impairments.
              Using cutting-edge technology, Ease Speak offers real-time assistance to improve communication and boost confidence.
            </Text>
          </View>
        )}

        {step === 2 && (
          <View style={{ alignItems: "center" }}>
            <Text style={styles.text}>Welcome to Ease Speak!</Text>
            <Text style={styles.subText}>Let’s set things up—just a few simple steps before you're ready to go!</Text>
          </View>
        )}
      </Animated.View>

      <View style={styles.buttonContainer}>
        {step < 2 ? (
          <Button title="Next" onPress={nextStep} color={PURPLE} />
        ) : (
          <TouchableOpacity style={styles.purpleButton} onPress={nextStep}>
            <Text style={styles.buttonText}>Get Started</Text>
          </TouchableOpacity>
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
    backgroundColor: WHITE,
    paddingHorizontal: 20,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
  },
  aboutContainer: {
    alignItems: "center",
    width: "90%",
  },
  image: {
    width: 500,
    height: 500,
    marginTop: -80,
    marginBottom: 10,
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: BLACK,
  },
  textRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -80
  },
  animatedWord: {
    fontSize: 24,
    fontWeight: "bold",
    color: PURPLE,
  },
  subText: {
    fontSize: 16,
    textAlign: "center",
    color: BLACK,
    marginTop: 10
  },
  aboutText: {
    fontSize: 16,
    textAlign: "justify",
    marginTop: 10,
    paddingHorizontal: 20,
    lineHeight: 22,
    color: BLACK,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 50,
    flexDirection: "row",
    gap: 10,
  },
  purpleButton: {
    backgroundColor: PURPLE,
    paddingVertical: 17,
    paddingHorizontal: 120,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: WHITE,
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default OnboardingScreen;
