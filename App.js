import React, { useEffect } from "react";
import { Text, TextInput } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";

// Import screens
import HomeScreen from "./screens/HomeScreen";
import OnboardingScreen from "./screens/OnboardingScreen";
import SplashScreenComponent from "./screens/SplashScreen";
import TutorialScreen from "./screens/TutorialScreen";

const Stack = createStackNavigator();

// Prevent default Expo splash from hiding automatically
SplashScreen.preventAutoHideAsync();

export default function App() {
  // Prevent system text scaling (optional)
  useEffect(() => {
    if (Text.defaultProps == null) Text.defaultProps = {};
    Text.defaultProps.allowFontScaling = false;

    if (TextInput.defaultProps == null) TextInput.defaultProps = {};
    TextInput.defaultProps.allowFontScaling = false;

    // Hide Expo splash immediately so your custom splash shows
    SplashScreen.hideAsync();
  }, []);

  return (
    <NavigationContainer>
      <StatusBar style="light" backgroundColor="#895FFF" translucent={false} />
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Splash" component={SplashScreenComponent} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Tutorial" component={TutorialScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
