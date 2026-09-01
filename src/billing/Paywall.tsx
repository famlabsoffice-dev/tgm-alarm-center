import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { BillingProduct } from './catalog';
import { EntitlementSnapshot, isEntitlementUsable } from './entitlements';
import { StoreProduct } from './adapter';

const COLORS = {
  background: '#090C12',
  panel: '#171B21',
  card: '#1E242B',
  border: '#38414A',
  text: '#EAE6D8',
  muted: '#9BA0A5',
  gold: '#F0C76A',
  mint: '#79C95B',
  danger: '#D65A50',
};

type PaywallAction = (productKey: string) => void;

export interface PaywallProps {
  catalog: BillingProduct[];
  products: StoreProduct[];
  entitlement: EntitlementSnapshot;
  loading: boolean;
  configured: boolean;
  cacheStatus: 'usable' | 'expired' | 'empty' | 'invalid' | 'online';
  error: string | null;
  onPurchase: PaywallAction;
  onRestore: () => void;
  onClose?: () => void;
}

interface TierGroup {
  tier: BillingProduct['tier'];
  name: string;
  products: BillingProduct[];
}

function groupProducts(catalog: BillingProduct[]): TierGroup[] {
  const groups = new Map<BillingProduct['tier'], TierGroup>();
  for (const product of catalog) {
    const group = groups.get(product.tier) ?? { tier: product.tier, name: product.displayName, products: [] };
    group.products.push(product);
    groups.set(product.tier, group);
  }
  return [...groups.values()];
}

function durationLabel(product: BillingProduct): string {
  return product.durationLabel;
}

