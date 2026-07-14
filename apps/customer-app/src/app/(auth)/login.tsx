import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Fonts } from '../../constants/theme';
import GlassBackground from '../../components/GlassBackground';
import GlassView from '../../components/GlassView';
import { LogoSvg } from '../../components/KallaIcons';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const { colors, glass } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Lütfen tüm alanları doldurun');
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

      <GlassView blurType="heavy" style={[styles.card, { borderRadius: glass.radius.xl }]}>
        <View style={styles.logoBlock}>
          <GlassView blurType="subtle" tint="brand" style={[styles.logoChip, { borderRadius: glass.radius.pill }]}>
            <LogoSvg size={30} color={colors.primary} />
          </GlassView>
          <Text style={[styles.wordmark, { color: colors.text, fontFamily: Fonts.displayItalicSemiBold }]}>Källa</Text>
          <Text style={[styles.caption, { color: colors.gold }]}>NORDIC ROASTERY</Text>
        </View>

        <Text style={[styles.title, { color: colors.text, fontFamily: Fonts.displayItalic }]}>Tekrar hoşgeldiniz</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: Fonts.ui }]}>
          En sevdiğiniz kahveleri sipariş etmek için giriş yapın
        </Text>

        {error && <Text style={[styles.errorText, { color: colors.error, fontFamily: Fonts.uiSemiBold }]}>{error}</Text>}

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.textSecondary, fontFamily: Fonts.uiBold }]}>E-POSTA</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: glass.border.color, backgroundColor: colors.inputBg, fontFamily: Fonts.ui }]}
            placeholder="örnek@mail.com"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.label, { color: colors.textSecondary, fontFamily: Fonts.uiBold }]}>ŞİFRE</Text>
          <TextInput
            style={[styles.input, { color: colors.text, borderColor: glass.border.color, backgroundColor: colors.inputBg, fontFamily: Fonts.ui }]}
            placeholder="••••••"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity onPress={handleLogin} disabled={loading} style={[styles.button, { borderRadius: glass.radius.md, backgroundColor: colors.primary }]}>
          {loading ? <ActivityIndicator color="#fdfdfb" /> : <Text style={[styles.buttonText, { fontFamily: Fonts.uiBold }]}>Giriş Yap</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.linkContainer}>
          <Text style={[styles.linkText, { color: colors.gold, fontFamily: Fonts.uiSemiBold }]}>Hesabınız yok mu? Kaydolun</Text>
        </TouchableOpacity>
      </GlassView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 340, padding: 32 },
  logoBlock: { alignItems: 'center', marginBottom: 24 },
  logoChip: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  wordmark: { fontSize: 24 },
  caption: { fontSize: 8.5, fontWeight: 'bold', letterSpacing: 3, marginTop: 2 },
  title: { fontSize: 21, textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 11.5, textAlign: 'center', marginBottom: 24, lineHeight: 17 },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 9.5, marginBottom: 6, letterSpacing: 0.5 },
  input: { height: 44, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontSize: 14 },
  button: { height: 46, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fdfdfb', fontSize: 15 },
  errorText: { fontSize: 12, textAlign: 'center', marginBottom: 14 },
  linkContainer: { marginTop: 18, alignItems: 'center' },
  linkText: { fontSize: 13 },
});
