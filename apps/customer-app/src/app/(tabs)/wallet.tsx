import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform, TouchableOpacity, Modal, TextInput, ScrollView, Switch } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Fonts, formatTL } from '../../constants/theme';
import { useRouter, useIsFocused } from 'expo-router';

const PRESETS = ['50', '100', '200', '500'];

const BADGE_DEFS = [
  { letter: 'B', title: 'Barista Dostu', check: (w: any) => w?.transactions?.some((t: any) => t.type === 'PAYMENT_DEBIT') },
  { letter: 'Y', title: 'Yatırımcı', check: (w: any) => w?.transactions?.some((t: any) => t.type === 'TOPUP') },
  { letter: 'K', title: 'Koleksiyoncu', check: (w: any) => w?.transactions?.filter((t: any) => t.type === 'CASHBACK').reduce((acc: number, t: any) => acc + t.amount, 0) > 0 },
  { letter: 'E', title: 'Elite Üye', check: (w: any) => (w?.transactions?.length || 0) >= 5 },
];

export default function WalletScreen() {
  const router = useRouter();
  const { user, apiFetch, loading: authLoading } = useAuth();
  const { colors } = useTheme();
  const isFocused = useIsFocused();

  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [topupModalVisible, setTopupModalVisible] = useState(false);
  const [topupAmount, setTopupAmount] = useState('100');
  const [paymentPageUrl, setPaymentPageUrl] = useState<string | null>(null);
  const [topupLoading, setTopupLoading] = useState(false);
  const [topupError, setTopupError] = useState<string | null>(null);
  const [topupSuccess, setTopupSuccess] = useState(false);

  const fetchWalletDetails = async () => {
    try {
      const data = await apiFetch('/wallet/me');
      setWallet(data);
    } catch (err: any) {
      setError('Cüzdan bilgileri yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/(auth)/login');
      } else {
        fetchWalletDetails();
      }
    }
  }, [user, authLoading]);

  const handleTopupInit = async () => {
    if (!topupAmount || isNaN(Number(topupAmount)) || Number(topupAmount) < 10) {
      setTopupError('Lütfen geçerli bir tutar girin (En az 10 TL).');
      return;
    }
    setTopupLoading(true);
    setTopupError(null);
    setPaymentPageUrl(null);
    try {
      const initResult = await apiFetch('/wallet/topup-form/initialize', {
        method: 'POST',
        body: JSON.stringify({ amount: Number(topupAmount) }),
      });
      setPaymentPageUrl(initResult.paymentPageUrl);
    } catch (err: any) {
      setTopupError(err.message || 'Ödeme formu başlatılamadı.');
    } finally {
      setTopupLoading(false);
    }
  };

  const handleTopupComplete = async (token: string) => {
    setTopupLoading(true);
    setTopupError(null);
    try {
      await apiFetch('/wallet/topup', {
        method: 'POST',
        body: JSON.stringify({ amount: Number(topupAmount), paymentToken: token }),
      });
      setTopupSuccess(true);
      await fetchWalletDetails();
      setTimeout(() => {
        setTopupModalVisible(false);
        setPaymentPageUrl(null);
        setTopupSuccess(false);
      }, 1300);
    } catch (err: any) {
      setTopupError(err.message || 'Bakiye yükleme işlemi başarısız oldu.');
    } finally {
      setTopupLoading(false);
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'IYZICO_SUCCESS') {
        handleTopupComplete(event.data.token);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [topupAmount]);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getDate().toString().padStart(2, '0')}.${(d.getMonth() + 1).toString().padStart(2, '0')}.${d.getFullYear()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const formatTxType = (type: string) => {
    switch (type) {
      case 'CASHBACK': return 'Cashback Kazanımı';
      case 'TOPUP': return 'Bakiye Yükleme';
      case 'PAYMENT_DEBIT': return 'Sipariş Ödemesi';
      case 'REFUND_CREDIT': return 'Sipariş İadesi';
      case 'CASHBACK_REVERSAL': return 'Cashback Geri Çekimi';
      case 'ADMIN_ADJUSTMENT': return 'Manuel Bakiye Düzenleme';
      default: return type;
    }
  };

  const isCredit = (type: string) => ['CASHBACK', 'TOPUP', 'REFUND_CREDIT'].includes(type);

  // See index.tsx for why this guard is needed (react-native-screens web tab bleed-through).
  if (!isFocused) return null;

  if (loading) {
    return (
      <View style={styles.centerFill}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerFill}>
        <Text style={{ color: colors.error }}>{error}</Text>
      </View>
    );
  }

  const balanceTL = (wallet?.balance || 0) / 100;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        <View style={[styles.heroCard, { backgroundColor: colors.cardBgStrong, borderColor: colors.border }]}>
          <Text style={[styles.heroLabel, { color: colors.textMuted, fontFamily: Fonts.uiExtraBold }]}>TOPLAM KULLANILABİLİR BAKİYE</Text>
          <Text style={[styles.heroBalance, { color: colors.text, fontFamily: Fonts.display }]}>{formatTL(balanceTL)}</Text>

          <TouchableOpacity
            style={[styles.topupBtn, { backgroundColor: colors.primary }]}
            onPress={() => { setTopupSuccess(false); setPaymentPageUrl(null); setTopupModalVisible(true); }}
          >
            <Text style={[styles.topupBtnText, { fontFamily: Fonts.uiBold }]}>Bakiye Yükle</Text>
          </TouchableOpacity>

          <View style={[styles.cashbackBanner, { backgroundColor: colors.goldTint, borderColor: colors.goldBorder }]}>
            <Text style={[styles.cashbackText, { color: colors.text, fontFamily: Fonts.ui }]}>
              Her kartlı ödemede <Text style={{ fontFamily: Fonts.uiBold, color: colors.gold }}>%10 Cashback</Text> anında cüzdanınıza yüklenir
            </Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: Fonts.displayItalicSemiBold }]}>Kahve keşif yolculuğum</Text>
        <View style={styles.badgesRow}>
          {BADGE_DEFS.map((badge) => {
            const unlocked = !!badge.check(wallet);
            return (
              <View
                key={badge.letter}
                style={[
                  styles.badgeCard,
                  { backgroundColor: unlocked ? `${colors.primary}24` : colors.cardBg2, borderColor: unlocked ? colors.sageBorder : colors.border, opacity: unlocked ? 1 : 0.5 },
                ]}
              >
                <View style={[styles.badgeCircle, unlocked ? { backgroundColor: colors.primary } : { borderWidth: 1.5, borderColor: colors.border }]}>
                  <Text style={[styles.badgeLetter, { color: unlocked ? '#fdfdfb' : colors.textMuted }]}>{badge.letter}</Text>
                </View>
                <Text style={[styles.badgeTitle, { color: unlocked ? colors.text : colors.textMuted, fontFamily: Fonts.uiBold }]}>{badge.title}</Text>
              </View>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: Fonts.displayItalicSemiBold }]}>Cüzdan hareketleri</Text>
        <View style={{ gap: 10 }}>
          {(wallet?.transactions || []).length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.textSecondary, fontFamily: Fonts.displayItalic }]}>Cüzdan hareketi bulunmuyor.</Text>
            </View>
          ) : (
            wallet.transactions.map((item: any) => (
              <View key={item.id} style={[styles.txItem, { backgroundColor: colors.cardBg2, borderColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.txType, { color: colors.text, fontFamily: Fonts.uiBold }]}>{formatTxType(item.type)}</Text>
                  <Text style={[styles.txDate, { color: colors.textMuted, fontFamily: Fonts.mono }]}>{formatDate(item.createdAt)}</Text>
                </View>
                <View style={styles.txRight}>
                  <Text style={[styles.txAmount, { color: isCredit(item.type) ? colors.success : colors.error }]}>
                    {isCredit(item.type) ? '+' : '-'}{formatTL(item.amount / 100)}
                  </Text>
                  <Text style={[styles.txBalanceAfter, { color: colors.textMuted }]}>Bakiye: {formatTL(item.balanceAfter / 100)}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <Modal animationType="slide" transparent visible={topupModalVisible} onRequestClose={() => setTopupModalVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlayBar }]}>
          <View style={[styles.modalCard, { backgroundColor: colors.cardBgStrong, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text, fontFamily: Fonts.displayItalicSemiBold }]}>Cüzdana Bakiye Yükle</Text>
              <TouchableOpacity onPress={() => setTopupModalVisible(false)}>
                <Text style={{ fontSize: 18, color: colors.textSecondary }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView keyboardShouldPersistTaps="handled">
              {topupSuccess ? (
                <View style={styles.successContainer}>
                  <View style={[styles.successCircle, { backgroundColor: colors.primary }]}>
                    <Text style={styles.successCheck}>✓</Text>
                  </View>
                  <Text style={[styles.successText, { color: colors.text, fontFamily: Fonts.displayItalicSemiBold }]}>Bakiye Yüklendi!</Text>
                  <Text style={[styles.successSub, { color: colors.textSecondary, fontFamily: Fonts.ui }]}>{formatTL(Number(topupAmount))} cüzdanınıza eklendi.</Text>
                </View>
              ) : (
                <>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary, fontFamily: Fonts.uiBold }]}>YÜKLENECEK TUTAR (TL)</Text>
                  <TextInput
                    style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.inputBg, fontFamily: Fonts.displayItalic }]}
                    keyboardType="numeric"
                    value={topupAmount}
                    onChangeText={setTopupAmount}
                    placeholder="Tutar girin"
                    placeholderTextColor={colors.textMuted}
                  />

                  <View style={styles.presetsRow}>
                    {PRESETS.map((val) => (
                      <TouchableOpacity
                        key={val}
                        style={[
                          styles.presetBtn,
                          { borderColor: colors.border },
                          topupAmount === val && { backgroundColor: `${colors.primary}33`, borderColor: colors.primary },
                        ]}
                        onPress={() => setTopupAmount(val)}
                      >
                        <Text style={[styles.presetText, { color: colors.text, fontFamily: Fonts.uiSemiBold }]}>{val} TL</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={[styles.divider, { backgroundColor: colors.border }]} />

                  {paymentPageUrl ? (
                    <View pointerEvents="auto" style={{ marginTop: 20, height: 450 }}>
                      <Text style={[styles.inputLabel, { color: colors.text, marginBottom: 10, textAlign: 'center' }]}>Ödeme Bilgileri (iyzico Güvenli Sayfa)</Text>
                      {Platform.OS === 'web' ? (
                        <iframe
                          src={paymentPageUrl}
                          style={{ width: '100%', height: 400, border: 'none', borderRadius: 12, backgroundColor: '#ffffff' } as any}
                          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-top-navigation"
                        />
                      ) : (
                        <Text style={{ color: colors.text, textAlign: 'center' }}>WebView is supported on Web platform.</Text>
                      )}
                    </View>
                  ) : (
                    <TouchableOpacity style={[styles.submitBtn, { backgroundColor: colors.primary }]} onPress={handleTopupInit} disabled={topupLoading}>
                      {topupLoading ? <ActivityIndicator size="small" color="#fdfdfb" /> : <Text style={[styles.submitBtnText, { fontFamily: Fonts.uiBold }]}>Kart Bilgilerini Gir</Text>}
                    </TouchableOpacity>
                  )}

                  {topupError && <Text style={[styles.modalError, { color: colors.error, marginTop: 12 }]}>{topupError}</Text>}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  centerFill: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 110 },
  heroCard: { borderRadius: 24, borderWidth: 1, padding: 22, alignItems: 'center', marginBottom: 22 },
  heroLabel: { fontSize: 9, letterSpacing: 2, marginBottom: 8 },
  heroBalance: { fontSize: 32, marginBottom: 16 },
  topupBtn: { borderRadius: 999, paddingVertical: 10, paddingHorizontal: 22, marginBottom: 16 },
  topupBtnText: { color: '#fdfdfb', fontSize: 12 },
  cashbackBanner: { borderRadius: 14, borderWidth: 1, padding: 10, width: '100%' },
  cashbackText: { fontSize: 10, lineHeight: 15, textAlign: 'center' },
  sectionTitle: { fontSize: 14, marginBottom: 12 },
  badgesRow: { flexDirection: 'row', gap: 8, marginBottom: 22 },
  badgeCard: { flex: 1, borderRadius: 14, borderWidth: 1, paddingVertical: 10, paddingHorizontal: 4, alignItems: 'center' },
  badgeCircle: { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  badgeLetter: { fontSize: 11, fontWeight: '800' },
  badgeTitle: { fontSize: 8, textAlign: 'center' },
  txItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 13, borderRadius: 14, borderWidth: 1 },
  txType: { fontSize: 11, marginBottom: 3 },
  txDate: { fontSize: 9 },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: 12, fontWeight: '800', marginBottom: 2 },
  txBalanceAfter: { fontSize: 8 },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 13 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalCard: { height: '80%', padding: 24, borderWidth: 1, borderBottomWidth: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18 },
  inputLabel: { fontSize: 11, marginBottom: 4, marginTop: 12 },
  input: { height: 44, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontSize: 15 },
  presetsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, gap: 8 },
  presetBtn: { flex: 1, height: 36, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  presetText: { fontSize: 12 },
  divider: { height: 1, marginVertical: 16 },
  submitBtn: { height: 48, justifyContent: 'center', alignItems: 'center', marginTop: 20, marginBottom: 30, borderRadius: 12 },
  submitBtnText: { color: '#fdfdfb', fontSize: 14 },
  modalError: { fontSize: 12, marginTop: 12, textAlign: 'center' },
  successContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  successCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  successCheck: { color: '#fdfdfb', fontSize: 28, fontWeight: 'bold' },
  successText: { fontSize: 18, marginBottom: 8 },
  successSub: { fontSize: 13 },
});
