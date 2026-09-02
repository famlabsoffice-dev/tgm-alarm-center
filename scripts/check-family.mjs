import { effectiveTierForAccount, isFamilyAccountName } from '../src/domain/pricing.ts';

const valid = ['TGMack', 'TGMkellz', 'TGMj9', 'TGMvany', 'TGMred'];
const variants = [' tgmack ', 'TGMKELLZ', 'tgmj9', ' TGMvany\n', 'TGMRED'];
const invalid = ['TGMack2', 'TGM', 'TGMredx', 'TGM-red', 'Family'];

for (const name of valid) {
  if (!isFamilyAccountName(name) || effectiveTierForAccount('free', name) !== 'godfather') {
    throw new Error(`Gültiger Family fehlgeschlagen: ${name}`);
  }
}
for (const name of variants) {
  if (!isFamilyAccountName(name) || effectiveTierForAccount('underboss', name) !== 'godfather') {
    throw new Error(`Variante fehlgeschlagen: ${JSON.stringify(name)}`);
  }
}
for (const name of invalid) {
  if (isFamilyAccountName(name) || effectiveTierForAccount('free', name) === 'godfather') {
    throw new Error(`Ungültiger Name fälschlich erkannt: ${name}`);
  }
}

console.log('Family direct verification: PASS');
