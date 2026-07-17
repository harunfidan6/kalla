import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { useRouter, useIsFocused } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Fonts, formatTL } from '../../constants/theme';
import GlassView from '../../components/GlassView';

export default function AdminZReportsScreen() {
  const router = useRouter();
  const { user, apiFetch, loading: authLoading } = useAuth();
  const { colors } = useTheme();
  const isFocused = useIsFocused();

  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null); // null = Tümü
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);

  const loadReports = useCallback(
    async (branchId: string | null) => {
      try {
        const query = branchId ? `?branchId=${branchId}` : '';
        const reportList = await apiFetch(`/sales/reports${query}`);
        setReports(reportList);
        setError(null);
      } catch (err: any) {
        setError('Z raporları yüklenemedi.');
      } finally {
        setLoading(false);
      }
    },
    [apiFetch],
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
      } catch {
        // Şube listesi olmadan da "Tümü" filtresiyle rapor listelemeye devam edilebilir.
      }
      await loadReports(null);
    };
    init();
  }, [user, authLoading]);

  const selectBranch = async (branchId: string | null) => {
    setSelectedBranchId(branchId);
    setLoading(true);
    await loadReports(branchId);
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

  const selectedReport = reports.find((r) => r.id === selectedReportId) || null;

  // Z raporu fişindeki satırlar: elle girilen tezgah satışları ürüne göre gruplanır,
  // sipariş kaynaklı kayıtlar (productId yok) kendi tekil satırında kalır.
  const reportLines = (report: any) => {
    const byLine: Record<string, { name: string; count: number; total: number }> = {};
    for (const sale of report.sales || []) {
      const key = sale.productId ?? sale.id;
      const lineTotal = sale.unitPrice * (sale.quantity ?? 1);
      if (!byLine[key]) byLine[key] = { name: sale.product?.name || sale.description || 'Ürün', count: 0, total: 0 };
      byLine[key].count += sale.quantity ?? 1;
      byLine[key].total += lineTotal;
    }
    return Object.values(byLine);
  };

  const grandTotal = reports.reduce((sum, r) => sum + r.cashTotal + r.cardTotal, 0);

  const branchPill = (id: string | null, label: string) => {
    const active = selectedBranchId === id;
    if (active) {
      return (
        <LinearGradient key={id ?? 'all'} colors={[colors.primary, colors.primaryEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.branchPill}>
          <Text style={[styles.branchPillTextActive, { fontFamily: Fonts.uiBold }]}>{label}</Text>
        </LinearGradient>
      );
    }
    return (
      <TouchableOpacity key={id ?? 'all'} onPress={() => selectBranch(id)}>
        <View style={[styles.branchPill, { backgroundColor: colors.cardBg2, borderColor: colors.border, borderWidth: 1 }]}>
          <Text style={[styles.branchPillText, { color: colors.text, fontFamily: Fonts.uiSemiBold }]}>{label}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        {error && (
          <View style={[styles.errorCard, { backgroundColor: `${colors.error}1A`, borderColor: colors.error }]}>
            <Text style={{ color: colors.error, fontFamily: Fonts.uiBold, fontSize: 12 }}>{error}</Text>
          </View>
        )}

        <Text style={[styles.sectionLabel, { color: colors.textMuted, fontFamily: Fonts.uiExtraBold }]}>ŞUBE FİLTRESİ</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.branchPillsRow}>
          {branchPill(null, 'Tümü')}
          {branches.map((branch) => branchPill(branch.id, branch.name))}
        </ScrollView>

        <View style={[styles.summaryCard, { backgroundColor: colors.cardBgStrong, borderColor: colors.border }]}>
          <Text style={[styles.summaryLabel, { color: colors.textMuted, fontFamily: Fonts.uiExtraBold }]}>
            {selectedBranchId ? branches.find((b) => b.id === selectedBranchId)?.name : 'TÜM ŞUBELER'} TOPLAM CİRO
          </Text>
          <Text style={[styles.summaryTotal, { color: colors.gold, fontFamily: Fonts.display }]}>{formatTL(grandTotal)}</Text>
          <Text style={[styles.summaryHint, { color: colors.textSecondary, fontFamily: Fonts.ui }]}>{reports.length} kapatılmış rapor</Text>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textMuted, fontFamily: Fonts.uiExtraBold, marginTop: 22 }]}>Z RAPORLARI</Text>
        {reports.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.cardBg2, borderColor: colors.border }]}>
            <Text style={[styles.emptyText, { color: colors.textMuted, fontFamily: Fonts.displayItalic }]}>Henüz kapatılmış gün yok.</Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {reports.map((report) => (
              <TouchableOpacity key={report.id} onPress={() => setSelectedReportId(report.id)}>
                <View style={[styles.reportRow, { backgroundColor: colors.cardBg2, borderColor: colors.border }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.reportId, { color: colors.text, fontFamily: Fonts.mono }]}>
                      Z-{report.id.slice(0, 4).toUpperCase()}{report.branch?.name ? ` · ${report.branch.name}` : ''}
                    </Text>
                    <Text style={[styles.reportDate, { color: colors.textMuted, fontFamily: Fonts.ui }]}>
                      {new Date(report.periodEnd).toLocaleDateString('tr-TR')}{' '}
                      {new Date(report.periodEnd).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      {report.closedBy?.fullName ? ` · ${report.closedBy.fullName}` : ''}
                    </Text>
                  </View>
                  <Text style={[styles.reportTotal, { color: colors.gold, fontFamily: Fonts.uiExtraBold }]}>
                    {formatTL(report.cashTotal + report.cardTotal)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Z raporu fiş modali */}
      {selectedReport && (
        <Modal animationType="fade" transparent visible onRequestClose={() => setSelectedReportId(null)}>
          <View style={styles.modalOverlay}>
            <GlassView backgroundColor={solidSheetBg(colors)} blurAmount={26} style={[styles.modalCard, { borderColor: colors.border }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text, fontFamily: Fonts.displayItalicSemiBold }]}>Z Raporu</Text>
                <TouchableOpacity onPress={() => setSelectedReportId(null)}>
                  <Text style={[styles.modalClose, { color: colors.textSecondary }]}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.receipt, { borderColor: colors.border }]}>
                <Text style={[styles.receiptBrand, { color: colors.text, fontFamily: Fonts.mono }]}>
                  KÄLLA COFFEE CO. {selectedReport.branch?.name ? `· ${selectedReport.branch.name}` : ''}
                </Text>
                <Text style={[styles.receiptDate, { color: colors.textMuted, fontFamily: Fonts.mono }]}>
                  {new Date(selectedReport.periodEnd).toLocaleDateString('tr-TR')}{' '}
                  {new Date(selectedReport.periodEnd).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <View style={[styles.receiptDivider, { borderTopColor: colors.border }]} />

                {reportLines(selectedReport).map((line) => (
                  <View key={line.name} style={styles.receiptLine}>
                    <Text style={[styles.receiptLineText, { color: colors.textSecondary, fontFamily: Fonts.mono }]}>
                      {line.name} x{line.count}
                    </Text>
                    <Text style={[styles.receiptLineText, { color: colors.textSecondary, fontFamily: Fonts.mono }]}>{formatTL(line.total)}</Text>
                  </View>
                ))}

                <View style={[styles.receiptDivider, { borderTopColor: colors.border }]} />
                <View style={styles.receiptLine}>
                  <Text style={[styles.receiptSubText, { color: colors.textSecondary, fontFamily: Fonts.mono }]}>NAKİT</Text>
                  <Text style={[styles.receiptSubText, { color: colors.textSecondary, fontFamily: Fonts.mono }]}>{formatTL(selectedReport.cashTotal)}</Text>
                </View>
                <View style={[styles.receiptLine, { marginBottom: 8 }]}>
                  <Text style={[styles.receiptSubText, { color: colors.textSecondary, fontFamily: Fonts.mono }]}>KART</Text>
                  <Text style={[styles.receiptSubText, { color: colors.textSecondary, fontFamily: Fonts.mono }]}>{formatTL(selectedReport.cardTotal)}</Text>
                </View>
                <View style={[styles.receiptTotalRow, { borderTopColor: colors.border }]}>
                  <Text style={[styles.receiptTotalText, { color: colors.text, fontFamily: Fonts.mono }]}>TOPLAM</Text>
                  <Text style={[styles.receiptTotalText, { color: colors.text, fontFamily: Fonts.mono }]}>
                    {formatTL(selectedReport.cashTotal + selectedReport.cardTotal)}
                  </Text>
                </View>
              </View>

              <TouchableOpacity onPress={() => setSelectedReportId(null)}>
                <LinearGradient colors={[colors.primary, colors.primaryEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.modalCloseBtn}>
                  <Text style={[styles.modalCloseBtnText, { fontFamily: Fonts.uiBold }]}>Kapat</Text>
                </LinearGradient>
              </TouchableOpacity>
            </GlassView>
          </View>
        </Modal>
      )}
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
  sectionLabel: { fontSize: 10, letterSpacing: 1.5, marginBottom: 12 },
  branchPillsRow: { gap: 8, marginBottom: 18 },
  branchPill: { borderRadius: 999, paddingVertical: 8, paddingHorizontal: 14 },
  branchPillText: { fontSize: 11 },
  branchPillTextActive: { fontSize: 11, color: '#fdfdfb' },
  summaryCard: { borderWidth: 1, borderRadius: 18, padding: 16, alignItems: 'center' },
  summaryLabel: { fontSize: 9.5, letterSpacing: 1.5, marginBottom: 8, textAlign: 'center' },
  summaryTotal: { fontSize: 24 },
  summaryHint: { fontSize: 10.5, marginTop: 6 },
  emptyCard: { borderWidth: 1, borderRadius: 14, padding: 16, alignItems: 'center' },
  emptyText: { fontSize: 11 },
  reportRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  reportId: { fontSize: 11, fontWeight: '700' },
  reportDate: { fontSize: 9, marginTop: 2 },
  reportTotal: { fontSize: 12 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10,15,12,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 320,
    maxHeight: '80%',
    borderWidth: 1,
    borderRadius: 20,
    padding: 22,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 15 },
  modalClose: { fontSize: 16 },
  receipt: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 12, padding: 14 },
  receiptBrand: { fontSize: 11, fontWeight: '700', letterSpacing: 1, textAlign: 'center', marginBottom: 2 },
  receiptDate: { fontSize: 9, textAlign: 'center', marginBottom: 10 },
  receiptDivider: { borderTopWidth: 1, borderStyle: 'dashed', marginBottom: 8 },
  receiptLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  receiptLineText: { fontSize: 10 },
  receiptSubText: { fontSize: 10.5 },
  receiptTotalRow: { borderTopWidth: 1, paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between' },
  receiptTotalText: { fontSize: 12.5, fontWeight: '800' },
  modalCloseBtn: { marginTop: 16, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalCloseBtnText: { color: '#fdfdfb', fontSize: 12.5 },
});
