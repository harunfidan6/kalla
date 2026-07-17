import React from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
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

      <Blob size={260} boxStyle={{ top: -70, left: -60 }} color={colors.blobSage} />
      <Blob size={220} boxStyle={{ bottom: 60, right: -70 }} color={colors.blobTeal} />
      <Blob size={200} boxStyle={{ bottom: -80, left: 40 }} color={colors.blobGold} />
    </View>
  );
}

// Native Views have no CSS-style blur filter, so a soft-edged radial gradient (center color
// fading smoothly to transparent) stands in for a blurred circle. Web keeps the real
// `filter: blur()` since browsers support it natively.
function Blob({ size, boxStyle, color }: { size: number; boxStyle: any; color: string }) {
  if (Platform.OS === 'web') {
    return <View style={[styles.blob, { width: size, height: size, backgroundColor: color }, boxStyle, webBlurStyle(60)]} />;
  }
  const { rgb, alpha } = parseRgba(color);
  const gradId = `blob-${rgb.replace(/[^0-9]/g, '')}-${size}`;
  return (
    <Svg width={size} height={size} style={[styles.blob, boxStyle]}>
      <Defs>
        <RadialGradient id={gradId} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={rgb} stopOpacity={alpha} />
          <Stop offset="100%" stopColor={rgb} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx={size / 2} cy={size / 2} r={size / 2} fill={`url(#${gradId})`} />
    </Svg>
  );
}

function parseRgba(color: string): { rgb: string; alpha: number } {
  const match = color.match(/rgba?\(([^)]+)\)/);
  if (!match) return { rgb: color, alpha: 1 };
  const [r, g, b, a] = match[1].split(',').map((p) => p.trim());
  return { rgb: `rgb(${r},${g},${b})`, alpha: a !== undefined ? Number(a) : 1 };
}

function webBlurStyle(radius: number) {
  return { filter: `blur(${radius}px)` } as any;
}

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
    borderRadius: 999,
  },
});
