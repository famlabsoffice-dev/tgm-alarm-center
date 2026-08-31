# TGM ALARM CENTER — Production Integration Gate

## Verbindliche Regel

Die folgenden Funktionen dürfen nur als produktiv aktiv bzw. verbunden gelten, wenn reale, erreichbare Produktionsendpunkte und gültige Zugangsdaten vorhanden sind und eine echte Verbindung erfolgreich verifiziert wurde:

1. Externe Alarmweiterleitung
2. SMS
3. Push
4. Sensor-/Gateway-Kommunikation
5. Serverseitige Leitstellenkommunikation

## Keine erfundenen Produktionsdaten

Es werden keine erfundenen URLs, Hosts, Telefonnummern, API-Keys, Tokens, Zertifikate, Providerkonten oder Zustell-/Verbindungsnachweise als Produktionskonfiguration verwendet.

Die aktuelle Konfiguration in `production-integrations.json` ist für alle fünf Integrationen ausdrücklich `blocked` und kennzeichnet fehlende reale Endpunkte sowie fehlende Credentials.

## Konfigurationsvertrag

Die produktiven Werte müssen außerhalb des Repository-Inhalts als sichere Deployment-Secrets bereitgestellt werden. Vorgesehene Variablennamen:

- `TGM_ALARM_FORWARD_URL`
- `TGM_ALARM_FORWARD_TOKEN`
- `TGM_SMS_PROVIDER_URL`
- `TGM_SMS_PROVIDER_TOKEN`
- `TGM_PUSH_PROVIDER_URL`
- `TGM_PUSH_PROVIDER_TOKEN`
- `TGM_SENSOR_GATEWAY_URL`
- `TGM_SENSOR_GATEWAY_TOKEN`
- `TGM_CONTROL_CENTER_URL`
- `TGM_CONTROL_CENTER_TOKEN`

Diese Namen definieren nur den Konfigurationsvertrag; sie enthalten keine Zugangsdaten.

## Freischaltkriterien

Eine Integration wird erst freigegeben, wenn alle für sie erforderlichen Werte vorhanden sind, das Ziel technisch erreichbar ist, die Authentifizierung erfolgreich ist und die konkrete Nutzfunktion mit einer echten Produktionsschnittstelle verifiziert wurde.

Bis dahin bleibt der Status `blocked`.
