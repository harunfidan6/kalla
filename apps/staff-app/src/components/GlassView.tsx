import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '../context/ThemeContext';

interface GlassViewProps {
  blurType?: 'subtle' | 'regular' | 'heavy';
  tint?: 'light' | 'dark' | 'brand';
  style?: any;
  children?: React.ReactNode;
}

// Flat, semi-transparent surface + backdrop blur — matches the design handoff's cards, which
// use a single rgba() background (T.cardBg/cardBg2/cardBgStrong), not a gradient fill.
export default function GlassView({
  blurType = 'regular',
  tint = 'light',
  style,
  children,
}: GlassViewProps) {
  const { theme, colors, glass } = useTheme();
  const intensity = glass.blur[blurType];

  const surfaceColor =
    tint === 'brand'
      ? `${colors.primary}24`
      : blurType === 'subtle'
      ? colors.cardBg2
      : blurType === 'heavy'
      ? colors.cardBgStrong
      : colors.cardBg;

  const isWeb = Platform.OS === 'web';
  const webStyle = isWeb
    ? {
        backdropFilter: `blur(${intensity}px) saturate(180%)`,
        WebkitBackdropFilter: `blur(${intensity}px) saturate(180%)`,
      }
    : {};

  const glassStyle = [
    styles.glassContainer,
    webStyle,
    {
      backgroundColor: surfaceColor,
      borderColor: glass.border.color,
      shadowOffset: { width: 0, height: glass.shadow.offsetY },
      shadowRadius: glass.shadow.blurRadius,
      shadowColor: theme === 'dark' ? '#000' : '#2A342E',
      shadowOpacity: theme === 'dark' ? 0.28 : 0.1,
      elevation: 4,
    },
    style,
  ];

  if (isWeb) {
    return <View style={glassStyle}>{children}</View>;
  }

  // Native: layer a BlurView behind the flat tint so content behind the card still blurs.
  return (
    <View style={glassStyle}>
      <BlurView intensity={intensity * 1.5} tint={theme === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
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
