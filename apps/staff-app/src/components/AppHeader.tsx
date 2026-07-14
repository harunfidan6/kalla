import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Fonts } from '../constants/theme';
import { LogoSvg } from './KallaIcons';
import ThemeSwitch from './ThemeSwitch';

// Per-tab titles shown next to the logo chip, matching Kalla Staff Demo.dc.html's tabTitleMap.
const TAB_TITLES: Record<string, string> = {
  '/': 'Sipariş Panosu',
  '/shifts': 'Ekip Çizelgesi',
  '/sales': 'Satış & Z Raporu',
  '/training': 'Eğitim Portalı',
  '/recipes': 'Reçete Rehberi',
};

// Persistent top bar shared by all 4 bottom-tab screens (Kanban/Vardiyalar/Satış/Eğitimler),
// matching the demo's single top-bar-outside-the-tab-content structure exactly.
export default function AppHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, colors, toggleTheme } = useTheme();
  const { logout } = useAuth();

  const title = TAB_TITLES[pathname] || 'Sipariş Panosu';

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <View style={[styles.logoChip, { backgroundColor: colors.cardBgStrong, borderColor: colors.border }]}>
          <LogoSvg size={16} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text, fontFamily: Fonts.displayItalicSemiBold }]}>{title}</Text>
      </View>

      <View style={styles.right}>
        <ThemeSwitch value={theme === 'dark'} onToggle={toggleTheme} trackColorOn={colors.switchTrack} trackColorOff={colors.switchTrack} />

        <TouchableOpacity onPress={handleLogout}>
          <View style={[styles.logoutPill, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <Text style={[styles.logoutText, { color: colors.error, fontFamily: Fonts.uiBold }]}>Çıkış</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: Platform.OS === 'ios' ? 52 : 32,
    paddingHorizontal: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  logoChip: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoutPill: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  logoutText: { fontSize: 9 },
});
