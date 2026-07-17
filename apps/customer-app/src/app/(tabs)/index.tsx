import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Image, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter, useIsFocused } from 'expo-router';
import { useAuth, resolveImageUrl } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import { Fonts, formatTL } from '../../constants/theme';
import LoyaltyRing from '../../components/LoyaltyRing';
import { AramaIcon } from '../../components/KallaIcons';

const SHOW_BARISTA_NOTE = true;
const SHOW_TIER_BANNER = true;
const NEXT_TIER_THRESHOLD = 500;

export default function MenuScreen() {
  const router = useRouter();
  const { user, apiFetch } = useAuth();
  const { addToCart } = useCart();
  const { colors, glass } = useTheme();

  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await apiFetch('/products/categories');
        setCategories(data);
        if (data.length > 0) {
          setSelectedCategoryId(data[0].id);
        } else {
          setLoading(false);
        }
      } catch (err: any) {
        setError('Kategoriler yüklenemedi. Sunucu bağlantısını kontrol edin.');
        setLoading(false);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    const loadProducts = async () => {
      if (!selectedCategoryId) return;
      setLoading(true);
      try {
        const data = await apiFetch(`/products?categoryId=${selectedCategoryId}`);
        setProducts(data);
      } catch (err: any) {
        setError('Ürünler yüklenemedi.');
      } finally {
        setLoading(false);
      }
    };
    loadProducts();
  }, [selectedCategoryId]);

  // react-native-screens doesn't fully hide inactive bottom-tab scenes on web (they stay
  // stacked, and our scene backgrounds are intentionally transparent so the shared
  // GlassBackground shows through) — without this every tab's content bleeds through
  // simultaneously. Bail out before rendering anything when this tab isn't focused.
  const isFocused = useIsFocused();
  if (!isFocused) return null;

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const loyaltyPoints = (user as any)?.customerProfile?.loyaltyPoints || 0;
  const loyaltyTier = (user as any)?.customerProfile?.loyaltyTier?.toUpperCase() || 'BRONZE';
  const tierLabelMap: Record<string, string> = { BRONZE: 'BRONZ SEVİYE', SILVER: 'GÜMÜŞ SEVİYE', GOLD: 'ALTIN SEVİYE' };
  // Gerçek, sunucuda uygulanan kademe indirim oranları (apps/backend/src/orders/orders.service.ts,
  // TIER_DISCOUNT_RATES ile birebir eşleşmeli) — banner artık gerçek bir indirimi anlatıyor.
  const tierDiscountBodyMap: Record<string, string> = {
    SILVER: 'Tüm siparişlerinizde otomatik %15 indirim uygulanır.',
    GOLD: 'Tüm siparişlerinizde otomatik %30 indirim uygulanır.',
  };
  const showTierBanner = SHOW_TIER_BANNER && loyaltyTier !== 'BRONZE';

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
      {user && SHOW_BARISTA_NOTE && (
        <View style={[styles.noteCard, { backgroundColor: colors.cardBg, borderColor: colors.goldBorder }]}>
          <Text style={[styles.captionLabel, { color: colors.gold, fontFamily: Fonts.uiExtraBold }]}>BUGÜNÜN KAHVESİ</Text>
          <Text style={[styles.noteBody, { color: colors.text, fontFamily: Fonts.displayItalic }]}>
            Barista Bob'dan tavsiye: Tek kökenli Etiyopya çekirdekleriyle hazırlanan Latte, bu hafta öne çıkıyor.
          </Text>
        </View>
      )}

      {user && showTierBanner && (
        <View style={[styles.campaignCard, { borderColor: colors.sageBorder, backgroundColor: `${colors.primary}14` }]}>
          <Text style={[styles.captionLabel, { color: colors.sageText, fontFamily: Fonts.uiExtraBold }]}>{tierLabelMap[loyaltyTier]} İNDİRİMİ</Text>
          <Text style={[styles.campaignBody, { color: colors.text, fontFamily: Fonts.ui }]}>{tierDiscountBodyMap[loyaltyTier]}</Text>
        </View>
      )}

      {user && (
        <View style={[styles.loyaltyCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <View style={styles.loyaltyInfo}>
            <Text style={[styles.userName, { color: colors.text, fontFamily: Fonts.displayItalicSemiBold }]}>Hej, {user.fullName.split(' ')[0]}</Text>
            <Text style={[styles.loyaltyDesc, { color: colors.textSecondary, fontFamily: Fonts.ui }]}>Sadakat Puanınız</Text>
            <View style={[styles.tierBadge, { backgroundColor: colors.goldTint, borderColor: colors.goldBorder }]}>
              <Text style={[styles.tierText, { color: colors.gold, fontFamily: Fonts.uiExtraBold }]}>{tierLabelMap[loyaltyTier]}</Text>
            </View>
          </View>
          <LoyaltyRing points={loyaltyPoints} nextTierThreshold={NEXT_TIER_THRESHOLD} />
        </View>
      )}

      <View style={[styles.searchWrapper, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <AramaIcon size={14} color={colors.textMuted} style={{ marginRight: 9 }} />
        <TextInput
          style={[styles.searchInput, { color: colors.text, fontFamily: Fonts.displayItalic }]}
          placeholder="Kahve veya fırın ürünü ara…"
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
        {categories.map((category) => {
          const isSelected = selectedCategoryId === category.id;
          if (isSelected) {
            return (
              <TouchableOpacity key={category.id} onPress={() => setSelectedCategoryId(category.id)}>
                <View style={[styles.categoryPillActive, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.categoryTextActive, { fontFamily: Fonts.uiBold }]}>{category.name}</Text>
                </View>
              </TouchableOpacity>
            );
          }
          return (
            <TouchableOpacity key={category.id} onPress={() => setSelectedCategoryId(category.id)}>
              <View style={[styles.categoryPill, { backgroundColor: colors.cardBg2, borderColor: colors.border }]}>
                <Text style={[styles.categoryText, { color: colors.textSecondary, fontFamily: Fonts.uiSemiBold }]}>{category.name}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={{ color: colors.error }}>{error}</Text>
        </View>
      ) : filteredProducts.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary, fontFamily: Fonts.displayItalic }]}>Ürün bulunamadı.</Text>
        </View>
      ) : (
        <View style={styles.productList}>
          {filteredProducts.map((item) => (
            <TouchableOpacity key={item.id} onPress={() => router.push(`/product/${item.id}`)}>
              <View style={[styles.productCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <View style={styles.productImageWrap}>
                  <Image source={{ uri: resolveImageUrl(item.imageUrl) }} style={styles.productImage} resizeMode="cover" />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={styles.productTopRow}>
                    <Text style={[styles.productName, { color: colors.text, fontFamily: Fonts.display }]} numberOfLines={1}>{item.name}</Text>
                    <Text style={[styles.productPrice, { color: colors.gold, fontFamily: Fonts.uiExtraBold }]}>{formatTL(item.price)}</Text>
                  </View>
                  <Text style={[styles.productDesc, { color: colors.textSecondary, fontFamily: Fonts.ui }]} numberOfLines={2}>{item.description}</Text>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    addToCart(item, 1, { size: 'Orta', milk: 'Normal', sweetness: 'Normal', syrup: 'Yok', extraShot: 'Yok' }, item.price)
                  }
                >
                  <View style={[styles.quickAddBtn, { backgroundColor: `${colors.primary}33`, borderColor: colors.sageBorder }]}>
                    <Text style={[styles.quickAddText, { color: colors.sageText }]}>+</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 110 },
  noteCard: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 16, padding: 13, marginBottom: 14 },
  captionLabel: { fontSize: 8.5, letterSpacing: 1.5, marginBottom: 4 },
  noteBody: { fontSize: 13 },
  campaignCard: { borderWidth: 1, borderRadius: 16, padding: 13, marginBottom: 16 },
  campaignBody: { fontSize: 11.5, lineHeight: 15 },
  loyaltyCard: { borderWidth: 1, borderRadius: 20, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  loyaltyInfo: { flex: 1 },
  userName: { fontSize: 15, marginBottom: 3 },
  loyaltyDesc: { fontSize: 10, marginBottom: 6 },
  tierBadge: { paddingVertical: 3, paddingHorizontal: 9, borderRadius: 8, borderWidth: 1, alignSelf: 'flex-start' },
  tierText: { fontSize: 8, letterSpacing: 0.5 },
  searchWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 14 },
  searchInput: { flex: 1, fontSize: 13 },
  categoriesScroll: { gap: 8, marginBottom: 16 },
  categoryPillActive: { borderRadius: 999, paddingVertical: 7, paddingHorizontal: 16 },
  categoryPill: { borderRadius: 999, paddingVertical: 7, paddingHorizontal: 16, borderWidth: 1 },
  categoryTextActive: { fontSize: 11, color: '#fdfdfb' },
  categoryText: { fontSize: 11 },
  productList: { gap: 12 },
  productCard: { borderWidth: 1, borderRadius: 18, padding: 12, flexDirection: 'row', gap: 12, alignItems: 'center' },
  productImageWrap: { width: 60, height: 60, borderRadius: 12, overflow: 'hidden', flexShrink: 0 },
  productImage: { width: '100%', height: '100%' },
  productTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3, gap: 8 },
  productName: { fontSize: 14, flexShrink: 1 },
  productPrice: { fontSize: 13, flexShrink: 0 },
  productDesc: { fontSize: 10, lineHeight: 14 },
  quickAddBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  quickAddText: { fontSize: 15, lineHeight: 15 },
  centerContainer: { paddingVertical: 60, alignItems: 'center' },
  emptyText: { fontSize: 13 },
});
