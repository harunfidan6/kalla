import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, Platform, RefreshControl } from 'react-native';
import { useRouter, useIsFocused } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Fonts } from '../../constants/theme';
import { Role, ShiftChangeRequestStatus } from '@kafe/shared-types';

const WEEKDAYS = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

const ROLE_LABELS: Record<string, string> = {
  [Role.STAFF]: 'Barista',
  [Role.SHIFT_LEAD]: 'Shift Lead',
  [Role.ADMIN]: 'Admin',
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

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

export default function ShiftsScreen() {
  const router = useRouter();
  const { user, apiFetch, loading: authLoading } = useAuth();
  const { colors } = useTheme();
  const isFocused = useIsFocused();

  const [shifts, setShifts] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedShift, setSelectedShift] = useState<any>(null);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const isManager = user?.role === Role.SHIFT_LEAD || user?.role === Role.ADMIN;

  const loadData = useCallback(async () => {
    try {
      const weekStart = getWeekStart();
      const [teamShifts, pending] = await Promise.all([
        apiFetch(`/shifts/team?weekStart=${weekStart}`),
        isManager ? apiFetch('/shifts/change-requests/pending') : Promise.resolve([]),
      ]);
      setShifts(teamShifts);
      setPendingRequests(pending);
      setError(null);
    } catch (err: any) {
      setError('Vardiya çizelgesi yüklenemedi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [apiFetch, isManager]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/(auth)/login');
      return;
    }
    loadData();
  }, [user, authLoading]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const openChangeModal = (shift: any) => {
    setSelectedShift(shift);
    setReason('');
    setModalError(null);
    setRequestSuccess(false);
  };

  const submitChangeRequest = async () => {
    if (!reason.trim()) {
      setModalError('Lütfen bir gerekçe yazın.');
      return;
    }
    setSubmitting(true);
    setModalError(null);
    try {
      await apiFetch('/shifts/change-request', {
        method: 'POST',
        body: JSON.stringify({ shiftId: selectedShift.id, reason: reason.trim() }),
      });
      setRequestSuccess(true);
      setTimeout(() => {
        setSelectedShift(null);
        setRequestSuccess(false);
        loadData();
      }, 1300);
    } catch (err: any) {
      setModalError(err.message || 'Talep gönderilemedi.');
    } finally {
      setSubmitting(false);
    }
  };

  const processRequest = async (requestId: string, status: ShiftChangeRequestStatus) => {
    setProcessingId(requestId);
    try {
      await apiFetch(`/shifts/change-request/${requestId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await loadData();
    } catch (err: any) {
      if (Platform.OS === 'web') alert('Talep işlenemedi: ' + err.message);
    } finally {
      setProcessingId(null);
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

  // Vardiyaları haftanın günlerine dağıt (Pazartesi = index 0).
  const dayBuckets: Record<string, any[]> = {};
  for (const day of WEEKDAYS) dayBuckets[day] = [];
  for (const shift of shifts) {
    const jsDay = new Date(shift.startTime).getDay(); // 0 = Pazar
    const idx = jsDay === 0 ? 6 : jsDay - 1;
    dayBuckets[WEEKDAYS[idx]].push(shift);
  }

  const hasPendingRequest = (shift: any) =>
    (shift.changeRequests || []).some((r: any) => r.status === ShiftChangeRequestStatus.PENDING);

  const roleColor = (role: string) => (role === Role.SHIFT_LEAD || role === Role.ADMIN ? colors.gold : colors.primary);

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

        <Text style={[styles.sectionLabel, { color: colors.textMuted, fontFamily: Fonts.uiExtraBold }]}>
          HAFTALIK EKİP ÇİZELGESİ
        </Text>
        <Text style={[styles.sectionDesc, { color: colors.textSecondary, fontFamily: Fonts.ui }]}>
          Tüm ekibin bu haftaki vardiyaları. Kendi vardiyanıza dokunarak değişim talebi başlatabilirsiniz.
        </Text>

        <View style={{ gap: 12 }}>
          {WEEKDAYS.map((day) => {
            const assignments = dayBuckets[day];
            return (
              <View key={day} style={[styles.dayCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <View style={[styles.dayHeader, assignments.length > 0 && { marginBottom: 10 }]}>
                  <Text style={[styles.dayLabel, { color: colors.text, fontFamily: Fonts.uiExtraBold }]}>{day}</Text>
                  <Text
                    style={[
                      styles.dayBadge,
                      { color: assignments.length ? colors.sageText : colors.textMuted, fontFamily: Fonts.uiExtraBold },
                    ]}
                  >
                    {assignments.length ? `${assignments.length} KİŞİ` : 'KAPALI'}
                  </Text>
                </View>

                <View style={{ gap: 8 }}>
                  {assignments.map((shift) => {
                    const pending = hasPendingRequest(shift);
                    const isOwn = shift.staff?.id === user?.id;
                    return (
                      <TouchableOpacity
                        key={shift.id}
                        disabled={!isOwn || pending}
                        onPress={() => openChangeModal(shift)}
                      >
                        <View style={[styles.assignmentRow, { backgroundColor: colors.cardBg2, borderColor: colors.border }]}>
                          <View style={styles.assignmentLeft}>
                            <View style={[styles.roleDot, { backgroundColor: roleColor(shift.staff?.role) }]} />
                            <View>
                              <Text style={[styles.staffName, { color: colors.text, fontFamily: Fonts.uiBold }]}>
                                {shift.staff?.fullName}
                                {isOwn ? ' (siz)' : ''}
                              </Text>
                              <Text style={[styles.staffRole, { color: colors.textMuted, fontFamily: Fonts.ui }]}>
                                {ROLE_LABELS[shift.staff?.role] || shift.staff?.role}
                              </Text>
                            </View>
                          </View>
                          <Text
                            style={[
                              styles.timeLabel,
                              { color: pending ? colors.gold : colors.textSecondary, fontFamily: Fonts.uiBold },
                            ]}
                          >
                            {pending ? 'DEĞİŞİM BEKLİYOR' : `${formatTime(shift.startTime)} – ${formatTime(shift.endTime)}`}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>

        {/* Yönetici onay paneli */}
        {isManager && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.textMuted, fontFamily: Fonts.uiExtraBold, marginTop: 26 }]}>
              ONAY BEKLEYEN TALEPLER
            </Text>
            {pendingRequests.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.cardBg2, borderColor: colors.border }]}>
                <Text style={[styles.emptyText, { color: colors.textMuted, fontFamily: Fonts.displayItalic }]}>
                  Bekleyen değişim talebi yok.
                </Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {pendingRequests.map((req) => (
                  <View key={req.id} style={[styles.requestCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                    <Text style={[styles.requestName, { color: colors.text, fontFamily: Fonts.uiBold }]}>
                      {req.requester?.fullName}
                    </Text>
                    <Text style={[styles.requestShift, { color: colors.textSecondary, fontFamily: Fonts.ui }]}>
                      {new Date(req.shift?.startTime).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}{' '}
                      ({formatTime(req.shift?.startTime)} – {formatTime(req.shift?.endTime)})
                    </Text>
                    <Text style={[styles.requestReason, { color: colors.textSecondary, fontFamily: Fonts.displayItalic }]}>
                      "{req.reason}"
                    </Text>
                    <View style={styles.requestActions}>
                      <TouchableOpacity
                        style={{ flex: 1 }}
                        disabled={processingId === req.id}
                        onPress={() => processRequest(req.id, ShiftChangeRequestStatus.APPROVED)}
                      >
                        <LinearGradient
                          colors={[colors.primary, colors.primaryEnd]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.approveBtn}
                        >
                          {processingId === req.id ? (
                            <ActivityIndicator size="small" color="#fdfdfb" />
                          ) : (
                            <Text style={[styles.approveBtnText, { fontFamily: Fonts.uiBold }]}>Onayla</Text>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{ flex: 1 }}
                        disabled={processingId === req.id}
                        onPress={() => processRequest(req.id, ShiftChangeRequestStatus.REJECTED)}
                      >
                        <View style={[styles.rejectBtn, { borderColor: colors.error }]}>
                          <Text style={[styles.rejectBtnText, { color: colors.error, fontFamily: Fonts.uiBold }]}>Reddet</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Vardiya değişim talebi bottom sheet */}
      {selectedShift && (
        <Modal animationType="fade" transparent visible onRequestClose={() => setSelectedShift(null)}>
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalSheet,
                { borderColor: colors.border, backgroundColor: solidSheetBg(colors) },
                webBlur(),
              ]}
            >
              {!requestSuccess ? (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: colors.text, fontFamily: Fonts.displayItalicSemiBold }]}>
                      Vardiya Değiştirme
                    </Text>
                    <TouchableOpacity onPress={() => setSelectedShift(null)}>
                      <Text style={[styles.modalClose, { color: colors.textSecondary }]}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={[styles.modalLabel, { color: colors.textMuted, fontFamily: Fonts.uiBold }]}>SEÇİLİ GÜN</Text>
                  <Text style={[styles.modalDay, { color: colors.text, fontFamily: Fonts.display }]}>
                    {new Date(selectedShift.startTime).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}{' '}
                    ({formatTime(selectedShift.startTime)} – {formatTime(selectedShift.endTime)})
                  </Text>

                  <Text style={[styles.modalLabel, { color: colors.textMuted, fontFamily: Fonts.uiBold }]}>GEREKÇE</Text>
                  <TextInput
                    style={[
                      styles.reasonInput,
                      { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBg, fontFamily: Fonts.displayItalic },
                    ]}
                    placeholder="Randevu / izin talebi vb."
                    placeholderTextColor={colors.textMuted}
                    value={reason}
                    onChangeText={setReason}
                    multiline
                  />

                  {modalError && (
                    <Text style={{ color: colors.error, fontFamily: Fonts.uiBold, fontSize: 11, marginBottom: 10 }}>{modalError}</Text>
                  )}

                  <TouchableOpacity onPress={submitChangeRequest} disabled={submitting}>
                    <LinearGradient
                      colors={[colors.primary, colors.primaryEnd]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.submitBtn}
                    >
                      {submitting ? (
                        <ActivityIndicator size="small" color="#fdfdfb" />
                      ) : (
                        <Text style={[styles.submitBtnText, { fontFamily: Fonts.uiBold }]}>Talebi İlet</Text>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.successBox}>
                  <View style={[styles.successCircle, { backgroundColor: colors.primary }]}>
                    <Text style={styles.successCheck}>✓</Text>
                  </View>
                  <Text style={[styles.successTitle, { color: colors.text, fontFamily: Fonts.displayItalicSemiBold }]}>
                    Talep İletildi
                  </Text>
                  <Text style={[styles.successDesc, { color: colors.textSecondary, fontFamily: Fonts.ui }]}>
                    Yöneticinizin onayı bekleniyor.
                  </Text>
                </View>
              )}
            </View>
          </View>
        </Modal>
      )}
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

// Modal arka planı: cardBgStrong çok saydam olduğundan altındaki karartılmış içerik okunurluğu
// bozuyor — bottom sheet'lerde tema bazlı opak-ımsı yüzey kullan.
function solidSheetBg(colors: any) {
  return colors.text === '#232621' ? 'rgba(252,252,250,0.92)' : 'rgba(24,32,28,0.92)';
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 110 },
  centerFill: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorCard: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 14 },
  sectionLabel: { fontSize: 10, letterSpacing: 1.5, marginBottom: 6 },
  sectionDesc: { fontSize: 10.5, lineHeight: 16, marginBottom: 14 },
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
  emptyCard: { borderWidth: 1, borderRadius: 14, padding: 16, alignItems: 'center' },
  emptyText: { fontSize: 11 },
  requestCard: { borderWidth: 1, borderRadius: 16, padding: 14 },
  requestName: { fontSize: 12.5, marginBottom: 3 },
  requestShift: { fontSize: 10.5, marginBottom: 6 },
  requestReason: { fontSize: 11.5, marginBottom: 12 },
  requestActions: { flexDirection: 'row', gap: 8 },
  approveBtn: { height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  approveBtnText: { color: '#fdfdfb', fontSize: 12 },
  rejectBtn: { height: 38, borderRadius: 11, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  rejectBtnText: { fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(10,15,12,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    width: '100%',
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
  modalLabel: { fontSize: 10, letterSpacing: 1, marginBottom: 6 },
  modalDay: { fontSize: 14, marginBottom: 18 },
  reasonInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 12.5,
    minHeight: 56,
    marginBottom: 20,
    textAlignVertical: 'top',
  },
  submitBtn: { height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  submitBtnText: { color: '#fdfdfb', fontSize: 13 },
  successBox: { alignItems: 'center', paddingVertical: 20, paddingHorizontal: 10 },
  successCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  successCheck: { color: '#fdfdfb', fontSize: 26 },
  successTitle: { fontSize: 16 },
  successDesc: { fontSize: 11.5, marginTop: 6 },
});
