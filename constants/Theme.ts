/**
 * FixMate Fieldnotes Design System - Tokens & Styles
 */

import { Platform, StyleSheet } from 'react-native';
import Colors, { Palette } from './Colors';

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;

export const Radii = {
  none: 0,
  xs: 3,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
} as const;

export const Borders = {
  hairline: StyleSheet.hairlineWidth,
  thin: 1,
  medium: 1.5,
  thick: 2,
} as const;

export const Typography = {
  fontFamily: {
    serif: Platform.select({
      ios: 'Georgia',
      android: 'serif',
      default: 'Georgia, serif',
    }),
    sans: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    }),
    mono: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
    }),
  },
  fontSize: {
    tiny: 10,
    caption: 12,
    bodySm: 13,
    body: 15,
    subtitle: 17,
    titleSm: 20,
    title: 24,
    headline: 28,
    display: 34,
  },
  lineHeight: {
    tiny: 14,
    caption: 16,
    bodySm: 18,
    body: 22,
    subtitle: 24,
    titleSm: 26,
    title: 30,
    headline: 34,
    display: 40,
  },
} as const;

export const Shadows = {
  subtle: {
    shadowColor: Palette.charcoal,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  ticket: {
    shadowColor: Palette.deepEvergreen,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 2,
  },
} as const;
