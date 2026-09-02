export interface ServerConfig {
  port: number;
  appleBundleId: string;
  appleRootCertificatePem: string;
  googlePackageName: string;
  googlePubSubAudience: string;
  googleServiceAccountEmail: string;
  googleServiceAccountPrivateKeyPem: string;
  dataFile: string;
}

function required(env: NodeJS.ProcessEnv, key: string): string {
  const value = env[key]?.replace(/\\n/g, '\n').trim();
  if (!value) throw new Error(`Fehlende Serverkonfiguration: ${key}`);
  return value;
}

export function loadServerConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const port = Number(env.TGM_BILLING_PORT ?? 8787);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('TGM_BILLING_PORT ist ungültig.');
  return {
    port,
    appleBundleId: required(env, 'APPLE_BUNDLE_ID'),
    appleRootCertificatePem: required(env, 'APPLE_ROOT_CERTIFICATE_PEM'),
    googlePackageName: required(env, 'GOOGLE_PACKAGE_NAME'),
    googlePubSubAudience: required(env, 'GOOGLE_PUBSUB_AUDIENCE'),
    googleServiceAccountEmail: required(env, 'GOOGLE_SERVICE_ACCOUNT_EMAIL'),
    googleServiceAccountPrivateKeyPem: required(env, 'GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_PEM'),
    dataFile: env.TGM_BILLING_DATA_FILE?.trim() || './.data/billing-store.json',
  };
}
