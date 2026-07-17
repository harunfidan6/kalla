import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Fonts } from '../../constants/theme';
import GlassBackground from '../../components/GlassBackground';
import GlassView from '../../components/GlassView';
import { LogoSvg } from '../../components/KallaIcons';
import LegalTextModal from '../../components/LegalTextModal';
import { LEGAL_SECTIONS, LegalSection } from '../../constants/legalTexts';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const { colors, glass } = useTheme();

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [kvkkAccepted, setKvkkAccepted] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [legalSection, setLegalSection] = useState<LegalSection | null>(null);

  const userAgreement = LEGAL_SECTIONS.find((s) => s.key === 'userAgreement')!;
  const kvkkText = LEGAL_SECTIONS.find((s) => s.key === 'kvkk')!;

  const handleRegister = async () => {
    if (!email || !phone || !password || !fullName) {
      setError('Lütfen zorunlu alanları doldurun (*)');
      return;
    }
    if (!kvkkAccepted) {
      setError('Devam etmek için Kullanıcı Sözleşmesi ve KVKK Aydınlatma Metni\'ni onaylamanız gerekir.');
      return;
    }
    setError(null);
    setLoading(true);
    const result = await register(email, phone, password, fullName, kvkkAccepted, marketingOptIn, birthday);
    setLoading(false);

    if (result.success) {
      router.replace('/');
    } else {
      setError(result.error || 'Kayıt başarısız oldu');
    }
  };

  const fields = [
    { key: 'fullName', label: 'AD SOYAD *', placeholder: 'Ahmet Yılmaz', value: fullName, onChange: setFullName, keyboardType: 'default' as const, secure: false },
    { key: 'email', label: 'E-POSTA *', placeholder: 'ahmet@ornek.com', value: email, onChange: setEmail, keyboardType: 'email-address' as const, secure: false },
    { key: 'phone', label: 'TELEFON *', placeholder: '+90 555 444 33 22', value: phone, onChange: setPhone, keyboardType: 'phone-pad' as const, secure: false },
    { key: 'password', label: 'ŞİFRE *', placeholder: 'En az 8 karakter, 1 büyük harf, 1 küçük harf, 1 rakam/özel karakter', value: password, onChange: setPassword, keyboardType: 'default' as const, secure: true },
    { key: 'birthday', label: 'DOĞUM TARİHİ (İSTEĞE BAĞLI)', placeholder: '1995-05-15', value: birthday, onChange: setBirthday, keyboardType: 'default' as const, secure: false },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GlassBackground />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <GlassView blurType="heavy" style={[styles.card, { borderRadius: glass.radius.xl }]}>
          <View style={styles.logoBlock}>
            <GlassView blurType="subtle" tint="brand" style={[styles.logoChip, { borderRadius: glass.radius.pill }]}>
              <LogoSvg size={26} color={colors.primary} />
            </GlassView>
          </View>

          <Text style={[styles.title, { color: colors.text, fontFamily: Fonts.displayItalic }]}>Ailemize katılın</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary, fontFamily: Fonts.ui }]}>
            Sadakat puanları toplamak ve özel indirimlerden yararlanmak için kaydolun
          </Text>

          {error && <Text style={[styles.errorText, { color: colors.error, fontFamily: Fonts.uiSemiBold }]}>{error}</Text>}

          {fields.map((field) => (
            <View key={field.key} style={styles.inputContainer}>
              <Text style={[styles.label, { color: colors.textSecondary, fontFamily: Fonts.uiBold }]}>{field.label}</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: glass.border.color, backgroundColor: colors.inputBg, fontFamily: Fonts.ui }]}
                placeholder={field.placeholder}
                placeholderTextColor={colors.textMuted}
                value={field.value}
                onChangeText={field.onChange}
                keyboardType={field.keyboardType}
                secureTextEntry={field.secure}
                autoCapitalize={field.key === 'email' ? 'none' : 'words'}
              />
            </View>
          ))}

          <View style={styles.checkboxRow}>
            <TouchableOpacity onPress={() => setKvkkAccepted((v) => !v)}>
              <View style={[styles.checkboxBox, { borderColor: colors.border }, kvkkAccepted && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                {kvkkAccepted && <Text style={styles.checkboxMark}>✓</Text>}
              </View>
            </TouchableOpacity>
            {/* Bağlantılar (Kullanıcı Sözleşmesi/KVKK) nested Text onPress kullanıyor — bunları
                bir TouchableOpacity'nin İÇİNE koymak dokunuşu ebeveyn Touchable'a kaptırıyordu
                (web'de tıklama modalı açmak yerine checkbox'ı değiştiriyordu), bu yüzden etiket
                artık ayrı, dokunulabilir olmayan bir sarmalayıcıda. */}
            <Text style={[styles.checkboxLabel, { color: colors.textSecondary, fontFamily: Fonts.ui }]} onPress={() => setKvkkAccepted((v) => !v)}>
              <Text onPress={() => setLegalSection(userAgreement)} style={{ color: colors.gold, fontFamily: Fonts.uiSemiBold }}>Kullanıcı Sözleşmesi</Text>
              {' '}ve{' '}
              <Text onPress={() => setLegalSection(kvkkText)} style={{ color: colors.gold, fontFamily: Fonts.uiSemiBold }}>KVKK Aydınlatma Metni</Text>
              {"'ni okudum, kabul ediyorum. *"}
            </Text>
          </View>

          <TouchableOpacity style={styles.checkboxRow} onPress={() => setMarketingOptIn((v) => !v)}>
            <View style={[styles.checkboxBox, { borderColor: colors.border }, marketingOptIn && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
              {marketingOptIn && <Text style={styles.checkboxMark}>✓</Text>}
            </View>
            <Text style={[styles.checkboxLabel, { color: colors.textSecondary, fontFamily: Fonts.ui }]}>
              İndirimler, hediye kahve kuponları ve kampanyalardan haberdar olmak için bana ticari elektronik ileti gönderilmesini kabul ediyorum.
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleRegister} disabled={loading} style={[styles.button, { borderRadius: glass.radius.md, backgroundColor: colors.primary }]}>
            {loading ? <ActivityIndicator color="#fdfdfb" /> : <Text style={[styles.buttonText, { fontFamily: Fonts.uiBold }]}>Kayıt Ol</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(auth)/login')} style={styles.linkContainer}>
            <Text style={[styles.linkText, { color: colors.gold, fontFamily: Fonts.uiSemiBold }]}>Zaten hesabınız var mı? Giriş yapın</Text>
          </TouchableOpacity>
        </GlassView>
      </ScrollView>
      <LegalTextModal section={legalSection} onClose={() => setLegalSection(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  card: { width: '100%', maxWidth: 340, padding: 32 },
  logoBlock: { alignItems: 'center', marginBottom: 16 },
  logoChip: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 11.5, textAlign: 'center', marginBottom: 20, lineHeight: 17 },
  inputContainer: { marginBottom: 14 },
  label: { fontSize: 9.5, marginBottom: 6, letterSpacing: 0.5 },
  input: { height: 44, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontSize: 14 },
  button: { height: 46, justifyContent: 'center', alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#fdfdfb', fontSize: 15 },
  errorText: { fontSize: 12, textAlign: 'center', marginBottom: 14 },
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 14 },
  checkboxBox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkboxMark: { color: '#fdfdfb', fontSize: 12, fontWeight: '700' },
  checkboxLabel: { flex: 1, fontSize: 11.5, lineHeight: 17 },
  linkContainer: { marginTop: 18, alignItems: 'center' },
  linkText: { fontSize: 13 },
});
