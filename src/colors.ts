// Odim Dashboard Color Palette
export const colors = {
  // Primary
  primary: '#2563EB',
  primaryLight: '#60A5FA',
  primaryDark: '#1D4ED8',

  // Background
  bgMain: '#ECF0FB',
  bgSidebar: '#FFFFFF',
  bgCard: '#FFFFFF',
  bgGradientStart: '#ECF0FB',
  bgGradientEnd: '#ECF0FB',
  bgHover: '#EBF3FF',
  bgActive: '#DBEAFE',
  bgInput: '#F3F6FB',

  // Text
  textPrimary: '#1E293B',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textWhite: '#FFFFFF',
  textSidebar: '#475569',
  textSidebarActive: '#2563EB',
  textBreadcrumb: '#94A3B8',

  // Border
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderInput: '#CBD5E1',

  // Sidebar
  sidebarWidth: '260px',
  sidebarCollapsedWidth: '80px',

  // Menu
  menuLabel: '#94A3B8',
  menuIcon: '#64748B',
  menuIconActive: '#2563EB',

  // Accent
  accentBlue: '#3B82F6',
  accentPurple: '#8B5CF6',
  accentGreen: '#22C55E',
  accentOrange: '#F97316',
  accentRed: '#EF4444',

  // Shadow
  shadowSm: '0 1px 2px rgba(0, 0, 0, 0.05)',
  shadowMd: '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -1px rgba(0, 0, 0, 0.04)',
  shadowLg: '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.03)',
  shadowXl: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.03)',

  // Misc
  avatarBg: '#1E293B',
  badgeBg: '#EF4444',
  divider: '#E2E8F0',
  scrollbarThumb: '#CBD5E1',
  scrollbarTrack: '#F1F5F9',
} as const;

export type ColorKey = keyof typeof colors;
