import { Inter_400Regular, Inter_600SemiBold, useFonts } from "@expo-google-fonts/inter";
import { Stack } from "expo-router";
import type { NativeStackNavigationOptions } from "expo-router/native-stack";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { colors, fonts, radii } from "@/constants/theme";
import { LogProvider } from "@/store/log";

SplashScreen.preventAutoHideAsync();

const sheet: NativeStackNavigationOptions = {
  presentation: "formSheet",
  headerShown: false,
  sheetAllowedDetents: [0.85],
  sheetCornerRadius: radii.sheet,
  sheetGrabberVisible: true,
};

export default function RootLayout() {
  const [loaded, error] = useFonts({ Inter_400Regular, Inter_600SemiBold });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LogProvider>
        <Stack
          screenOptions={{
            headerShadowVisible: false,
            headerStyle: { backgroundColor: colors.paper },
            headerTintColor: colors.ink,
            headerTitleStyle: { fontFamily: fonts.semiBold },
            contentStyle: { backgroundColor: colors.paper },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="journal" options={sheet} />
          <Stack.Screen name="add-workout" options={sheet} />
        </Stack>
      </LogProvider>
    </GestureHandlerRootView>
  );
}
