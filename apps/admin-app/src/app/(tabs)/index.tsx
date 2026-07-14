import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Modal, TextInput } from 'react-native';
import { useRouter, useIsFocused } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Fonts } from '../../constants/theme';
import { TabBranchesIcon } from '../../components/KallaIcons';

const emptyForm = { name: '', address: '', city: '', district: '', latitude: '', longitude: '' };

export default function BranchesScreen() {
  const router = useRouter();
  const { user, loading, apiFetch } = useAuth();
  const { colors } = useTheme();
  const isFocused = useIsFocused();

  const [branches, setBranches] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    try {
      const [branchList, staff] = await Promise.all([apiFetch('/branches'), apiFetch('/users/staff')]);
      setBranches(branchList);
      setStaffList(staff);
      setError(null);
    } catch (err: any) {
      setError('Şubeler yüklenirken hata oluştu.');
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/(auth)/login');
      return;
    }
    if (user) loadData();
  }, [user, loading]);

  const staffCountFor = (branchId: string) => staffList.filter((s) => s.branchId === branchId).length;

  const openCreate = () => {
    setForm(emptyForm);
    setFormError(null);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.address.trim() || !form.latitude.trim() || !form.longitude.trim()) {
      setFormError('Şube adı, adres, enlem ve boylam zorunludur.');
      return;
    }
    const latitude = parseFloat(form.latitude);
    const longitude = parseFloat(form.longitude);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      setFormError('Enlem ve boylam geçerli sayılar olmalıdır.');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      await apiFetch('/branches', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          address: form.address.trim(),
          city: form.city.trim() || undefined,
          district: form.district.trim() || undefined,
          latitude,
          longitude,
        }),
      });
      setModalVisible(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Şube oluşturulamadı.');
    } finally {
      setSaving(false);
    }
  };

  // See customer-app (tabs)/index.tsx: react-native-screens web tab bleed-through guard.
  if (!isFocused) return null;

  if (loading || initialLoading) {
    return (
      <View style={styles.centerFill}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        {error && (
          <View style={[styles.errorCard, { backgroundColor: `${colors.error}1A`, borderColor: colors.error }]}>
            <Text style={{ color: colors.error, fontFamily: Fonts.uiBold, fontSize: 12 }}>{error}</Text>
          </View>
        )}

        <View style={styles.headerRow}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted, fontFamily: Fonts.uiExtraBold }]}>
            ŞUBELER ({branches.length})
          </Text>
          <TouchableOpacity onPress={openCreate}>
            <LinearGradient colors={[colors.primary, colors.primaryEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.addBtn}>
              <Text style={[styles.addBtnText, { fontFamily: Fonts.uiBold }]}>+ Şube Ekle</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={{ gap: 12 }}>
          {branches.map((branch) => (
            <View key={branch.id} style={[styles.branchCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <View style={styles.branchTopRow}>
                <View style={[styles.branchIconChip, { backgroundColor: colors.cardBg2, borderColor: colors.border }]}>
                  <TabBranchesIcon size={16} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.branchName, { color: colors.text, fontFamily: Fonts.display }]}>{branch.name}</Text>
                  <Text style={[styles.branchAddress, { color: colors.textSecondary, fontFamily: Fonts.ui }]}>
                    {branch.district ? `${branch.district}, ` : ''}{branch.address}
                  </Text>
                </View>
              </View>
              <View style={[styles.branchFooter, { borderTopColor: colors.border }]}>
                <Text style={[styles.branchStaffCount, { color: colors.sageText, fontFamily: Fonts.uiBold }]}>
                  {staffCountFor(branch.id)} personel
                </Text>
                <Text style={[styles.branchCoords, { color: colors.textMuted, fontFamily: Fonts.mono }]}>
                  {branch.latitude.toFixed(4)}, {branch.longitude.toFixed(4)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal animationType="fade" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { borderColor: colors.border, backgroundColor: solidSheetBg(colors) }, webBlur()]}>
            <ScrollView contentContainerStyle={{ paddingBottom: 10 }}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text, fontFamily: Fonts.displayItalicSemiBold }]}>Yeni Şube</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text style={[styles.modalClose, { color: colors.textSecondary }]}>✕</Text>
                </TouchableOpacity>
              </View>

              {[
                { key: 'name', label: 'ŞUBE ADI', placeholder: 'Örn. Nişantaşı Şube' },
                { key: 'address', label: 'ADRES', placeholder: 'Sokak, bina no' },
                { key: 'city', label: 'ŞEHİR', placeholder: 'İstanbul' },
                { key: 'district', label: 'İLÇE', placeholder: 'Şişli' },
                { key: 'latitude', label: 'ENLEM (LATITUDE)', placeholder: '41.0500' },
                { key: 'longitude', label: 'BOYLAM (LONGITUDE)', placeholder: '28.9900' },
              ].map((field) => (
                <View key={field.key} style={styles.inputContainer}>
                  <Text style={[styles.label, { color: colors.textMuted, fontFamily: Fonts.uiBold }]}>{field.label}</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBg, fontFamily: Fonts.ui }]}
                    placeholder={field.placeholder}
                    placeholderTextColor={colors.textMuted}
                    value={(form as any)[field.key]}
                    onChangeText={(v) => setForm((prev) => ({ ...prev, [field.key]: v }))}
                    keyboardType={field.key === 'latitude' || field.key === 'longitude' ? 'numeric' : 'default'}
                  />
                </View>
              ))}

              {formError && (
                <Text style={{ color: colors.error, fontFamily: Fonts.uiBold, fontSize: 11, marginBottom: 10 }}>{formError}</Text>
              )}

              <TouchableOpacity onPress={handleSave} disabled={saving}>
                <LinearGradient colors={[colors.primary, colors.primaryEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.saveBtn}>
                  {saving ? <ActivityIndicator size="small" color="#fdfdfb" /> : <Text style={[styles.saveBtnText, { fontFamily: Fonts.uiBold }]}>Şubeyi Kaydet</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

function webBlur() {
  return Platform.select({
    web: {
      // @ts-ignore web-only
      backdropFilter: 'blur(26px) saturate(180%)',
      WebkitBackdropFilter: 'blur(26px) saturate(180%)',
    } as any,
    default: {},
  });
}

function solidSheetBg(colors: any) {
  return colors.text === '#232621' ? 'rgba(252,252,250,0.92)' : 'rgba(24,32,28,0.92)';
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 110 },
  centerFill: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorCard: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 14 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionLabel: { fontSize: 10, letterSpacing: 1.5 },
  addBtn: { borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },
  addBtnText: { color: '#fdfdfb', fontSize: 11 },
  branchCard: { borderWidth: 1, borderRadius: 18, padding: 14 },
  branchTopRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  branchIconChip: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  branchName: { fontSize: 15, marginBottom: 3 },
  branchAddress: { fontSize: 11, lineHeight: 16 },
  branchFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, paddingTop: 10 },
  branchStaffCount: { fontSize: 11 },
  branchCoords: { fontSize: 9 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(10,15,12,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    width: '100%',
    maxHeight: '85%',
    borderTopWidth: 1,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 30,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 16 },
  modalClose: { fontSize: 16 },
  inputContainer: { marginBottom: 14 },
  label: { fontSize: 9.5, letterSpacing: 1, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 14, fontSize: 13 },
  saveBtn: { height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  saveBtnText: { color: '#fdfdfb', fontSize: 13 },
});
