import AsyncStorage from '@react-native-async-storage/async-storage';

const BILLING_ACCOUNT_KEY = 'tgm-alarm-center-billing-account-v1';

function fallbackUuid(): string {
  const bytes = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = bytes.map((value) => value.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function newAccountId(): string {
  const cryptoLike = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  return cryptoLike?.randomUUID?.() ?? fallbackUuid();
}

export async function getBillingAccountId(): Promise<string> {
  const existing = await AsyncStorage.getItem(BILLING_ACCOUNT_KEY);
  if (existing && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(existing)) return existing;
  const accountId = newAccountId();
  await AsyncStorage.setItem(BILLING_ACCOUNT_KEY, accountId);
  return accountId;
}
