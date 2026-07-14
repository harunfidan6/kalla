import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withDelay,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../context/ThemeContext';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface LoyaltyRingProps {
  points: number;
  nextTierThreshold: number;
  size?: number;
}

export default function LoyaltyRing({ points, nextTierThreshold, size = 66 }: LoyaltyRingProps) {
  const { colors } = useTheme();
  const radius = size / 2 - 6;
  const circumference = 2 * Math.PI * radius;

  const progress = Math.max(0, Math.min(1, nextTierThreshold > 0 ? points / nextTierThreshold : 0));
  const animatedProgress = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withDelay(
      250,
      withTiming(progress, { duration: 1100, easing: Easing.bezier(0.2, 0.8, 0.2, 1) }),
    );
  }, [progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animatedProgress.value),
  }));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.ringTrack}
          strokeWidth={6}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.primary}
          strokeWidth={6}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.centerText}>
        <Text style={[styles.pointsValue, { color: colors.text }]}>{points}</Text>
        <Text style={[styles.pointsLabel, { color: colors.textMuted }]}>PUAN</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    position: 'absolute',
    alignItems: 'center',
  },
  pointsValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  pointsLabel: {
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
