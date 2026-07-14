import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import { Fonts } from '../constants/theme';
import { LogoSvg, BasketIcon } from './KallaIcons';
import ThemeSwitch from './ThemeSwitch';

// Persistent top bar shared by all 5 bottom-tab screens (Menu/Orders/Wallet/Notifications/Profile),
// matching Kalla Demo.dc.html's single top-bar-outside-the-tab-content structure exactly.
export default function AppHeader() {
  const router = useRouter();
  const { theme, colors, toggleTheme } = useTheme();
  const { cartItemCount } = useCart();

  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <View style={[styles.logoChip, { backgroundColor: colors.cardBgStrong, borderColor: colors.border }]}>
          <LogoSvg size={16} color={colors.primary} />
        </View>
        <Text style={[styles.wordmark, { color: colors.text, fontFamily: Fonts.displayItalicSemiBold }]}>Källa</Text>
      </View>

      <View style={styles.right}>
        <ThemeSwitch value={theme === 'dark'} onToggle={toggleTheme} trackColorOn={colors.switchTrack} trackColorOff={colors.switchTrack} />

        <TouchableOpacity onPress={() => router.push('/cart')}>
          <View style={[styles.cartPill, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <BasketIcon size={13} color={colors.text} />
            <Text style={[styles.cartText, { color: colors.text, fontFamily: Fonts.uiBold }]}>Sepet</Text>
            {cartItemCount > 0 && (
              <View style={[styles.cartBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.cartBadgeText}>{cartItemCount}</Text>
              </View>
            )}
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
  wordmark: { fontSize: 16 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cartPill: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    paddingLeft: 9,
  },
  cartText: { fontSize: 9 },
  cartBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 15,
    height: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: { color: '#0d1410', fontSize: 8, fontWeight: '800' },
});
