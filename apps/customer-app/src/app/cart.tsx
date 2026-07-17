import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator, Platform, ScrollView, Modal, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import { Fonts, formatTL } from '../constants/theme';
import { OrderType, PaymentStatus } from '@kafe/shared-types';
import GlassBackground from '../components/GlassBackground';
import GlassView from '../components/GlassView';
import { BasketIcon, GelAlIcon, PaketIcon, OdemeIcon } from '../components/KallaIcons';
import { WebView } from 'react-native-webview';
import LegalTextModal from '../components/LegalTextModal';
import { LEGAL_SECTIONS, LegalSection } from '../constants/legalTexts';

// Bilgilendirme amaçlı istemci tahmini — gerçek indirim her zaman sunucuda
// (apps/backend/src/orders/orders.service.ts, TIER_DISCOUNT_RATES) hesaplanır ve
// sipariş oluşturulduktan sonra dönen orderData.totalAmount otoriter kaynaktır.
const TIER_DISCOUNT_PREVIEW: Record<string, number> = { silver: 0.15, gold: 0.3 };
const TIER_DISCOUNT_LABEL_PREVIEW: Record<string, string> = {
  silver: 'Gümüş Üye İndirimi (%15)',
  gold: 'Altın Üye İndirimi (%30)',
};

