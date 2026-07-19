import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
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

  // Native: three separate overlay techniques were tried and reverted here — real backdrop
  // blur (crashed, see git history), a corner-to-corner LinearGradient sheen, and an off-center
  // SVG RadialGradient highlight (all three left the exact same flat white patch visible in the
  // middle of wide/short cards). Removing just the overlay (keeping `elevation`) was NOT enough —
  // the patch came back. `elevation` forces Android to promote the View to its own hardware
  // layer to draw the shadow; that layer is what was compositing badly (the semi-transparent
  // tint rendering as opaque white in parts of the layer). Dropping `elevation` on native and
  // keeping only the border for depth is the stable fix — no hardware layer, no patch.
  const { elevation: _elevation, ...nativeShapeStyle } = shapeStyle;

  return (
    <View style={[styles.glassContainer, nativeShapeStyle, { backgroundColor: surfaceColor }, style]}>
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
});
