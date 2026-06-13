export const Colors = {
  bgBase:        '#0D0D0D',
  bgSurface:     '#1A1A1A',
  bgElevated:    '#242424',
  bgBorder:      '#2A2A2A',
  accentPrimary: '#FF9900',
  accentDim:     '#CC7A00',
  textPrimary:   '#FFFFFF',
  textMuted:     '#8A8A8A',
  textMicro:     '#5A5A5A',
  success:       '#1DB954',
  danger:        '#E53935',
} as const;

export type ColorKey = keyof typeof Colors;
