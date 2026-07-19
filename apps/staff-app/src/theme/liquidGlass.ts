import { Colors, ThemeMode } from '../constants/theme';

// Static, theme-independent measurements (blur intensity, radii, shadow shape).
export const glassMetrics = {
  blur: {
    subtle: 12,
    regular: 20,
    heavy: 32,
  },
  radius: {
    sm: 12,
    md: 18,
    lg: 24,
    xl: 32,
    pill: 999,
  },
  shadow: {
    offsetY: 8,
    blurRadius: 24,
    color: 'rgba(0,0,0,0.28)',
  },
} as const;

// Theme-aware surface/border/text tokens. Light mode uses a near-black warm border
// (per the redesign spec); dark mode keeps the original white-border glass look.
export function getGlassTokens(mode: ThemeMode) {
  const colors = Colors[mode];
  const isDark = mode === 'dark';

  return {
    ...glassMetrics,
    border: {
      width: 1,
      color: colors.border,
      colorActive: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(20,35,30,0.22)',
    },
    shadow: {
      ...glassMetrics.shadow,
      innerHighlight: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.55)',
    },
    gradient: {
      glassLight: isDark
        ? ['rgba(255,255,255,0.16)', 'rgba(255,255,255,0.04)']
        : ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.32)'],
      glassOnDark: ['rgba(255,255,255,0.16)', 'rgba(255,255,255,0.04)'],
      tintBrand: isDark
        ? ['rgba(122,174,148,0.28)', 'rgba(122,174,148,0.08)']
        : ['rgba(127,174,148,0.28)', 'rgba(127,174,148,0.10)'],
    },
    text: {
      onGlassPrimary: colors.text,
      onGlassSecondary: colors.textSecondary,
      onGlassMuted: colors.textMuted,
    },
  };
}

// Backwards-compatible default export (dark, matching the pre-redesign values) for any
// call site not yet migrated to `getGlassTokens(mode)`.
export const glassTokens = getGlassTokens('dark');
