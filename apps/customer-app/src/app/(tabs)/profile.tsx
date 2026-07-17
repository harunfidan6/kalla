import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, Platform } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Fonts } from '../../constants/theme';
import ThemeSwitch from '../../components/ThemeSwitch';
import ConfirmModal, { ConfirmModalState } from '../../components/ConfirmModal';
import { useRouter, useIsFocused } from 'expo-router';

interface Address {
  id: string;
  label: string;
  addressLine: string;
  city?: string;
  district?: string;
  isDefault: boolean;
}

const emptyForm = { label: '', addressLine: '', city: '', district: '' };

export default function ProfileScreen() {
  const router = useRouter();
  const { user, apiFetch, logout, loading: authLoading } = useAuth();
  const { theme, colors, toggleTheme } = useTheme();
  const isFocused = useIsFocused();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [confirmState, setConfirmState] = useState<ConfirmModalState | null>(null);

  const loadAddresses = async () => {
    try {
      const data = await apiFetch('/users/me/addresses');
      setAddresses(data);
    } catch {
      // silent — address list is a secondary feature, not gating page render
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/(auth)/login');
      return;
    }
    loadAddresses();
  }, [user, authLoading]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalVisible(true);
  };

  const openEdit = (address: Address) => {
    setEditingId(address.id);
    setForm({ label: address.label, addressLine: address.addressLine, city: address.city || '', district: address.district || '' });
    setModalVisible(true);
  };

  // react-native-web'in Alert.alert() implementasyonu tamamen no-op (hiçbir şey yapmıyor) —
  // web'de zaten window.alert kullanılıyor; native'de ise markasız OS diyaloğu yerine kendi
  // ConfirmModal'ımızı gösteriyoruz (bkz. components/ConfirmModal.tsx).
  const notify = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n${message}`);
    } else {
      setConfirmState({ title, message });
    }
  };

  const handleSave = async () => {
    if (!form.label.trim() || !form.addressLine.trim()) {
      notify('Eksik Bilgi', 'Etiket ve adres alanları zorunludur.');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await apiFetch(`/users/me/addresses/${editingId}`, { method: 'PATCH', body: JSON.stringify(form) });
      } else {
        await apiFetch('/users/me/addresses', { method: 'POST', body: JSON.stringify(form) });
      }
      setModalVisible(false);
      await loadAddresses();
    } catch (err: any) {
      notify('Hata', err.message || 'Adres kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (address: Address) => {
    const doDelete = async () => {
      try {
        await apiFetch(`/users/me/addresses/${address.id}`, { method: 'DELETE' });
        await loadAddresses();
      } catch (err: any) {
        notify('Hata', err.message || 'Adres silinemedi.');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`"${address.label}" adresini silmek istediğinize emin misiniz?`)) {
        doDelete();
      }
      return;
    }
    setConfirmState({
      title: 'Adresi Sil',
      message: `"${address.label}" adresini silmek istediğinize emin misiniz?`,
      cancelText: 'Vazgeç',
      confirmText: 'Sil',
      destructive: true,
      onConfirm: doDelete,
    });
  };

  const initial = (user?.fullName || '?').trim().charAt(0).toUpperCase();

  // See index.tsx for why this guard is needed (react-native-screens web tab bleed-through).
  if (!isFocused) return null;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        <View style={[styles.profileCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.avatarText, { fontFamily: Fonts.display }]}>{initial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.userName, { color: colors.text, fontFamily: Fonts.displayItalicSemiBold }]}>{user?.fullName}</Text>
            <Text style={[styles.userEmail, { color: colors.textSecondary, fontFamily: Fonts.ui }]}>{user?.email}</Text>
          </View>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted, fontFamily: Fonts.uiExtraBold }]}>ADRESLERİM</Text>
          <TouchableOpacity onPress={openCreate}>
            <View style={[styles.addBtn, { backgroundColor: `${colors.primary}24`, borderColor: colors.sageBorder }]}>
              <Text style={[styles.addBtnText, { color: colors.sageText, fontFamily: Fonts.uiBold }]}>+ Ekle</Text>
            </View>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
        ) : addresses.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <Text style={[styles.emptyText, { color: colors.textSecondary, fontFamily: Fonts.displayItalic }]}>Henüz kayıtlı adresiniz yok.</Text>
          </View>
        ) : (
          <View style={{ gap: 10, marginBottom: 22 }}>
            {addresses.map((address) => (
              <View key={address.id} style={[styles.addressCard, { backgroundColor: colors.cardBg2, borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <View style={styles.addressLabelRow}>
                    <Text style={[styles.addressLabel, { color: colors.text, fontFamily: Fonts.uiBold }]}>{address.label}</Text>
                    {address.isDefault && (
                      <View style={[styles.defaultBadge, { backgroundColor: colors.goldTint }]}>
                        <Text style={[styles.defaultBadgeText, { color: colors.gold, fontFamily: Fonts.uiBold }]}>VARSAYILAN</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.addressLine, { color: colors.textSecondary, fontFamily: Fonts.ui }]}>
                    {address.addressLine}{address.district ? `, ${address.district}` : ''}{address.city ? ` / ${address.city}` : ''}
                  </Text>
                </View>
                <View style={styles.addressActions}>
                  <TouchableOpacity onPress={() => openEdit(address)}>
                    <Text style={[styles.actionLink, { color: colors.primary, fontFamily: Fonts.uiSemiBold }]}>Düzenle</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(address)}>
                    <Text style={[styles.actionLink, { color: colors.error, fontFamily: Fonts.uiSemiBold }]}>Sil</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={[styles.themeRow, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <Text style={[styles.themeRowText, { color: colors.text, fontFamily: Fonts.uiSemiBold }]}>Koyu Tema</Text>
          <ThemeSwitch value={theme === 'dark'} onToggle={toggleTheme} trackColorOn={colors.switchTrack} trackColorOff={colors.switchTrack} />
        </View>

        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Text style={[styles.logoutText, { color: colors.error, fontFamily: Fonts.uiBold }]}>Çıkış Yap</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal animationType="slide" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlayBar }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.cardBgStrong, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text, fontFamily: Fonts.displayItalicSemiBold }]}>
                {editingId ? 'Adresi Düzenle' : 'Yeni Adres Ekle'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={{ fontSize: 18, color: colors.textSecondary }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
              {[
                { key: 'label', label: 'ETİKET (Ev, İş...)', placeholder: 'Ev' },
                { key: 'addressLine', label: 'AÇIK ADRES', placeholder: 'Mahalle, sokak, kapı no' },
                { key: 'district', label: 'İLÇE', placeholder: 'Kadıköy' },
                { key: 'city', label: 'ŞEHİR', placeholder: 'İstanbul' },
              ].map((field) => (
                <View key={field.key} style={{ marginBottom: 14 }}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary, fontFamily: Fonts.uiBold }]}>{field.label}</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBg, fontFamily: Fonts.ui }]}
                    value={(form as any)[field.key]}
                    onChangeText={(v) => setForm((f) => ({ ...f, [field.key]: v }))}
                    placeholder={field.placeholder}
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              ))}

              <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary }]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator size="small" color="#fdfdfb" /> : <Text style={[styles.submitBtnText, { fontFamily: Fonts.uiBold }]}>Kaydet</Text>}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ConfirmModal state={confirmState} onClose={() => setConfirmState(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 110 },
  profileCard: { padding: 18, borderRadius: 20, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fdfdfb', fontSize: 20 },
  userName: { fontSize: 16, marginBottom: 2 },
  userEmail: { fontSize: 11 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionLabel: { fontSize: 10, letterSpacing: 1.5 },
  addBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1 },
  addBtnText: { fontSize: 11 },
  emptyCard: { padding: 20, borderRadius: 16, borderWidth: 1, alignItems: 'center', marginBottom: 16 },
  emptyText: { fontSize: 13 },
  addressCard: { padding: 13, borderRadius: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  addressLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 },
  addressLabel: { fontSize: 12 },
  defaultBadge: { paddingVertical: 2, paddingHorizontal: 6, borderRadius: 6 },
  defaultBadgeText: { fontSize: 8 },
  addressLine: { fontSize: 10.5, lineHeight: 15 },
  addressActions: { alignItems: 'flex-end', gap: 8, marginLeft: 10 },
  actionLink: { fontSize: 11 },
  themeRow: { padding: 14, borderRadius: 16, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  themeRowText: { fontSize: 12 },
  logoutBtn: { alignItems: 'center' },
  logoutText: { fontSize: 12 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalCard: { maxHeight: '85%', padding: 24, borderWidth: 1, borderBottomWidth: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18 },
  inputLabel: { fontSize: 10, marginBottom: 4 },
  input: { height: 44, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontSize: 14 },
  submitBtn: { height: 48, justifyContent: 'center', alignItems: 'center', marginTop: 8, marginBottom: 24, borderRadius: 12 },
  submitBtnText: { color: '#fdfdfb', fontSize: 14 },
});
