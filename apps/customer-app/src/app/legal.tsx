import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { Fonts } from '../constants/theme';
import GlassBackground from '../components/GlassBackground';
import GlassView from '../components/GlassView';
import { LEGAL_SECTIONS } from '../constants/legalTexts';

export default function LegalScreen() {
  const router = useRouter();
  const { colors, glass } = useTheme();
  const [activeKey, setActiveKey] = useState(LEGAL_SECTIONS[0].key);
  const active = LEGAL_SECTIONS.find((s) => s.key === activeKey)!;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <GlassBackground />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <GlassView blurType="regular" style={[styles.backBtn, { borderRadius: glass.radius.pill }]}>
            <Text style={[styles.backBtnText, { color: colors.text, fontFamily: Fonts.uiBold }]}>← Geri</Text>
          </GlassView>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text, fontFamily: Fonts.displayItalicSemiBold }]}>Yasal Bilgiler</Text>
        <View style={{ width: 70 }} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll} contentContainerStyle={styles.tabsRow}>
        {LEGAL_SECTIONS.map((section) => {
          const isActive = section.key === activeKey;
          return (
            <TouchableOpacity key={section.key} onPress={() => setActiveKey(section.key)}>
              <View
                style={[
                  styles.tab,
                  { borderColor: colors.border },
                  isActive && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
              >
                <Text style={[styles.tabText, { color: isActive ? '#fdfdfb' : colors.textSecondary, fontFamily: Fonts.uiSemiBold }]}>
                  {section.title}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        <GlassView blurType="regular" style={[styles.card, { borderRadius: glass.radius.lg }]}>
          <Text style={[styles.title, { color: colors.text, fontFamily: Fonts.displayItalicSemiBold }]}>{active.title}</Text>
          <Text style={[styles.body, { color: colors.textSecondary, fontFamily: Fonts.ui }]}>{active.body}</Text>
        </GlassView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 54, paddingBottom: 12 },
  backBtn: { paddingVertical: 8, paddingHorizontal: 16, borderWidth: 1 },
  backBtnText: { fontSize: 12 },
  headerTitle: { fontSize: 17 },
  tabsScroll: { flexGrow: 0, flexShrink: 0, maxHeight: 50 },
  tabsRow: { paddingHorizontal: 20, gap: 8, paddingBottom: 14, alignItems: 'flex-start' },
  tab: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1 },
  tabText: { fontSize: 11.5 },
  content: { paddingHorizontal: 20, paddingBottom: 60 },
  card: { padding: 20, borderWidth: 1 },
  title: { fontSize: 17, marginBottom: 12 },
  body: { fontSize: 12.5, lineHeight: 20 },
});
