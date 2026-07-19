import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Fonts } from '../../constants/theme';
import GlassBackground from '../../components/GlassBackground';
import GlassView from '../../components/GlassView';
import { LogoSvg } from '../../components/KallaIcons';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { colors } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Lütfen e-posta ve şifrenizi girin');
      return;
    }
    setError(null);
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      router.replace('/');
    } else {
      setError(result.error || 'Giriş başarısız oldu');
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GlassBackground />

      <GlassView blurType="heavy" style={[styles.card, { borderColor: colors.border }]}>
        <View style={styles.brandHeader}>
          <View style={[styles.logoCircle, { backgroundColor: colors.cardBgStrong, borderColor: colors.border }]}>
            <LogoSvg size={30} color={colors.primary} />
          </View>
          <Text style={[styles.roleLabel, { color: colors.textMuted, fontFamily: Fonts.uiExtraBold }]}>PERSONEL</Text>
          <Text style={[styles.wordmark, { color: colors.text, fontFamily: Fonts.displayItalicSemiBold }]}>Källa</Text>
          <Text style={[styles.portalCaption, { color: colors.gold, fontFamily: Fonts.uiBold }]}>NORDIC PORTAL</Text>
        </View>

        <Text style={[styles.title, { color: colors.text, fontFamily: Fonts.displayItalic }]}>Personel Girişi</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: Fonts.ui }]}>
          Sipariş paneli, vardiya çizelgesi ve eğitim sistemine erişmek için oturum açın.
        </Text>

        {error && (
          <View style={[styles.errorBox, { backgroundColor: `${colors.error}1A`, borderColor: colors.error }]}>
            <Text style={[styles.errorText, { color: colors.error, fontFamily: Fonts.uiBold }]}>{error}</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.textMuted, fontFamily: Fonts.uiBold }]}>E-POSTA</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBg, fontFamily: Fonts.ui }]}
            placeholder="barista@kalla.com"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={[styles.inputContainer, { marginBottom: 22 }]}>
          <Text style={[styles.label, { color: colors.textMuted, fontFamily: Fonts.uiBold }]}>ŞİFRE</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBg, fontFamily: Fonts.ui }]}
            placeholder="••••••••"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity onPress={handleLogin} disabled={loading}>
          <LinearGradient
            colors={[colors.primary, colors.primaryEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.button}
          >
            {loading ? (
              <ActivityIndicator color="#fdfdfb" />
            ) : (
              <Text style={[styles.buttonText, { fontFamily: Fonts.uiBold }]}>Oturum Aç</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </GlassView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderRadius: 28,
    paddingVertical: 32,
    paddingHorizontal: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.18,
    shadowRadius: 50,
    elevation: 8,
  },
  brandHeader: { alignItems: 'center', marginBottom: 22 },
  logoCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  roleLabel: { fontSize: 9, letterSpacing: 2, marginBottom: 2 },
  wordmark: { fontSize: 24 },
  portalCaption: { fontSize: 8.5, letterSpacing: 3, marginTop: 2 },
  title: { fontSize: 19, textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 11.5, lineHeight: 18, textAlign: 'center', marginBottom: 24 },
  errorBox: { padding: 12, marginBottom: 16, borderWidth: 1, borderRadius: 12 },
  errorText: { fontSize: 12, textAlign: 'center' },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 9.5, letterSpacing: 1.5, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    fontSize: 13,
  },
  button: {
    height: 46,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({ web: { cursor: 'pointer' as any } }),
  },
  buttonText: { color: '#fdfdfb', fontSize: 13 },
});
