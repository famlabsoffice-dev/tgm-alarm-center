import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const appPath = path.join(root, 'app.js');
const source = fs.readFileSync(appPath, 'utf8');

const tiers = {
  free: { name: 'Free', limits: { accounts: 1, alarms: 2, events: 1, perAccount: { bubbleAlarms: 1, eventAlarms: 1, individualAlarms: 0, rssAlarms: 0 } }, eur: { weekly: 0, monthly: 0, sixMonth: 0, yearly: 0, lifetime: 0 }, usdDirect: { weekly: 0, monthly: 0, sixMonth: 0, yearly: 0, lifetime: 0 }, usdStore: { weekly: 0, monthly: 0, sixMonth: 0, yearly: 0, lifetime: 0 }, jpyDirect: { weekly: 0, monthly: 0, sixMonth: 0, yearly: 0, lifetime: 0 }, jpyStore: { weekly: 0, monthly: 0, sixMonth: 0, yearly: 0, lifetime: 0 }, annualSavingPercent: null },
  streetBoss: { name: 'Street Boss', limits: { accounts: 2, alarms: 4, events: 2, perAccount: { bubbleAlarms: 1, eventAlarms: 1, individualAlarms: 0, rssAlarms: 0 } }, eur: { weekly: 4.99, monthly: 14.99, sixMonth: 79.99, yearly: 129.99, lifetime: 199.99 }, usdDirect: { weekly: 5.79, monthly: 17.37, sixMonth: 92.77, yearly: 150.77, lifetime: 231.91 }, usdStore: { weekly: 5.99, monthly: 16.99, sixMonth: 89.99, yearly: 149.99, lifetime: 214.99 }, jpyDirect: { weekly: 924, monthly: 2777, sixMonth: 14815, yearly: 24072, lifetime: 37042 }, jpyStore: { weekly: 1000, monthly: 2800, sixMonth: 14800, yearly: 24000, lifetime: 37000 }, annualSavingPercent: 17 },
  caporegime: { name: 'Caporegime', limits: { accounts: 3, alarms: 9, events: 3, perAccount: { bubbleAlarms: 1, eventAlarms: 1, individualAlarms: 1, rssAlarms: 0 } }, eur: { weekly: 7.99, monthly: 24.99, sixMonth: 129.99, yearly: 199.99, lifetime: 299.99 }, usdDirect: { weekly: 9.26, monthly: 28.99, sixMonth: 150.72, yearly: 231.83, lifetime: 347.73 }, usdStore: { weekly: 9.99, monthly: 27.99, sixMonth: 149.99, yearly: 229.99, lifetime: 319.99 }, jpyDirect: { weekly: 1479, monthly: 4629, sixMonth: 24077, yearly: 37038, lifetime: 55557 }, jpyStore: { weekly: 1500, monthly: 4600, sixMonth: 24000, yearly: 37000, lifetime: 55000 }, annualSavingPercent: 23 },
  underboss: { name: 'Underboss', limits: { accounts: 5, alarms: 15, events: 5, perAccount: { bubbleAlarms: 1, eventAlarms: 1, individualAlarms: 1, rssAlarms: 1 } }, eur: { weekly: 9.99, monthly: 34.99, sixMonth: 179.99, yearly: 299.99, lifetime: 449.99 }, usdDirect: { weekly: 11.58, monthly: 40.56, sixMonth: 208.77, yearly: 347.79, lifetime: 521.87 }, usdStore: { weekly: 11.99, monthly: 39.99, sixMonth: 199.99, yearly: 349.99, lifetime: 479.99 }, jpyDirect: { weekly: 1850, monthly: 6483, sixMonth: 33332, yearly: 55552, lifetime: 83358 }, jpyStore: { weekly: 1900, monthly: 6500, sixMonth: 33000, yearly: 56000, lifetime: 83000 }, annualSavingPercent: 17 },
  boss: { name: 'Boss', limits: { accounts: 10, alarms: 70, events: 20, perAccount: { bubbleAlarms: 1, eventAlarms: 2, individualAlarms: 2, rssAlarms: 2 } }, eur: { weekly: 14.99, monthly: 49.99, sixMonth: 249.99, yearly: 399.99, lifetime: 599.99 }, usdDirect: { weekly: 17.38, monthly: 57.94, sixMonth: 289.90, yearly: 463.84, lifetime: 695.76 }, usdStore: { weekly: 16.99, monthly: 54.99, sixMonth: 299.99, yearly: 499.99, lifetime: 699.99 }, jpyDirect: { weekly: 2777, monthly: 9259, sixMonth: 46296, yearly: 74088, lifetime: 111132 }, jpyStore: { weekly: 2800, monthly: 10000, sixMonth: 50000, yearly: 78000, lifetime: 115000 }, annualSavingPercent: 20 },
  godfather: { name: 'Godfather', limits: { accounts: Infinity, alarms: Infinity, events: Infinity, perAccount: { bubbleAlarms: Infinity, eventAlarms: Infinity, individualAlarms: Infinity, rssAlarms: Infinity } }, eur: { weekly: 19.99, monthly: 69.99, sixMonth: 399.99, yearly: 599.99, lifetime: 799.99 }, usdDirect: { weekly: 23.18, monthly: 81.1, sixMonth: 463.96, yearly: 695.68, lifetime: 927.64 }, usdStore: { weekly: 22.99, monthly: 79.99, sixMonth: 449.99, yearly: 699.99, lifetime: 899.99 }, jpyDirect: { weekly: 3702, monthly: 12956, sixMonth: 74086, yearly: 111061, lifetime: 148106 }, jpyStore: { weekly: 3700, monthly: 13000, sixMonth: 74000, yearly: 111000, lifetime: 148000 }, annualSavingPercent: 17 },
};

