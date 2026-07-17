import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { useRouter, useIsFocused } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Fonts } from '../../constants/theme';
import { Role } from '@kafe/shared-types';
import GlassView from '../../components/GlassView';

const ROLE_LABELS: Record<string, string> = {
  [Role.STAFF]: 'Barista',
  [Role.SHIFT_LEAD]: 'Shift Lead',
};

export default function StaffScreen() {
  const router = useRouter();
  const { user, apiFetch, loading: authLoading } = useAuth();
  const { colors } = useTheme();
  const isFocused = useIsFocused();

  const [staffList, setStaffList] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedStaff, setSelectedStaff] = useState<any>(null);
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [staff, branchList] = await Promise.all([apiFetch('/users/staff'), apiFetch('/branches')]);
      setStaffList(staff);
      setBranches(branchList);
      setError(null);
    } catch (err: any) {
      setError('Personel listesi yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/(auth)/login');
      return;
    }
    loadData();
  }, [user, authLoading]);

  const branchName = (branchId: string | null) => branches.find((b) => b.id === branchId)?.name;

  const assignBranch = async (branchId: string) => {
    if (!selectedStaff) return;
    setAssigning(true);
    setAssignError(null);
    try {
      await apiFetch(`/users/${selectedStaff.id}/branch`, {
        method: 'PATCH',
        body: JSON.stringify({ branchId }),
      });
      setSelectedStaff(null);
      await loadData();
    } catch (err: any) {
      setAssignError(err.message || 'Şube ataması yapılamadı.');
    } finally {
      setAssigning(false);
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

  const unassignedCount = staffList.filter((s) => !s.branchId).length;

  return (
    <>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        {error && (
          <View style={[styles.errorCard, { backgroundColor: `${colors.error}1A`, borderColor: colors.error }]}>
            <Text style={{ color: colors.error, fontFamily: Fonts.uiBold, fontSize: 12 }}>{error}</Text>
          </View>
        )}

        <Text style={[styles.sectionLabel, { color: colors.textMuted, fontFamily: Fonts.uiExtraBold }]}>
          PERSONEL ({staffList.length}){unassignedCount > 0 ? ` · ${unassignedCount} ATANMAMIŞ` : ''}
        </Text>
        <Text style={[styles.sectionDesc, { color: colors.textSecondary, fontFamily: Fonts.ui }]}>
          Bir personele dokunarak şube atamasını değiştirebilirsiniz.
        </Text>

        <View style={{ gap: 10 }}>
          {staffList.map((staff) => (
            <TouchableOpacity key={staff.id} onPress={() => { setSelectedStaff(staff); setAssignError(null); }}>
              <View style={[styles.staffCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.staffName, { color: colors.text, fontFamily: Fonts.uiBold }]}>{staff.fullName}</Text>
                  <Text style={[styles.staffMeta, { color: colors.textMuted, fontFamily: Fonts.ui }]}>
                    {ROLE_LABELS[staff.role] || staff.role}
                    {staff.staffProfile?.employeeCode ? ` · ${staff.staffProfile.employeeCode}` : ''}
                  </Text>
                </View>
                {staff.branchId ? (
                  <View style={[styles.branchTag, { backgroundColor: colors.cardBg2, borderColor: colors.sageBorder }]}>
                    <Text style={[styles.branchTagText, { color: colors.sageText, fontFamily: Fonts.uiBold }]}>{branchName(staff.branchId)}</Text>
                  </View>
                ) : (
                  <View style={[styles.branchTag, { backgroundColor: `${colors.error}1A`, borderColor: colors.error }]}>
                    <Text style={[styles.branchTagText, { color: colors.error, fontFamily: Fonts.uiBold }]}>Atanmamış</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Modal animationType="fade" transparent visible={!!selectedStaff} onRequestClose={() => setSelectedStaff(null)}>
        <View style={styles.modalOverlay}>
          <GlassView backgroundColor={solidSheetBg(colors)} blurAmount={26} style={[styles.modalSheet, { borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text, fontFamily: Fonts.displayItalicSemiBold }]}>
                {selectedStaff?.fullName}
              </Text>
              <TouchableOpacity onPress={() => setSelectedStaff(null)}>
                <Text style={[styles.modalClose, { color: colors.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalLabel, { color: colors.textMuted, fontFamily: Fonts.uiBold }]}>ŞUBE ATA</Text>
            <View style={{ gap: 8, marginBottom: 10 }}>
              {branches.map((branch) => {
                const isCurrent = selectedStaff?.branchId === branch.id;
                return (
                  <TouchableOpacity key={branch.id} disabled={assigning || isCurrent} onPress={() => assignBranch(branch.id)}>
                    {isCurrent ? (
                      <LinearGradient colors={[colors.primary, colors.primaryEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.branchOption}>
                        <Text style={[styles.branchOptionTextActive, { fontFamily: Fonts.uiBold }]}>{branch.name} (mevcut)</Text>
                      </LinearGradient>
                    ) : (
                      <View style={[styles.branchOption, { backgroundColor: colors.cardBg2, borderColor: colors.border, borderWidth: 1 }]}>
                        <Text style={[styles.branchOptionText, { color: colors.text, fontFamily: Fonts.uiSemiBold }]}>{branch.name}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {assigning && <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 6 }} />}
            {assignError && (
              <Text style={{ color: colors.error, fontFamily: Fonts.uiBold, fontSize: 11, marginTop: 8 }}>{assignError}</Text>
            )}
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
  content: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 110 },
  centerFill: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorCard: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 14 },
  sectionLabel: { fontSize: 10, letterSpacing: 1.5, marginBottom: 6 },
  sectionDesc: { fontSize: 10.5, lineHeight: 16, marginBottom: 14 },
  staffCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 16, padding: 14, gap: 10 },
  staffName: { fontSize: 13, marginBottom: 3 },
  staffMeta: { fontSize: 10 },
  branchTag: { borderWidth: 1, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 11, flexShrink: 0 },
  branchTagText: { fontSize: 9.5 },
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
  modalLabel: { fontSize: 10, letterSpacing: 1, marginBottom: 10 },
  branchOption: { borderRadius: 13, paddingVertical: 12, paddingHorizontal: 16 },
  branchOptionText: { fontSize: 12.5 },
  branchOptionTextActive: { fontSize: 12.5, color: '#fdfdfb' },
});