export function Paywall({ catalog, products, entitlement, loading, configured, cacheStatus, error, onPurchase, onRestore, onClose }: PaywallProps): React.ReactElement {
  const groups = useMemo(() => groupProducts(catalog), [catalog]);
  const storeProducts = useMemo(() => new Map(products.map((product) => [product.productId, product])), [products]);
  const entitlementActive = isEntitlementUsable(entitlement);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>TGM ALARM CENTER</Text>
          <Text style={styles.title}>Mehr Kontrolle. Kein verpasster Termin.</Text>
          <Text style={styles.subtitle}>Wähle die Kommandoebene, die zu deinem Alarmalltag passt.</Text>
        </View>
        {onClose ? <Pressable accessibilityRole="button" accessibilityLabel="Paywall schließen" onPress={onClose} style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}><Text style={styles.closeText}>×</Text></Pressable> : null}
      </View>

      {entitlementActive ? (
        <View style={styles.activeBanner}>
          <Text style={styles.activeTitle}>{entitlement.tier} ist aktiv</Text>
          <Text style={styles.activeText}>Dein serverseitig bestätigtes Entitlement ist auf diesem Gerät verfügbar.</Text>
        </View>
      ) : null}

      {cacheStatus === 'usable' ? (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineTitle}>Offlinezugriff aktiv</Text>
          <Text style={styles.offlineText}>Der zuletzt serverseitig bestätigte Zugang bleibt vorübergehend verfügbar. Beim nächsten Online-Kontakt wird er erneut geprüft.</Text>
        </View>
      ) : null}

      {!configured ? (
        <View style={styles.infoBanner}>
          <Text style={styles.infoTitle}>Store-Billing wird vorbereitet</Text>
          <Text style={styles.infoText}>Käufe werden angezeigt, sobald die Store-Produkte und die serverseitige Prüfung für diese App konfiguriert sind.</Text>
        </View>
      ) : null}

      {error ? <View style={styles.errorBanner}><Text style={styles.errorText}>{error}</Text></View> : null}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {groups.map((group) => (
          <View key={group.tier} style={styles.tierSection}>
            <View style={styles.tierHeading}>
              <View><Text style={styles.tierName}>{group.name}</Text><Text style={styles.tierCaption}>Kommandoebene</Text></View>
              {group.tier === 'godfather' ? <Text style={styles.recommended}>MAXIMUM</Text> : null}
            </View>
            <View style={styles.productGrid}>
              {group.products.map((product) => {
                const productId = product.iosProductId ?? product.androidProductId;
                const storeProduct = productId ? storeProducts.get(productId) : undefined;
                const purchaseEnabled = configured && Boolean(storeProduct) && !loading;
                const isCurrent = entitlementActive && entitlement.productKey === product.key;
                return (
                  <View key={product.key} style={[styles.productCard, isCurrent && styles.currentCard]}>
                    <View style={styles.productMeta}><Text style={styles.duration}>{durationLabel(product)}</Text><Text style={styles.kind}>{product.kind === 'subscription' ? 'ABO' : 'EINMALIG'}</Text></View>
                    <Text style={styles.price}>{storeProduct?.displayPrice ?? 'Im Store verfügbar'}</Text>
                    <Text style={styles.productHint}>{product.kind === 'subscription' ? 'Automatische Verlängerung über den Store' : 'Zeitlich unbegrenzter Zugriff'}</Text>
                    <Pressable accessibilityRole="button" accessibilityLabel={`${group.name} ${durationLabel(product)} kaufen`} disabled={!purchaseEnabled || isCurrent} onPress={() => onPurchase(product.key)} style={({ pressed }) => [styles.purchaseButton, (!purchaseEnabled || isCurrent) && styles.disabledButton, pressed && purchaseEnabled && styles.pressed]}>
                      {loading ? <ActivityIndicator color="#1B160D" /> : <Text style={styles.purchaseText}>{isCurrent ? 'Aktiv' : purchaseEnabled ? 'Auswählen' : 'Nicht verfügbar'}</Text>}
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable accessibilityRole="button" accessibilityLabel="Käufe wiederherstellen" disabled={loading} onPress={onRestore} style={({ pressed }) => [styles.restoreButton, pressed && styles.pressed]}><Text style={styles.restoreText}>{loading ? 'Wird geprüft …' : 'Käufe wiederherstellen'}</Text></Pressable>
        <Text style={styles.legalText}>Die Abrechnung erfolgt über den jeweiligen App Store. Abos können dort verwaltet und gekündigt werden.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background, paddingTop: 18 },
  header: { flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 18, paddingBottom: 14 },
  headerCopy: { flex: 1 },
  eyebrow: { color: COLORS.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: COLORS.text, fontSize: 25, lineHeight: 31, fontWeight: '900', marginTop: 7 },
  subtitle: { color: COLORS.muted, fontSize: 13, lineHeight: 19, marginTop: 7 },
  closeButton: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.card, borderColor: COLORS.border, borderWidth: 1 },
  closeText: { color: COLORS.muted, fontSize: 26, lineHeight: 28 },
  content: { paddingHorizontal: 18, paddingBottom: 12 },
  activeBanner: { marginHorizontal: 18, marginBottom: 10, padding: 13, borderRadius: 13, backgroundColor: '#17351B', borderColor: '#416B35', borderWidth: 1 },
  activeTitle: { color: COLORS.mint, fontSize: 14, fontWeight: '900' },
  activeText: { color: '#C7E9BD', fontSize: 12, lineHeight: 17, marginTop: 3 },
  offlineBanner: { marginHorizontal: 18, marginBottom: 10, padding: 13, borderRadius: 13, backgroundColor: '#13232C', borderColor: '#2A5470', borderWidth: 1 },
  offlineTitle: { color: '#ABE0FB', fontSize: 14, fontWeight: '900' },
  offlineText: { color: '#C5E6F5', fontSize: 12, lineHeight: 17, marginTop: 3 },
  infoBanner: { marginHorizontal: 18, marginBottom: 10, padding: 13, borderRadius: 13, backgroundColor: '#2B2416', borderColor: '#67532D', borderWidth: 1 },
  infoTitle: { color: COLORS.gold, fontSize: 14, fontWeight: '900' },
  infoText: { color: '#E6D7AE', fontSize: 12, lineHeight: 17, marginTop: 3 },
  errorBanner: { marginHorizontal: 18, marginBottom: 10, padding: 13, borderRadius: 13, backgroundColor: '#3B1D20', borderColor: '#66312E', borderWidth: 1 },
  errorText: { color: '#FFB5AB', fontSize: 12, lineHeight: 17, fontWeight: '700' },
  tierSection: { marginBottom: 16 },
  tierHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  tierName: { color: COLORS.text, fontSize: 19, fontWeight: '900' },
  tierCaption: { color: COLORS.muted, fontSize: 11, marginTop: 2 },
  recommended: { color: COLORS.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  productGrid: { gap: 8 },
  productCard: { backgroundColor: COLORS.panel, borderColor: COLORS.border, borderWidth: 1, borderRadius: 15, padding: 14 },
  currentCard: { borderColor: COLORS.mint, backgroundColor: '#142319' },
  productMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  duration: { color: COLORS.text, fontSize: 14, fontWeight: '900' },
  kind: { color: COLORS.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  price: { color: COLORS.gold, fontSize: 22, fontWeight: '900', marginTop: 8 },
  productHint: { color: COLORS.muted, fontSize: 11, lineHeight: 16, marginTop: 4 },
  purchaseButton: { minHeight: 42, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.gold, borderRadius: 10, marginTop: 12 },
  purchaseText: { color: '#1B160D', fontSize: 13, fontWeight: '900' },
  disabledButton: { backgroundColor: '#40464B' },
  restoreButton: { minHeight: 42, alignItems: 'center', justifyContent: 'center', borderColor: COLORS.border, borderWidth: 1, borderRadius: 10, backgroundColor: COLORS.card },
  restoreText: { color: COLORS.text, fontSize: 13, fontWeight: '800' },
  footer: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 18, backgroundColor: COLORS.background },
  legalText: { color: COLORS.muted, fontSize: 10, lineHeight: 15, textAlign: 'center', marginTop: 9 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
});
