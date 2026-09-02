import "../global.css";
import { useEffect } from "react";
import { DarkTheme, DefaultTheme, Slot, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useColorScheme } from "react-native";
import { useFonts } from "expo-font";
import { ClerkProvider, ClerkLoaded } from "@clerk/expo";
import { tokenCache } from "@/utils/token-cache";

import { AnimatedSplashOverlay } from "@/components/animated-icon";

SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded, fontError] = useFonts({
    "Rubik-Light": require("../../assets/fonts/Rubik-Light.ttf"),
    "Rubik-Regular": require("../../assets/fonts/Rubik-Regular.ttf"),
    "Rubik-Medium": require("../../assets/fonts/Rubik-Medium.ttf"),
    "Rubik-SemiBold": require("../../assets/fonts/Rubik-SemiBold.ttf"),
    "Rubik-Bold": require("../../assets/fonts/Rubik-Bold.ttf"),
    "Rubik-ExtraBold": require("../../assets/fonts/Rubik-ExtraBold.ttf"),
    "SpaceMono-Regular": require("../../assets/fonts/SpaceMono-Regular.ttf")
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <ClerkLoaded>
        <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
          <AnimatedSplashOverlay />
          <Slot />
        </ThemeProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
