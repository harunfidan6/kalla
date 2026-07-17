import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, Platform } from 'react-native';
import { useIsFocused } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Fonts } from '../../constants/theme';
import { GUIDE_CONTENT, GuideSection } from '../../constants/guide';
import ConfirmModal, { ConfirmModalState } from '../../components/ConfirmModal';
import GlassView from '../../components/GlassView';

export default function TrainingScreen() {
  const { user, apiFetch } = useAuth();
  const { colors } = useTheme();
  const isFocused = useIsFocused();

  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedGuideSection, setSelectedGuideSection] = useState<GuideSection | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmModalState | null>(null);

  // Modül detay / video modali
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const videoIntervalRef = useRef<any>(null);

  // Quiz modali
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [quizModalVisible, setQuizModalVisible] = useState(false);
  const [loadingQuiz, setLoadingQuiz] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [submittingQuiz, setSubmittingQuiz] = useState(false);

  // Quiz sonuç modali
  const [quizResult, setQuizResult] = useState<any>(null);
  const [resultModalVisible, setResultModalVisible] = useState(false);

  const loadModules = async () => {
    try {
      setError(null);
      const data = await apiFetch('/training');
      setModules(data);
    } catch (err: any) {
      setError('Eğitim modülleri yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModules();
  }, [user]);

  const handleToggleVideo = () => {
    if (isVideoPlaying) {
      clearInterval(videoIntervalRef.current);
      setIsVideoPlaying(false);
    } else {
      setIsVideoPlaying(true);
      videoIntervalRef.current = setInterval(() => {
        setVideoProgress((prev) => {
          if (prev >= 100) {
            clearInterval(videoIntervalRef.current);
            setIsVideoPlaying(false);
            return 100;
          }
          return prev + 10;
        });
      }, 300);
    }
  };

  const handleCloseDetailModal = () => {
    clearInterval(videoIntervalRef.current);
    setIsVideoPlaying(false);
    setVideoProgress(0);
    setSelectedModule(null);
  };

  const handleStartQuiz = async (moduleId: string) => {
    try {
      setLoadingQuiz(true);
      setQuizQuestions([]);
      setSelectedAnswers({});

      const modDetails = await apiFetch(`/training/${moduleId}`);
      const questionsWithParsedOptions = modDetails.questions.map((q: any) => ({
        ...q,
        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
      }));

      setQuizQuestions(questionsWithParsedOptions);
      setQuizModalVisible(true);
    } catch (err: any) {
      if (Platform.OS === 'web') alert('Quiz soruları yüklenemedi.');
      else setConfirmState({ title: 'Hata', message: 'Quiz soruları yüklenemedi.' });
    } finally {
      setLoadingQuiz(false);
    }
  };

  const handleSelectOption = (questionId: string, option: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleSubmitQuiz = async () => {
    const unansweredCount = quizQuestions.filter((q) => !selectedAnswers[q.id]).length;
    if (unansweredCount > 0) {
      if (Platform.OS === 'web') alert('Lütfen tüm soruları cevaplayın.');
      else setConfirmState({ title: 'Hata', message: 'Lütfen tüm soruları cevaplayın.' });
      return;
    }

    try {
      setSubmittingQuiz(true);
      const answersPayload = Object.keys(selectedAnswers).map((qId) => ({
        questionId: qId,
        selectedOption: selectedAnswers[qId],
      }));

      const res = await apiFetch(`/training/${selectedModule.id}/submit`, {
        method: 'POST',
        body: JSON.stringify({ answers: answersPayload }),
      });

      setQuizResult(res);
      setQuizModalVisible(false);
      setResultModalVisible(true);
      loadModules();
    } catch (err: any) {
      if (Platform.OS === 'web') alert('Quiz gönderilemedi: ' + err.message);
      else setConfirmState({ title: 'Hata', message: 'Quiz gönderilemedi: ' + err.message });
    } finally {
      setSubmittingQuiz(false);
    }
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

  const completedCount = modules.filter((m) => m.progress?.status === 'completed').length;

  return (
    <>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
        {error && (
          <View style={[styles.errorCard, { backgroundColor: `${colors.error}1A`, borderColor: colors.error }]}>
            <Text style={{ color: colors.error, fontFamily: Fonts.uiBold, fontSize: 12 }}>{error}</Text>
          </View>
        )}

        {/* Barista Eğitim Pasaportu */}
        <View style={[styles.passportCard, { backgroundColor: colors.cardBgStrong, borderColor: colors.border }]}>
          <View style={[styles.passportHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.passportTitle, { color: colors.text, fontFamily: Fonts.uiExtraBold }]}>
              BARİSTA EĞİTİM PASAPORTU
            </Text>
            <Text style={[styles.passportSub, { color: colors.textMuted, fontFamily: Fonts.uiBold }]}>
              KÄLLA ROASTERY AKADEMİSİ
            </Text>
          </View>

          <View style={styles.stampsRow}>
            {modules.map((m, idx) => {
              const isCompleted = m.progress?.status === 'completed';
              return (
                <View key={m.id} style={styles.stampCol}>
                  <View
                    style={[
                      styles.stampCircle,
                      { borderColor: isCompleted ? colors.sageBorder : colors.border },
                      isCompleted && { backgroundColor: `${colors.primary}24` },
                    ]}
                  >
                    <Text
                      style={[
                        isCompleted
                          ? { fontSize: 12, color: colors.sageText }
                          : { fontSize: 16, color: colors.textMuted },
                        { fontFamily: Fonts.uiExtraBold },
                      ]}
                    >
                      {isCompleted ? `E${idx + 1}` : '?'}
                    </Text>
                  </View>
                  <Text style={[styles.stampLabel, { color: colors.textSecondary, fontFamily: Fonts.uiBold }]} numberOfLines={1}>
                    {m.title.length > 14 ? m.title.slice(0, 12) + '…' : m.title}
                  </Text>
                </View>
              );
            })}
          </View>

          <Text style={[styles.passportFooter, { color: colors.textSecondary, fontFamily: Fonts.displayItalic }]}>
            Toplam {modules.length} modülden{' '}
            <Text style={{ color: colors.sageText, fontFamily: Fonts.uiBold }}>{completedCount}</Text> tanesi tamamlandı.
          </Text>
        </View>

        {/* Barista El Kitabı */}
        <Text style={[styles.sectionLabel, { color: colors.textMuted, fontFamily: Fonts.uiExtraBold }]}>BARİSTA EL KİTABI</Text>
        <View style={{ gap: 10, marginBottom: 24 }}>
          {GUIDE_CONTENT.map((section, idx) => (
            <TouchableOpacity key={section.title} onPress={() => setSelectedGuideSection(section)}>
              <View style={[styles.guideRow, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <View style={[styles.guideIndex, { backgroundColor: colors.cardBg2, borderColor: colors.border }]}>
                  <Text style={[styles.guideIndexText, { color: colors.primary, fontFamily: Fonts.uiExtraBold }]}>{idx + 1}</Text>
                </View>
                <Text style={[styles.guideRowTitle, { color: colors.text, fontFamily: Fonts.uiSemiBold }]} numberOfLines={2}>
                  {section.title}
                </Text>
                <Text style={[styles.guideRowChevron, { color: colors.textMuted }]}>›</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Modül listesi */}
        <Text style={[styles.sectionLabel, { color: colors.textMuted, fontFamily: Fonts.uiExtraBold }]}>EĞİTİM MODÜLLERİ</Text>
        <View style={{ gap: 12 }}>
          {modules.map((m) => {
            const isCompleted = m.progress?.status === 'completed';
            return (
              <TouchableOpacity
                key={m.id}
                onPress={() => {
                  setSelectedModule(m);
                  setVideoProgress(isCompleted ? 100 : 0);
                }}
              >
                <View style={[styles.moduleCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                  <View style={styles.moduleHeader}>
                    <Text style={[styles.moduleTitle, { color: colors.text, fontFamily: Fonts.display }]}>{m.title}</Text>
                    {isCompleted ? (
                      <LinearGradient
                        colors={[colors.primary, colors.primaryEnd]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.moduleBadge}
                      >
                        <Text style={[styles.moduleBadgeTextDone, { fontFamily: Fonts.uiExtraBold }]}>TAMAMLANDI</Text>
                      </LinearGradient>
                    ) : (
                      <View style={[styles.moduleBadge, { backgroundColor: colors.cardBg2 }]}>
                        <Text style={[styles.moduleBadgeText, { color: colors.textMuted, fontFamily: Fonts.uiExtraBold }]}>
                          BAŞLAMADI
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.moduleDesc, { color: colors.textSecondary, fontFamily: Fonts.ui }]} numberOfLines={2}>
                    {m.description}
                  </Text>
                  <Text style={[styles.moduleLink, { color: colors.sageText, fontFamily: Fonts.uiBold }]}>Modülü İncele →</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Modül detay bottom sheet */}
      {selectedModule && (
        <Modal animationType="fade" transparent visible onRequestClose={handleCloseDetailModal}>
          <View style={styles.modalOverlay}>
            <GlassView backgroundColor={solidSheetBg(colors)} blurAmount={26} style={[styles.modalSheet, { borderColor: colors.border }]}>
              <ScrollView contentContainerStyle={{ paddingBottom: 10 }}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text, fontFamily: Fonts.displayItalicSemiBold }]}>
                    {selectedModule.title}
                  </Text>
                  <TouchableOpacity onPress={handleCloseDetailModal}>
                    <Text style={[styles.modalClose, { color: colors.textSecondary }]}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Video simülasyonu */}
                <View style={[styles.videoBox, { backgroundColor: colors.cardBg2, borderColor: colors.border }]}>
                  <Text style={[styles.videoStatus, { color: colors.text, fontFamily: Fonts.uiBold }]}>
                    {videoProgress >= 100
                      ? 'Eğitim Videosu İzlendi'
                      : isVideoPlaying
                      ? `Oynatılıyor (%${videoProgress})`
                      : 'Duraklatıldı'}
                  </Text>
                  <TouchableOpacity onPress={handleToggleVideo}>
                    <LinearGradient
                      colors={[colors.primary, colors.primaryEnd]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.videoPlayBtn}
                    >
                      <Text style={{ color: '#fdfdfb', fontSize: 16 }}>{isVideoPlaying ? '❚❚' : '▶'}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  <View style={[styles.seekBarTrack, { backgroundColor: colors.border }]}>
                    <LinearGradient
                      colors={[colors.primary, colors.primaryEnd]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.seekBarFill, { width: `${videoProgress}%` }]}
                    />
                  </View>
                </View>

                <Text style={[styles.moduleDetailDesc, { color: colors.textSecondary, fontFamily: Fonts.ui }]}>
                  {selectedModule.description}
                </Text>

                {/* Sertifika */}
                {selectedModule.progress?.status === 'completed' && (
                  <View style={[styles.certBox, { borderColor: colors.goldBorder }]}>
                    <Text style={[styles.certTitle, { color: colors.gold, fontFamily: Fonts.uiExtraBold }]}>
                      BAŞARI SERTİFİKASI
                    </Text>
                    <Text style={[styles.certText, { color: colors.text, fontFamily: Fonts.ui }]}>
                      {user?.fullName}, "{selectedModule.title}" modülünü başarıyla tamamladı.
                    </Text>
                    {selectedModule.progress?.certificateUrl && (
                      <Text style={[styles.certCode, { color: colors.textMuted, fontFamily: Fonts.mono }]}>
                        Kod: {selectedModule.progress.certificateUrl}
                      </Text>
                    )}
                  </View>
                )}

                <TouchableOpacity
                  onPress={() => {
                    handleStartQuiz(selectedModule.id);
                  }}
                  disabled={loadingQuiz}
                >
                  <LinearGradient
                    colors={[colors.primary, colors.primaryEnd]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.actionBtn}
                  >
                    {loadingQuiz ? (
                      <ActivityIndicator size="small" color="#fdfdfb" />
                    ) : (
                      <Text style={[styles.actionBtnText, { fontFamily: Fonts.uiBold }]}>
                        {selectedModule.progress?.status === 'completed' ? 'Quizi Tekrarla' : 'Değerlendirme Quizini Başlat'}
                      </Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
            </GlassView>
          </View>
        </Modal>
      )}

      {/* Quiz bottom sheet */}
      <Modal animationType="fade" transparent visible={quizModalVisible} onRequestClose={() => setQuizModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <GlassView backgroundColor={solidSheetBg(colors)} blurAmount={26} style={[styles.modalSheet, { borderColor: colors.border }]}>
            <ScrollView contentContainerStyle={{ paddingBottom: 10 }}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text, fontFamily: Fonts.displayItalicSemiBold }]}>
                  Değerlendirme Soruları
                </Text>
                <TouchableOpacity onPress={() => setQuizModalVisible(false)}>
                  <Text style={[styles.modalClose, { color: colors.textSecondary }]}>✕</Text>
                </TouchableOpacity>
              </View>

              {quizQuestions.map((q) => (
                <View key={q.id} style={{ marginBottom: 18 }}>
                  <Text style={[styles.questionText, { color: colors.text, fontFamily: Fonts.uiBold }]}>{q.questionText}</Text>
                  <View style={{ gap: 7 }}>
                    {q.options.map((opt: string) => {
                      const isSelected = selectedAnswers[q.id] === opt;
                      if (isSelected) {
                        return (
                          <TouchableOpacity key={opt} onPress={() => handleSelectOption(q.id, opt)}>
                            <LinearGradient
                              colors={[colors.primary, colors.primaryEnd]}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                              style={styles.option}
                            >
                              <Text style={[styles.optionTextSelected, { fontFamily: Fonts.uiBold }]}>{opt}</Text>
                            </LinearGradient>
                          </TouchableOpacity>
                        );
                      }
                      return (
                        <TouchableOpacity key={opt} onPress={() => handleSelectOption(q.id, opt)}>
                          <View style={[styles.option, { backgroundColor: colors.cardBg2, borderColor: colors.border, borderWidth: 1 }]}>
                            <Text style={[styles.optionText, { color: colors.text, fontFamily: Fonts.uiSemiBold }]}>{opt}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}

              <TouchableOpacity onPress={handleSubmitQuiz} disabled={submittingQuiz}>
                <LinearGradient
                  colors={[colors.primary, colors.primaryEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionBtn}
                >
                  {submittingQuiz ? (
                    <ActivityIndicator size="small" color="#fdfdfb" />
                  ) : (
                    <Text style={[styles.actionBtnText, { fontFamily: Fonts.uiBold }]}>Cevapları Gönder</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </GlassView>
        </View>
      </Modal>

      {/* Quiz sonuç modali */}
      {quizResult && (
        <Modal animationType="fade" transparent visible={resultModalVisible} onRequestClose={() => setResultModalVisible(false)}>
          <View style={styles.resultOverlay}>
            <GlassView backgroundColor={solidSheetBg(colors)} blurAmount={26} style={[styles.resultCard, { borderColor: colors.border }]}>
              <Text style={[styles.resultTitle, { color: colors.text, fontFamily: Fonts.displayItalicSemiBold }]}>Quiz Sonucu</Text>
              <Text style={[styles.resultLine, { color: colors.textSecondary, fontFamily: Fonts.ui }]}>
                Doğru:{' '}
                <Text style={{ color: colors.text, fontFamily: Fonts.uiBold }}>
                  {quizResult.correctCount} / {quizResult.totalQuestions}
                </Text>
              </Text>
              <Text style={[styles.resultLine, { color: colors.textSecondary, fontFamily: Fonts.ui, marginBottom: 16 }]}>
                Başarı Oranı: <Text style={{ color: colors.text, fontFamily: Fonts.uiBold }}>%{Math.round(quizResult.score)}</Text>
              </Text>

              <View
                style={[
                  styles.resultBanner,
                  quizResult.passed
                    ? { backgroundColor: `${colors.primary}24`, borderColor: colors.sageBorder }
                    : { backgroundColor: `${colors.error}1A`, borderColor: colors.error },
                ]}
              >
                <Text style={[styles.resultBannerText, { color: colors.text, fontFamily: Fonts.ui }]}>
                  {quizResult.passed
                    ? 'Tebrikler! Quizi başarıyla geçtiniz — sertifikanız pasaportunuza eklendi.'
                    : 'Geçmek için en az %80 başarı gerekiyor. Modülü tekrar inceleyip yeniden deneyebilirsiniz.'}
                </Text>
              </View>

              <TouchableOpacity onPress={() => setResultModalVisible(false)}>
                <LinearGradient
                  colors={[colors.primary, colors.primaryEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.actionBtn, { marginTop: 18, height: 44 }]}
                >
                  <Text style={[styles.actionBtnText, { fontFamily: Fonts.uiBold, fontSize: 12.5 }]}>Kapat</Text>
                </LinearGradient>
              </TouchableOpacity>
            </GlassView>
          </View>
        </Modal>
      )}

      {/* Barista El Kitabı bölüm detay sheet */}
      {selectedGuideSection && (
        <Modal animationType="fade" transparent visible onRequestClose={() => setSelectedGuideSection(null)}>
          <View style={styles.modalOverlay}>
            <GlassView backgroundColor={solidSheetBg(colors)} blurAmount={26} style={[styles.modalSheet, { borderColor: colors.border }]}>
              <ScrollView contentContainerStyle={{ paddingBottom: 10 }}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: colors.text, fontFamily: Fonts.displayItalicSemiBold }]}>
                    {selectedGuideSection.title}
                  </Text>
                  <TouchableOpacity onPress={() => setSelectedGuideSection(null)}>
                    <Text style={[styles.modalClose, { color: colors.textSecondary }]}>✕</Text>
                  </TouchableOpacity>
                </View>

                {selectedGuideSection.blocks.map((block, i) => {
                  if (block.type === 'heading') {
                    return (
                      <Text key={i} style={[styles.guideHeading, { color: colors.text, fontFamily: Fonts.uiExtraBold }]}>
                        {block.text}
                      </Text>
                    );
                  }
                  if (block.type === 'paragraph') {
                    return (
                      <Text key={i} style={[styles.guideParagraph, { color: colors.textSecondary, fontFamily: Fonts.ui }]}>
                        {block.text}
                      </Text>
                    );
                  }
                  if (block.type === 'callout') {
                    return (
                      <View key={i} style={[styles.guideCallout, { backgroundColor: `${colors.error}14`, borderColor: colors.error }]}>
                        <Text style={[styles.guideCalloutText, { color: colors.text, fontFamily: Fonts.ui }]}>{block.text}</Text>
                      </View>
                    );
                  }
                  return (
                    <View key={i} style={{ marginBottom: 12, gap: 6 }}>
                      {block.items.map((item, j) => (
                        <View key={j} style={styles.guideListRow}>
                          <Text style={[styles.guideListBullet, { color: colors.sageText, fontFamily: Fonts.uiExtraBold }]}>
                            {block.ordered ? `${j + 1}.` : '•'}
                          </Text>
                          <Text style={[styles.guideListText, { color: colors.textSecondary, fontFamily: Fonts.ui }]}>{item}</Text>
                        </View>
                      ))}
                    </View>
                  );
                })}
              </ScrollView>
            </GlassView>
          </View>
        </Modal>
      )}

      <ConfirmModal state={confirmState} onClose={() => setConfirmState(null)} />
    </>
  );
}

function solidSheetBg(colors: any) {
  return colors.text === '#232621' ? 'rgba(252,252,250,0.92)' : 'rgba(24,32,28,0.92)';
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 110 },
  centerFill: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorCard: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 14 },
  passportCard: { borderWidth: 1, borderRadius: 22, padding: 18, marginBottom: 20 },
  passportHeader: { alignItems: 'center', borderBottomWidth: 1, paddingBottom: 12, marginBottom: 16 },
  passportTitle: { fontSize: 11, letterSpacing: 1.5 },
  passportSub: { fontSize: 7.5, letterSpacing: 2, marginTop: 2 },
  stampsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 14 },
  stampCol: { alignItems: 'center', gap: 6 },
  stampCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampLabel: { fontSize: 8, maxWidth: 52, textAlign: 'center' },
  passportFooter: { fontSize: 10.5, textAlign: 'center' },
  sectionLabel: { fontSize: 10, letterSpacing: 1.5, marginBottom: 12 },
  guideRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 14, padding: 12, gap: 10 },
  guideIndex: { width: 26, height: 26, borderRadius: 13, borderWidth: 1, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  guideIndexText: { fontSize: 10.5 },
  guideRowTitle: { fontSize: 12, flex: 1, lineHeight: 16 },
  guideRowChevron: { fontSize: 16 },
  guideHeading: { fontSize: 13, marginTop: 14, marginBottom: 6 },
  guideParagraph: { fontSize: 11.5, lineHeight: 18, marginBottom: 10 },
  guideCallout: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 10 },
  guideCalloutText: { fontSize: 11.5, lineHeight: 18 },
  guideListRow: { flexDirection: 'row', gap: 8 },
  guideListBullet: { fontSize: 11.5, width: 16 },
  guideListText: { fontSize: 11.5, lineHeight: 18, flex: 1 },
  moduleCard: { borderWidth: 1, borderRadius: 18, padding: 14 },
  moduleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, gap: 8 },
  moduleTitle: { fontSize: 13.5, flexShrink: 1 },
  moduleBadge: { borderRadius: 6, paddingVertical: 3, paddingHorizontal: 8 },
  moduleBadgeText: { fontSize: 8, letterSpacing: 0.5 },
  moduleBadgeTextDone: { fontSize: 8, letterSpacing: 0.5, color: '#fdfdfb' },
  moduleDesc: { fontSize: 11, lineHeight: 16, marginBottom: 8 },
  moduleLink: { fontSize: 10.5 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(10,15,12,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    width: '100%',
    maxHeight: '85%',
    borderTopWidth: 1,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 30,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 8 },
  modalTitle: { fontSize: 15, flexShrink: 1 },
  modalClose: { fontSize: 16 },
  videoBox: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 16, alignItems: 'center' },
  videoStatus: { fontSize: 11, marginBottom: 14 },
  videoPlayBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  seekBarTrack: { width: '100%', height: 4, borderRadius: 2, overflow: 'hidden' },
  seekBarFill: { height: '100%', borderRadius: 2 },
  moduleDetailDesc: { fontSize: 11, lineHeight: 18, marginBottom: 18 },
  certBox: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 18 },
  certTitle: { fontSize: 11, letterSpacing: 1.5, marginBottom: 4 },
  certText: { fontSize: 11.5, lineHeight: 18, textAlign: 'center' },
  certCode: { fontSize: 9, marginTop: 8 },
  actionBtn: { height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  actionBtnText: { color: '#fdfdfb', fontSize: 13 },
  questionText: { fontSize: 12, marginBottom: 10 },
  option: { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12 },
  optionText: { fontSize: 11.5 },
  optionTextSelected: { fontSize: 11.5, color: '#fdfdfb' },
  resultOverlay: {
    flex: 1,
    backgroundColor: 'rgba(10,15,12,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  resultCard: { width: '100%', maxWidth: 320, borderWidth: 1, borderRadius: 22, padding: 26, alignItems: 'stretch' },
  resultTitle: { fontSize: 17, textAlign: 'center', marginBottom: 10 },
  resultLine: { fontSize: 13, textAlign: 'center', marginBottom: 4 },
  resultBanner: { borderWidth: 1, borderRadius: 10, padding: 12 },
  resultBannerText: { fontSize: 11, lineHeight: 18, textAlign: 'center' },
});
