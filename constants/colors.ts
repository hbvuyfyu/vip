// Primary palette
export const COLORS = {
  // Backgrounds
  background: '#0A0A0F',
  surface: '#13131A',
  surfaceHover: '#1A1A24',

  // Gold/Primary
  gold: '#C9A84C',
  goldLight: '#E0C060',
  goldDark: '#A8872A',
  goldDim: 'rgba(201,168,76,0.15)',

  // Silver/Secondary
  silver: '#A8A9AD',
  silverLight: '#D0D0D5',
  silverDark: '#6B6C70',

  // Text
  text: '#F0F0F5',
  textSecondary: '#8E8E9A',
  textMuted: '#4A4A5A',

  // Border
  border: 'rgba(255,255,255,0.07)',
  borderGold: 'rgba(201,168,76,0.3)',

  // Status
  success: '#2ECC71',
  warning: '#F39C12',
  error: '#E74C3C',
  info: '#3498DB',
};

// Legacy alias kept for backward compatibility
export const Colors = {
  bg: COLORS.background,
  bgCard: COLORS.surface,
  bgCardHover: COLORS.surfaceHover,
  bgInput: COLORS.surfaceHover,
  bgModal: '#0F0F18',
  gold: COLORS.gold,
  goldLight: COLORS.goldLight,
  goldDark: COLORS.goldDark,
  goldDim: COLORS.goldDim,
  silver: COLORS.silver,
  silverLight: COLORS.silverLight,
  silverDark: COLORS.silverDark,
  silverDim: 'rgba(168,169,173,0.1)',
  success: COLORS.success,
  successDim: 'rgba(46,204,113,0.15)',
  warning: COLORS.warning,
  warningDim: 'rgba(243,156,18,0.15)',
  error: COLORS.error,
  errorDim: 'rgba(231,76,60,0.15)',
  info: COLORS.info,
  infoDim: 'rgba(52,152,219,0.15)',
  textPrimary: COLORS.text,
  textSecondary: COLORS.textSecondary,
  textMuted: COLORS.textMuted,
  textGold: COLORS.gold,
  border: COLORS.border,
  borderGold: COLORS.borderGold,
  gradientGold: ['#C9A84C', '#A8872A'],
  gradientDark: ['#1A1A24', '#0A0A0F'],
  gradientCard: ['rgba(201,168,76,0.08)', 'rgba(201,168,76,0.02)'],
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: COLORS.warning,
  processing: COLORS.info,
  completed: COLORS.success,
  failed: COLORS.error,
  cancelled: COLORS.silver,
};

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'قيد الانتظار',
  processing: 'جاري التنفيذ',
  completed: 'مكتمل',
  failed: 'فشل',
  cancelled: 'ملغي',
};
