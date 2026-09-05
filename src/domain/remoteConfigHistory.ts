import { acceptRemoteConfig, validateRemoteConfig, type RemoteEventConfig } from './remoteConfig';

export interface RemoteConfigHistory {
  schemaVersion: 1;
  active: RemoteEventConfig | null;
  previous: RemoteEventConfig[];
}

const MAX_HISTORY = 3;

export function emptyRemoteConfigHistory(): RemoteConfigHistory {
  return { schemaVersion: 1, active: null, previous: [] };
}

export function acceptIntoHistory(history: RemoteConfigHistory, candidate: RemoteEventConfig, signatureVerified: boolean): RemoteConfigHistory {
  const accepted = acceptRemoteConfig(history.active, candidate, signatureVerified);
  const previous = history.active ? [history.active, ...history.previous.filter((item) => item.configVersion !== history.active?.configVersion)] : [...history.previous];
  return { schemaVersion: 1, active: accepted, previous: previous.slice(0, MAX_HISTORY) };
}

export function rollbackToPreviousKnownGood(history: RemoteConfigHistory, targetVersion?: number): RemoteConfigHistory {
  if (!history.active) throw new Error('Kein aktiver Remote-Config-Stand vorhanden');
  const index = targetVersion === undefined ? 0 : history.previous.findIndex((item) => item.configVersion === targetVersion);
  const candidate = history.previous[index];
  if (!candidate) throw new Error('Kein passender vorheriger Remote-Config-Stand vorhanden');
  if (validateRemoteConfig(candidate).length) throw new Error('Vorheriger Remote-Config-Stand ist nicht mehr gültig');
  const previous = [history.active, ...history.previous.filter((item) => item.configVersion !== candidate.configVersion)].slice(0, MAX_HISTORY);
  return { schemaVersion: 1, active: candidate, previous };
}

export function serializeRemoteConfigHistory(history: RemoteConfigHistory): string {
  return JSON.stringify(history);
}

export function parseRemoteConfigHistory(value: unknown): RemoteConfigHistory {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Remote-Config-Historie ist ungültig');
  const input = value as Record<string, unknown>;
  if (input.schemaVersion !== 1 || (input.active !== null && typeof input.active !== 'object') || !Array.isArray(input.previous) || input.previous.length > MAX_HISTORY) throw new Error('Remote-Config-Historie ist nicht kompatibel');
  const active = input.active as RemoteEventConfig | null;
  if (active && validateRemoteConfig(active).length) throw new Error('Aktive Remote-Config ist ungültig');
  const previous = input.previous.map((candidate) => {
    const config = candidate as RemoteEventConfig;
    if (validateRemoteConfig(config).length) throw new Error('Vorherige Remote-Config ist ungültig');
    return config;
  });
  return { schemaVersion: 1, active, previous };
}
