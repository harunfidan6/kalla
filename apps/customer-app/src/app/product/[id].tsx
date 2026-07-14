import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useTheme } from '../../context/ThemeContext';
import { Fonts, formatTL } from '../../constants/theme';
import GlassBackground from '../../components/GlassBackground';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { apiFetch } = useAuth();
  const { addToCart } = useCart();
  const { colors, glass } = useTheme();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const [size, setSize] = useState('Orta');
  const [milk, setMilk] = useState('Normal');
  const [sweetness, setSweetness] = useState('Normal');
  const [syrup, setSyrup] = useState('Yok');
  const [extraShot, setExtraShot] = useState('Yok');
  const [quantity, setQuantity] = useState(1);

  const btnScale = useSharedValue(1);
  const btnAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: btnScale.value }] }));

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const data = await apiFetch(`/products/${id}`);
        setProduct(data);
        // Espresso ve Türk Kahvesi tek ürün altında Tek/Çift seçimiyle satılır — bu
        // ürünlerde "size" alanı boy değil şot/fincan adedini taşır, varsayılan "Tek"tir.
        // Türk Kahvesi'nin şeker seviyesi de kendine özgü ölçekle (Sade varsayılan) çalışır.
        if (data.name === 'Espresso' || data.name === 'Türk Kahvesi') {
          setSize('Tek');
        }
        if (data.name === 'Türk Kahvesi') {
          setSweetness('Sade');
        }
      } catch (err: any) {
        setError('Ürün detayları yüklenemedi.');
      } finally {
        setLoading(false);
      }
    };
    loadProduct();
  }, [id]);

  const isEspresso = product?.name === 'Espresso';
  const isTurkishCoffee = product?.name === 'Türk Kahvesi';

  let priceAdjustment = 0;
  if (isEspresso || isTurkishCoffee) {
    if (size === 'Çift') priceAdjustment += 15;
  } else {
    if (size === 'Küçük') priceAdjustment -= 5;
    else if (size === 'Büyük') priceAdjustment += 10;
    if (milk === 'Yulaf' || milk === 'Badem') priceAdjustment += 10;
    if (extraShot === '1 Shot') priceAdjustment += 15;
    else if (extraShot === '2 Shot') priceAdjustment += 30;
  }

  const unitPrice = product ? product.price + priceAdjustment : 0;
  const totalPrice = unitPrice * quantity;

  const handleAddToCart = () => {
    if (!product || confirming) return;
    addToCart(product, quantity, { size, milk, sweetness, syrup, extraShot }, unitPrice);
    setConfirming(true);
    btnScale.value = withTiming(1.06, { duration: 150 });
    setTimeout(() => {
      router.replace('/');
    }, 800);
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <GlassBackground />
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <GlassBackground />
        <Text style={{ color: colors.error }}>{error || 'Ürün bulunamadı'}</Text>
      </View>
    );
  }

  // Boy/süt/şurup/shot tercihleri sadece içeceklerde anlamlıdır — pastane ve
  // sandviç/tuzlu ürünlerde bu seçenekler gösterilmez.
  const DRINK_CATEGORIES = ['Sıcak Klasikler', 'Soğuk Klasikler', 'Sıcak Karışımlar', 'Soğuk Karışımlar', 'Bitki Çayları'];
  const isCoffee = DRINK_CATEGORIES.includes(product.category?.name);

  // Espresso ve Türk Kahvesi kendi ölçülerine göre çok daha sade bir tercih seti kullanır;
  // boy/süt/şurup/ekstra shot bu iki üründe anlamsızdır (espresso zaten süt/şurup almaz,
  // Türk kahvesi boy yerine tek/duble fincan seçimiyle satılır).
  let optionGroups: any[];
  if (isEspresso) {
    optionGroups = [
      { label: 'ŞOT SEÇİMİ', value: size, setValue: setSize, options: [
        { key: 'Tek', label: 'Tek Shot' }, { key: 'Çift', label: 'Çift Shot (+15 TL)' },
      ] },
    ];
  } else if (isTurkishCoffee) {
    optionGroups = [
      { label: 'FİNCAN SEÇİMİ', value: size, setValue: setSize, options: [
        { key: 'Tek', label: 'Tek Fincan' }, { key: 'Çift', label: 'Duble Fincan (+15 TL)' },
      ] },
      { label: 'ŞEKER SEVİYESİ', value: sweetness, setValue: setSweetness, options: [
        { key: 'Sade', label: 'Sade' }, { key: 'Az Şekerli', label: 'Az Şekerli' },
        { key: 'Orta', label: 'Orta Şekerli' }, { key: 'Şekerli', label: 'Şekerli' },
      ] },
    ];
  } else {
    optionGroups = [
      { label: 'BOY SEÇİMİ', value: size, setValue: setSize, options: [
        { key: 'Küçük', label: 'Küçük (-5 TL)' }, { key: 'Orta', label: 'Orta' }, { key: 'Büyük', label: 'Büyük (+10 TL)' },
      ] },
      { label: 'SÜT SEÇİMİ', value: milk, setValue: setMilk, options: [
        { key: 'Normal', label: 'Normal' }, { key: 'Laktozsuz', label: 'Laktozsuz' },
        { key: 'Yulaf', label: 'Yulaf (+10 TL)' }, { key: 'Badem', label: 'Badem (+10 TL)' },
      ] },
      { label: 'EKSTRA ESPRESSO SHOT', value: extraShot, setValue: setExtraShot, options: [
        { key: 'Yok', label: 'Yok' }, { key: '1 Shot', label: '1 Shot (+15 TL)' }, { key: '2 Shot', label: '2 Shot (+30 TL)' },
      ] },
      { label: 'ŞURUP SEÇİMİ', value: syrup, setValue: setSyrup, options: [
        { key: 'Yok', label: 'Yok' }, { key: 'Karamel', label: 'Karamel' }, { key: 'Vanilya', label: 'Vanilya' }, { key: 'Fındık', label: 'Fındık' },
      ] },
    ];
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <GlassBackground />

      <TouchableOpacity style={styles.backBtnWrapper} onPress={() => router.replace('/')}>
        <View style={[styles.backBtn, { backgroundColor: colors.cardBgStrong, borderColor: colors.border }, webBlur(14)]}>
          <Text style={[styles.backBtnText, { color: colors.text, fontFamily: Fonts.uiBold }]}>← Geri</Text>
        </View>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.imageWrapper}>
          <Image source={{ uri: product.imageUrl }} style={styles.image} resizeMode="cover" />
        </View>

        <View style={[styles.detailsContainer, { backgroundColor: colors.cardBg, borderColor: colors.border }, webBlur(22)]}>
          <View style={styles.productHeader}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={[styles.categoryName, { color: colors.gold, fontFamily: Fonts.uiExtraBold }]}>{product.category?.name.toUpperCase()}</Text>
              <Text style={[styles.productName, { color: colors.text, fontFamily: Fonts.display }]}>{product.name}</Text>
            </View>
            <Text style={[styles.productPrice, { color: colors.gold, fontFamily: Fonts.display }]}>{formatTL(unitPrice)}</Text>
          </View>

          <Text style={[styles.description, { color: colors.textSecondary, fontFamily: Fonts.ui }]}>{product.description}</Text>

          {isCoffee && (
            <View style={[styles.optionsCard, { backgroundColor: colors.cardBg2, borderColor: colors.border }]}>
              <Text style={[styles.optionsTitle, { color: colors.text, fontFamily: Fonts.displayItalicSemiBold }]}>Kahve tercihleri</Text>
              {optionGroups.map((group) => (
                <View key={group.label} style={styles.optionSection}>
                  <Text style={[styles.optionLabel, { color: colors.textMuted, fontFamily: Fonts.uiBold }]}>{group.label}</Text>
                  <View style={styles.optionsRow}>
                    {group.options.map((option) => {
                      const isSelected = group.value === option.key;
                      return (
                        <TouchableOpacity key={option.key} onPress={() => group.setValue(option.key)}>
                          {isSelected ? (
                            <View style={[styles.optionButtonActive, { backgroundColor: colors.primary }]}>
                              <Text style={[styles.optionTextActive, { fontFamily: Fonts.uiBold }]}>{option.label}</Text>
                            </View>
                          ) : (
                            <View style={[styles.optionButton, { borderColor: colors.border, backgroundColor: colors.cardBg2 }]}>
                              <Text style={[styles.optionText, { color: colors.textSecondary, fontFamily: Fonts.uiMedium }]}>{option.label}</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={styles.quantityContainer}>
            <Text style={[styles.quantityLabel, { color: colors.text, fontFamily: Fonts.displayItalicSemiBold }]}>Adet Seçimi</Text>
            <View style={[styles.quantitySelector, { backgroundColor: colors.cardBg2, borderColor: colors.border }]}>
              <TouchableOpacity onPress={() => setQuantity((q) => Math.max(1, q - 1))}>
                <Text style={[styles.qtyButtonText, { color: colors.text }]}>−</Text>
              </TouchableOpacity>
              <Text style={[styles.qtyValue, { color: colors.text, fontFamily: Fonts.uiBold }]}>{quantity}</Text>
              <TouchableOpacity onPress={() => setQuantity((q) => q + 1)}>
                <Text style={[styles.qtyButtonText, { color: colors.text }]}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { backgroundColor: colors.overlayBar, borderColor: colors.border }, webBlur(24)]}>
        <View>
          <Text style={[styles.totalLabel, { color: colors.textMuted, fontFamily: Fonts.uiBold }]}>TOPLAM TUTAR</Text>
          <Text style={[styles.totalPrice, { color: colors.text, fontFamily: Fonts.display }]}>{formatTL(totalPrice)}</Text>
        </View>
        <TouchableOpacity onPress={handleAddToCart} disabled={confirming}>
          <Animated.View style={[styles.addButton, { backgroundColor: colors.primary }, btnAnimatedStyle]}>
            <Text style={[styles.addButtonText, { fontFamily: Fonts.uiBold }]}>{confirming ? 'Eklendi ✓' : 'Sepete Ekle'}</Text>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function webBlur(px: number) {
  return Platform.OS === 'web' ? ({ backdropFilter: `blur(${px}px) saturate(180%)`, WebkitBackdropFilter: `blur(${px}px) saturate(180%)` } as any) : {};
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 16 },
  backBtnWrapper: { position: 'absolute', top: 50, left: 20, zIndex: 10 },
  backBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1 },
  backBtnText: { fontSize: 12 },
  scrollContent: { paddingBottom: 120 },
  imageWrapper: { width: '100%', height: 210 },
  image: { width: '100%', height: '100%' },
  detailsContainer: { padding: 22, flexGrow: 1, marginTop: -22, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderBottomWidth: 0 },
  productHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  categoryName: { fontSize: 9, letterSpacing: 2, marginBottom: 5 },
  productName: { fontSize: 23 },
  productPrice: { fontSize: 20 },
  description: { fontSize: 12, lineHeight: 19, marginBottom: 22 },
  optionsCard: { padding: 16, marginBottom: 22, borderRadius: 20, borderWidth: 1 },
  optionsTitle: { fontSize: 15, marginBottom: 16 },
  optionSection: { marginBottom: 14 },
  optionLabel: { fontSize: 10, letterSpacing: 1, marginBottom: 8 },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  optionButton: { paddingVertical: 6, paddingHorizontal: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderRadius: 999 },
  optionButtonActive: { paddingVertical: 6, paddingHorizontal: 12, justifyContent: 'center', alignItems: 'center', borderRadius: 999 },
  optionText: { fontSize: 10 },
  optionTextActive: { fontSize: 10, color: '#fdfdfb' },
  quantityContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  quantityLabel: { fontSize: 14 },
  quantitySelector: { flexDirection: 'row', alignItems: 'center', gap: 16, borderWidth: 1, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 16 },
  qtyButtonText: { fontSize: 15 },
  qtyValue: { fontSize: 13 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: 1, paddingHorizontal: 22, paddingTop: 16, paddingBottom: 30, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 8.5, letterSpacing: 1.5, marginBottom: 2 },
  totalPrice: { fontSize: 19 },
  addButton: { paddingVertical: 13, paddingHorizontal: 28, borderRadius: 999 },
  addButtonText: { color: '#fdfdfb', fontSize: 14 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
});
