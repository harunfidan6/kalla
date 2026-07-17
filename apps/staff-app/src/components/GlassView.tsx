import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';

interface GlassViewProps {
  blurType?: 'subtle' | 'regular' | 'heavy';
  tint?: 'light' | 'dark' | 'brand';
  backgroundColor?: string;
  blurAmount?: number;
  style?: any;
  children?: React.ReactNode;
}

// Flat, semi-transparent surface + backdrop blur — matches the design handoff's cards, which
// use a single rgba() background (T.cardBg/cardBg2/cardBgStrong), not a gradient fill.
export default function GlassView({
  blurType = 'regular',
  tint = 'light',
  backgroundColor,
  blurAmount,
  style,
  children,
}: GlassViewProps) {
  const { theme, colors, glass } = useTheme();
  const intensity = blurAmount ?? glass.blur[blurType];

  const surfaceColor =
    backgroundColor ??
    (tint === 'brand'
      ? `${colors.primary}24`
      : blurType === 'subtle'
      ? colors.cardBg2
      : blurType === 'heavy'
      ? colors.cardBgStrong
      : colors.cardBg);

  const isWeb = Platform.OS === 'web';
  const webStyle = isWeb
    ? {
        backdropFilter: `blur(${intensity}px) saturate(180%)`,
        WebkitBackdropFilter: `blur(${intensity}px) saturate(180%)`,
      }
    : {};

  const shapeStyle = {
    borderColor: glass.border.color,
    shadowOffset: { width: 0, height: glass.shadow.offsetY },
    shadowRadius: glass.shadow.blurRadius,
    shadowColor: theme === 'dark' ? '#000' : '#2A342E',
    shadowOpacity: theme === 'dark' ? 0.28 : 0.1,
    elevation: 4,
  };

  if (isWeb) {
    return <View style={[styles.glassContainer, webStyle, shapeStyle, { backgroundColor: surfaceColor }, style]}>{children}</View>;
  }

  // Native: real backdrop blur (blurMethod + blurTarget pointing at a shared root view) was
  // tried here and reverted — with several GlassView instances open on one screen, expo-blur's
  // Android implementation (Dimezis BlurView) recurses while walking the shared target's render
  // tree and crashes the app with a native stack overflow (SIGSEGV in RenderThread). BlurView
  // itself (even with no blur method) was then dropped too — with `blurMethod` unset it did no
  // blurring at all, only its own tint, and its layout didn't reliably fill dynamically-sized
  // cards, leaving a visible seam where it undersized against its sibling layers.
  // A corner-to-corner LinearGradient was tried next, but on wide/short cards its perceptible
  // change is compressed into the corners, leaving a large visually-flat "dead zone" in the
  // middle — exactly the "beyazlık" (flat white patch) reported. An off-center RadialGradient
  // (same technique already used for the background blobs) reads as a soft light source hitting
  // glass instead, and its falloff is visible across the whole card, not just the diagonal.
  return (
    <View style={[styles.glassContainer, shapeStyle, style]}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: surfaceColor }]} />
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <RadialGradient id="glassHighlight" cx="26%" cy="16%" r="90%">
            <Stop offset="0%" stopColor="#ffffff" stopOpacity={glass.highlightOpacity} />
            <Stop offset="55%" stopColor="#ffffff" stopOpacity={glass.highlightOpacity * 0.35} />
            <Stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#glassHighlight)" />
      </Svg>
      <View style={[styles.topHighlight, { backgroundColor: glass.shadow.innerHighlight }]} pointerEvents="none" />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  glassContainer: {
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
});
