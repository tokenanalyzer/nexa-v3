export const VAULT_STORAGE_KEY = 'nexa_vault_items';

export interface VaultItem {
  id: number;
  title: string;
  content: string;
  date: string;
  platform: string;
  scheduledDate?: string;
  scheduledTime?: string;
}
