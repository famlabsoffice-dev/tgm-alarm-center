import fs from 'node:fs';

const config = JSON.parse(fs.readFileSync(new URL('../production-integrations.json', import.meta.url), 'utf8'));
const checks = Object.entries(config.integrations).map(([name, integration]) => {
  const endpointEnv = integration.endpoint_env ?? integration.provider_env;
  const credentialEnv = integration.credentials_env;
  const endpoint = endpointEnv ? process.env[endpointEnv]?.trim() : '';
  const credential = credentialEnv ? process.env[credentialEnv]?.trim() : '';

  const endpointOk = Boolean(endpoint);
  const credentialOk = Boolean(credential);
  const urlOk = endpointOk && (() => {
    try {
      const url = new URL(endpoint);
      return url.protocol === 'https:' && Boolean(url.hostname);
    } catch {
      return false;
    }
  })();

  return {
    name,
    endpointOk,
    credentialOk,
    urlOk,
    pass: endpointOk && credentialOk && urlOk
  };
});

const failed = checks.filter((check) => !check.pass);
for (const check of checks) {
  console.log(`${check.name}: ${check.pass ? 'READY' : 'BLOCKED'}`);
}

if (failed.length > 0) {
  console.error(`Production integration verification failed: ${failed.length}/${checks.length} integration(s) are not configured with real HTTPS endpoints and credentials.`);
  process.exit(1);
}

console.log('Production integration configuration gate passed. Runtime connectivity/authentication must still be verified against the real services before release.');
