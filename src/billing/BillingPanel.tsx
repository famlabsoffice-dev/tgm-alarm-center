import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';
import { useIAP, type Product, type ProductSubscription, type Purchase } from 'expo-iap';
import { highestTier, productForId, STORE_LIFETIME_IDS, STORE_PRODUCT_IDS, STORE_SUBSCRIPTION_IDS } from './catalog';
import type { Tier } from '../domain/alarm';

type BillingPanelProps = { currentTier: Tier; onTierConfirmed: (tier: Tier) => void };
type StoreItem = Product | ProductSubscription;

function purchaseId(purchase: Purchase): string[] {
  return Array.isArray(purchase.ids) && purchase.ids.length > 0 ? purchase.ids : [purchase.productId];
}

export function BillingPanel({ currentTier, onTierConfirmed }: BillingPanelProps): React.ReactElement {
  const [message, setMessage] = useState<string | null>(null);
  const [busyProduct, setBusyProduct] = useState<string | null>(null);
  const { connected, products, subscriptions, availablePurchases, fetchProducts, requestPurchase, finishTransaction, getAvailablePurchases, restorePurchases, verifyPurchaseWithProvider } = useIAP({
    onPurchaseSuccess: async (purchase) => {
      try {
        if (purchase.purchaseState !== 'purchased') {
          setMessage('Der Kauf wartet noch auf die Zahlungsbestätigung.');
          return;
        }
        const token = purchase.purchaseToken;
        if (!token) throw new Error('Store-Transaktion enthält kein Verifikationstoken.');
        const verification = await verifyPurchaseWithProvider({
          provider: 'iapkit',
          iapkit: Platform.OS === 'android'
            ? { google: { purchaseToken: token } }
            : { apple: { jws: token } },
        });
        if (verification.iapkit?.isValid !== true || verification.iapkit.state !== 'entitled') throw new Error('Store-Transaktion konnte nicht verifiziert werden.');
        const tier = highestTier(purchaseId(purchase));
        if (tier === 'free') throw new Error('Store-Transaktion enthält kein gültiges Paid-Produkt.');
        await finishTransaction({ purchase, isConsumable: false });
        onTierConfirmed(tier);
        setMessage('Kauf bestätigt und Tarif aktiviert.');
      } catch {
        setMessage('Der Kauf konnte nicht abgeschlossen werden. Bitte versuche es erneut.');
      } finally {
        setBusyProduct(null);
      }
    },
    onPurchaseError: () => {
      setBusyProduct(null);
      setMessage('Der Kauf konnte nicht gestartet werden.');
    },
    onError: () => setMessage('Der Store ist momentan nicht erreichbar.'),
  });

  useEffect(() => {
    if (!connected) return;
    void fetchProducts({ skus: STORE_SUBSCRIPTION_IDS, type: 'subs' });
    void fetchProducts({ skus: STORE_LIFETIME_IDS, type: 'in-app' });
  }, [connected, fetchProducts]);

  useEffect(() => {
    if (availablePurchases.length === 0) return;
    let active = true;
    void (async () => {
      const verifiedIds: string[] = [];
      for (const purchase of availablePurchases) {
        const token = purchase.purchaseToken;
        if (!token || purchase.purchaseState !== 'purchased') continue;
        try {
          const verification = await verifyPurchaseWithProvider({
            provider: 'iapkit',
            iapkit: Platform.OS === 'android' ? { google: { purchaseToken: token } } : { apple: { jws: token } },
          });
          if (verification.iapkit?.isValid === true && verification.iapkit.state === 'entitled') verifiedIds.push(...purchaseId(purchase));
        } catch {
          setMessage('Ein vorhandener Kauf konnte nicht verifiziert werden.');
        }
      }
      const restoredTier = highestTier(verifiedIds);
      if (active && restoredTier !== 'free') onTierConfirmed(restoredTier);
    })();
    return () => { active = false; };
  }, [availablePurchases, onTierConfirmed, verifyPurchaseWithProvider]);

  const storeItems = useMemo(() => [...subscriptions, ...products] as StoreItem[], [products, subscriptions]);
  const itemById = useMemo(() => new Map(storeItems.map((item) => [item.id, item])), [storeItems]);
  const restore = async (): Promise<void> => {
    setMessage(null);
    try {
      await restorePurchases();
      await getAvailablePurchases();
      setMessage('Vorhandene Käufe wurden wiederhergestellt.');
    } catch {
      setMessage('Käufe konnten nicht wiederhergestellt werden.');
    }
  };
  const buy = async (productId: string): Promise<void> => {
    setBusyProduct(productId);
    setMessage(null);
    try {
      const definition = productForId(productId);
      if (!definition) throw new Error('Unbekanntes Store-Produkt.');
      if (definition.kind === 'subscription') {
        await requestPurchase({ type: 'subs', request: { apple: { sku: productId }, google: { skus: [productId] } } });
      } else {
        await requestPurchase({ type: 'in-app', request: { apple: { sku: productId }, google: { skus: [productId] } } });
      }
    } catch {
      setBusyProduct(null);
      setMessage('Der Kauf konnte nicht gestartet werden.');
    }
  };

  return <View style={styles.panel}>
    <Text style={styles.heading}>Pläne und Preise</Text>
    <Text style={styles.caption}>Aktueller Tarif: {currentTier}</Text>
    {!connected ? <Text style={styles.caption}>Store wird verbunden …</Text> : null}
    {STORE_PRODUCT_IDS.map((productId) => {
      const item = itemById.get(productId);
      const definition = productForId(productId);
      if (!definition) return null;
      const title = item?.title ?? `${definition.tier} · ${definition.period}`;
      const price = item?.displayPrice ?? 'Preis wird geladen';
      const busy = busyProduct === productId;
      return <Pressable key={productId} disabled={!item || busy} onPress={() => void buy(productId)} style={({ pressed }) => [styles.row, pressed && styles.pressed, (!item || busy) && styles.disabled]}>
        <View style={styles.flex}><Text style={styles.title}>{title}</Text><Text style={styles.caption}>{definition.kind === 'lifetime' ? 'Einmaliger Kauf' : 'Abonnement'}</Text></View>
        {busy ? <ActivityIndicator color="#F0C76A" /> : <Text style={styles.price}>{price}</Text>}
      </Pressable>;
    })}
    <Pressable onPress={() => void restore()} style={({ pressed }) => [styles.restore, pressed && styles.pressed]}><Text style={styles.restoreText}>Käufe wiederherstellen</Text></Pressable>
    {message ? <Text style={styles.message}>{message}</Text> : null}
    <Text style={styles.footnote}>Käufe werden über den jeweiligen Store abgewickelt und erst nach erfolgreicher Store-Verifikation als Tarif berechtigt.</Text>
  </View>;
}

