import { Platform } from 'react-native';
import * as ExpoClipboard from 'expo-clipboard';

export const copyToClipboard = async (text: string): Promise<void> => {
  try {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    } else {
      await ExpoClipboard.setStringAsync(text);
    }
  } catch {
    try { await ExpoClipboard.setStringAsync(text); } catch {}
  }
};
