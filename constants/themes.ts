export const THEMES = {
  cyber: {
    bg: '#020209', surface: '#0a0a14', card: '#12121e', accent: '#00FF9D',
    text: '#ffffff', muted: '#42425a', grad: '#05051a', name: 'CYBER',
  },
  ocean: {
    bg: '#010a14', surface: '#021628', card: '#032440', accent: '#00A3FF',
    text: '#ffffff', muted: '#1a4565', grad: '#010e1e', name: 'OCEAN',
  },
  inferno: {
    bg: '#0a0100', surface: '#160400', card: '#220800', accent: '#FF4500',
    text: '#ffffff', muted: '#451200', grad: '#0f0200', name: 'INFERNO',
  },
  phantom: {
    bg: '#060012', surface: '#0e0025', card: '#180038', accent: '#9D4DFF',
    text: '#ffffff', muted: '#320070', grad: '#08001a', name: 'PHANTOM',
  },
  arctic: {
    bg: '#f0f4f8', surface: '#ffffff', card: '#e8edf2', accent: '#0066CC',
    text: '#000000', muted: '#8899aa', grad: '#e4eaf0', name: 'ARCTIC',
  },
};
export type ThemeKey = keyof typeof THEMES;
export type Theme = typeof THEMES[ThemeKey];
