import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Fonts } from '../../constants/theme';
import { TabMenuIcon, TabOrdersIcon, TabWalletIcon, TabNotificationsIcon, TabProfileIcon } from '../../components/KallaIcons';
import { BlurView } from 'expo-blur';
import GlassBackground from '../../components/GlassBackground';
import AppHeader from '../../components/AppHeader';

function TabBarBackground() {
  const { theme, colors, glass } = useTheme();
  const isWeb = Platform.OS === 'web';

  if (isWeb) {
    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            backgroundColor: colors.cardBgStrong,
            // @ts-ignore web-only
            backdropFilter: `blur(${glass.blur.heavy}px) saturate(180%)`,
            // @ts-ignore web-only
            WebkitBackdropFilter: `blur(${glass.blur.heavy}px) saturate(180%)`,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          },
        ]}
      />
    );
  }

  return (
    <BlurView
      intensity={glass.blur.heavy * 1.5}
      tint={theme === 'dark' ? 'dark' : 'light'}
      style={[StyleSheet.absoluteFill, { borderTopWidth: 1, borderTopColor: colors.border }]}
    />
  );
}

export default function TabsLayout() {
  const { colors } = useTheme();

  const tabIcon = (Icon: React.FC<{ size?: number; color?: string }>) =>
    ({ color, focused }: any) => <Icon size={15} color={focused ? colors.primary : color} />;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <GlassBackground />
      <AppHeader />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.text,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelStyle: { fontSize: 9, fontFamily: Fonts.uiBold },
          sceneStyle: { backgroundColor: 'transparent' },
          tabBarStyle: {
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            height: Platform.OS === 'ios' ? 84 : 64,
            paddingTop: 10,
            paddingBottom: Platform.OS === 'ios' ? 28 : 10,
            position: 'absolute',
            elevation: 0,
          },
          tabBarBackground: () => <TabBarBackground />,
        }}
      >
        <Tabs.Screen name="index" options={{ tabBarLabel: 'Menü', tabBarIcon: tabIcon(TabMenuIcon) }} />
        <Tabs.Screen name="orders" options={{ tabBarLabel: 'Sipariş', tabBarIcon: tabIcon(TabOrdersIcon) }} />
        <Tabs.Screen name="wallet" options={{ tabBarLabel: 'Cüzdan', tabBarIcon: tabIcon(TabWalletIcon) }} />
        <Tabs.Screen name="notifications" options={{ tabBarLabel: 'Bildirim', tabBarIcon: tabIcon(TabNotificationsIcon) }} />
        <Tabs.Screen name="profile" options={{ tabBarLabel: 'Profil', tabBarIcon: tabIcon(TabProfileIcon) }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