const tierOrder = ['free', 'streetBoss', 'caporegime', 'underboss', 'boss', 'godfather'];
const tierFeatures = {
  free: ['1 Account', '1 Bubble Alarm', '1 Event Alarm', 'Keine Timer'],
  streetBoss: ['2 Accounts', 'Je 1 Bubble Alarm pro Account', 'Je 1 Event Alarm pro Account', 'Keine Timer'],
  caporegime: ['3 Accounts', 'Je 1 Bubble Alarm pro Account', 'Je 1 Event Alarm pro Account', 'Je 1 Individual Timer: Investment, Building oder Training'],
  underboss: ['5 Accounts', 'Je 1 Bubble Alarm pro Account', 'Je 1 Event Alarm pro Account', 'Je 1 Individual Timer und je 1 RSS Timer: Tiles, Trucks oder Schmuggler'],
  boss: ['10 Accounts', 'Je 1 Bubble Alarm pro Account', 'Je 2 Event Alarm pro Account', 'Je 2 Individual Timer und 2 RSS Timer pro Account'],
  godfather: ['Unbegrenzte Accounts', 'Unbegrenzte Alarme', 'Bubble Alarm, Event Alarm, Individual Timer und RSS Timer ohne Limit', 'Vollständiger Funktionsumfang für die Alarmplanung'],
};

const sourceTierOrder = source.match(/const TIER_ORDER = \[[^\]]+\];/s);
if (!sourceTierOrder) throw new Error('TIER_ORDER block not found in app.js');
const sourcePricing = source.match(/const TIER_PRICING = \{.*?const TIER_FEATURES/s);
if (!sourcePricing) throw new Error('TIER_PRICING block not found in app.js');
const sourceFeatures = source.match(/const TIER_FEATURES = \{.*?\n  \};/s);
if (!sourceFeatures) throw new Error('TIER_FEATURES block not found in app.js');

const js = (value) => JSON.stringify(value).replace(/"/g, "'").replace(/'([A-Za-z_$][\w$]*)':/g, '$1:').replace(/: 'Infinity'/g, ': Infinity');

const nextOrder = `const TIER_ORDER = ${js(tierOrder)};`;
const nextPricing = `const TIER_PRICING = ${js(tiers).replace(/Infinity/g, 'Infinity')};\n  const TIER_FEATURES`;
const nextFeatures = `const TIER_FEATURES = ${js(tierFeatures)};`;

let next = source.replace(sourceTierOrder[0], nextOrder).replace(sourcePricing[0], nextPricing).replace(sourceFeatures[0], nextFeatures);
if (next === source) process.exit(0);
fs.writeFileSync(appPath, next);
console.log('Synchronized web pricing: six tiers, four alarm categories, EUR/USD/JPY price data.');
