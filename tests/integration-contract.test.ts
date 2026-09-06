import assert from 'node:assert/strict';
import test from 'node:test';
import { fromTGMhubEvent, toTGMhubIntegrationOutput } from '../src/integration/tgmhub-contract';
import { canonicalRequest, validateBulkSize, validatePartnerRequest, type PartnerEvent, type PartnerRequest } from '../src/integration/partner-contract';
import { toAlarmIntent, UTILITY_DEFAULTS, validateUtilityEvent } from '../src/integration/utility-events';

test('utility categories normalize into alarm intents', () => {
  for (const category of Object.keys(UTILITY_DEFAULTS) as Array<keyof typeof UTILITY_DEFAULTS>) {
    const intent = toAlarmIntent({ id: `evt-${category}`, category, title: category, accountId: 'account-1', startAtUtc: '2030-01-01T12:00:00.000Z', endAtUtc: null, metadata: {}, ...UTILITY_DEFAULTS[category] });
    assert.equal(intent.sourceEventId, `evt-${category}`);
    assert.equal(intent.accountId, 'account-1');
  }
});

test('invalid utility events fail closed', () => {
  assert.throws(() => validateUtilityEvent({ id: 'x', category: 'event', title: '', accountId: 'account-1', startAtUtc: 'bad', endAtUtc: null, metadata: {}, ...UTILITY_DEFAULTS.event }));
  assert.throws(() => validateUtilityEvent({ id: 'x', category: 'event', title: 'x', accountId: 'account-1', startAtUtc: '2030-01-01T12:00:00.000Z', endAtUtc: '2029-01-01T12:00:00.000Z', metadata: {}, ...UTILITY_DEFAULTS.event }));
});

test('TGMhub adapter preserves event identity and produces alarm output', () => {
  const intent = fromTGMhubEvent({ event: 'GW', start: '2030-01-01T12:00:00.000Z', end: '2030-01-02T12:00:00.000Z', category: 'gw', metadata: { season: 4 } }, { eventId: 'hub-1', accountId: 'account-1' }, UTILITY_DEFAULTS.gw);
  const output = toTGMhubIntegrationOutput(intent);
  assert.equal(output.eventId, 'hub-1');
  assert.deepEqual(output.warnings, [60, 30, 15]);
  assert.equal(output.tone, 'siren');
  assert.equal(output.preferencesRequired, true);
});

test('partner canonical representation is deterministic and signed requests are bounded', () => {
  const request: PartnerRequest = { method: 'POST', route: 'POST /events', timestamp: 1893456000000, nonce: 'nonce-123456', body: '{"id":"evt-1"}', identity: { partnerId: 'partner-123456', keyId: 'key-123456' }, signature: 'a'.repeat(64) };
  assert.equal(canonicalRequest({ ...request, signature: undefined } as Omit<PartnerRequest, 'signature'>), canonicalRequest({ ...request, signature: undefined } as Omit<PartnerRequest, 'signature'>));
  assert.doesNotThrow(() => validatePartnerRequest(request, request.timestamp));
  assert.throws(() => validatePartnerRequest({ ...request, timestamp: request.timestamp - 6 * 60 * 1000 }, request.timestamp));
});

test('partner bulk contract is bounded', () => {
  const event: PartnerEvent = { id: 'evt-1', accountId: 'account-1', event: 'Event', start: '2030-01-01T12:00:00.000Z', end: null, category: 'event', metadata: {} };
  assert.doesNotThrow(() => validateBulkSize([event]));
  assert.throws(() => validateBulkSize([]));
  assert.throws(() => validateBulkSize(Array.from({ length: 101 }, (_, index) => ({ ...event, id: `evt-${index}` }))));
});
