import React, { useEffect, useState } from "react";
import { Text, TextInput } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Import screens
import HomeScreen from "./screens/HomeScreen";
import OnboardingScreen from "./screens/OnboardingScreen";
import SplashScreenComponent from "./screens/SplashScreen";
import TutorialScreen from "./screens/TutorialScreen";

const Stack = createStackNavigator();

// Prevent default Expo splash from hiding automatically
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [initialRoute, setInitialRoute] = useState(null);

  // Prevent system text scaling (optional)
  useEffect(() => {
    const checkFirstLaunch = async () => {
      const hasLaunched = await AsyncStorage.getItem("hasLaunched");

      if (hasLaunched === null) {
        // First time
        await AsyncStorage.setItem("hasLaunched", "true");
        setInitialRoute("Splash"); // Splash → Onboarding → Tutorial → Home
      } else {
        // Not first time
        setInitialRoute("Home");
      }

      if (Text.defaultProps == null) Text.defaultProps = {};
      Text.defaultProps.allowFontScaling = false;

      if (TextInput.defaultProps == null) TextInput.defaultProps = {};
      TextInput.defaultProps.allowFontScaling = false;

      // Hide Expo splash immediately so your custom splash shows
      SplashScreen.hideAsync();
    };

    checkFirstLaunch();
  }, []);

  if (!initialRoute) return null; // Avoid flashing

  return (
    <NavigationContainer>
      <StatusBar style="light" backgroundColor="#895FFF" translucent={false} />
      <Stack.Navigator
        initialRouteName={initialRoute}
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
