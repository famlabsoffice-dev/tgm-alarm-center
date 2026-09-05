import AsyncStorage from '@react-native-async-storage/async-storage';
import type { RemoteConfigStore, RemoteEventConfig } from '../domain/remoteConfig';
import { validateRemoteConfig } from '../domain/remoteConfig';

const KEY = '@tgm-alarm-center/remote-config/v3';

export class AsyncStorageRemoteConfigStore implements RemoteConfigStore {
  async read(): Promise<RemoteEventConfig | null> {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    let parsed: RemoteEventConfig;
    try {
      parsed = JSON.parse(raw) as RemoteEventConfig;
    } catch {
      await AsyncStorage.removeItem(KEY);
      return null;
    }
    if (validateRemoteConfig(parsed).length) {
      await AsyncStorage.removeItem(KEY);
      return null;
    }
    return parsed;
  }

  async write(config: RemoteEventConfig): Promise<void> {
    const errors = validateRemoteConfig(config);
    if (errors.length) throw new Error(`Refusing invalid remote config: ${errors.join(',')}`);
    await AsyncStorage.setItem(KEY, JSON.stringify(config));
  }

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(KEY);
  }
}
