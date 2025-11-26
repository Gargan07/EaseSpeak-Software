import React from "react";
import { View, Image, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LogoHeader() {
  const insets = useSafeAreaInsets();

  return React.createElement(
    View,
    {
      style: [
        styles.logoContainer,
        {
          paddingTop: Math.max(insets.top - 100, 0), // minimal safe padding
          marginTop: -50, // pull the logo visually higher
        },
      ],
    },
    React.createElement(Image, {
      source: require("../assets/logo.png"),
      style: styles.logo,
    })
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  logo: {
    width: 600,
    height: 250,
    resizeMode: "contain",
  },
});
