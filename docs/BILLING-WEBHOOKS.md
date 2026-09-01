# Serverseitige Store-Verifizierung und Webhooks

## Endpunkte

| Endpunkt | Zweck | Authentifizierung |
|---|---|---|
| `POST /v1/verify/purchase` | Direktverifikation nach einem Kauf aus der App | App-Session muss vor dem Produktivbetrieb vor den Endpoint geschaltet werden; Store-Nachweis wird zusätzlich geprüft |
| `POST /v1/webhooks/apple` | Apple App Store Server Notifications V2 | Apple-signiertes `signedPayload` mit Zertifikatskettenprüfung |
| `POST /v1/webhooks/google` | Google Play RTDN über Pub/Sub | Google OIDC-JWT mit Issuer-, Audience-, Zeit- und RS256-Signaturprüfung |
| `GET /v1/entitlements/:userId` | Aktives serverseitiges Entitlement lesen | Vor dem Produktivbetrieb hinter eine App-Authentifizierung schalten |

## Apple

Der Apple-Endpoint akzeptiert ausschließlich V2-Payloads mit `signedPayload`. Die Implementierung prüft:

- JWS-Struktur und `ES256`-Algorithmus.
- Die im JWS enthaltene Zertifikatskette und das konfigurierte Apple-Root-Zertifikat.
- Zertifikatsgültigkeit, Zertifikatsaussteller und Zertifikatsignaturen.
- Apple-Bundle-ID, Produkt-ID, Umgebung und Transaktions-ID.
- `appAccountToken` beziehungsweise `originalTransactionId` zur Nutzerbindung.
- `notificationUUID` zur Replay-/Duplikatvermeidung.

V1-Notifications werden nicht unterstützt. Apple beschreibt V2 als signierte JWS-Payload und empfiehlt sie anstelle des deprecated V1-Formats. [Apple: Receiving App Store Server Notifications](https://developer.apple.com/documentation/appstoreservernotifications/receiving-app-store-server-notifications)

## Google

Der Google-Endpoint erwartet das von Pub/Sub gelieferte JSON-Envelope und einen OIDC-Bearer-Token. Der Token wird auf Issuer, Audience, Ablaufzeit, Ausstellungszeitpunkt und `RS256`-Signatur geprüft. Die RTDN-Daten werden base64-dekodiert und über `messageId` idempotent verarbeitet.

RTDN signalisiert nur eine Zustandsänderung. Der Server ruft anschließend die Google Play Developer API mit einem kurzlebigen Service-Account-Access-Token auf und prüft die vollständige Subscription- oder One-Time-Product-Antwort. Der Kauftoken wird mit dem gespeicherten Nutzer verknüpft; unbekannte Token werden nicht automatisch einem Nutzer zugeordnet. [Google: Real-time developer notifications reference](https://developer.android.com/google/play/billing/rtdn-reference)

## Konfiguration

Der Server benötigt folgende Umgebungsvariablen:

```text
APPLE_BUNDLE_ID
APPLE_ROOT_CERTIFICATE_PEM
GOOGLE_PACKAGE_NAME
GOOGLE_PUBSUB_AUDIENCE
GOOGLE_SERVICE_ACCOUNT_EMAIL
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_PEM
GOOGLE_PUBSUB_OIDC_PUBLIC_KEY_PEM
EXPO_PUBLIC_IAP_*_*
```

`GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_PEM` und Apple-/Google-Zertifikate dürfen ausschließlich im Serverprozess beziehungsweise Secret Manager gespeichert werden. Sie dürfen nicht als `EXPO_PUBLIC_*`-Variable oder in den App-Bundle gelangen. Der aktuelle Adapter verwendet einen konfigurierten Google-OIDC-Public-Key; für den Produktivbetrieb ist dessen Rotation im Secret-Management zu automatisieren.

## Entitlement-Lifecycle

Ein Kauf wird erst nach Store-Prüfung gespeichert. Apple `REFUND`, `REVOKE` und abgelaufene Zustände entziehen den aktiven Status. Google RTDN verarbeitet Verlängerungen, Pending-Zustände, Ablauf und Void-/Refund-Ereignisse; bei unbekanntem Kauftoken bleibt das System absichtlich unverändert. Der JSON-Speicher schreibt atomar über eine temporäre Datei und verwendet restriktive Dateirechte. Für mehrere Produktionsinstanzen ist er vor dem Launch durch eine transaktionale Datenbank mit Unique-Constraint auf `(platform, transactionId)` und `(platform, purchaseToken)` zu ersetzen.

## Produktions-Gates

Vor dem öffentlichen Release müssen App-Authentifizierung für Direktverifikation und Entitlement-Abfrage, Secret-Management, Google-OIDC-Key-Rotation, TLS-Terminierung, Rate-Limits, Monitoring, Dead-Letter-/Retry-Verarbeitung, Datenbankbetrieb und Sandbox-/Produktions-Testkäufe abgenommen werden. Diese Gates sind nicht stillschweigend als erledigt markiert.
