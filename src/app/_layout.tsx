import { Inter_400Regular, Inter_600SemiBold, useFonts } from "@expo-google-fonts/inter";
import { Stack } from "expo-router";
import type { NativeStackNavigationOptions } from "expo-router/native-stack";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { enableFreeze } from "react-native-screens";

import { colors, fonts, radii } from "@/constants/theme";
import { LogProvider, useLog } from "@/store/log";

SplashScreen.preventAutoHideAsync();

// Screens out of view (the home list under a workout, the workout under its timer) skip
// re-rendering on every edit and catch up when shown again, so taps stay quick.
enableFreeze(true);

const sheet: NativeStackNavigationOptions = {
  presentation: "formSheet",
  headerShown: false,
  sheetAllowedDetents: [0.85],
  sheetCornerRadius: radii.sheet,
  sheetGrabberVisible: true,
};

export default function RootLayout() {
  const [loaded, error] = useFonts({ Inter_400Regular, Inter_600SemiBold });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LogProvider>
        <AppStack fontsReady={loaded || !!error} />
      </LogProvider>
    </GestureHandlerRootView>
  );
}

/** Keeps the splash screen up until fonts and saved data have both loaded. */
function AppStack({ fontsReady }: { fontsReady: boolean }) {
  const { hydrated } = useLog();
  const ready = fontsReady && hydrated;

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.paper },
        headerTintColor: colors.ink,
        headerTitleStyle: { fontFamily: fonts.semiBold },
        headerBackButtonDisplayMode: "minimal",
        contentStyle: { backgroundColor: colors.paper },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="journal" options={sheet} />
      <Stack.Screen name="add-workout" options={sheet} />
      <Stack.Screen name="template/[id]" options={{ presentation: "modal", headerShown: false }} />
      <Stack.Screen name="session/[id]" options={{ title: "" }} />
      <Stack.Screen name="timer/[id]" options={{ title: "", animation: "slide_from_right" }} />
    </Stack>
  );
}
