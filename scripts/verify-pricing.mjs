import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const js = readFileSync(new URL('../app.js', import.meta.url), 'utf8');

const tiers = {
  streetBoss: { eur: [4.99, 14.99, 79.99, 129.99, 199.99], usdStore: [5.99, 16.99, 89.99, 149.99, 214.99], jpyStore: [1000, 2800, 14800, 24000, 37000] },
  caporegime: { eur: [7.99, 24.99, 129.99, 199.99, 299.99], usdStore: [9.99, 27.99, 149.99, 229.99, 319.99], jpyStore: [1500, 4600, 24000, 37000, 55000] },
  underboss: { eur: [9.99, 34.99, 179.99, 299.99, 449.99], usdStore: [11.99, 39.99, 199.99, 349.99, 479.99], jpyStore: [1900, 6500, 33000, 56000, 83000] },
  godfather: { eur: [19.99, 69.99, 399.99, 599.99, 799.99], usdStore: [22.99, 79.99, 449.99, 699.99, 899.99], jpyStore: [3700, 13000, 74000, 111000, 148000] },
};

assert(js.includes("const TIER_ORDER = ['free','streetBoss','caporegime','underboss','godfather'];"), 'Five-tier order is missing.');
for (const currency of ['jpyDirect', 'jpyStore']) assert(js.includes(currency), `${currency} pricing is missing.`);
for (const [tier, values] of Object.entries(tiers)) {
  assert(js.includes(`${tier}:`), `${tier} is missing.`);
  for (const value of [...values.eur, ...values.usdStore, ...values.jpyStore]) assert(js.includes(String(value)), `${tier} pricing value ${value} is missing.`);
}
assert(js.includes("usdStore:{weekly:5.99,monthly:16.99,sixMonth:89.99,yearly:149.99,lifetime:214.99}"), 'Street Boss USD Store pricing mismatch.');
assert(js.includes("usdStore:{weekly:9.99,monthly:27.99,sixMonth:149.99,yearly:229.99,lifetime:319.99}"), 'Caporegime USD Store pricing mismatch.');
assert(js.includes("usdStore:{weekly:11.99,monthly:39.99,sixMonth:199.99,yearly:349.99,lifetime:479.99}"), 'Underboss USD Store pricing mismatch.');
assert(js.includes("usdStore:{weekly:22.99,monthly:79.99,sixMonth:449.99,yearly:699.99,lifetime:899.99}"), 'Godfather USD Store pricing mismatch.');

console.log('TGM ALARM CENTER pricing validation: PASS');
