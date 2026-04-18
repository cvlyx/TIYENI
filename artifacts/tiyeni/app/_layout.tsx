import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

import EnhancedErrorBoundary, { CriticalErrorBoundary } from "@/components/EnhancedErrorBoundary";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppDataProvider } from "@/contexts/AppDataContext";
import { ToastProvider } from "@/contexts/ToastContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/(auth)/welcome");
    }
  }, [user, isLoading]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(post)" options={{ presentation: "modal" }} />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <CriticalErrorBoundary>
        <EnhancedErrorBoundary enablePerformanceTracking={true}>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <AppDataProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <ToastProvider>
                    <RootLayoutNav />
                  </ToastProvider>
                </GestureHandlerRootView>
              </AppDataProvider>
            </AuthProvider>
          </QueryClientProvider>
        </EnhancedErrorBoundary>
      </CriticalErrorBoundary>
    </SafeAreaProvider>
  );
}
