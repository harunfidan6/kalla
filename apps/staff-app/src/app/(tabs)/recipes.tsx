import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Modal, Platform } from 'react-native';
import { useIsFocused } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Fonts } from '../../constants/theme';
import { AramaIcon } from '../../components/KallaIcons';

const DIFFICULTY_COLOR: Record<string, 'sage' | 'gold' | 'error'> = {
  Kolay: 'sage',
  Orta: 'gold',
  Zor: 'error',
};

function parsePrepSeconds(prepTime: string): number {
  const match = prepTime.match(/(\d+(?:[.,]\d+)?)/);
  if (!match) return 60;
  const minutes = parseFloat(match[1].replace(',', '.'));
  return Math.max(5, Math.round(minutes * 60));
}

export default function RecipesScreen() {
  const { user, apiFetch, loading: authLoading } = useAuth();
  const { colors } = useTheme();
  const isFocused = useIsFocused();

  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerIntervalRef = useRef<any>(null);

  useEffect(() => {
    if (authLoading) return;
    const load = async () => {
      try {
        setError(null);
        const data = await apiFetch('/recipes');
        setRecipes(data);
      } catch (err: any) {
        setError('Tarifler yüklenemedi.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, authLoading]);

  const categories = Array.from(new Set(recipes.map((r) => r.category)));

  const filteredRecipes = recipes.filter((r) => {
    const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || r.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const openRecipe = (recipe: any) => {
    clearInterval(timerIntervalRef.current);
    setTimerRunning(false);
    setTimerSeconds(parsePrepSeconds(recipe.prepTime));
    setSelectedRecipe(recipe);
  };

  const closeRecipe = () => {
    clearInterval(timerIntervalRef.current);
    setTimerRunning(false);
    setSelectedRecipe(null);
  };

  const toggleTimer = () => {
    if (timerRunning) {
      clearInterval(timerIntervalRef.current);
      setTimerRunning(false);
      return;
    }
    if (timerSeconds <= 0) return;
    setTimerRunning(true);
    timerIntervalRef.current = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerIntervalRef.current);
          setTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const resetTimer = () => {
    clearInterval(timerIntervalRef.current);
    setTimerRunning(false);
    if (selectedRecipe) setTimerSeconds(parsePrepSeconds(selectedRecipe.prepTime));
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

  const totalTimerSeconds = selectedRecipe ? parsePrepSeconds(selectedRecipe.prepTime) : 1;
  const timerProgress = selectedRecipe ? Math.round(((totalTimerSeconds - timerSeconds) / totalTimerSeconds) * 100) : 0;
  const timerLabel = `${Math.floor(timerSeconds / 60)}:${String(timerSeconds % 60).padStart(2, '0')}`;

  return (
    <>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        {error && (
          <View style={[styles.errorCard, { backgroundColor: `${colors.error}1A`, borderColor: colors.error }]}>
            <Text style={{ color: colors.error, fontFamily: Fonts.uiBold, fontSize: 12 }}>{error}</Text>
          </View>
        )}

        <Text style={[styles.sectionLabel, { color: colors.textMuted, fontFamily: Fonts.uiExtraBold }]}>
          REÇETE REHBERİ ({recipes.length})
        </Text>

        <View style={[styles.searchWrapper, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <AramaIcon size={14} color={colors.textMuted} style={{ marginRight: 9 }} />
          <TextInput
            style={[styles.searchInput, { color: colors.text, fontFamily: Fonts.ui }]}
            placeholder="Ürün ara…"
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
          <TouchableOpacity onPress={() => setSelectedCategory(null)}>
            <View style={selectedCategory === null ? [styles.categoryPillActive, { backgroundColor: colors.primary }] : [styles.categoryPill, { backgroundColor: colors.cardBg2, borderColor: colors.border }]}>
              <Text style={selectedCategory === null ? [styles.categoryTextActive, { fontFamily: Fonts.uiBold }] : [styles.categoryText, { color: colors.textSecondary, fontFamily: Fonts.uiSemiBold }]}>
                Tümü
              </Text>
            </View>
          </TouchableOpacity>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity key={cat} onPress={() => setSelectedCategory(cat)}>
                <View style={isSelected ? [styles.categoryPillActive, { backgroundColor: colors.primary }] : [styles.categoryPill, { backgroundColor: colors.cardBg2, borderColor: colors.border }]}>
                  <Text style={isSelected ? [styles.categoryTextActive, { fontFamily: Fonts.uiBold }] : [styles.categoryText, { color: colors.textSecondary, fontFamily: Fonts.uiSemiBold }]}>
                    {cat}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {filteredRecipes.length === 0 ? (
          <View style={styles.centerContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary, fontFamily: Fonts.displayItalic }]}>Tarif bulunamadı.</Text>
          </View>
        ) : (
          <View style={{ gap: 10 }}>
            {filteredRecipes.map((recipe) => {
              const diffKind = DIFFICULTY_COLOR[recipe.difficulty] || 'sage';
              const diffColor = diffKind === 'sage' ? colors.sageText : diffKind === 'gold' ? colors.gold : colors.error;
              const diffBorder = diffKind === 'sage' ? colors.sageBorder : diffKind === 'gold' ? colors.goldBorder : colors.error;
              return (
                <TouchableOpacity key={recipe.id} onPress={() => openRecipe(recipe)}>
                  <View style={[styles.recipeCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.recipeName, { color: colors.text, fontFamily: Fonts.display }]} numberOfLines={1}>{recipe.name}</Text>
                      <Text style={[styles.recipeCategory, { color: colors.textMuted, fontFamily: Fonts.ui }]}>{recipe.category} · {recipe.prepTime}</Text>
                    </View>
                    <View style={[styles.diffBadge, { borderColor: diffBorder }]}>
                      <Text style={[styles.diffBadgeText, { color: diffColor, fontFamily: Fonts.uiBold }]}>{recipe.difficulty}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {selectedRecipe && (
        <Modal animationType="fade" transparent visible onRequestClose={closeRecipe}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalSheet, { borderColor: colors.border, backgroundColor: solidSheetBg(colors) }, webBlur()]}>
              <ScrollView contentContainerStyle={{ paddingBottom: 10 }}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text, fontFamily: Fonts.displayItalicSemiBold }]}>{selectedRecipe.name}</Text>
                  <TouchableOpacity onPress={closeRecipe}>
                    <Text style={[styles.modalClose, { color: colors.textSecondary }]}>✕</Text>
                  </TouchableOpacity>
                </View>

                {!!selectedRecipe.temp && (
                  <Text style={[styles.recipeMeta, { color: colors.textMuted, fontFamily: Fonts.mono }]}>
                    {selectedRecipe.difficulty} · {selectedRecipe.prepTime} · {selectedRecipe.temp}
                  </Text>
                )}

                {/* Hazırlık zamanlayıcısı */}
                <View style={[styles.timerBox, { backgroundColor: colors.cardBg2, borderColor: colors.border }]}>
                  <Text style={[styles.timerLabel, { color: colors.text, fontFamily: Fonts.mono }]}>{timerLabel}</Text>
                  <TouchableOpacity onPress={toggleTimer}>
                    <LinearGradient colors={[colors.primary, colors.primaryEnd]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.timerPlayBtn}>
                      <Text style={{ color: '#fdfdfb', fontSize: 16 }}>{timerRunning ? '❚❚' : '▶'}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={resetTimer}>
                    <Text style={[styles.timerReset, { color: colors.sageText, fontFamily: Fonts.uiBold }]}>Sıfırla</Text>
                  </TouchableOpacity>
                  <View style={[styles.seekBarTrack, { backgroundColor: colors.border }]}>
                    <LinearGradient
                      colors={[colors.primary, colors.primaryEnd]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.seekBarFill, { width: `${timerProgress}%` }]}
                    />
                  </View>
                </View>

                <Text style={[styles.blockLabel, { color: colors.textMuted, fontFamily: Fonts.uiExtraBold }]}>MALZEMELER</Text>
                <View style={{ gap: 6, marginBottom: 16 }}>
                  {selectedRecipe.ingredients.map((ing: any, i: number) => (
                    <View key={i} style={styles.ingredientRow}>
                      <Text style={[styles.ingredientName, { color: colors.text, fontFamily: Fonts.uiSemiBold }]}>{ing.name}</Text>
                      <Text style={[styles.ingredientAmount, { color: colors.textMuted, fontFamily: Fonts.mono }]}>{ing.amount} {ing.unit}</Text>
                    </View>
                  ))}
                </View>

                <Text style={[styles.blockLabel, { color: colors.textMuted, fontFamily: Fonts.uiExtraBold }]}>HAZIRLIK ADIMLARI</Text>
                <View style={{ gap: 8, marginBottom: 16 }}>
                  {selectedRecipe.steps.map((step: string, i: number) => (
                    <View key={i} style={styles.stepRow}>
                      <Text style={[styles.stepIndex, { color: colors.sageText, fontFamily: Fonts.uiExtraBold }]}>{i + 1}.</Text>
                      <Text style={[styles.stepText, { color: colors.textSecondary, fontFamily: Fonts.ui }]}>{step}</Text>
                    </View>
                  ))}
                </View>

                {!!selectedRecipe.proTip && (
                  <View style={[styles.tipBox, { borderColor: colors.goldBorder }]}>
                    <Text style={[styles.tipTitle, { color: colors.gold, fontFamily: Fonts.uiExtraBold }]}>BARİSTA İPUCU</Text>
                    <Text style={[styles.tipText, { color: colors.text, fontFamily: Fonts.ui }]}>{selectedRecipe.proTip}</Text>
                  </View>
                )}

                {selectedRecipe.allergens?.length > 0 && (
                  <View style={styles.tagsRow}>
                    {selectedRecipe.allergens.map((a: string) => (
                      <View key={a} style={[styles.tag, { backgroundColor: `${colors.error}14`, borderColor: colors.error }]}>
                        <Text style={[styles.tagText, { color: colors.error, fontFamily: Fonts.uiBold }]}>{a}</Text>
                      </View>
                    ))}
                    {selectedRecipe.tags.map((t: string) => (
                      <View key={t} style={[styles.tag, { backgroundColor: colors.cardBg2, borderColor: colors.border }]}>
                        <Text style={[styles.tagText, { color: colors.textSecondary, fontFamily: Fonts.uiBold }]}>{t}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

function webBlur() {
  return Platform.select({
    web: {
      // @ts-ignore web-only
      backdropFilter: 'blur(26px) saturate(180%)',
      WebkitBackdropFilter: 'blur(26px) saturate(180%)',
    } as any,
    default: {},
  });
}

function solidSheetBg(colors: any) {
  return colors.text === '#232621' ? 'rgba(252,252,250,0.92)' : 'rgba(24,32,28,0.92)';
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 110 },
  centerFill: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  centerContainer: { paddingVertical: 60, alignItems: 'center' },
  emptyText: { fontSize: 13 },
  errorCard: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 14 },
  sectionLabel: { fontSize: 10, letterSpacing: 1.5, marginBottom: 12 },
  searchWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 13 },
  categoriesScroll: { gap: 8, marginBottom: 16 },
  categoryPillActive: { borderRadius: 999, paddingVertical: 7, paddingHorizontal: 16 },
  categoryPill: { borderRadius: 999, paddingVertical: 7, paddingHorizontal: 16, borderWidth: 1 },
  categoryTextActive: { fontSize: 11, color: '#fdfdfb' },
  categoryText: { fontSize: 11 },
  recipeCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 16, padding: 14, gap: 10 },
  recipeName: { fontSize: 14, marginBottom: 3 },
  recipeCategory: { fontSize: 10.5 },
  diffBadge: { borderWidth: 1, borderRadius: 8, paddingVertical: 4, paddingHorizontal: 9, flexShrink: 0 },
  diffBadgeText: { fontSize: 9.5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(10,15,12,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    width: '100%',
    maxHeight: '88%',
    borderTopWidth: 1,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 34,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, gap: 8 },
  modalTitle: { fontSize: 16, flexShrink: 1 },
  modalClose: { fontSize: 16 },
  recipeMeta: { fontSize: 10, marginBottom: 14 },
  timerBox: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 18, alignItems: 'center' },
  timerLabel: { fontSize: 26, marginBottom: 12 },
  timerPlayBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  timerReset: { fontSize: 10.5, marginBottom: 12 },
  seekBarTrack: { width: '100%', height: 4, borderRadius: 2, overflow: 'hidden' },
  seekBarFill: { height: '100%', borderRadius: 2 },
  blockLabel: { fontSize: 9.5, letterSpacing: 1.5, marginBottom: 10 },
  ingredientRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ingredientName: { fontSize: 12, flexShrink: 1 },
  ingredientAmount: { fontSize: 11 },
  stepRow: { flexDirection: 'row', gap: 8 },
  stepIndex: { fontSize: 11.5, width: 18 },
  stepText: { fontSize: 11.5, lineHeight: 18, flex: 1 },
  tipBox: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 14, padding: 14, marginBottom: 14 },
  tipTitle: { fontSize: 10, letterSpacing: 1, marginBottom: 6 },
  tipText: { fontSize: 11.5, lineHeight: 18 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { borderWidth: 1, borderRadius: 999, paddingVertical: 4, paddingHorizontal: 10 },
  tagText: { fontSize: 9 },
});
