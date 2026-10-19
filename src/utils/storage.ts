import { PracticeMode } from '../data/types';

export interface UserProgressRecord {
  unitId: number;
  sentenceId: string;
  mode: PracticeMode;
  score: number;
  completedAt: string;
}

export interface UserSettings {
  playbackRate: number;
  voiceName?: string;
  autoPlayAudio?: boolean;
  useAiScoring?: boolean;
  theme?: 'light' | 'dark' | 'system';
  currentUnitId?: number;
  currentSentenceIndex?: number;
  lastActiveMode?: PracticeMode;
}

const STORAGE_KEYS = {
  PROGRESS: 'reflex_progress_v1',
  BOOKMARKS: 'reflex_bookmarks_v1',
  SETTINGS: 'reflex_settings_v1',
  ACTIVE_STATE: 'reflex_active_state_v1',
  API_KEY: 'reflex_gemini_api_key_v1',
};

export function loadProgress(): Record<string, UserProgressRecord> {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PROGRESS);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getUserProgress(): UserProgressRecord[] {
  const map = loadProgress();
  return Object.values(map);
}

export function saveProgressRecord(record: UserProgressRecord) {
  try {
    const current = loadProgress();
    const key = `${record.mode}_${record.sentenceId}`;
    if (!current[key] || current[key].score < record.score) {
      current[key] = record;
      localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(current));
    }
  } catch (e) {
    console.error('Failed to save progress to localStorage', e);
  }
}

export function recordSentenceProgress(
  sentenceId: string,
  unitId: number,
  mode: PracticeMode,
  score: number
) {
  saveProgressRecord({
    sentenceId,
    unitId,
    mode,
    score,
    completedAt: new Date().toISOString(),
  });
}

export function loadBookmarks(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function getBookmarks(): string[] {
  return loadBookmarks();
}

export function toggleBookmark(sentenceId: string): string[] {
  try {
    const list = loadBookmarks();
    const idx = list.indexOf(sentenceId);
    if (idx >= 0) {
      list.splice(idx, 1);
    } else {
      list.push(sentenceId);
    }
    localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(list));
    return list;
  } catch {
    return [];
  }
}

export function loadSettings(): UserSettings {
  const defaults: UserSettings = {
    playbackRate: 1.0,
    voiceName: '',
    autoPlayAudio: false,
    useAiScoring: true,
    theme: 'light',
    currentUnitId: 1,
    currentSentenceIndex: 1,
    lastActiveMode: 'pdf_practice',
  };
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return raw ? { ...defaults, ...JSON.parse(raw) } : defaults;
  } catch {
    return defaults;
  }
}

export function getUserSettings(): UserSettings {
  return loadSettings();
}

export function saveSettings(settings: Partial<UserSettings>) {
  try {
    const current = loadSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save settings', e);
  }
}

export function saveUserSettings(settings: Partial<UserSettings>) {
  saveSettings(settings);
}

export function getStoredApiKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.API_KEY) || '';
  } catch {
    return '';
  }
}

export function setStoredApiKey(key: string): void {
  try {
    if (key) {
      localStorage.setItem(STORAGE_KEYS.API_KEY, key);
    } else {
      localStorage.removeItem(STORAGE_KEYS.API_KEY);
    }
  } catch (e) {
    console.error('Failed to save API key', e);
  }
}
