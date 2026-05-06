export const THEMES = {
  cyber: { bg: '#000000', surface: '#0d0d0d', card: '#111111', accent: '#00FF9D', text: '#ffffff', muted: '#444444', name: 'CYBER' },
  ocean: { bg: '#000810', surface: '#001525', card: '#002040', accent: '#00A3FF', text: '#ffffff', muted: '#1a4060', name: 'OCEAN' },
  inferno: { bg: '#080000', surface: '#150500', card: '#200800', accent: '#FF4500', text: '#ffffff', muted: '#401000', name: 'INFERNO' },
  phantom: { bg: '#05000d', surface: '#0d0020', card: '#160035', accent: '#9D4DFF', text: '#ffffff', muted: '#2d0060', name: 'PHANTOM' },
  arctic: { bg: '#f0f4f8', surface: '#ffffff', card: '#e8edf2', accent: '#0066CC', text: '#000000', muted: '#8899aa', name: 'ARCTIC' },
};
export type ThemeKey = keyof typeof THEMES;
