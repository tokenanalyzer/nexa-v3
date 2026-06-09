export const THEMES = {
  light: {
    bg: '#F8FAFC', surface: '#FFFFFF', card: '#F1F5F9', accent: '#6C47FF',
    text: '#0F172A', muted: '#94A3B8', grad: '#EFF6FF', name: 'LIGHT',
    isDark: false,
  },
  cyber: {
    bg: '#020209', surface: '#0a0a14', card: '#12121e', accent: '#6C47FF',
    text: '#ffffff', muted: '#42425a', grad: '#05051a', name: 'CYBER',
    isDark: true,
  },
  ocean: {
    bg: '#010a14', surface: '#021628', card: '#032440', accent: '#0EA5E9',
    text: '#ffffff', muted: '#1a4565', grad: '#010e1e', name: 'OCEAN',
    isDark: true,
  },
  inferno: {
    bg: '#0a0100', surface: '#160400', card: '#220800', accent: '#F43F5E',
    text: '#ffffff', muted: '#451200', grad: '#0f0200', name: 'INFERNO',
    isDark: true,
  },
  phantom: {
    bg: '#060012', surface: '#0e0025', card: '#180038', accent: '#A855F7',
    text: '#ffffff', muted: '#320070', grad: '#08001a', name: 'PHANTOM',
    isDark: true,
  },
};
export type ThemeKey = keyof typeof THEMES;
export type Theme = typeof THEMES[ThemeKey];