// Haversine formülü — iki koordinat arası kuş uçuşu mesafe (km). En yakın şube önerisi için.
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function CartScreen() {
  const router = useRouter();
  const { user, apiFetch } = useAuth();
  const { items, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();
  const { colors, glass } = useTheme();

  const [orderType, setOrderType] = useState<OrderType>(OrderType.PICKUP);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.PAID_ONLINE);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [distanceSalesAccepted, setDistanceSalesAccepted] = useState(false);
  const [legalSection, setLegalSection] = useState<LegalSection | null>(null);
  const distanceSalesText = LEGAL_SECTIONS.find((s) => s.key === 'distanceSales')!;

  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [branchDistances, setBranchDistances] = useState<Record<string, number>>({});

  // Sipariş oluşturulduktan sonra sunucudan dönen gerçek (indirim uygulanmış) tutar —
  // ödeme modalındaki tüm hesaplar bundan sonra cartTotal yerine bunu kullanır.
  const [confirmedOrderTotal, setConfirmedOrderTotal] = useState<number | null>(null);

  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);
  const [wallet, setWallet] = useState<any>(null);
  const [useWallet, setUseWallet] = useState(false);
  const [paymentPageUrl, setPaymentPageUrl] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const fetchWallet = async () => {
    try {
      const data = await apiFetch('/wallet/me');
      setWallet(data);
    } catch (err) {
      console.log('Error fetching wallet:', err);
    }
  };

  useEffect(() => {
    if (paymentModalVisible && user) fetchWallet();
  }, [paymentModalVisible]);

  // Şubeleri yükle, mümkünse konum izniyle en yakınını öner (web-only — react-native-web'de
  // Alert.alert gibi expo-location native modülleri de web'de sorunsuz çalışmıyor; bu yüzden
  // doğrudan tarayıcının Geolocation API'si kullanılıyor, izin verilmezse sessizce atlanır).
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const data = await apiFetch('/branches');
        setBranches(data);

        if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude } = position.coords;
              const distances: Record<string, number> = {};
              for (const branch of data) {
                distances[branch.id] = haversineKm(latitude, longitude, branch.latitude, branch.longitude);
              }
              setBranchDistances(distances);
              const nearest = [...data].sort((a, b) => distances[a.id] - distances[b.id])[0];
              if (nearest) setSelectedBranchId(nearest.id);
            },
            () => {
              // İzin reddedildi veya konum alınamadı — müşteri elle seçer, hata gösterme.
            },
            { timeout: 8000 },
          );
        }
      } catch (err) {
        console.log('Error fetching branches:', err);
      }
    };
    loadBranches();
  }, []);

  const handleCheckout = async () => {
    if (items.length === 0) return;
    if (!user) {
      router.push('/(auth)/login');
      return;
    }
    if (!selectedBranchId) {
      setError('Lütfen siparişinizi karşılayacak bir şube seçin.');
      return;
    }
    if (!distanceSalesAccepted) {
      setError('Devam etmek için Mesafeli Satış Sözleşmesi\'ni onaylamanız gerekir.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formattedItems = items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        options: JSON.stringify(item.options),
      }));

      const orderData = await apiFetch('/orders', {
        method: 'POST',
        body: JSON.stringify({ branchId: selectedBranchId, orderType, paymentStatus, notes: notes || undefined, items: formattedItems }),
      });
      setConfirmedOrderTotal(orderData.totalAmount);

      if (paymentStatus === PaymentStatus.PAID_ONLINE) {
        const walletBalanceTL = (wallet?.balance || 0) / 100;
        const walletUsedTL = useWallet ? Math.min(walletBalanceTL, orderData.totalAmount) : 0;
        const remainingTL = orderData.totalAmount - walletUsedTL;

        if (remainingTL > 0) {
          const initResult = await apiFetch(`/orders/${orderData.id}/checkout-form/initialize`, {
            method: 'POST',
            body: JSON.stringify({ useWallet, walletAmount: walletUsedTL }),
          });
          setPaymentPageUrl(initResult.paymentPageUrl);
          setCreatedOrderId(orderData.id);
          completedPaymentTokenRef.current = null;
          setPaymentModalVisible(true);
        } else {
          await apiFetch(`/orders/${orderData.id}/checkout`, {
            method: 'POST',
            body: JSON.stringify({ useWallet, walletAmount: walletUsedTL }),
          });
          finishSuccessfulOrder();
        }
      } else {
        clearCart();
        router.replace('/orders');
      }
    } catch (err: any) {
      setError(err.message || 'Sipariş gönderilirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const finishSuccessfulOrder = () => {
    clearCart();
    setPaymentModalVisible(false);
    setPaymentPageUrl(null);
    router.replace('/orders');
  };

  // react-native-webview's onNavigationStateChange fires on every navigation state change,
  // not once per URL — without this guard the success URL could trigger handlePayment several
  // times with the same token, sending duplicate /checkout requests (see wallet.tsx for the
  // exact bug this caused: the first request succeeds, the second hits the backend's
  // idempotency check and fails, which looks like "500 error, but the order still got paid").
  const completedPaymentTokenRef = useRef<string | null>(null);

  const handlePayment = async (token: string) => {
    if (!createdOrderId) return;
    if (completedPaymentTokenRef.current === token) return;
    completedPaymentTokenRef.current = token;
    setPaymentLoading(true);
    setPaymentError(null);

    try {
      const walletBalanceTL = (wallet?.balance || 0) / 100;
      const walletAmountToUse = useWallet ? Math.min(walletBalanceTL, confirmedOrderTotal ?? cartTotal) : 0;

      await apiFetch(`/orders/${createdOrderId}/checkout`, {
        method: 'POST',
        body: JSON.stringify({ useWallet, walletAmount: walletAmountToUse, paymentToken: token }),
      });

      setPaymentSuccess(true);
      setTimeout(finishSuccessfulOrder, 1300);
    } catch (err: any) {
      setPaymentError(err.message || 'Ödeme işlemi onaylanamadı. Lütfen tekrar deneyin.');
    } finally {
      setPaymentLoading(false);
    }
  };

  useEffect(() => {
    // iyzico'nun ödeme sayfası bir <iframe> içinde açılır (yalnızca web'de) ve postMessage ile
    // sonucu bildirir. Native'de window nesnesi bu şekilde yok, bu yüzden yalnızca web'de
    // dinleyici ekliyoruz — aksi halde ödeme adımına gelindiğinde uygulama çöker.
    if (Platform.OS !== 'web') return;
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'IYZICO_SUCCESS') handlePayment(event.data.token);
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [createdOrderId, useWallet, wallet]);

  if (items.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <GlassBackground />
        <BasketIcon size={64} color={colors.primary} style={{ marginBottom: 16 }} />
        <Text style={[styles.emptyTitle, { color: colors.text, fontFamily: Fonts.displayItalic }]}>Sepetiniz Boş</Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary, fontFamily: Fonts.ui }]}>
          Menüden dilediğiniz kahve ve fırın ürününü sepetinize ekleyebilirsiniz.
        </Text>
        <TouchableOpacity onPress={() => router.replace('/')} style={[styles.browseButton, { borderRadius: glass.radius.pill, backgroundColor: colors.primary }]}>
          <Text style={[styles.browseButtonText, { fontFamily: Fonts.uiBold }]}>Alışverişe Başla</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const orderTotalTL = confirmedOrderTotal ?? cartTotal;
  const walletBalanceTL = (wallet?.balance || 0) / 100;
  const walletUsedTL = useWallet ? Math.min(walletBalanceTL, orderTotalTL) : 0;
  const remainingTL = orderTotalTL - walletUsedTL;

  // Sepet ekranındaki kademe indirimi önizlemesi — bilgilendirme amaçlı, gerçek indirim
  // sipariş oluşturulunca sunucudan (confirmedOrderTotal) gelir.
  const userTier = (user as any)?.customerProfile?.loyaltyTier?.toLowerCase();
  const previewRate = TIER_DISCOUNT_PREVIEW[userTier] ?? 0;
  const previewDiscount = Math.round(cartTotal * previewRate * 100) / 100;
  const previewTotal = cartTotal - previewDiscount;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GlassBackground />

      <GlassView blurType="heavy" style={[styles.header, { borderBottomLeftRadius: glass.radius.xl, borderBottomRightRadius: glass.radius.xl, borderWidth: 0, borderBottomWidth: 1 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
          <TouchableOpacity style={[styles.backBtn, { borderColor: glass.border.color, borderRadius: glass.radius.pill }]} onPress={() => router.replace('/')}>
            <Text style={[styles.backBtnText, { color: colors.text, fontFamily: Fonts.uiBold }]}>← Menü</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text, fontFamily: Fonts.displayItalicSemiBold }]}>Sepetim</Text>
          <View style={{ width: 60 }} />
        </View>
      </GlassView>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: Fonts.uiBold }]}>Sipariş Listesi</Text>
        {items.map((item) => {
          const serializedOptions = [];
          if (item.options.size && item.options.size !== 'Orta' && item.options.size !== 'Tek') serializedOptions.push(item.options.size);
          if (item.options.milk !== 'Normal') serializedOptions.push(item.options.milk);
          if (item.options.sweetness !== 'Normal' && item.options.sweetness !== 'Sade') serializedOptions.push(item.options.sweetness);
          if (item.options.syrup !== 'Yok') serializedOptions.push(`+${item.options.syrup} Şurubu`);
          if (item.options.extraShot && item.options.extraShot !== 'Yok') serializedOptions.push(`+${item.options.extraShot}`);
          const optionSummary = serializedOptions.join(', ');

          return (
            <GlassView key={item.id} blurType="regular" style={[styles.itemCard, { borderRadius: glass.radius.lg }]}>
              <View style={styles.itemHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemName, { color: colors.text, fontFamily: Fonts.displayItalic }]}>{item.product.name}</Text>
                  {optionSummary ? <Text style={[styles.itemOptions, { color: colors.textSecondary, fontFamily: Fonts.ui }]}>{optionSummary}</Text> : null}
                </View>
                <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                  <Text style={[styles.removeButton, { color: colors.error }]}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.itemFooter}>
                <Text style={[styles.itemPrice, { color: colors.gold, fontFamily: Fonts.uiExtraBold }]}>{formatTL(item.product.price * item.quantity)}</Text>
                <View style={[styles.qtySelector, { borderColor: glass.border.color, backgroundColor: colors.cardBg2, borderRadius: glass.radius.pill }]}>
                  <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity - 1)} style={styles.qtyBtn}>
                    <Text style={[styles.qtyBtnText, { color: colors.text }]}>−</Text>
                  </TouchableOpacity>
                  <Text style={[styles.qtyVal, { color: colors.text, fontFamily: Fonts.uiBold }]}>{item.quantity}</Text>
                  <TouchableOpacity onPress={() => updateQuantity(item.id, item.quantity + 1)} style={styles.qtyBtn}>
                    <Text style={[styles.qtyBtnText, { color: colors.text }]}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </GlassView>
          );
        })}

        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: Fonts.uiBold, marginTop: 24 }]}>Teslimat Şekli</Text>
        <View style={styles.optionsGrid}>
          {[
            { type: OrderType.PICKUP, Icon: GelAlIcon, title: 'Gel-Al', sub: 'Kafeden teslim alın' },
            { type: OrderType.TAKEAWAY, Icon: PaketIcon, title: 'Adrese Paket', sub: 'Adresinize getirelim' },
          ].map(({ type, Icon, title, sub }) => {
            const selected = orderType === type;
            return (
              <TouchableOpacity
                key={type}
                style={[
                  styles.gridOptionCard,
                  { borderColor: glass.border.color, backgroundColor: colors.cardBg2, borderRadius: glass.radius.lg },
                  selected && { borderColor: colors.primary, backgroundColor: `${colors.primary}20` },
                ]}
                onPress={() => setOrderType(type)}
              >
                <Icon size={28} color={colors.primary} style={{ marginBottom: 8 }} />
                <Text style={[styles.gridOptionTitle, { color: colors.text, fontFamily: Fonts.uiBold }]}>{title}</Text>
                <Text style={[styles.gridOptionSub, { color: colors.textSecondary, fontFamily: Fonts.ui }]}>{sub}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: Fonts.uiBold, marginTop: 24 }]}>Şube Seç</Text>
        <View style={{ gap: 10, marginBottom: 8 }}>
          {branches.map((branch) => {
            const selected = selectedBranchId === branch.id;
            const distance = branchDistances[branch.id];
            return (
              <TouchableOpacity
                key={branch.id}
                style={[
                  styles.branchCard,
                  { borderColor: glass.border.color, backgroundColor: colors.cardBg2, borderRadius: glass.radius.lg },
                  selected && { borderColor: colors.primary, backgroundColor: `${colors.primary}20` },
                ]}
                onPress={() => setSelectedBranchId(branch.id)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.branchName, { color: colors.text, fontFamily: Fonts.uiBold }]}>{branch.name}</Text>
                  <Text style={[styles.branchAddress, { color: colors.textSecondary, fontFamily: Fonts.ui }]}>
                    {branch.district ? `${branch.district}, ` : ''}{branch.address}
                  </Text>
                </View>
                {distance != null && (
                  <Text style={[styles.branchDistance, { color: colors.gold, fontFamily: Fonts.uiExtraBold }]}>~{distance.toFixed(1)} km</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: Fonts.uiBold, marginTop: 24 }]}>Ödeme Tercihi</Text>
        <View style={styles.optionsGrid}>
          {[
            { type: PaymentStatus.PAID_ONLINE, title: 'Online Ödeme', sub: 'Kart / Cüzdan ile ödeyin' },
            { type: PaymentStatus.PAY_AT_COUNTER, title: 'Kafede Ödeme', sub: 'Nakit veya POS' },
          ].map(({ type, title, sub }) => {
            const selected = paymentStatus === type;
            return (
              <TouchableOpacity
                key={type}
                style={[
                  styles.gridOptionCard,
                  { borderColor: glass.border.color, backgroundColor: colors.cardBg2, borderRadius: glass.radius.lg },
                  selected && { borderColor: colors.primary, backgroundColor: `${colors.primary}20` },
                ]}
                onPress={() => setPaymentStatus(type)}
              >
                <OdemeIcon size={28} color={colors.primary} style={{ marginBottom: 8 }} />
                <Text style={[styles.gridOptionTitle, { color: colors.text, fontFamily: Fonts.uiBold }]}>{title}</Text>
                <Text style={[styles.gridOptionSub, { color: colors.textSecondary, fontFamily: Fonts.ui }]}>{sub}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: Fonts.uiBold, marginTop: 24 }]}>Baristaya Not</Text>
        <TextInput
          style={[styles.noteInput, { color: colors.text, borderColor: glass.border.color, backgroundColor: colors.inputBg, fontFamily: Fonts.ui }]}
          placeholder="İçecek detayları, teslimat notları..."
          placeholderTextColor={colors.textMuted}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={2}
        />

        {previewRate > 0 && (
          <GlassView blurType="subtle" style={[styles.discountPreviewCard, { borderRadius: glass.radius.lg, borderColor: colors.goldBorder }]}>
            <View style={styles.summaryRow}>
              <Text style={{ color: colors.textSecondary, fontFamily: Fonts.ui, fontSize: 12 }}>Ara Toplam</Text>
              <Text style={{ color: colors.text, fontFamily: Fonts.uiBold, fontSize: 12 }}>{formatTL(cartTotal)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={{ color: colors.gold, fontFamily: Fonts.uiBold, fontSize: 12 }}>{TIER_DISCOUNT_LABEL_PREVIEW[userTier]}</Text>
              <Text style={{ color: colors.gold, fontFamily: Fonts.uiBold, fontSize: 12 }}>-{formatTL(previewDiscount)}</Text>
            </View>
          </GlassView>
        )}

        <View style={styles.checkboxRow}>
          <TouchableOpacity onPress={() => setDistanceSalesAccepted((v) => !v)}>
            <View style={[styles.checkboxBox, { borderColor: colors.border }, distanceSalesAccepted && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
              {distanceSalesAccepted && <Text style={styles.checkboxMark}>✓</Text>}
            </View>
          </TouchableOpacity>
          {/* Bağlantıyı bir TouchableOpacity'nin içine koymak dokunuşu ebeveyn Touchable'a
              kaptırıyordu (bkz. register.tsx) — etiket artık ayrı, dokunulabilir olmayan
              bir sarmalayıcıda; iç içe Text onPress'ler doğru şekilde kendi dokunuşunu alıyor. */}
          <Text style={[styles.checkboxLabel, { color: colors.textSecondary, fontFamily: Fonts.ui }]} onPress={() => setDistanceSalesAccepted((v) => !v)}>
            <Text onPress={() => setLegalSection(distanceSalesText)} style={{ color: colors.gold, fontFamily: Fonts.uiSemiBold }}>Mesafeli Satış Sözleşmesi</Text>
            {"'ni okudum ve onaylıyorum."}
          </Text>
        </View>

        {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
      </ScrollView>
      <LegalTextModal section={legalSection} onClose={() => setLegalSection(null)} />

      <GlassView blurType="heavy" style={[styles.bottomBar, { borderTopLeftRadius: glass.radius.xl, borderTopRightRadius: glass.radius.xl, borderWidth: 0, borderTopWidth: 1 }]}>
        <View>
          <Text style={[styles.totalLabel, { color: colors.textSecondary, fontFamily: Fonts.uiBold }]}>TOPLAM</Text>
          <Text style={[styles.totalPrice, { color: colors.text, fontFamily: Fonts.display }]}>{formatTL(previewTotal)}</Text>
        </View>
        <TouchableOpacity onPress={handleCheckout} disabled={loading} style={[styles.checkoutBtn, { borderRadius: glass.radius.pill, backgroundColor: colors.primary }]}>
          {loading ? <ActivityIndicator color="#fdfdfb" /> : <Text style={[styles.checkoutBtnText, { fontFamily: Fonts.uiBold }]}>{user ? 'Siparişi Onayla' : 'Giriş Yap ve Öde'}</Text>}
        </TouchableOpacity>
      </GlassView>

      <Modal animationType="slide" transparent visible={paymentModalVisible} onRequestClose={() => setPaymentModalVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlayBar }]}>
          <GlassView
            blurType="heavy"
            style={[
              styles.modalContent,
              { borderTopLeftRadius: glass.radius.xl, borderTopRightRadius: glass.radius.xl, borderWidth: 0, borderTopWidth: 1 },
              // `modalContent` normally sizes itself to its content (maxHeight caps it at 85%),
              // which works for the short success/no-card-needed states. The WebView needs an
              // actual fixed height to flex into — without this, `flex: 1` on its wrapper has
              // no defined parent height to fill and collapses to almost nothing.
              paymentPageUrl && Platform.OS !== 'web' && remainingTL > 0 ? { height: '85%' } : null,
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text, fontFamily: Fonts.displayItalicSemiBold }]}>Güvenli Ödeme</Text>
              <TouchableOpacity onPress={() => setPaymentModalVisible(false)}>
                <Text style={{ fontSize: 18, color: colors.textSecondary }}>✕</Text>
              </TouchableOpacity>
            </View>

            {paymentSuccess ? (
              <View style={styles.successContainer}>
                <View style={[styles.successCircle, { backgroundColor: colors.primary }]}>
                  <Text style={styles.successCheck}>✓</Text>
                </View>
                <Text style={[styles.successText, { color: colors.text, fontFamily: Fonts.displayItalicSemiBold }]}>Ödeme Başarılı!</Text>
              </View>
            ) : paymentPageUrl && Platform.OS !== 'web' && remainingTL > 0 ? (
              // The native WebView must NOT sit inside a ScrollView — the parent ScrollView
              // steals touch/scroll gestures from it on Android, making the iyzico page feel
              // frozen (can't tap or scroll). Everything above it is short enough to render
              // directly (no scrolling needed), and the WebView fills the remaining space.
              <View style={{ flex: 1 }}>
                <GlassView blurType="regular" style={[styles.paymentGlassPanel, { borderRadius: glass.radius.lg }]}>
                  <View style={styles.walletToggleRow}>
                    <View>
                      <Text style={[styles.panelTitle, { color: colors.text, fontFamily: Fonts.uiBold }]}>Cüzdan Bakiyesi Kullan</Text>
                      <Text style={[styles.panelSub, { color: colors.textSecondary, fontFamily: Fonts.ui }]}>Kullanılabilir: {formatTL(walletBalanceTL)}</Text>
                    </View>
                    <Switch value={useWallet} onValueChange={setUseWallet} trackColor={{ false: glass.border.color as string, true: colors.primary }} thumbColor="#FFFFFF" />
                  </View>
                </GlassView>

                <GlassView blurType="subtle" style={[styles.summaryPanel, { borderRadius: glass.radius.lg, marginBottom: 16 }]}>
                  <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: glass.border.color, paddingTop: 8, marginTop: 8 }]}>
                    <Text style={{ color: colors.text, fontFamily: Fonts.uiBold }}>Ödenecek Tutar (Kart):</Text>
                    <Text style={{ color: colors.gold, fontFamily: Fonts.display, fontSize: 16 }}>{formatTL(remainingTL)}</Text>
                  </View>
                </GlassView>

                <GlassView blurType="regular" style={[styles.cardForm, { borderRadius: glass.radius.lg, flex: 1 }]}>
                  <Text style={[styles.cardFormTitle, { color: colors.text, fontFamily: Fonts.uiBold, textAlign: 'center' }]}>Ödeme Bilgileri (iyzico Güvenli Sayfa)</Text>
                  <View style={{ flex: 1, borderRadius: 12, overflow: 'hidden' }}>
                    <WebView
                      source={{ uri: paymentPageUrl }}
                      style={{ flex: 1, backgroundColor: '#ffffff' }}
                      startInLoadingState
                      renderLoading={() => (
                        <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff' }]}>
                          <ActivityIndicator size="small" color={colors.primary} />
                        </View>
                      )}
                      onNavigationStateChange={(navState) => {
                        // Web'deki postMessage köprüsünün native karşılığı: iyzico'nun
                        // yönlendirdiği başarı sayfasının URL'indeki token'ı doğrudan yakalıyoruz
                        // (bkz. backend orders.controller.ts checkout-form/success).
                        if (navState.url.includes('/orders/checkout-form/success')) {
                          const match = navState.url.match(/[?&]token=([^&]+)/);
                          if (match) handlePayment(decodeURIComponent(match[1]));
                        }
                      }}
                    />
                  </View>
                </GlassView>

                {paymentError && <Text style={[styles.errorText, { color: colors.error, marginVertical: 12 }]}>{paymentError}</Text>}
              </View>
            ) : (
              <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
                <GlassView blurType="regular" style={[styles.paymentGlassPanel, { borderRadius: glass.radius.lg }]}>
                  <View style={styles.walletToggleRow}>
                    <View>
                      <Text style={[styles.panelTitle, { color: colors.text, fontFamily: Fonts.uiBold }]}>Cüzdan Bakiyesi Kullan</Text>
                      <Text style={[styles.panelSub, { color: colors.textSecondary, fontFamily: Fonts.ui }]}>Kullanılabilir: {formatTL(walletBalanceTL)}</Text>
                    </View>
                    <Switch value={useWallet} onValueChange={setUseWallet} trackColor={{ false: glass.border.color as string, true: colors.primary }} thumbColor="#FFFFFF" />
                  </View>
                </GlassView>

                <GlassView blurType="subtle" style={[styles.summaryPanel, { borderRadius: glass.radius.lg, marginBottom: 16 }]}>
                  <View style={styles.summaryRow}>
                    <Text style={{ color: colors.textSecondary, fontFamily: Fonts.ui }}>Sipariş Tutarı:</Text>
                    <Text style={{ color: colors.text, fontFamily: Fonts.uiBold }}>{formatTL(orderTotalTL)}</Text>
                  </View>
                  {useWallet && (
                    <View style={styles.summaryRow}>
                      <Text style={{ color: colors.textSecondary, fontFamily: Fonts.ui }}>Cüzdandan Düşülen:</Text>
                      <Text style={{ color: colors.error, fontFamily: Fonts.uiBold }}>-{formatTL(walletUsedTL)}</Text>
                    </View>
                  )}
                  <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: glass.border.color, paddingTop: 8, marginTop: 8 }]}>
                    <Text style={{ color: colors.text, fontFamily: Fonts.uiBold }}>Ödenecek Tutar (Kart):</Text>
                    <Text style={{ color: colors.gold, fontFamily: Fonts.display, fontSize: 16 }}>{formatTL(remainingTL)}</Text>
                  </View>
                </GlassView>

                {remainingTL > 0 ? (
                  <GlassView blurType="regular" style={[styles.cardForm, { borderRadius: glass.radius.lg }]}>
                    <Text style={[styles.cardFormTitle, { color: colors.text, fontFamily: Fonts.uiBold, textAlign: 'center' }]}>Ödeme Bilgileri (iyzico Güvenli Sayfa)</Text>
                    {paymentPageUrl ? (
                      <iframe
                        src={paymentPageUrl}
                        style={{ width: '100%', height: 420, border: 'none', borderRadius: 12, backgroundColor: '#ffffff' } as any}
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-top-navigation"
                      />
                    ) : (
                      <ActivityIndicator size="small" color={colors.primary} />
                    )}
                  </GlassView>
                ) : (
                  <GlassView blurType="regular" style={[styles.cardForm, { borderRadius: glass.radius.lg, alignItems: 'center' }]}>
                    <Text style={{ fontSize: 14, fontFamily: Fonts.uiBold, color: colors.primary, textAlign: 'center' }}>
                      🎉 Tutarın tamamı cüzdanınızdan düşülecektir. Kart bilgilerine gerek yoktur!
                    </Text>
                    <TouchableOpacity onPress={() => handlePayment('wallet-full-token')} disabled={paymentLoading} style={[styles.paySubmitBtn, { borderRadius: glass.radius.pill, backgroundColor: colors.primary }]}>
                      {paymentLoading ? <ActivityIndicator color="#fdfdfb" /> : <Text style={[styles.paySubmitText, { fontFamily: Fonts.uiBold }]}>Ödemeyi Tamamla</Text>}
                    </TouchableOpacity>
                  </GlassView>
                )}

                {paymentError && <Text style={[styles.errorText, { color: colors.error, marginVertical: 12 }]}>{paymentError}</Text>}
              </ScrollView>
            )}
          </GlassView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: Platform.OS === 'ios' ? 60 : 40, paddingHorizontal: 24, paddingBottom: 16, borderBottomWidth: 1 },
  backBtn: { paddingVertical: 6, paddingHorizontal: 12, borderWidth: 1 },
  backBtnText: { fontSize: 11 },
  headerTitle: { fontSize: 17 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 120, paddingTop: 16 },
  sectionTitle: { fontSize: 14, letterSpacing: 0.5, marginBottom: 12 },
  itemCard: { padding: 16, marginBottom: 12 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  itemName: { fontSize: 15 },
  itemOptions: { fontSize: 11, marginTop: 2 },
  removeButton: { fontSize: 16, fontWeight: 'bold', paddingHorizontal: 6 },
  itemFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemPrice: { fontSize: 14 },
  qtySelector: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, height: 32 },
  qtyBtn: { width: 32, height: '100%', justifyContent: 'center', alignItems: 'center' },
  qtyBtnText: { fontSize: 16, fontWeight: 'bold' },
  qtyVal: { fontSize: 13, paddingHorizontal: 10 },
  optionsGrid: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  gridOptionCard: { flex: 1, borderWidth: 1, padding: 14, alignItems: 'center' },
  gridOptionTitle: { fontSize: 12, marginBottom: 2 },
  gridOptionSub: { fontSize: 9, textAlign: 'center' },
  noteInput: { borderWidth: 1, borderRadius: 18, padding: 12, fontSize: 13, textAlignVertical: 'top', height: 60 },
  branchCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, padding: 14, gap: 10 },
  branchName: { fontSize: 13, marginBottom: 3 },
  branchAddress: { fontSize: 10.5, lineHeight: 15 },
  branchDistance: { fontSize: 11, flexShrink: 0 },
  discountPreviewCard: { padding: 14, marginTop: 16, borderWidth: 1, gap: 6 },
  errorText: { fontSize: 12, textAlign: 'center', marginTop: 12, fontWeight: 'bold' },
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 8 },
  checkboxBox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  checkboxMark: { color: '#fdfdfb', fontSize: 12, fontWeight: '700' },
  checkboxLabel: { flex: 1, fontSize: 11.5, lineHeight: 17 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 84, paddingHorizontal: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 9, letterSpacing: 1, marginBottom: 2 },
  totalPrice: { fontSize: 20 },
  checkoutBtn: { paddingVertical: 13, paddingHorizontal: 24 },
  checkoutBtnText: { color: '#fdfdfb', fontSize: 13 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 19, marginBottom: 8 },
  emptySubtitle: { fontSize: 12, textAlign: 'center', lineHeight: 16, marginBottom: 20 },
  browseButton: { paddingVertical: 13, paddingHorizontal: 28 },
  browseButtonText: { color: '#fdfdfb', fontSize: 13 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  modalContent: { paddingHorizontal: 24, paddingTop: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 18 },
  paymentGlassPanel: { padding: 16, marginBottom: 16 },
  walletToggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  panelTitle: { fontSize: 13 },
  panelSub: { fontSize: 11, marginTop: 2 },
  summaryPanel: { padding: 16 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  cardForm: { padding: 16, marginBottom: 20 },
  cardFormTitle: { fontSize: 13, marginBottom: 14 },
  paySubmitBtn: { paddingVertical: 14, alignItems: 'center', marginTop: 16, marginBottom: 20, width: 200 },
  paySubmitText: { color: '#fdfdfb', fontSize: 14 },
  successContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  successCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  successCheck: { color: '#fdfdfb', fontSize: 28, fontWeight: 'bold' },
  successText: { fontSize: 18 },
});
