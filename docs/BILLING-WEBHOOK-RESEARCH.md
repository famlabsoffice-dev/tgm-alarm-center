# Externe Grundlagen für Store-Webhooks

## Apple

Quelle: https://developer.apple.com/documentation/appstoreservernotifications/receiving-app-store-server-notifications

Apple App Store Server Notifications V2 sendet einen HTTP-POST mit `responseBodyV2`. Das Objekt enthält `signedPayload`, eine kryptografisch signierte JWS-Payload. Enthaltene Transaktions- und Verlängerungsdaten können in weiteren signierten JWS-Feldern liegen. Apple empfiehlt V2; V1 und `notification_type` sind deprecated. Der Server muss die JWS-Signatur prüfen und die Notification verarbeiten.

## Google

Primärquellen für die nächste Recherchephase:

- https://developer.android.com/google/play/billing/rtdn-reference
- https://developer.android.com/google/play/billing/subscriptions
- https://developer.android.com/google/play/billing/test

Für Google RTDN wird die Zustellung über Google Cloud Pub/Sub berücksichtigt. Kauf- und Abozustände müssen serverseitig gegen Google Play geprüft werden; Pending-, Verlängerungs-, Ablauf-, Widerrufs- und Refund-Zustände dürfen erst nach entsprechender Prüfung das Entitlement verändern.

## Google RTDN

Quelle: https://developer.android.com/google/play/billing/rtdn-reference

Google Real-time Developer Notifications werden über Cloud Pub/Sub zugestellt. Jede Veröffentlichung enthält ein einzelnes base64-kodiertes `data`-Feld. RTDN teilt mit, dass sich ein Kaufzustand geändert hat, liefert aber nicht den vollständigen Kaufdatensatz; der Server muss danach die Google Play Developer API aufrufen, um den vollständigen Status abzurufen und das Entitlement zu aktualisieren. Relevante Kategorien sind SubscriptionNotification, OneTimeProductNotification, VoidedPurchaseNotification, PendingRefundReviewNotification und TestNotification.

Die Dokumentation weist außerdem darauf hin, dass neue Apps und Updates ab dem 31. August 2026 Billing Library 8 oder höher verwenden müssen; für dieses Serverprojekt wird deshalb die Billing-Library-/API-Version explizit konfigurierbar gehalten.
