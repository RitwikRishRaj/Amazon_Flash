export const Colors = {
  bgBase: '#0D0D0D',
  bgSurface: '#1A1A1A',
  bgElevated: '#242424',
  bgBorder: '#2A2A2A',
  accentPrimary: '#FF9900',
  accentDim: '#CC7A00',
  textPrimary: '#FFFFFF',
  textMuted: '#8A8A8A',
  textMicro: '#5A5A5A',
  success: '#1DB954',
  danger: '#E53935',

  // Inverse text (on light/accent surfaces)
  textInverse: '#000000',
  textOnLight: '#131313',

  // Pure surfaces
  surfaceLight: '#FFFFFF',
  shadow: '#000000',

  // Translucent overlays / scrims
  scrim: 'rgba(0, 0, 0, 0.5)',
  overlayBase: 'rgba(13, 13, 13, 0.85)',
  tabBarBg: 'rgba(19, 19, 19, 0.95)',

  // Accent alpha variants
  accentAlpha80: 'rgba(255, 153, 0, 0.8)',
  accentAlpha50: 'rgba(255, 153, 0, 0.5)',
  accentAlpha40: 'rgba(255, 153, 0, 0.4)',
  accentAlpha20: 'rgba(255, 153, 0, 0.2)',
  accentDimAlpha25: 'rgba(204, 122, 0, 0.25)',

  // Danger alpha variants
  dangerAlpha20: 'rgba(229, 57, 53, 0.2)',
  dangerAlpha10: 'rgba(229, 57, 53, 0.1)',

  // Success alpha variants
  successAlpha15: 'rgba(29, 185, 84, 0.15)',
} as const;

export type ColorKey = keyof typeof Colors;
