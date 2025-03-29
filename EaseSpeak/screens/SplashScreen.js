import React, { useEffect } from "react";
import { View, Image, StyleSheet } from "react-native";

const SplashScreen = ({ navigation }) => {
  useEffect(() => {
    setTimeout(() => {
      navigation.replace("Onboarding"); // Navigate to Onboarding
    }, 3000); // 3 seconds delay
  }, []);

  return (
    <View style={styles.container}>
      <Image source={require("../assets/logo.png")} style={styles.logo} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#895FFF", // Updated background color
  },
  logo: {
    width: 300, // Increased size
    height: 300, // Increased size
    resizeMode: "contain",
  },
});

export default SplashScreen;