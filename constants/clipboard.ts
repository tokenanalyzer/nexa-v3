import { Platform, Alert } from 'react-native';

export const copyToClipboard = async (text: string): Promise<void> => {
  try {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    } else {
      Alert.alert('Copy', text.slice(0, 200) + (text.length > 200 ? '…' : ''), [{ text: 'OK' }]);
    }
  } catch {
    Alert.alert('Copy Failed', 'Could not copy to clipboard.');
  }
};
