export interface BillingConfiguration {
  verificationEndpoint: string | null;
  provider: 'unconfigured' | 'expo-iap';
  configured: boolean;
}

function environment(): Record<string, string | undefined> {
  const processLike = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process;
  return processLike?.env ?? {};
}

function httpsUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? url.toString().replace(/\/$/, '') : null;
  } catch {
    return null;
  }
}

export function getBillingConfiguration(): BillingConfiguration {
  const env = environment();
  const verificationEndpoint = httpsUrl(env.EXPO_PUBLIC_IAP_VERIFICATION_URL);
  const provider = env.EXPO_PUBLIC_IAP_PROVIDER === 'expo-iap' ? 'expo-iap' : 'unconfigured';
  return { verificationEndpoint, provider, configured: provider === 'expo-iap' && verificationEndpoint !== null };
}

export function billingConfigurationIssues(): string[] {
  const configuration = getBillingConfiguration();
  const issues: string[] = [];
  if (configuration.provider === 'unconfigured') issues.push('Kein Store-Adapter konfiguriert.');
  if (!configuration.verificationEndpoint) issues.push('Kein HTTPS-Verifikationsendpunkt konfiguriert.');
  return issues;
}
