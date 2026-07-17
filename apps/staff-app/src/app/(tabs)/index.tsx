import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Modal } from 'react-native';
import { useRouter, useIsFocused } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth, API_URL } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Fonts, formatTL } from '../../constants/theme';
import { OrderStatus, OrderType, PaymentStatus, PaymentMethod } from '@kafe/shared-types';
import io from 'socket.io-client';
import ConfirmModal, { ConfirmModalState } from '../../components/ConfirmModal';
import GlassView from '../../components/GlassView';

// Emin: sipariş durumuna göre modaldaki tek aksiyon butonunun etiketi (demo actionLabelMap).
const ACTION_LABELS: Partial<Record<string, string>> = {
  [OrderStatus.RECEIVED]: 'Hazırlamaya Başla',
  [OrderStatus.PREPARING]: 'Tamamla',
  [OrderStatus.READY]: 'Teslim Et',
};

const NEXT_STATUS: Partial<Record<string, OrderStatus>> = {
  [OrderStatus.RECEIVED]: OrderStatus.PREPARING,
  [OrderStatus.PREPARING]: OrderStatus.READY,
  [OrderStatus.READY]: OrderStatus.DELIVERED,
};

export default function KanbanScreen() {
  const router = useRouter();
  const { user, loading, apiFetch, accessToken } = useAuth();
  const { colors } = useTheme();
  const isFocused = useIsFocused();

  const [orders, setOrders] = useState<any[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmModalState | null>(null);
  const [cancelledOrders, setCancelledOrders] = useState<any[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // orderId_itemId -> boolean (hazırlık kontrol listesi, yalnızca yerel durum)
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  const socketRef = useRef<any>(null);
  const accessTokenRef = useRef<string | null>(accessToken);

  // Reconnect sonrası soket, ilk bağlantıda yakalanan eski (belki artık geçersiz) token yerine
  // her zaman güncel access token'ı sunsun diye ref'te tutuluyor.
  useEffect(() => {
    accessTokenRef.current = accessToken;
  }, [accessToken]);

  const playAlertSound = () => {
    if (Platform.OS === 'web') {
      try {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav');
        audio.volume = 0.5;
        audio.play().catch((e) => console.log('Audio autoplay blocked', e));
      } catch (err) {
        console.log('Audio failed to initialize', err);
      }
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/(auth)/login');
    }
  }, [user, loading]);

  useEffect(() => {
    if (!user) return;

    const loadActiveOrders = async () => {
      try {
        const activeOrders = await apiFetch('/orders/active');
        setOrders(activeOrders);
      } catch (err: any) {
        setError('Siparişler yüklenirken hata oluştu.');
      } finally {
        setInitialLoading(false);
      }
    };

    // "İptaller" bölümü için son 24 saatte iptal edilen siparişler — bu oturum açılmadan
    // ÖNCE iptal edilmiş olanları da kapsar (yalnızca canlı soket olaylarına güvenilmez).
    const loadCancelledOrders = async () => {
      try {
        const cancelled = await apiFetch('/orders/cancelled');
        setCancelledOrders(cancelled);
      } catch {
        // sessiz — iptaller bölümü ikincil bir özellik, sayfa render'ını engellemesin
      }
    };

    loadActiveOrders();
    loadCancelledOrders();

    // auth bir callback olarak veriliyor ki her (yeniden) bağlanma denemesinde en güncel token
    // sunulsun — aksi halde token yenilendikten sonra bir kopma/yeniden bağlanma, ilk bağlantı
    // anında yakalanmış artık geçersiz bir token'la başarısız reconnect'e yol açabilir.
    socketRef.current = io(API_URL, {
      auth: (cb: (data: { token: string | null }) => void) => cb({ token: accessTokenRef.current }),
    });

    // Soket her bağlandığında (ilk bağlantı VE her yeniden bağlanma) aktif siparişleri REST
    // üzerinden yeniden çeker — bağlantı kopukken kaçırılmış olabilecek order:new/status_update
    // olaylarını telafi eder, aksi halde personel manuel sayfa yenilemeden haberdar olmaz.
    socketRef.current.on('connect', () => {
      loadActiveOrders();
      loadCancelledOrders();
    });

    socketRef.current.on('order:new', (newOrder: any) => {
      playAlertSound();
      setOrders((prevOrders) => {
        if (prevOrders.some((o) => o.id === newOrder.id)) return prevOrders;
        return [...prevOrders, newOrder];
      });
    });

    socketRef.current.on('order:status_update', (data: { orderId: string; status: string }) => {
      setOrders((prevOrders) => {
        if (data.status === OrderStatus.CANCELLED) {
          // Sipariş bir an önce aktif listedeydi — tam halini (müşteri/ürünler/tutar) burada
          // yakala, backend'in status_update payload'ı yalnızca orderId+status içeriyor.
          const cancelled = prevOrders.find((o) => o.id === data.orderId);
          if (cancelled) {
            setCancelledOrders((prev) => [{ ...cancelled, status: data.status }, ...prev].slice(0, 20));
          }
        }
        if (data.status === OrderStatus.DELIVERED || data.status === OrderStatus.CANCELLED) {
          return prevOrders.filter((o) => o.id !== data.orderId);
        }
        return prevOrders.map((o) => (o.id === data.orderId ? { ...o, status: data.status } : o));
      });
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [user]);

  const updateOrderStatus = async (orderId: string, status: OrderStatus, paymentMethod?: PaymentMethod) => {
    try {
      await apiFetch(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, paymentMethod }),
      });
      setSelectedOrderId(null);
      if (status === OrderStatus.DELIVERED) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
      } else {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
      }
    } catch (err: any) {
      if (Platform.OS === 'web') {
        alert('Sipariş güncellenemedi: ' + err.message);
      } else {
        setConfirmState({ title: 'Hata', message: 'Sipariş güncellenemedi.' });
      }
    }
  };

  const toggleCheckItem = (orderId: string, itemId: string) => {
    const key = `${orderId}_${itemId}`;
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const parseOptions = (options: string | null) => {
    if (!options) return '';
    try {
      const parsed = JSON.parse(options);
      const arr = [];
      if (parsed.size && parsed.size !== 'Orta' && parsed.size !== 'Tek') arr.push(parsed.size);
      if (parsed.milk && parsed.milk !== 'Normal') arr.push(parsed.milk);
      if (parsed.sweetness && parsed.sweetness !== 'Normal' && parsed.sweetness !== 'Sade') arr.push(parsed.sweetness);
      if (parsed.syrup && parsed.syrup !== 'Yok') arr.push(`+${parsed.syrup}`);
      if (parsed.extraShot && parsed.extraShot !== 'Yok') arr.push(`+${parsed.extraShot}`);
      return arr.length > 0 ? ` (${arr.join(', ')})` : '';
    } catch {
      return '';
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

  const receivedOrders = orders.filter((o) => o.status === OrderStatus.RECEIVED);
  const preparingOrders = orders.filter((o) => o.status === OrderStatus.PREPARING);
  const readyOrders = orders.filter((o) => o.status === OrderStatus.READY);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || null;

  const columns = [
    { title: 'YENİ GELENLER', dotColor: colors.gold, orders: receivedOrders, emptyText: 'Sipariş sırası boş' },
    { title: 'HAZIRLANANLAR', dotColor: colors.text, orders: preparingOrders, emptyText: 'Hazırlanan kahve yok' },
    { title: 'TEZGAHTA HAZIR', dotColor: colors.primary, orders: readyOrders, emptyText: 'Teslim edilecek ürün yok' },
  ];

  const renderOrderCard = (order: any) => {
    const minutesElapsed = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000);
    const isDelayed = minutesElapsed >= 10 && order.status !== OrderStatus.READY;
    const itemsSummary = order.items
      .map((it: any) => `${it.quantity}x ${it.product.name}${parseOptions(it.options)}`)
      .join(' · ');

    return (
      <TouchableOpacity key={order.id} onPress={() => setSelectedOrderId(order.id)}>
        <View
          style={[
            styles.orderCard,
            {
              backgroundColor: colors.cardBg,
              borderColor: isDelayed ? colors.error : colors.border,
              borderWidth: isDelayed ? 2 : 1,
            },
          ]}
        >
          <View style={styles.cardTopRow}>
            <View>
              <Text style={[styles.orderId, { color: colors.text, fontFamily: Fonts.mono }]}>
                #{order.id.slice(0, 6).toUpperCase()}
              </Text>
              <Text style={[styles.timeLabel, { color: isDelayed ? colors.error : colors.textMuted, fontFamily: Fonts.uiBold }]}>
                {minutesElapsed} dk. önce
              </Text>
            </View>
            <LinearGradient
              colors={[colors.primary, colors.primaryEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.typeBadge}
            >
              <Text style={[styles.typeBadgeText, { fontFamily: Fonts.uiExtraBold }]}>
                {order.orderType === OrderType.PICKUP ? 'GEL-AL' : 'PAKET'}
              </Text>
            </LinearGradient>
          </View>

          <Text style={[styles.customerName, { color: colors.text, fontFamily: Fonts.uiBold }]}>
            {order.customer?.fullName || 'Bilinmeyen Müşteri'}
          </Text>
          <Text style={[styles.itemsSummary, { color: colors.textSecondary, fontFamily: Fonts.ui }]}>{itemsSummary}</Text>
          <View style={styles.cardTotalRow}>
            <Text style={[styles.cardTotal, { color: colors.text, fontFamily: Fonts.uiBold }]}>{formatTL(order.totalAmount)}</Text>
            {order.discountAmount > 0 && (
              <Text style={[styles.cardDiscountTag, { color: colors.gold, fontFamily: Fonts.uiBold }]}>İndirimli</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCancelledRow = (order: any) => (
    <View key={order.id} style={[styles.cancelledRow, { backgroundColor: colors.cardBg2, borderColor: colors.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.cancelledOrderId, { color: colors.textSecondary, fontFamily: Fonts.mono }]}>
          #{order.id.slice(0, 6).toUpperCase()} · {order.customer?.fullName || 'Bilinmeyen Müşteri'}
        </Text>
        <Text style={[styles.cancelledMeta, { color: colors.textMuted, fontFamily: Fonts.ui }]}>
          {new Date(order.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })} · İptal Edildi
        </Text>
      </View>
      <Text style={[styles.cancelledTotal, { color: colors.textMuted, fontFamily: Fonts.uiBold }]}>{formatTL(order.totalAmount)}</Text>
    </View>
  );

  return (
    <>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        {error && (
          <View style={[styles.errorCard, { backgroundColor: `${colors.error}1A`, borderColor: colors.error }]}>
            <Text style={{ color: colors.error, fontFamily: Fonts.uiBold, fontSize: 12 }}>{error}</Text>
          </View>
        )}

        {/* stat pills */}
        <View style={styles.statsRow}>
          <View style={[styles.statBox, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <Text style={[styles.statNum, { color: colors.gold, fontFamily: Fonts.display }]}>{receivedOrders.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted, fontFamily: Fonts.uiBold }]}>YENİ</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <Text style={[styles.statNum, { color: colors.text, fontFamily: Fonts.display }]}>{preparingOrders.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted, fontFamily: Fonts.uiBold }]}>HAZIRLANIYOR</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <Text style={[styles.statNum, { color: colors.sageText, fontFamily: Fonts.display }]}>{readyOrders.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted, fontFamily: Fonts.uiBold }]}>HAZIR</Text>
          </View>
        </View>

        {columns.map((col) => (
          <View key={col.title} style={styles.column}>
            <View style={styles.columnHeader}>
              <View style={[styles.columnDot, { backgroundColor: col.dotColor }]} />
              <Text style={[styles.columnTitle, { color: colors.text, fontFamily: Fonts.uiExtraBold }]}>{col.title}</Text>
            </View>
            {col.orders.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.cardBg2, borderColor: colors.border }]}>
                <Text style={[styles.emptyText, { color: colors.textMuted, fontFamily: Fonts.displayItalic }]}>{col.emptyText}</Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>{col.orders.map(renderOrderCard)}</View>
            )}
          </View>
        ))}

        {cancelledOrders.length > 0 && (
          <View style={styles.column}>
            <View style={styles.columnHeader}>
              <View style={[styles.columnDot, { backgroundColor: colors.error }]} />
              <Text style={[styles.columnTitle, { color: colors.text, fontFamily: Fonts.uiExtraBold }]}>İPTALLER (SON 24 SAAT)</Text>
            </View>
            <View style={{ gap: 8 }}>{cancelledOrders.map(renderCancelledRow)}</View>
          </View>
        )}
      </ScrollView>

      {/* Sipariş detay bottom sheet */}
      {selectedOrder && (
        <Modal animationType="fade" transparent visible onRequestClose={() => setSelectedOrderId(null)}>
          <View style={styles.modalOverlay}>
            <GlassView
              backgroundColor={solidSheetBg(colors)}
              blurAmount={26}
              style={[styles.modalSheet, { borderColor: colors.border }]}
            >
              <ScrollView contentContainerStyle={{ paddingBottom: 10 }}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalOrderId, { color: colors.text, fontFamily: Fonts.mono }]}>
                    #{selectedOrder.id.slice(0, 6).toUpperCase()}
                  </Text>
                  <TouchableOpacity onPress={() => setSelectedOrderId(null)}>
                    <Text style={[styles.modalClose, { color: colors.textSecondary }]}>✕</Text>
                  </TouchableOpacity>
                </View>

                <Text style={[styles.modalCustomer, { color: colors.text, fontFamily: Fonts.display }]}>
                  {selectedOrder.customer?.fullName || 'Bilinmeyen Müşteri'}
                </Text>
                <Text style={[styles.modalMeta, { color: colors.textSecondary, fontFamily: Fonts.ui }]}>
                  {selectedOrder.orderType === OrderType.PICKUP ? 'GEL-AL' : 'PAKET'} ·{' '}
                  {selectedOrder.paymentStatus === PaymentStatus.PAID_ONLINE ? 'Online Ödendi' : 'Kafede Ödeme'}
                </Text>

                {selectedOrder.discountAmount > 0 && (
                  <View style={[styles.paymentBox, { backgroundColor: colors.cardBg2, borderColor: colors.goldBorder }]}>
                    <View style={styles.discountBreakdownRow}>
                      <Text style={[styles.paymentLine, { color: colors.textSecondary, fontFamily: Fonts.ui }]}>Ara Toplam</Text>
                      <Text style={[styles.paymentLine, { color: colors.text, fontFamily: Fonts.uiBold }]}>{formatTL(selectedOrder.subtotal)}</Text>
                    </View>
                    <View style={styles.discountBreakdownRow}>
                      <Text style={[styles.paymentLine, { color: colors.gold, fontFamily: Fonts.uiBold }]}>{selectedOrder.discountLabel}</Text>
                      <Text style={[styles.paymentLine, { color: colors.gold, fontFamily: Fonts.uiBold }]}>-{formatTL(selectedOrder.discountAmount)}</Text>
                    </View>
                    <View style={[styles.discountBreakdownRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 6, marginTop: 2 }]}>
                      <Text style={[styles.paymentLine, { color: colors.text, fontFamily: Fonts.uiExtraBold }]}>Toplam</Text>
                      <Text style={[styles.paymentLine, { color: colors.text, fontFamily: Fonts.uiExtraBold }]}>{formatTL(selectedOrder.totalAmount)}</Text>
                    </View>
                  </View>
                )}

                {selectedOrder.payment && (
                  <View style={[styles.paymentBox, { backgroundColor: colors.cardBg2, borderColor: colors.border }]}>
                    <Text style={[styles.paymentLine, { color: colors.textSecondary, fontFamily: Fonts.ui }]}>
                      Cüzdandan Düşen:{' '}
                      <Text style={{ color: colors.text, fontFamily: Fonts.uiBold }}>
                        {(selectedOrder.payment.walletAmountUsed / 100).toFixed(2)} TL
                      </Text>
                    </Text>
                    <Text style={[styles.paymentLine, { color: colors.textSecondary, fontFamily: Fonts.ui }]}>
                      Karttan Tahsil:{' '}
                      <Text style={{ color: colors.text, fontFamily: Fonts.uiBold }}>
                        {(selectedOrder.payment.amountCharged / 100).toFixed(2)} TL
                      </Text>
                    </Text>
                  </View>
                )}

                <Text style={[styles.modalSectionLabel, { color: colors.textMuted, fontFamily: Fonts.uiExtraBold }]}>
                  HAZIRLIK KONTROL LİSTESİ
                </Text>
                <View style={{ gap: 8, marginBottom: 16 }}>
                  {selectedOrder.items.map((item: any) => {
                    const isChecked = !!checkedItems[`${selectedOrder.id}_${item.id}`];
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.checkRow}
                        onPress={() => toggleCheckItem(selectedOrder.id, item.id)}
                      >
                        <View
                          style={[
                            styles.checkbox,
                            { borderColor: colors.border },
                            isChecked && { backgroundColor: colors.primary, borderColor: colors.primary },
                          ]}
                        >
                          {isChecked && <Text style={styles.checkmark}>✓</Text>}
                        </View>
                        <Text
                          style={[
                            styles.checkText,
                            { color: colors.text, fontFamily: Fonts.ui },
                            isChecked && { opacity: 0.5, textDecorationLine: 'line-through' },
                          ]}
                        >
                          {item.quantity}x {item.product.name}
                          {parseOptions(item.options)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {selectedOrder.notes ? (
                  <View style={[styles.notesBox, { backgroundColor: colors.goldTint, borderColor: colors.goldBorder }]}>
                    <Text style={[styles.notesText, { color: colors.text, fontFamily: Fonts.uiBold }]}>{selectedOrder.notes}</Text>
                  </View>
                ) : null}

                {selectedOrder.status === OrderStatus.READY && selectedOrder.paymentStatus === PaymentStatus.PAY_AT_COUNTER ? (
                  // Kasada ödeme: teslim anında personel fiilen tahsil ettiği yöntemi seçmeden
                  // sipariş "Teslim Et" durumuna geçemez — bu seçim kasaya (Z Raporu) yazılır.
                  <View>
                    <Text style={[styles.paymentPromptLabel, { color: colors.textMuted, fontFamily: Fonts.uiExtraBold }]}>
                      TESLİMDE TAHSİL EDİLEN
                    </Text>
                    <View style={styles.paymentPromptRow}>
                      <TouchableOpacity
                        style={{ flex: 1 }}
                        onPress={() => updateOrderStatus(selectedOrder.id, OrderStatus.DELIVERED, PaymentMethod.CASH)}
                      >
                        <LinearGradient
                          colors={[colors.primary, colors.primaryEnd]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.actionButton}
                        >
                          <Text style={[styles.actionButtonText, { fontFamily: Fonts.uiBold }]}>Nakit Alındı</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{ flex: 1 }}
                        onPress={() => updateOrderStatus(selectedOrder.id, OrderStatus.DELIVERED, PaymentMethod.CARD)}
                      >
                        <LinearGradient
                          colors={[colors.primary, colors.primaryEnd]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.actionButton}
                        >
                          <Text style={[styles.actionButtonText, { fontFamily: Fonts.uiBold }]}>Kart Alındı</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  ACTION_LABELS[selectedOrder.status] && (
                    <TouchableOpacity
                      onPress={() => updateOrderStatus(selectedOrder.id, NEXT_STATUS[selectedOrder.status] as OrderStatus)}
                    >
                      <LinearGradient
                        colors={[colors.primary, colors.primaryEnd]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.actionButton}
                      >
                        <Text style={[styles.actionButtonText, { fontFamily: Fonts.uiBold }]}>
                          {ACTION_LABELS[selectedOrder.status]}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )
                )}
              </ScrollView>
            </GlassView>
          </View>
        </Modal>
      )}

      <ConfirmModal state={confirmState} onClose={() => setConfirmState(null)} />
    </>
  );
}

