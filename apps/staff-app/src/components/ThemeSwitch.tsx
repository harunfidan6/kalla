import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';

interface ThemeSwitchProps {
  value: boolean;
  onToggle: () => void;
  trackColorOn: string;
  trackColorOff: string;
}

// 40x22 pill track + 18x18 thumb, matches Kalla Staff Demo.dc.html's toggleDark control exactly.
export default function ThemeSwitch({ value, onToggle, trackColorOn, trackColorOff }: ThemeSwitchProps) {
  return (
    <TouchableOpacity onPress={onToggle} activeOpacity={0.8}>
      <View style={[styles.track, { backgroundColor: value ? trackColorOn : trackColorOff }]}>
        <View style={[styles.thumb, { left: value ? 20 : 2 }]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 40,
    height: 22,
    borderRadius: 999,
    position: 'relative',
  },
  thumb: {
    position: 'absolute',
    top: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
});
