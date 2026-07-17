import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, RefreshControl } from 'react-native';
import { useRouter, useIsFocused } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Fonts } from '../../constants/theme';
import { Role } from '@kafe/shared-types';
import GlassView from '../../components/GlassView';

const WEEKDAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

const ROLE_LABELS: Record<string, string> = {
  [Role.STAFF]: 'Barista',
  [Role.SHIFT_LEAD]: 'Shift Lead',
};

// Pazartesi ile başlayan hafta (yerel saat), YYYY-MM-DD.
function getWeekStart(): string {
  const now = new Date();
  const day = now.getDay(); // 0 = Pazar
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, '0');
  const d = String(monday.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function dateForWeekday(weekStart: string, dayIndex: number): Date {
  const start = new Date(`${weekStart}T00:00:00`);
  start.setDate(start.getDate() + dayIndex);
  return start;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

const emptyForm = { staffId: '', dayIndex: 0, startTime: '09:00', endTime: '17:00' };

export default function AdminShiftsScreen() {
  const router = useRouter();
  const { user, apiFetch, loading: authLoading } = useAuth();
  const { colors } = useTheme();
  const isFocused = useIsFocused();

  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [shifts, setShifts] = useState<any[]>([]);
  const [branchStaff, setBranchStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const weekStart = getWeekStart();

  const loadShifts = useCallback(
    async (branchId: string) => {
      try {
        const [teamShifts, staffList] = await Promise.all([
          apiFetch(`/shifts/team?weekStart=${weekStart}&branchId=${branchId}`),
          apiFetch('/users/staff'),
        ]);
        setShifts(teamShifts);
        setBranchStaff(staffList.filter((s: any) => s.branchId === branchId));
        setError(null);
      } catch (err: any) {
        setError('Vardiya çizelgesi yüklenemedi.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [apiFetch, weekStart],
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/(auth)/login');
      return;
    }
    const init = async () => {
      try {
        const branchList = await apiFetch('/branches');
        setBranches(branchList);
        if (branchList.length > 0) {
          setSelectedBranchId(branchList[0].id);
          await loadShifts(branchList[0].id);
        } else {
          setLoading(false);
        }
      } catch {
        setError('Şubeler yüklenemedi.');
        setLoading(false);
      }
    };
    init();
  }, [user, authLoading]);

  const selectBranch = async (branchId: string) => {
    setSelectedBranchId(branchId);
    setLoading(true);
    await loadShifts(branchId);
  };

  const onRefresh = () => {
    if (!selectedBranchId) return;
    setRefreshing(true);
    loadShifts(selectedBranchId);
  };

  const openCreate = () => {
    setForm({ ...emptyForm, staffId: branchStaff[0]?.id || '' });
    setFormError(null);
    setModalVisible(true);
  };

  const handleCreateShift = async () => {
    if (!form.staffId) {
      setFormError('Lütfen bir personel seçin.');
      return;
    }
    const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timePattern.test(form.startTime) || !timePattern.test(form.endTime)) {
      setFormError('Saatler SS:DD biçiminde olmalıdır (örn. 09:00).');
      return;
    }

    const day = dateForWeekday(weekStart, form.dayIndex);
    const [startH, startM] = form.startTime.split(':').map(Number);
    const [endH, endM] = form.endTime.split(':').map(Number);
    const startTime = new Date(day);
    startTime.setHours(startH, startM, 0, 0);
    const endTime = new Date(day);
    endTime.setHours(endH, endM, 0, 0);

    if (endTime <= startTime) {
      setFormError('Bitiş saati başlangıç saatinden sonra olmalıdır.');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      await apiFetch('/shifts', {
        method: 'POST',
        body: JSON.stringify({ staffId: form.staffId, startTime: startTime.toISOString(), endTime: endTime.toISOString() }),
      });
      setModalVisible(false);
      if (selectedBranchId) await loadShifts(selectedBranchId);
    } catch (err: any) {
      setFormError(err.message || 'Vardiya oluşturulamadı.');
    } finally {
      setSaving(false);
    }
  };

  // See customer-app (tabs)/index.tsx: react-native-screens web tab bleed-through guard.
  if (!isFocused) return null;

  if (loading) {
    return (
      <View style={styles.centerFill}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  const dayBuckets: Record<string, any[]> = {};
  for (const day of WEEKDAYS) dayBuckets[day] = [];
  for (const shift of shifts) {
    const jsDay = new Date(shift.startTime).getDay();
    const idx = jsDay === 0 ? 6 : jsDay - 1;
    dayBuckets[WEEKDAYS[idx]].push(shift);
  }

  const roleColor = (role: string) => (role === Role.SHIFT_LEAD ? colors.gold : colors.primary);

  return (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {error && (
          <View style={[styles.errorCard, { backgroundColor: `${colors.error}1A`, borderColor: colors.error }]}>
            <Text style={{ color: colors.error, fontFamily: Fonts.uiBold, fontSize: 12 }}>{error}</Text>
          </View>
        )}

        <Text style={[styles.sectionLabel, { color: colors.textMuted, fontFamily: Fonts.uiExtraBold }]}>ŞUBE SEÇ</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.branchPillsRow}>
          {branches.map((branch) => {
            const selected = branch.id === selectedBranchId;
            if (selected) {
              return (
                <LinearGradient key={branch.id} colors={[colors.primary, colors.primaryEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.branchPill}>
                  <Text style={[styles.branchPillTextActive, { fontFamily: Fonts.uiBold }]}>{branch.name}</Text>
                </LinearGradient>
              );
            }
            return (
              <TouchableOpacity key={branch.id} onPress={() => selectBranch(branch.id)}>
                <View style={[styles.branchPill, { backgroundColor: colors.cardBg2, borderColor: colors.border, borderWidth: 1 }]}>
                  <Text style={[styles.branchPillText, { color: colors.text, fontFamily: Fonts.uiSemiBold }]}>{branch.name}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.headerRow}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted, fontFamily: Fonts.uiExtraBold }]}>HAFTALIK ÇİZELGE</Text>
          <TouchableOpacity onPress={openCreate} disabled={branchStaff.length === 0}>
            <LinearGradient colors={[colors.primary, colors.primaryEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.addBtn, { opacity: branchStaff.length === 0 ? 0.45 : 1 }]}>
              <Text style={[styles.addBtnText, { fontFamily: Fonts.uiBold }]}>+ Vardiya Ekle</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        {branchStaff.length === 0 && (
          <Text style={[styles.sectionDesc, { color: colors.textMuted, fontFamily: Fonts.ui, marginBottom: 14 }]}>
            Bu şubede henüz atanmış personel yok — önce Personel sekmesinden atama yapın.
          </Text>
        )}

        <View style={{ gap: 12 }}>
          {WEEKDAYS.map((day) => {
            const assignments = dayBuckets[day];
            return (
              <View key={day} style={[styles.dayCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <View style={[styles.dayHeader, assignments.length > 0 && { marginBottom: 10 }]}>
                  <Text style={[styles.dayLabel, { color: colors.text, fontFamily: Fonts.uiExtraBold }]}>{day}</Text>
                  <Text style={[styles.dayBadge, { color: assignments.length ? colors.sageText : colors.textMuted, fontFamily: Fonts.uiExtraBold }]}>
                    {assignments.length ? `${assignments.length} KİŞİ` : 'KAPALI'}
                  </Text>
                </View>
                <View style={{ gap: 8 }}>
                  {assignments.map((shift) => (
                    <View key={shift.id} style={[styles.assignmentRow, { backgroundColor: colors.cardBg2, borderColor: colors.border }]}>
                      <View style={styles.assignmentLeft}>
                        <View style={[styles.roleDot, { backgroundColor: roleColor(shift.staff?.role) }]} />
                        <View>
                          <Text style={[styles.staffName, { color: colors.text, fontFamily: Fonts.uiBold }]}>{shift.staff?.fullName}</Text>
                          <Text style={[styles.staffRole, { color: colors.textMuted, fontFamily: Fonts.ui }]}>
                            {ROLE_LABELS[shift.staff?.role] || shift.staff?.role}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.timeLabel, { color: colors.textSecondary, fontFamily: Fonts.uiBold }]}>
                        {formatTime(shift.startTime)} – {formatTime(shift.endTime)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <Modal animationType="fade" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <GlassView backgroundColor={solidSheetBg(colors)} blurAmount={26} style={[styles.modalSheet, { borderColor: colors.border }]}>
            <ScrollView contentContainerStyle={{ paddingBottom: 10 }}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text, fontFamily: Fonts.displayItalicSemiBold }]}>Vardiya Ekle</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Text style={[styles.modalClose, { color: colors.textSecondary }]}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.modalLabel, { color: colors.textMuted, fontFamily: Fonts.uiBold }]}>PERSONEL</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {branchStaff.map((staff) => {
                  const selected = form.staffId === staff.id;
                  return (
                    <TouchableOpacity key={staff.id} onPress={() => setForm((prev) => ({ ...prev, staffId: staff.id }))}>
                      {selected ? (
                        <LinearGradient colors={[colors.primary, colors.primaryEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.staffPill}>
                          <Text style={[styles.staffPillTextActive, { fontFamily: Fonts.uiBold }]}>{staff.fullName}</Text>
                        </LinearGradient>
                      ) : (
                        <View style={[styles.staffPill, { backgroundColor: colors.cardBg2, borderColor: colors.border, borderWidth: 1 }]}>
                          <Text style={[styles.staffPillText, { color: colors.text, fontFamily: Fonts.uiSemiBold }]}>{staff.fullName}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.modalLabel, { color: colors.textMuted, fontFamily: Fonts.uiBold }]}>GÜN</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {WEEKDAYS.map((day, idx) => {
                  const selected = form.dayIndex === idx;
                  return (
                    <TouchableOpacity key={day} onPress={() => setForm((prev) => ({ ...prev, dayIndex: idx }))}>
                      {selected ? (
                        <LinearGradient colors={[colors.primary, colors.primaryEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.dayPill}>
                          <Text style={[styles.staffPillTextActive, { fontFamily: Fonts.uiBold }]}>{day.slice(0, 3)}</Text>
                        </LinearGradient>
                      ) : (
                        <View style={[styles.dayPill, { backgroundColor: colors.cardBg2, borderColor: colors.border, borderWidth: 1 }]}>
                          <Text style={[styles.staffPillText, { color: colors.text, fontFamily: Fonts.uiSemiBold }]}>{day.slice(0, 3)}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={[styles.inputContainer, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.textMuted, fontFamily: Fonts.uiBold }]}>BAŞLANGIÇ</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBg, fontFamily: Fonts.mono }]}
                    placeholder="09:00"
                    placeholderTextColor={colors.textMuted}
                    value={form.startTime}
                    onChangeText={(v) => setForm((prev) => ({ ...prev, startTime: v }))}
                  />
                </View>
                <View style={[styles.inputContainer, { flex: 1 }]}>
                  <Text style={[styles.label, { color: colors.textMuted, fontFamily: Fonts.uiBold }]}>BİTİŞ</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBg, fontFamily: Fonts.mono }]}
                    placeholder="17:00"
                    placeholderTextColor={colors.textMuted}
                    value={form.endTime}
                    onChangeText={(v) => setForm((prev) => ({ ...prev, endTime: v }))}
                  />
                </View>
              </View>

              {formError && (
                <Text style={{ color: colors.error, fontFamily: Fonts.uiBold, fontSize: 11, marginTop: 12 }}>{formError}</Text>
              )}

              <TouchableOpacity onPress={handleCreateShift} disabled={saving}>
                <LinearGradient colors={[colors.primary, colors.primaryEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.submitBtn}>
                  {saving ? <ActivityIndicator size="small" color="#fdfdfb" /> : <Text style={[styles.submitBtnText, { fontFamily: Fonts.uiBold }]}>Vardiyayı Kaydet</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </GlassView>
        </View>
      </Modal>
    </>
  );
}

function solidSheetBg(colors: any) {
  return colors.text === '#232621' ? 'rgba(252,252,250,0.92)' : 'rgba(24,32,28,0.92)';
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 110 },
  centerFill: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorCard: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 14 },
  sectionLabel: { fontSize: 10, letterSpacing: 1.5, marginBottom: 10 },
  sectionDesc: { fontSize: 10.5, lineHeight: 16 },
  branchPillsRow: { gap: 8, marginBottom: 20 },
  branchPill: { borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },
  branchPillText: { fontSize: 11 },
  branchPillTextActive: { fontSize: 11, color: '#fdfdfb' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  addBtn: { borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },
  addBtnText: { color: '#fdfdfb', fontSize: 11 },
  dayCard: { borderWidth: 1, borderRadius: 16, padding: 13 },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayLabel: { fontSize: 12.5 },
  dayBadge: { fontSize: 8, letterSpacing: 0.5 },
  assignmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 11,
    paddingVertical: 8,
    paddingHorizontal: 11,
  },
  assignmentLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  roleDot: { width: 7, height: 7, borderRadius: 4 },
  staffName: { fontSize: 11.5 },
  staffRole: { fontSize: 9 },
  timeLabel: { fontSize: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(10,15,12,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    width: '100%',
    maxHeight: '85%',
    borderTopWidth: 1,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 34,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 16 },
  modalClose: { fontSize: 16 },
  modalLabel: { fontSize: 10, letterSpacing: 1, marginBottom: 8 },
  staffPill: { borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },
  staffPillText: { fontSize: 11 },
  staffPillTextActive: { fontSize: 11, color: '#fdfdfb' },
  dayPill: { borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12 },
  inputContainer: { marginBottom: 14 },
  label: { fontSize: 9.5, letterSpacing: 1, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 14, fontSize: 13 },
  submitBtn: { height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  submitBtnText: { color: '#fdfdfb', fontSize: 13 },
});
