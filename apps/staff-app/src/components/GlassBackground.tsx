import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

// Exact blob sizes/positions/blur radii from the design handoff (Kalla Staff Demo.dc.html).
export default function GlassBackground() {
  const { colors } = useTheme();

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={[colors.background, colors.backgroundMid, colors.backgroundEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.blob, { width: 260, height: 260, top: -70, left: -60, backgroundColor: colors.blobSage }, blurStyle(60)]} />
      <View style={[styles.blob, { width: 220, height: 220, bottom: 60, right: -70, backgroundColor: colors.blobTeal }, blurStyle(60)]} />
      <View style={[styles.blob, { width: 200, height: 200, bottom: -80, left: 40, backgroundColor: colors.blobGold }, blurStyle(70)]} />
    </View>
  );
}

function blurStyle(radius: number) {
  return Platform.select({
    web: { filter: `blur(${radius}px)` } as any,
    default: { opacity: 0.6 },
  });
}

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
});
