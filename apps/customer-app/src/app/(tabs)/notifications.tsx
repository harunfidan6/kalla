import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Fonts, formatTL } from '../../constants/theme';
import { OrderStatus } from '@kafe/shared-types';
import { useRouter, useIsFocused } from 'expo-router';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  date: Date;
}

// Client-derived notification feed — no dedicated backend feed exists yet, so this is
// computed from already-fetched order history + wallet transactions + loyalty tier.
export default function NotificationsScreen() {
  const router = useRouter();
  const { user, apiFetch, loading: authLoading } = useAuth();
  const isFocused = useIsFocused();
  const { colors } = useTheme();

  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace('/(auth)/login');
      return;
    }

    const load = async () => {
      try {
        const [orders, wallet] = await Promise.all([
          apiFetch('/orders/my-history'),
          apiFetch('/wallet/me'),
        ]);

        const derived: NotificationItem[] = [];

        for (const order of orders) {
          const shortId = order.id.slice(0, 8).toUpperCase();
          if (order.status === OrderStatus.READY) {
            derived.push({
              id: `order-ready-${order.id}`,
              title: 'Siparişiniz hazır!',
              body: `#${shortId} numaralı siparişiniz teslim almaya hazır.`,
              date: new Date(order.createdAt),
            });
          }
          if (order.status === OrderStatus.DELIVERED) {
            derived.push({
              id: `order-delivered-${order.id}`,
              title: 'Sipariş teslim edildi',
              body: `#${shortId} numaralı siparişiniz için afiyet olsun!`,
              date: new Date(order.createdAt),
            });
          }
          if (order.status === OrderStatus.CANCELLED) {
            derived.push({
              id: `order-cancelled-${order.id}`,
              title: 'Sipariş iptal edildi',
              body: `#${shortId} numaralı sipariş iptal edildi.`,
              date: new Date(order.createdAt),
            });
          }
        }

        for (const tx of wallet?.transactions || []) {
          if (tx.type === 'CASHBACK') {
            derived.push({
              id: `tx-${tx.id}`,
              title: 'Cashback kazandınız',
              body: `Son ödemenizden ${tx.amount >= 0 ? '+' : ''}${formatTL(tx.amount / 100)} cüzdanınıza yüklendi.`,
              date: new Date(tx.createdAt),
            });
          }
          if (tx.type === 'TOPUP') {
            derived.push({
              id: `tx-${tx.id}`,
              title: 'Bakiye yüklendi',
              body: `Cüzdanınıza ${formatTL(tx.amount / 100)} yüklendi.`,
              date: new Date(tx.createdAt),
            });
          }
        }

        const tier = (user as any)?.customerProfile?.loyaltyTier;
        const tierLabels: Record<string, string> = { silver: 'Gümüş', gold: 'Altın' };
        if (tier && tier !== 'bronze') {
          derived.push({
            id: 'tier-change',
            title: `${tierLabels[tier] || tier} seviyeye ulaştınız`,
            body: 'Bir sonraki alışverişte daha yüksek seviyeye daha yakınsınız.',
            date: new Date(Date.now() - 24 * 60 * 60 * 1000),
          });
        }

        derived.sort((a, b) => b.date.getTime() - a.date.getTime());
        setItems(derived);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, authLoading]);

  const formatRelative = (date: Date) => {
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'az önce';
    if (diffMin < 60) return `${diffMin} dk önce`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} sa önce`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay === 1) return 'Dün';
    return `${diffDay} gün önce`;
  };

  // See index.tsx for why this guard is needed (react-native-screens web tab bleed-through).
  if (!isFocused) return null;

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
      <Text style={[styles.sectionLabel, { color: colors.textMuted, fontFamily: Fonts.uiExtraBold }]}>BİLDİRİMLER</Text>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary, fontFamily: Fonts.displayItalic }]}>Henüz bir bildiriminiz yok.</Text>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {items.map((item) => (
            <View key={item.id} style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <View style={[styles.dot, { backgroundColor: colors.primary }]} />
              <View style={{ flex: 1 }}>
                <View style={styles.cardHeaderRow}>
                  <Text style={[styles.cardTitle, { color: colors.text, fontFamily: Fonts.display }]}>{item.title}</Text>
                  <Text style={[styles.cardTime, { color: colors.textMuted }]}>{formatRelative(item.date)}</Text>
                </View>
                <Text style={[styles.cardBody, { color: colors.textSecondary, fontFamily: Fonts.ui }]}>{item.body}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 110 },
  sectionLabel: { fontSize: 10, letterSpacing: 1.5, marginBottom: 14 },
  card: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, borderRadius: 16, borderWidth: 1, gap: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3, gap: 8 },
  cardTitle: { fontSize: 13, flex: 1 },
  cardTime: { fontSize: 9, flexShrink: 0 },
  cardBody: { fontSize: 11, lineHeight: 16 },
  centerContainer: { paddingVertical: 40, alignItems: 'center' },
  emptyText: { fontSize: 13 },
});
