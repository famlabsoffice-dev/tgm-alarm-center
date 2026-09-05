export interface StorageTransactionAdapter {
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export interface StorageTransactionKeys {
  pending: string;
  primary: string;
  lastKnownGood: string;
}

export async function persistWithRecoveryLadder(
  adapter: StorageTransactionAdapter,
  keys: StorageTransactionKeys,
  serialized: string,
): Promise<void> {
  await adapter.setItem(keys.pending, serialized);
  await adapter.setItem(keys.primary, serialized);
  await adapter.setItem(keys.lastKnownGood, serialized);
  await adapter.removeItem(keys.pending);
}
