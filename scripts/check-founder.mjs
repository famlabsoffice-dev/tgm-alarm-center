import { effectiveTierForAccount, isFounderAccountName } from '../src/domain/pricing.ts';

const valid = ['TGMack', 'TGMkellz', 'TGMj9', 'TGMvany', 'TGMred'];
const variants = [' tgmack ', 'TGMKELLZ', 'tgmj9', ' TGMvany\n', 'TGMRED'];
const invalid = ['TGMack2', 'TGM', 'TGMredx', 'TGM-red', 'Founder'];

for (const name of valid) {
  if (!isFounderAccountName(name) || effectiveTierForAccount('free', name) !== 'godfather') {
    throw new Error(`Gültiger Founder fehlgeschlagen: ${name}`);
  }
}
for (const name of variants) {
  if (!isFounderAccountName(name) || effectiveTierForAccount('underboss', name) !== 'godfather') {
    throw new Error(`Variante fehlgeschlagen: ${JSON.stringify(name)}`);
  }
}
for (const name of invalid) {
  if (isFounderAccountName(name) || effectiveTierForAccount('free', name) === 'godfather') {
    throw new Error(`Ungültiger Name fälschlich erkannt: ${name}`);
  }
}

console.log('Founder direct verification: PASS');
