import Purchases, { CustomerInfo } from 'react-native-purchases';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { Tier } from '../domain/alarm';

const PRODUCTS = (Constants.expoConfig?.extra?.billing ?? {}) as Record<string, string>;
const ENTITLEMENT_IDS = { streetBoss: 'street_boss', caporegime: 'caporegime', godfather: 'godfather' } as const;

export async function configureBilling(userId: string): Promise<void> {
  if (Platform.OS === 'web') throw new Error('Store-Billing ist auf Web nicht verfügbar');
  const key = Platform.OS === 'ios' ? process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY : process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
  if (!key) throw new Error('Store-Billing ist nicht konfiguriert');
  Purchases.configure({ apiKey: key, appUserID: userId });
}

export function verifiedTier(info: CustomerInfo): Tier {
  if (info.entitlements.active[ENTITLEMENT_IDS.godfather]) return 'godfather';
  if (info.entitlements.active[ENTITLEMENT_IDS.caporegime]) return 'caporegime';
  if (info.entitlements.active[ENTITLEMENT_IDS.streetBoss]) return 'streetBoss';
  return 'free';
}

export async function refreshVerifiedEntitlement(): Promise<Tier> {
  if (Platform.OS === 'web') return 'free';
  const info = await Purchases.getCustomerInfo();
  return verifiedTier(info);
}

export async function restorePurchases(): Promise<Tier> {
  if (Platform.OS === 'web') throw new Error('Store-Wiederherstellung ist auf Web nicht verfügbar');
  const info = await Purchases.restorePurchases();
  return verifiedTier(info);
}

export async function purchaseTier(tier: Exclude<Tier, 'free'>, period: 'monthly' | 'yearly' | 'lifetime'): Promise<Tier> {
  if (Platform.OS === 'web') throw new Error('Käufe sind auf Web nicht verfügbar');
  const suffix = period === 'monthly' ? 'Monthly' : period === 'yearly' ? 'Yearly' : 'Lifetime';
  const key = `${tier}${suffix}`;
  const productId = PRODUCTS[key];
  if (!productId) throw new Error('Store-Produkt ist nicht konfiguriert');
  const products = await Purchases.getProducts([productId]);
  const product = products[0];
  if (!product) throw new Error('Store-Produkt wurde nicht gefunden');
  const result = await Purchases.purchaseStoreProduct(product);
  return verifiedTier(result.customerInfo);
}
