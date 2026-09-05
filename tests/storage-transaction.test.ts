import assert from 'node:assert/strict';
import test from 'node:test';
import { persistWithRecoveryLadder, type StorageTransactionAdapter } from '../src/storage/storageTransaction';

function fakeStorage(failKey: string | null = null): { adapter: StorageTransactionAdapter; values: Map<string, string>; removed: string[] } {
  const values = new Map<string, string>();
  const removed: string[] = [];
  const adapter: StorageTransactionAdapter = {
    async setItem(key, value) {
      if (key === failKey) throw new Error(`injected write failure: ${key}`);
      values.set(key, value);
    },
    async removeItem(key) {
      removed.push(key);
      values.delete(key);
    },
  };
  return { adapter, values, removed };
}

test('primary write failure leaves the pending snapshot intact and does not mark the transaction complete', async () => {
  const storage = fakeStorage('primary');
  await assert.rejects(
    persistWithRecoveryLadder(storage.adapter, { pending: 'pending', primary: 'primary', lastKnownGood: 'last-known-good' }, 'snapshot-v2'),
    /injected write failure: primary/,
  );
  assert.equal(storage.values.get('pending'), 'snapshot-v2');
  assert.equal(storage.values.has('primary'), false);
  assert.equal(storage.values.has('last-known-good'), false);
  assert.deepEqual(storage.removed, []);
});

test('last-known-good write failure preserves pending snapshot after primary success for safe recovery', async () => {
  const storage = fakeStorage('last-known-good');
  await assert.rejects(
    persistWithRecoveryLadder(storage.adapter, { pending: 'pending', primary: 'primary', lastKnownGood: 'last-known-good' }, 'snapshot-v3'),
    /injected write failure: last-known-good/,
  );
  assert.equal(storage.values.get('pending'), 'snapshot-v3');
  assert.equal(storage.values.get('primary'), 'snapshot-v3');
  assert.equal(storage.values.has('last-known-good'), false);
  assert.deepEqual(storage.removed, []);
});

test('successful recovery-ladder write removes pending only after all durable writes succeed', async () => {
  const storage = fakeStorage();
  await persistWithRecoveryLadder(storage.adapter, { pending: 'pending', primary: 'primary', lastKnownGood: 'last-known-good' }, 'snapshot-v4');
  assert.equal(storage.values.has('pending'), false);
  assert.equal(storage.values.get('primary'), 'snapshot-v4');
  assert.equal(storage.values.get('last-known-good'), 'snapshot-v4');
  assert.deepEqual(storage.removed, ['pending']);
});
