import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Fonts } from '../constants/theme';
import GlassView from './GlassView';

export interface ConfirmModalState {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  onConfirm?: () => void;
}

interface ConfirmModalProps {
  state: ConfirmModalState | null;
  onClose: () => void;
}

// Alert.alert()'in native karşılığı — react-native-web'de tamamen no-op olduğu için web'de
// zaten window.confirm/alert kullanılıyordu; native'de ise OS'un varsayısı, markasız gri kutu
// diyaloğu görünüyordu. Bu component, uygulamanın liquid-glass tasarımına uygun tek bir
// onay/bildirim kartı sunar — hem "bilgilendirme" (tek buton) hem "onay" (iki buton) modunu
// destekler: cancelText verilmezse tek buton gösterilir.
export default function ConfirmModal({ state, onClose }: ConfirmModalProps) {
  const { colors } = useTheme();
  if (!state) return null;

  const { title, message, confirmText = 'Tamam', cancelText, destructive, onConfirm } = state;
  const hasCancel = !!cancelText;

  const handleConfirm = () => {
    onClose();
    onConfirm?.();
  };

  return (
    <Modal animationType="fade" transparent visible onRequestClose={onClose}>
      <View style={styles.overlay}>
        <GlassView blurType="heavy" backgroundColor={solidSheetBg(colors)} style={[styles.card, { borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text, fontFamily: Fonts.displayItalicSemiBold }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.textSecondary, fontFamily: Fonts.ui }]}>{message}</Text>
          <View style={styles.buttonRow}>
            {hasCancel && (
              <TouchableOpacity style={{ flex: 1 }} onPress={onClose}>
                <View style={[styles.btn, { backgroundColor: colors.cardBg2, borderColor: colors.border, borderWidth: 1 }]}>
                  <Text style={[styles.btnText, { color: colors.text, fontFamily: Fonts.uiSemiBold }]}>{cancelText}</Text>
                </View>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={{ flex: 1 }} onPress={handleConfirm}>
              <View style={[styles.btn, { backgroundColor: destructive ? colors.error : colors.primary }]}>
                <Text style={[styles.btnText, { color: '#fdfdfb', fontFamily: Fonts.uiBold }]}>{confirmText}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </GlassView>
      </View>
    </Modal>
  );
}

function solidSheetBg(colors: any) {
  return colors.text === '#232621' ? 'rgba(252,252,250,0.94)' : 'rgba(24,32,28,0.94)';
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(10,15,12,0.5)', alignItems: 'center', justifyContent: 'center', padding: 28 },
  card: { width: '100%', maxWidth: 340, borderWidth: 1, borderRadius: 22, padding: 22 },
  title: { fontSize: 16, marginBottom: 8, textAlign: 'center' },
  message: { fontSize: 12.5, lineHeight: 19, textAlign: 'center', marginBottom: 20 },
  buttonRow: { flexDirection: 'row', gap: 10 },
  btn: { height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: 13 },
});
