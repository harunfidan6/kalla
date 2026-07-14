import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, RefreshControl, ActivityIndicator, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useAuth, API_URL } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Fonts, formatTL } from '../../constants/theme';
import { OrderStatus } from '@kafe/shared-types';
import io from 'socket.io-client';
import { useRouter, useIsFocused } from 'expo-router';

export default function OrdersScreen() {
  const { user, apiFetch, accessToken, loading: authLoading } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();
  const isFocused = useIsFocused();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const socketRef = useRef<any>(null);

  const loadOrders = async () => {
    try {
      const data = await apiFetch('/orders/my-history');
      setOrders(data);
    } catch (err: any) {
      setError('Sipariş geçmişiniz yüklenemedi.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/(auth)/login');
      return;
    }

    loadOrders();

    socketRef.current = io(API_URL, { auth: { token: accessToken } });

    socketRef.current.on('order:status_update', (data: { orderId: string; status: string }) => {
      setOrders((prevOrders) =>
        prevOrders.map((o) => (o.id === data.orderId ? { ...o, status: data.status } : o))
      );
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [accessToken, authLoading, user]);

  useEffect(() => {
    if (socketRef.current && orders.length > 0) {
      orders.forEach((order) => {
        if (order.status !== OrderStatus.DELIVERED && order.status !== OrderStatus.CANCELLED) {
          socketRef.current.emit('subscribeToOrder', { orderId: order.id });
        }
      });
    }
  }, [orders, socketRef.current]);

  const onRefresh = () => {
    setRefreshing(true);
    loadOrders();
  };

  const cancelOrder = async (orderId: string) => {
    setCancellingId(orderId);
    try {
      await apiFetch(`/orders/${orderId}/cancel`, { method: 'PATCH' });
      setOrders((prevOrders) =>
        prevOrders.map((o) => (o.id === orderId ? { ...o, status: OrderStatus.CANCELLED } : o))
      );
    } catch (err: any) {
      const message = err.message || 'Sipariş iptal edilirken bir hata oluştu.';
      // react-native-web'in Alert.alert() implementasyonu tamamen no-op (hiçbir şey yapmıyor) —
      // web'de çalışırken bu hata hiç görünmez olurdu.
      if (Platform.OS === 'web') {
        window.alert(message);
      } else {
        Alert.alert('İptal Edilemedi', message);
      }
    } finally {
      setCancellingId(null);
    }
  };

  const confirmCancelOrder = (orderId: string) => {
    // Aynı no-op nedeniyle çok butonlu Alert.alert web'de onay diyaloğunu hiç göstermiyor,
    // dolayısıyla "Siparişi İptal Et" tıklaması hiçbir şey yapmıyormuş gibi görünüyordu.
    if (Platform.OS === 'web') {
      if (window.confirm('Bu siparişi iptal etmek istediğinize emin misiniz?')) {
        cancelOrder(orderId);
      }
      return;
    }
    Alert.alert('Siparişi İptal Et', 'Bu siparişi iptal etmek istediğinize emin misiniz?', [
      { text: 'Vazgeç', style: 'cancel' },
      { text: 'Siparişi İptal Et', style: 'destructive', onPress: () => cancelOrder(orderId) },
    ]);
  };

  const getStatusStep = (status: string) => {
    switch (status) {
      case OrderStatus.RECEIVED: return 1;
      case OrderStatus.PREPARING: return 2;
      case OrderStatus.READY: return 3;
      case OrderStatus.DELIVERED: return 4;
      default: return 0;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case OrderStatus.RECEIVED: return 'Alındı';
      case OrderStatus.PREPARING: return 'Hazırlanıyor';
      case OrderStatus.READY: return 'Hazır';
      case OrderStatus.DELIVERED: return 'Teslim Edildi';
      case OrderStatus.CANCELLED: return 'İptal Edildi';
      default: return status;
    }
  };

  const activeOrders = orders.filter((o) => o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.CANCELLED);
  const pastOrders = orders.filter((o) => o.status === OrderStatus.DELIVERED || o.status === OrderStatus.CANCELLED);

  // See index.tsx for why this guard is needed (react-native-screens web tab bleed-through).
  if (!isFocused) return null;

  if (loading) {
    return (
      <View style={styles.centerFill}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
    >
      <Text style={[styles.sectionLabel, { color: colors.textMuted, fontFamily: Fonts.uiExtraBold }]}>AKTİF TAKİP</Text>
      {activeOrders.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <Text style={[styles.emptyText, { color: colors.textSecondary, fontFamily: Fonts.displayItalic }]}>Aktif siparişiniz bulunmuyor.</Text>
        </View>
      ) : (
        activeOrders.map((order) => {
          const step = getStatusStep(order.status);
          return (
            <View key={order.id} style={[styles.orderCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.orderNumber, { color: colors.text, fontFamily: Fonts.mono }]}>
                  Sipariş #{order.id.slice(0, 8).toUpperCase()}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.statusBadgeText, { fontFamily: Fonts.uiExtraBold }]}>{getStatusText(order.status).toUpperCase()}</Text>
                </View>
              </View>

              <View style={styles.timelineRow}>
                {[1, 2, 3, 4].map((s) => {
                  const isCompleted = step >= s;
                  const label = s === 1 ? 'Alındı' : s === 2 ? 'Hazırlanıyor' : s === 3 ? 'Hazır' : 'Teslim';
                  return (
                    <View key={s} style={styles.timelineStep}>
                      <View style={[styles.timelineDot, isCompleted ? { backgroundColor: colors.primary } : { borderWidth: 1.5, borderColor: colors.border }]} />
                      <Text style={[styles.timelineLabel, { color: isCompleted ? colors.text : colors.textMuted, fontFamily: isCompleted ? Fonts.uiBold : Fonts.uiMedium }]}>{label}</Text>
                    </View>
                  );
                })}
              </View>

              <View style={styles.itemsList}>
                {order.items.map((item: any) => (
                  <Text key={item.id} style={[styles.itemRow, { color: colors.textSecondary, fontFamily: Fonts.ui }]}>
                    • {item.quantity}x {item.product.name}
                  </Text>
                ))}
              </View>

              {order.discountAmount > 0 && (
                <View style={styles.discountBreakdown}>
                  <View style={styles.discountRow}>
                    <Text style={[styles.discountLabel, { color: colors.textMuted, fontFamily: Fonts.ui }]}>Ara Toplam</Text>
                    <Text style={[styles.discountValue, { color: colors.textSecondary, fontFamily: Fonts.ui }]}>{formatTL(order.subtotal)}</Text>
                  </View>
                  <View style={styles.discountRow}>
                    <Text style={[styles.discountLabel, { color: colors.gold, fontFamily: Fonts.uiBold }]}>{order.discountLabel}</Text>
                    <Text style={[styles.discountValue, { color: colors.gold, fontFamily: Fonts.uiBold }]}>-{formatTL(order.discountAmount)}</Text>
                  </View>
                </View>
              )}

              <View style={[styles.cardFooter, { borderTopColor: colors.border }]}>
                <Text style={[styles.totalLabel, { color: colors.textMuted, fontFamily: Fonts.ui }]}>Sipariş Tutarı</Text>
                <Text style={[styles.totalPrice, { color: colors.text, fontFamily: Fonts.display }]}>{formatTL(order.totalAmount)}</Text>
              </View>

              {order.status === OrderStatus.RECEIVED && (
                <TouchableOpacity onPress={() => confirmCancelOrder(order.id)} disabled={cancellingId === order.id} style={styles.cancelBtn}>
                  {cancellingId === order.id ? (
                    <ActivityIndicator size="small" color={colors.error} />
                  ) : (
                    <Text style={[styles.cancelBtnText, { color: colors.error, fontFamily: Fonts.uiBold }]}>Siparişi İptal Et</Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          );
        })
      )}

      <Text style={[styles.sectionLabel, { color: colors.textMuted, fontFamily: Fonts.uiExtraBold, marginTop: 24 }]}>GEÇMİŞ SİPARİŞLERİM</Text>
      {pastOrders.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <Text style={[styles.emptyText, { color: colors.textSecondary, fontFamily: Fonts.displayItalic }]}>Geçmiş siparişiniz bulunmamaktadır.</Text>
        </View>
      ) : (
        pastOrders.map((order) => (
          <View key={order.id} style={[styles.orderCardCompact, { backgroundColor: colors.cardBg2, borderColor: colors.border }]}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={[styles.orderNumberCompact, { color: colors.text, fontFamily: Fonts.mono }]}>Sipariş #{order.id.slice(0, 8).toUpperCase()}</Text>
                <Text style={[styles.orderDate, { color: colors.textMuted, fontFamily: Fonts.ui }]}>
                  {new Date(order.createdAt).toLocaleDateString('tr-TR')} {new Date(order.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <Text style={[styles.statusBadgeCompact, { color: order.status === OrderStatus.CANCELLED ? colors.error : colors.success, fontFamily: Fonts.uiExtraBold }]}>
                {getStatusText(order.status).toUpperCase()}
              </Text>
            </View>
            {order.discountAmount > 0 && (
              <Text style={[styles.discountTagCompact, { color: colors.gold, fontFamily: Fonts.uiBold }]}>
                {order.discountLabel} · -{formatTL(order.discountAmount)}
              </Text>
            )}
            <View style={[styles.cardFooterCompact, { borderTopColor: colors.border }]}>
              <Text style={[styles.totalLabel, { color: colors.textMuted, fontFamily: Fonts.ui }]}>Tutar</Text>
              <Text style={[styles.totalPriceCompact, { color: colors.text, fontFamily: Fonts.display }]}>{formatTL(order.totalAmount)}</Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 110 },
  centerFill: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionLabel: { fontSize: 10, letterSpacing: 1.5, marginBottom: 12 },
  emptyCard: { padding: 20, borderRadius: 16, borderWidth: 1, alignItems: 'center', marginBottom: 24 },
  emptyText: { fontSize: 12 },
  orderCard: { padding: 18, borderRadius: 20, borderWidth: 1, marginBottom: 24 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 },
  discountBreakdown: { marginBottom: 10, gap: 3 },
  discountRow: { flexDirection: 'row', justifyContent: 'space-between' },
  discountLabel: { fontSize: 10 },
  discountValue: { fontSize: 10 },
  discountTagCompact: { fontSize: 9.5, marginTop: 6 },
  orderNumber: { fontSize: 11 },
  statusBadge: { borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10 },
  statusBadgeText: { fontSize: 8, color: '#fdfdfb', letterSpacing: 0.5 },
  timelineRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, marginBottom: 8 },
  timelineStep: { alignItems: 'center', gap: 6, flex: 1 },
  timelineDot: { width: 11, height: 11, borderRadius: 6 },
  timelineLabel: { fontSize: 8 },
  itemsList: { marginTop: 8, marginBottom: 12 },
  itemRow: { fontSize: 12, marginBottom: 4 },
  cardFooter: { borderTopWidth: 1, paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 9 },
  totalPrice: { fontSize: 13 },
  cancelBtn: { marginTop: 12, paddingVertical: 8, alignItems: 'center' },
  cancelBtnText: { fontSize: 12 },
  orderCardCompact: { padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 10 },
  orderNumberCompact: { fontSize: 11 },
  orderDate: { fontSize: 9, marginTop: 2 },
  statusBadgeCompact: { fontSize: 9 },
  cardFooterCompact: { borderTopWidth: 1, paddingTop: 10, marginTop: 12, flexDirection: 'row', justifyContent: 'space-between' },
  totalPriceCompact: { fontSize: 13 },
});
