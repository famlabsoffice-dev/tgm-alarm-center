import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, NotificationPreferences } from '../domain/alarm';

export const STORAGE_KEY = 'tgm-alarm-center-v1';
export const defaultPreferences: NotificationPreferences = { sound: 'pulse', warningSound: true, eventSound: true, vibration: true, criticalAlerts: true, preview: true };
export const emptyState = (): AppState => ({ schemaVersion: 1, accounts: [], alarms: [], activeAccountId: null, tier: 'free', notificationPreferences: defaultPreferences, testConfirmedAt: null });

export async function loadState(): Promise<AppState> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return emptyState();
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || (parsed as {schemaVersion?: unknown}).schemaVersion !== 1) throw new Error('Unbekannte Datenschema-Version');
  const state = parsed as AppState;
  return { ...emptyState(), ...state, notificationPreferences: { ...defaultPreferences, ...state.notificationPreferences } };
}

export async function saveState(state: AppState): Promise<void> {
  const normalized: AppState = { ...state, schemaVersion: 1 };
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
}

export async function resetState(): Promise<void> { await AsyncStorage.removeItem(STORAGE_KEY); }
