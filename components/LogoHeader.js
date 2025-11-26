import React from "react";
import { View, Image, StyleSheet, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LogoHeader() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const isTablet = width > 600;

  // Logo size scales with screen width
  const logoWidth = Math.min(width * 0.75, 500);
  const logoHeight = logoWidth * 0.42; // keep proportions

  return (
    <View
      style={[
        styles.logoContainer,
        {
          paddingTop: Math.max(insets.top - 20, 0),
          marginTop: isTablet ? -10 : -30, // tablet = less negative pull
        },
      ]}
    >
      <Image
        source={require("../assets/logo.png")}
        style={{
          width: logoWidth,
          height: logoHeight,
          resizeMode: "contain",
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
});
