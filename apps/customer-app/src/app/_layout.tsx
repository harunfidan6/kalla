import { View } from 'react-native';
import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import CookieConsentBanner from '../components/CookieConsentBanner';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  Newsreader_500Medium_Italic,
  Newsreader_600SemiBold_Italic,
  Newsreader_600SemiBold,
} from '@expo-google-fonts/newsreader';
import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
import React, { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

function RootStack() {
  const { colors, glass } = useTheme();

  return (
    <View style={{ flex: 1 }}>
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.overlayBar,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: 'bold',
            color: colors.text,
          },
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="product/[id]"
          options={{ headerShown: false }} // Custom glass header rendered inside
        />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/register" options={{ headerShown: false }} />
        <Stack.Screen name="cart" options={{ headerShown: false }} />
        <Stack.Screen name="legal" options={{ headerShown: false }} />
      </Stack>
      <CookieConsentBanner />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Newsreader_500Medium_Italic,
    Newsreader_600SemiBold_Italic,
    Newsreader_600SemiBold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    JetBrainsMono_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <CartProvider>
          <RootStack />
        </CartProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
