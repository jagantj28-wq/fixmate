/**
 * FixMate Fieldnotes Design System - Color Tokens
 * Premium, editorial-style palette inspired by architectural field notes,
 * modern utility brands, and technical work orders.
 */

export const Palette = {
  forestGreen: '#174D3A',
  deepEvergreen: '#10372C',
  warmIvory: '#F7F5EE',
  paperWhite: '#FFFEFA',
  citrusLime: '#D7F36A',
  charcoal: '#242821',
  mutedGrayGreen: '#747B70',
  subtleBorder: '#E5E5D9',

  // Tints & highlights
  citrusTint: '#F4FBD6',
  forestTint: '#E8F2EC',
  cardAlt: '#F2EFE6',

  // Semantic
  success: '#177A4B',
  successLight: '#E8F6EF',
  warning: '#B7791F',
  warningLight: '#FEF6E7',
  error: '#C53030',
  errorLight: '#FDE8E8',
  info: '#2B6CB0',
  infoLight: '#EBF4FF',
} as const;

export default {
  light: {
    text: Palette.charcoal,
    textSecondary: Palette.mutedGrayGreen,
    background: Palette.warmIvory,
    surface: Palette.paperWhite,
    surfaceMuted: Palette.cardAlt,
    border: Palette.subtleBorder,
    borderFocused: Palette.forestGreen,
    tint: Palette.forestGreen,
    accent: Palette.citrusLime,
    tabIconDefault: Palette.mutedGrayGreen,
    tabIconSelected: Palette.forestGreen,
    tabBackground: Palette.paperWhite,
    tagBackground: Palette.citrusTint,
    badgeBackground: Palette.forestTint,
  },
  dark: {
    text: Palette.paperWhite,
    textSecondary: '#A9B2A4',
    background: '#0B221B',
    surface: Palette.deepEvergreen,
    surfaceMuted: '#144033',
    border: '#1D4D3E',
    borderFocused: Palette.citrusLime,
    tint: Palette.citrusLime,
    accent: Palette.citrusLime,
    tabIconDefault: '#747B70',
    tabIconSelected: Palette.citrusLime,
    tabBackground: '#0B221B',
    tagBackground: '#1D4530',
    badgeBackground: '#163B2F',
  },
};
