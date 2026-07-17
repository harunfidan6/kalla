import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';
import { Fonts } from '../constants/theme';
import GlassView from './GlassView';
import { COOKIE_BANNER_TEXT } from '../constants/legalTexts';

const STORAGE_KEY = 'kalla_cookie_consent';

export default function CookieConsentBanner() {
  const { colors, glass } = useTheme();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (!value) setVisible(true);
    });
  }, []);

  const choose = async (choice: 'accepted' | 'rejected') => {
    await AsyncStorage.setItem(STORAGE_KEY, choice);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <GlassView blurType="heavy" style={[styles.card, { borderRadius: glass.radius.lg }]}>
        <Text style={[styles.text, { color: colors.textSecondary, fontFamily: Fonts.ui }]}>{COOKIE_BANNER_TEXT}</Text>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={[styles.btn, { backgroundColor: colors.cardBg2, borderColor: colors.border, borderWidth: 1 }]} onPress={() => choose('rejected')}>
            <Text style={[styles.btnText, { color: colors.text, fontFamily: Fonts.uiSemiBold }]}>Reddet</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]} onPress={() => choose('accepted')}>
            <Text style={[styles.btnText, { color: '#fdfdfb', fontFamily: Fonts.uiBold }]}>Tümünü Kabul Et</Text>
          </TouchableOpacity>
        </View>
      </GlassView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'absolute', left: 0, right: 0, bottom: 90, paddingHorizontal: 16, zIndex: 50 },
  card: { padding: 16, borderWidth: 1 },
  text: { fontSize: 11.5, lineHeight: 17, marginBottom: 12 },
  buttonRow: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, height: 40, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: 12.5 },
});
