import React, { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import { AuthProvider } from '@/contexts/AuthContext';
import { Palette } from '@/constants/Colors';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) console.warn('Font load error:', error);
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: Palette.paperWhite,
          },
          headerTintColor: Palette.charcoal,
          headerTitleStyle: {
            fontFamily: 'serif',
            fontWeight: '700',
          },
          contentStyle: {
            backgroundColor: Palette.warmIvory,
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="book"
          options={{
            presentation: 'modal',
            title: 'Schedule Service Order',
            headerBackTitle: 'Cancel',
          }}
        />
        <Stack.Screen
          name="booking/[id]"
          options={{
            title: 'Service Work Order',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="provider/[id]"
          options={{
            title: 'Technician Field Profile',
            headerBackTitle: 'Back',
          }}
        />
        <Stack.Screen
          name="provider-workspace"
          options={{
            title: 'Provider Field Tool',
            headerBackTitle: 'Exit',
          }}
        />
        <Stack.Screen
          name="admin-dashboard"
          options={{
            title: 'Platform Administration',
            headerBackTitle: 'Exit',
          }}
        />
      </Stack>
    </AuthProvider>
  );
}
