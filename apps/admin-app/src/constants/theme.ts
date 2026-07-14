import '@/global.css';
import { Platform } from 'react-native';

interface ThemePalette {
  primary: string; primaryEnd: string; secondary: string; accent: string;
  background: string; backgroundMid: string; backgroundEnd: string;
  surface: string; backgroundElement: string; backgroundSelected: string;
  text: string; textSecondary: string; textMuted: string; border: string;
  gold: string; goldTint: string; goldBorder: string;
  sageText: string; sageBorder: string;
  error: string; success: string;
  blobSage: string; blobTeal: string; blobGold: string;
  cardBg: string; cardBg2: string; cardBgStrong: string; inputBg: string;
  overlayBar: string; switchTrack: string; ringTrack: string;
}

// Converted from the design handoff's tokens(dark) function (Kalla Staff Demo.dc.html) —
// oklch() has no React Native equivalent, so every value below is a manual hex/rgba
// approximation of the original oklch token, done once here. Identical values to the
// customer-app redesign (same shared design system).
export const Colors: { light: ThemePalette; dark: ThemePalette } = {
  light: {
    primary: '#7FAE94',        // sage gradient start
    primaryEnd: '#4C7C63',     // sage gradient end
    secondary: '#A8C2B7',
    accent: '#4C7C63',
    background: '#F7F4EC',     // page aurora gradient stop 1
    backgroundMid: '#EFEEEA',  // stop 2
    backgroundEnd: '#EDF0EF',  // stop 3
    surface: '#F4F6F3',
    backgroundElement: '#F4F6F3',
    backgroundSelected: '#E2E8E4',
    text: '#232621',           // ink
    textSecondary: 'rgba(35,38,33,0.75)',
    textMuted: 'rgba(35,38,33,0.55)',
    border: 'rgba(20,35,30,0.10)',
    gold: '#8A6A1E',
    goldTint: 'rgba(232,203,132,0.16)',
    goldBorder: 'rgba(232,203,132,0.45)',
    sageText: '#3A6B52',
    sageBorder: 'rgba(127,174,148,0.5)',
    error: '#A23A22',
    success: '#2E6B4B',
    blobSage: 'rgba(191,224,203,0.4)',
    blobTeal: 'rgba(211,231,230,0.35)',
    blobGold: 'rgba(239,223,174,0.3)',
    cardBg: 'rgba(255,255,255,0.5)',
    cardBg2: 'rgba(255,255,255,0.45)',
    cardBgStrong: 'rgba(255,255,255,0.6)',
    inputBg: 'rgba(255,255,255,0.45)',
    overlayBar: 'rgba(255,255,255,0.75)',
    switchTrack: 'rgba(20,35,30,0.16)',
    ringTrack: 'rgba(20,35,30,0.10)',
  },
  dark: {
    primary: '#7AAE94',
    primaryEnd: '#4C7C63',
    secondary: '#A8C2B7',
    accent: '#87A99C',
    background: '#16211D',     // page aurora gradient stop 1
    backgroundMid: '#0F1813',  // stop 2
    backgroundEnd: '#0A0F0E',  // stop 3
    surface: '#0F1813',
    backgroundElement: '#182620',
    backgroundSelected: '#1F312A',
    text: '#FAFBF9',
    textSecondary: 'rgba(250,251,249,0.65)',
    textMuted: 'rgba(250,251,249,0.5)',
    border: 'rgba(255,255,255,0.14)',
    gold: '#E8CB84',
    goldTint: 'rgba(232,203,132,0.16)',
    goldBorder: 'rgba(232,203,132,0.5)',
    sageText: '#C8E0D0',
    sageBorder: 'rgba(127,174,148,0.5)',
    error: '#FFB4AB',
    success: '#81C784',
    blobSage: 'rgba(122,168,142,0.55)',
    blobTeal: 'rgba(140,190,185,0.4)',
    blobGold: 'rgba(200,180,120,0.18)',
    cardBg: 'rgba(255,255,255,0.06)',
    cardBg2: 'rgba(255,255,255,0.05)',
    cardBgStrong: 'rgba(255,255,255,0.09)',
    inputBg: 'rgba(255,255,255,0.05)',
    overlayBar: 'rgba(15,20,20,0.75)',
    switchTrack: 'rgba(255,255,255,0.18)',
    ringTrack: 'rgba(255,255,255,0.12)',
  },
};

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type ThemeMode = 'light' | 'dark';

// Family names registered via useFonts() in app/_layout.tsx (@expo-google-fonts packages).
// expo-font registers under these exact keys on web too (injects @font-face), so the same
// names work across platforms. Each weight is its own font family — do not pair with `fontWeight`.
export const Fonts = {
  displayItalic: 'Newsreader_500Medium_Italic',
  displayItalicSemiBold: 'Newsreader_600SemiBold_Italic',
  // Upright (non-italic) Newsreader — used for stat counts, product names, module titles,
  // customer names per the design handoff (only screen headings & modal titles are italic).
  display: 'Newsreader_600SemiBold',
  ui: 'Manrope_400Regular',
  uiMedium: 'Manrope_500Medium',
  uiSemiBold: 'Manrope_600SemiBold',
  uiBold: 'Manrope_700Bold',
  uiExtraBold: 'Manrope_800ExtraBold',
  mono: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
} as const;

// Matches the design handoff's fmtTL2(): tr-TR locale, always 2 decimals, comma separator.
export function formatTL(amount: number): string {
  return amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' TL';
}

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
