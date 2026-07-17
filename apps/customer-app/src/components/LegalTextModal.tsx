import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Fonts } from '../constants/theme';
import GlassView from './GlassView';
import { LegalSection } from '../constants/legalTexts';

interface LegalTextModalProps {
  section: LegalSection | null;
  onClose: () => void;
}

export default function LegalTextModal({ section, onClose }: LegalTextModalProps) {
  const { colors } = useTheme();
  if (!section) return null;

  return (
    <Modal animationType="slide" transparent visible onRequestClose={onClose}>
      <View style={[styles.overlay, { backgroundColor: colors.overlayBar }]}>
        <GlassView blurType="heavy" style={[styles.card, { borderColor: colors.border }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text, fontFamily: Fonts.displayItalicSemiBold }]}>{section.title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ fontSize: 18, color: colors.textSecondary }}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
            <Text style={[styles.body, { color: colors.textSecondary, fontFamily: Fonts.ui }]}>{section.body}</Text>
          </ScrollView>
        </GlassView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  card: {
    height: '85%',
    padding: 22,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title: { fontSize: 17, flex: 1, paddingRight: 12 },
  body: { fontSize: 12.5, lineHeight: 20 },
});
