export const VAULT_STORAGE_KEY = 'nexa_vault_items';
export const SWARM_HISTORY_KEY = 'nexa_swarm_history';

export interface VaultItem {
  id: number;
  title: string;
  content: string;
  date: string;
  platform: string;
  scheduledDate?: string;
  scheduledTime?: string;
}

export interface SwarmHistoryItem {
  id: number;
  topic: string;
  platforms: string[];
  viralScore: number;
  timing: Record<string, number>;
  date: string;
  time: string;
  agentCount: number;
}
