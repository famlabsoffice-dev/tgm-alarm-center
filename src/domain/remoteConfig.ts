import type { EventDefinition } from './eventModel';
import { validateEventDefinition } from './eventModel';

export interface RemoteEventConfig {
  schema: number;
  configVersion: number;
  gameVersionRange: [string, string];
  effectiveFrom: string;
  rules: EventDefinition[];
  signature: string;
}

export interface RemoteConfigStore {
  read(): Promise<RemoteEventConfig | null>;
  write(config: RemoteEventConfig): Promise<void>;
}

export function validateRemoteConfig(config: RemoteEventConfig, supportedSchema = 3): string[] {
  const errors: string[] = [];
  if (!Number.isInteger(config.schema) || config.schema < 1 || config.schema > supportedSchema) errors.push('unsupported-schema');
  if (!Number.isInteger(config.configVersion) || config.configVersion < 1) errors.push('invalid-config-version');
  if (!Array.isArray(config.gameVersionRange) || config.gameVersionRange.length !== 2 || config.gameVersionRange.some((v) => !/^\d+\.\d+(?:\.\d+|\.x)?$/.test(v))) errors.push('invalid-game-version-range');
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(config.effectiveFrom) || !Number.isFinite(Date.parse(config.effectiveFrom))) errors.push('invalid-effective-from');
  if (typeof config.signature !== 'string' || !/^[A-Za-z0-9+/=_-]{32,4096}$/.test(config.signature)) errors.push('invalid-signature-format');
  if (!Array.isArray(config.rules) || config.rules.length > 2048) errors.push('invalid-rule-count');
  for (const rule of config.rules) errors.push(...validateEventDefinition(rule).map((error) => `rule:${rule.id}:${error}`));
  return [...new Set(errors)];
}

export function acceptRemoteConfig(
  current: RemoteEventConfig | null,
  candidate: RemoteEventConfig,
  signatureVerified: boolean,
): RemoteEventConfig {
  const validation = validateRemoteConfig(candidate);
  if (validation.length) throw new Error(`Remote config rejected: ${validation.join(',')}`);
  if (!signatureVerified) throw new Error('Remote config signature verification failed');
  if (current && candidate.configVersion <= current.configVersion) throw new Error('Remote config is not newer than the cached version');
  return structuredClone(candidate);
}
