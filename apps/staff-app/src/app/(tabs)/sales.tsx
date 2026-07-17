import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Platform, RefreshControl } from 'react-native';
import { useRouter, useIsFocused } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Fonts, formatTL } from '../../constants/theme';
import { PaymentMethod, Role } from '@kafe/shared-types';
import GlassView from '../../components/GlassView';

export default function SalesScreen() {
  const router = useRouter();
  const { user, apiFetch, loading: authLoading } = useAuth();
  const { colors } = useTheme();
  const isFocused = useIsFocused();

  const [products, setProducts] = useState<any[]>([]);
  const [today, setToday] = useState<any>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [sellingId, setSellingId] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [flashMessage, setFlashMessage] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  };

  const canCloseDay = user?.role === Role.SHIFT_LEAD || user?.role === Role.ADMIN;

  const loadData = useCallback(async () => {
    try {
      const [productList, todaySummary, reportList] = await Promise.all([
        apiFetch('/products'),
        apiFetch('/sales/today'),
        apiFetch('/sales/reports'),
      ]);
      setProducts(productList);
      setToday(todaySummary);
      setReports(reportList);
      setError(null);
    } catch (err: any) {
      setError('Satış verileri yüklenemedi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
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

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const sellProduct = async (product: any) => {
    setSellingId(product.id);
    try {
      await apiFetch('/sales', {
        method: 'POST',
        body: JSON.stringify({ productId: product.id, paymentMethod }),
      });
      const summary = await apiFetch('/sales/today');
      setToday(summary);
      setFlashMessage(`${product.name} satışı eklendi (${paymentMethod === PaymentMethod.CASH ? 'Nakit' : 'Kart'})`);
      setTimeout(() => setFlashMessage(null), 1800);
    } catch (err: any) {
      if (Platform.OS === 'web') alert('Satış kaydedilemedi: ' + err.message);
    } finally {
      setSellingId(null);
    }
  };

  const closeDay = async () => {
    if (!today || today.txCount === 0 || closing) return;
    setClosing(true);
    try {
      const report = await apiFetch('/sales/close', { method: 'POST' });
      await loadData();
      setSelectedReportId(report.id);
    } catch (err: any) {
      if (Platform.OS === 'web') alert('Gün kapatılamadı: ' + err.message);
    } finally {
      setClosing(false);
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

  const selectedReport = reports.find((r) => r.id === selectedReportId) || null;
  const closeEnabled = canCloseDay && today && today.txCount > 0;

  // Hızlı satış ürünleri, uzun tek bir listeye sığdırmak yerine kategoriye göre
  // açılır/kapanır gruplara ayrılır (bkz. products/products.service.ts: category dahil edilir).
  const categoryGroups: { id: string; name: string; displayOrder: number; products: any[] }[] = [];
  const categoryGroupIndex: Record<string, number> = {};
  for (const product of products) {
    const cat = product.category;
    if (categoryGroupIndex[cat.id] === undefined) {
      categoryGroupIndex[cat.id] = categoryGroups.length;
      categoryGroups.push({ id: cat.id, name: cat.name, displayOrder: cat.displayOrder, products: [] });
    }
    categoryGroups[categoryGroupIndex[cat.id]].products.push(product);
  }
  categoryGroups.sort((a, b) => a.displayOrder - b.displayOrder);

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

  const methodPill = (method: PaymentMethod, label: string) => {
    const active = paymentMethod === method;
    if (active) {
      return (
        <TouchableOpacity key={method} style={{ flex: 1 }} onPress={() => setPaymentMethod(method)}>
          <LinearGradient
            colors={[colors.primary, colors.primaryEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.methodPill}
          >
            <Text style={[styles.methodPillTextActive, { fontFamily: Fonts.uiBold }]}>{label}</Text>
          </LinearGradient>
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity key={method} style={{ flex: 1 }} onPress={() => setPaymentMethod(method)}>
        <View style={[styles.methodPill, { backgroundColor: colors.cardBg2, borderColor: colors.border, borderWidth: 1 }]}>
          <Text style={[styles.methodPillText, { color: colors.text, fontFamily: Fonts.uiSemiBold }]}>{label}</Text>
        </View>
      </TouchableOpacity>
    );
  };

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

        {flashMessage && (
          <View style={[styles.flashCard, { backgroundColor: `${colors.primary}22`, borderColor: colors.sageBorder }]}>
            <Text style={{ color: colors.sageText, fontFamily: Fonts.uiBold, fontSize: 11 }}>{flashMessage}</Text>
          </View>
        )}

        <Text style={[styles.sectionLabel, { color: colors.textMuted, fontFamily: Fonts.uiExtraBold }]}>ÖDEME YÖNTEMİ</Text>
        <View style={styles.methodRow}>
          {methodPill(PaymentMethod.CASH, 'Nakit')}
          {methodPill(PaymentMethod.CARD, 'Kart')}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textMuted, fontFamily: Fonts.uiExtraBold }]}>
          HIZLI SATIŞ — DOKUNARAK EKLE
        </Text>
        <View style={{ gap: 8, marginBottom: 20 }}>
          {categoryGroups.map((group) => {
            const isOpen = expandedCategories.has(group.id);
            return (
              <View key={group.id} style={[styles.categoryGroup, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <TouchableOpacity onPress={() => toggleCategory(group.id)}>
                  <View style={styles.categoryHeader}>
                    <Text style={[styles.categoryHeaderText, { color: colors.text, fontFamily: Fonts.uiSemiBold }]} numberOfLines={1}>
                      {group.name}
                    </Text>
                    <View style={styles.categoryHeaderRight}>
                      <Text style={[styles.categoryCount, { color: colors.textMuted, fontFamily: Fonts.ui }]}>
                        {group.products.length}
                      </Text>
                      <Text style={[styles.categoryChevron, { color: colors.textMuted }]}>{isOpen ? '▴' : '▾'}</Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {isOpen && (
                  <View style={styles.chipWrap}>
                    {group.products.map((product) => (
                      <TouchableOpacity key={product.id} disabled={sellingId === product.id} onPress={() => sellProduct(product)}>
                        <View style={[styles.productChip, { backgroundColor: colors.cardBg2, borderColor: colors.border }]}>
                          {sellingId === product.id ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                          ) : (
                            <Text
                              style={[styles.productChipText, { color: colors.text, fontFamily: Fonts.uiSemiBold }]}
                              numberOfLines={1}
                            >
                              {product.name}
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Bugünkü satış özeti */}
        <View style={[styles.summaryCard, { backgroundColor: colors.cardBgStrong, borderColor: colors.border }]}>
          <Text style={[styles.summaryLabel, { color: colors.textMuted, fontFamily: Fonts.uiExtraBold }]}>BUGÜNKÜ SATIŞ</Text>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryKey, { color: colors.textSecondary, fontFamily: Fonts.ui }]}>Nakit</Text>
            <Text style={[styles.summaryVal, { color: colors.text, fontFamily: Fonts.uiBold }]}>
              {formatTL(today?.cashTotal || 0)}
            </Text>
          </View>
          <View style={[styles.summaryRow, { marginBottom: 10 }]}>
            <Text style={[styles.summaryKey, { color: colors.textSecondary, fontFamily: Fonts.ui }]}>Kart</Text>
            <Text style={[styles.summaryVal, { color: colors.text, fontFamily: Fonts.uiBold }]}>
              {formatTL(today?.cardTotal || 0)}
            </Text>
          </View>
          <View style={[styles.summaryTotalRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.summaryTotalKey, { color: colors.text, fontFamily: Fonts.uiExtraBold }]}>
              Toplam ({today?.txCount || 0} işlem)
            </Text>
            <Text style={[styles.summaryTotalVal, { color: colors.gold, fontFamily: Fonts.display }]}>
              {formatTL(today?.total || 0)}
            </Text>
          </View>
        </View>

        {/* Günü kapat */}
        <TouchableOpacity disabled={!closeEnabled || closing} onPress={closeDay}>
          <LinearGradient
            colors={[colors.primary, colors.primaryEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.closeDayBtn, { opacity: closeEnabled ? 1 : 0.45 }]}
          >
            {closing ? (
              <ActivityIndicator size="small" color="#fdfdfb" />
            ) : (
              <Text style={[styles.closeDayBtnText, { fontFamily: Fonts.uiBold }]}>Günü Kapat — Z Raporu Oluştur</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
        {!canCloseDay && (
          <Text style={[styles.closeDayHint, { color: colors.textMuted, fontFamily: Fonts.ui }]}>
            Günü yalnızca vardiya amiri veya yönetici kapatabilir.
          </Text>
        )}

        <Text style={[styles.sectionLabel, { color: colors.textMuted, fontFamily: Fonts.uiExtraBold, marginTop: 22 }]}>
          GEÇMİŞ Z RAPORLARI
        </Text>
        {reports.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.cardBg2, borderColor: colors.border }]}>
            <Text style={[styles.emptyText, { color: colors.textMuted, fontFamily: Fonts.displayItalic }]}>
              Henüz kapatılmış gün yok.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 8 }}>
            {reports.map((report) => (
              <TouchableOpacity key={report.id} onPress={() => setSelectedReportId(report.id)}>
                <View style={[styles.reportRow, { backgroundColor: colors.cardBg2, borderColor: colors.border }]}>
                  <View>
                    <Text style={[styles.reportId, { color: colors.text, fontFamily: Fonts.mono }]}>
                      Z-{report.id.slice(0, 4).toUpperCase()}
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
                <Text style={[styles.receiptBrand, { color: colors.text, fontFamily: Fonts.mono }]}>KÄLLA COFFEE CO.</Text>
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
                    <Text style={[styles.receiptLineText, { color: colors.textSecondary, fontFamily: Fonts.mono }]}>
                      {formatTL(line.total)}
                    </Text>
                  </View>
                ))}

                <View style={[styles.receiptDivider, { borderTopColor: colors.border }]} />
                <View style={styles.receiptLine}>
                  <Text style={[styles.receiptSubText, { color: colors.textSecondary, fontFamily: Fonts.mono }]}>NAKİT</Text>
                  <Text style={[styles.receiptSubText, { color: colors.textSecondary, fontFamily: Fonts.mono }]}>
                    {formatTL(selectedReport.cashTotal)}
                  </Text>
                </View>
                <View style={[styles.receiptLine, { marginBottom: 8 }]}>
                  <Text style={[styles.receiptSubText, { color: colors.textSecondary, fontFamily: Fonts.mono }]}>KART</Text>
                  <Text style={[styles.receiptSubText, { color: colors.textSecondary, fontFamily: Fonts.mono }]}>
                    {formatTL(selectedReport.cardTotal)}
                  </Text>
                </View>
                <View style={[styles.receiptTotalRow, { borderTopColor: colors.border }]}>
                  <Text style={[styles.receiptTotalText, { color: colors.text, fontFamily: Fonts.mono }]}>TOPLAM</Text>
                  <Text style={[styles.receiptTotalText, { color: colors.text, fontFamily: Fonts.mono }]}>
                    {formatTL(selectedReport.cashTotal + selectedReport.cardTotal)}
                  </Text>
                </View>
              </View>

              <TouchableOpacity onPress={() => setSelectedReportId(null)}>
                <LinearGradient
                  colors={[colors.primary, colors.primaryEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.modalCloseBtn}
                >
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
  flashCard: { borderWidth: 1, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 12, marginBottom: 14 },
  sectionLabel: { fontSize: 10, letterSpacing: 1.5, marginBottom: 12 },
  methodRow: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  methodPill: { borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  methodPillText: { fontSize: 12 },
  methodPillTextActive: { fontSize: 12, color: '#fdfdfb' },
  categoryGroup: { borderWidth: 1, borderRadius: 14, overflow: 'hidden' },
  categoryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, gap: 8 },
  categoryHeaderText: { fontSize: 12.5, flex: 1 },
  categoryHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  categoryCount: { fontSize: 10.5 },
  categoryChevron: { fontSize: 11 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, paddingHorizontal: 12, paddingBottom: 12 },
  productChip: { borderWidth: 1, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 12, minHeight: 28, justifyContent: 'center' },
  productChipText: { fontSize: 11 },
  summaryCard: { borderWidth: 1, borderRadius: 18, padding: 16, marginBottom: 16 },
  summaryLabel: { fontSize: 9.5, letterSpacing: 1.5, marginBottom: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  summaryKey: { fontSize: 11.5 },
  summaryVal: { fontSize: 12 },
  summaryTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, paddingTop: 10 },
  summaryTotalKey: { fontSize: 12 },
  summaryTotalVal: { fontSize: 16 },
  closeDayBtn: { height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  closeDayBtnText: { color: '#fdfdfb', fontSize: 13 },
  closeDayHint: { fontSize: 9.5, textAlign: 'center', marginTop: 8 },
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