const styles = {
  panel: { backgroundColor: '#171B21', borderColor: '#38414A', borderWidth: 1, borderRadius: 16, padding: 15, marginTop: 12 },
  heading: { color: '#EAE6D8', fontSize: 18, fontWeight: '900' as const, marginBottom: 4 },
  caption: { color: '#9BA0A5', fontSize: 11, marginTop: 3 },
  row: { flexDirection: 'row' as const, alignItems: 'center' as const, minHeight: 54, borderBottomColor: '#38414A', borderBottomWidth: 1, paddingVertical: 8 },
  flex: { flex: 1 },
  title: { color: '#EAE6D8', fontSize: 13, fontWeight: '800' as const },
  price: { color: '#F0C76A', fontSize: 13, fontWeight: '900' as const, marginLeft: 8 },
  restore: { backgroundColor: '#252C34', borderColor: '#38414A', borderWidth: 1, borderRadius: 10, alignItems: 'center' as const, paddingVertical: 11, marginTop: 12 },
  restoreText: { color: '#EAE6D8', fontSize: 12, fontWeight: '800' as const },
  message: { color: '#79C95B', fontSize: 12, fontWeight: '700' as const, marginTop: 10 },
  footnote: { color: '#6F7880', fontSize: 10, marginTop: 10 },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.5 },
};