// Modal arka planı: cardBgStrong çok saydam olduğundan altındaki karartılmış içerik okunurluğu
// bozuyor — bottom sheet'lerde tema bazlı opak-ımsı yüzey kullan.
function solidSheetBg(colors: any) {
  return colors.text === '#232621' ? 'rgba(252,252,250,0.92)' : 'rgba(24,32,28,0.92)';
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 110 },
  centerFill: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorCard: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 14 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statBox: { flex: 1, borderWidth: 1, borderRadius: 14, paddingVertical: 10, alignItems: 'center' },
  statNum: { fontSize: 18 },
  statLabel: { fontSize: 8, letterSpacing: 0.5, marginTop: 2 },
  column: { marginBottom: 20 },
  columnHeader: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
  columnDot: { width: 7, height: 7, borderRadius: 4 },
  columnTitle: { fontSize: 11, letterSpacing: 0.5 },
  emptyCard: { borderWidth: 1, borderRadius: 14, padding: 16, alignItems: 'center' },
  emptyText: { fontSize: 11 },
  orderCard: { borderRadius: 16, padding: 13 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  orderId: { fontSize: 12, fontWeight: '700' },
  timeLabel: { fontSize: 9, marginTop: 2 },
  typeBadge: { borderRadius: 6, paddingVertical: 3, paddingHorizontal: 8 },
  typeBadgeText: { fontSize: 8, color: '#fdfdfb' },
  customerName: { fontSize: 12.5, marginBottom: 6 },
  itemsSummary: { fontSize: 10.5, lineHeight: 16 },
  cardTotalRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  cardTotal: { fontSize: 12 },
  cardDiscountTag: { fontSize: 9 },
  cancelledRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 12,
    opacity: 0.75,
  },
  cancelledOrderId: { fontSize: 10.5 },
  cancelledMeta: { fontSize: 9, marginTop: 2 },
  cancelledTotal: { fontSize: 11 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(10,15,12,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    width: '100%',
    maxHeight: '82%',
    borderTopWidth: 1,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 30,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalOrderId: { fontSize: 14, fontWeight: '700' },
  modalClose: { fontSize: 16 },
  modalCustomer: { fontSize: 16, marginBottom: 4 },
  modalMeta: { fontSize: 11, marginBottom: 16 },
  paymentBox: { borderWidth: 1, borderRadius: 12, padding: 10, marginBottom: 16, gap: 3 },
  paymentLine: { fontSize: 11 },
  discountBreakdownRow: { flexDirection: 'row', justifyContent: 'space-between' },
  modalSectionLabel: { fontSize: 9.5, letterSpacing: 1, marginBottom: 10 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkbox: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  checkmark: { color: '#fdfdfb', fontSize: 10, fontWeight: '800' },
  checkText: { fontSize: 12, flex: 1 },
  notesBox: { borderWidth: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 12, marginBottom: 16 },
  notesText: { fontSize: 11 },
  actionButton: { height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  actionButtonText: { color: '#fdfdfb', fontSize: 13 },
  paymentPromptLabel: { fontSize: 9.5, letterSpacing: 1, marginBottom: 8, textAlign: 'center' },
  paymentPromptRow: { flexDirection: 'row', gap: 8 },
});
