import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  emptyFunnelSnapshot,
  parseFunnelSnapshot,
  recordFunnelStage,
  serializeFunnelSnapshot,
  type FunnelStage,
  type FunnelSnapshot,
} from '../domain/funnelDiagnostics';

export const FUNNEL_STORAGE_KEY = 'tgm-alarm-center-funnel-v1';

export async function loadFunnelSnapshot(): Promise<FunnelSnapshot> {
  try {
    const raw = await AsyncStorage.getItem(FUNNEL_STORAGE_KEY);
    if (!raw) return emptyFunnelSnapshot();
    return parseFunnelSnapshot(JSON.parse(raw) as unknown);
  } catch {
    return emptyFunnelSnapshot();
  }
}

export async function recordLocalFunnelStage(stage: FunnelStage, occurredAt = new Date().toISOString()): Promise<FunnelSnapshot> {
  const current = await loadFunnelSnapshot();
  const next = recordFunnelStage(current, stage, occurredAt);
  await AsyncStorage.setItem(FUNNEL_STORAGE_KEY, serializeFunnelSnapshot(next));
  return next;
}

export async function clearLocalFunnelDiagnostics(): Promise<void> {
  await AsyncStorage.removeItem(FUNNEL_STORAGE_KEY);
}
