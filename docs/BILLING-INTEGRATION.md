# Billing- und Entitlement-Schicht

## Status

Die Billing-Domäne ist vorbereitet, aber standardmäßig **nicht freigeschaltet**. Solange Store-Produkt-IDs, ein nativer Store-Adapter und ein HTTPS-Verifikationsendpunkt fehlen, bleiben Käufe und Premium-Entitlements deaktiviert. Eine lokale Planwahl oder ein Teststatus darf kein Premium-Entitlement erzeugen.

## Architektur

Der Ablauf ist strikt:

1. Der Store-Adapter verbindet sich mit App Store oder Google Play.
2. Der Produktkatalog lädt die in den Stores veröffentlichten Produkte.
3. Der Nutzer startet einen Kauf.
4. Das Kaufobjekt wird an den serverseitigen Verifikationsendpunkt übertragen.
5. Nur eine gültige Antwort mit `status: "active"`, passender Produkt-ID und passendem Tier wird als Entitlement akzeptiert.
6. Erst danach wird die Store-Transaktion abgeschlossen.
7. Der verifizierte Entitlement-Snapshot wird lokal zwischengespeichert und beim nächsten Start erneut auf Gültigkeit geprüft.

StoreKit 2 stellt signierte Transaktionsdaten bereit und unterstützt aktuelle Entitlements sowie Restore-Szenarien. [Apple StoreKit](https://developer.apple.com/storekit/) Google Play verlangt für Abonnements eine korrekte Verarbeitung des Lebenszyklus einschließlich Verlängerung, Ablauf, Pending-Status und Acknowledgement. [Google Play Billing – Subscriptions](https://developer.android.com/google/play/billing/subscriptions)

## Produktkonfiguration

Die Schicht erwartet pro Tier und Laufzeit eine iOS- und Android-ID. Die Variablennamen werden aus diesen Bestandteilen gebildet:

```text
EXPO_PUBLIC_IAP_{PLATFORM}_{TIER}_{PERIOD}
```

Beispiele für die Namensstruktur sind `EXPO_PUBLIC_IAP_IOS_STREET_BOSS_MONTHLY` und `EXPO_PUBLIC_IAP_ANDROID_GODFATHER_LIFETIME`. Die Werte müssen die tatsächlich in App Store Connect beziehungsweise Google Play Console angelegten IDs sein. Es werden keine Default-IDs und keine Test-IDs in den Quellcode eingebaut.

Der Katalog umfasst die fünf kostenpflichtigen Tiers `streetBoss`, `caporegime`, `underboss`, `boss` und `godfather` mit den Laufzeiten `weekly`, `monthly`, `sixMonth`, `yearly` und `lifetime`. Laufzeiten außer `lifetime` werden als Abonnements modelliert; `lifetime` wird als nicht konsumierbares Produkt modelliert.

## Verifikationsendpunkt

Der Client verwendet ausschließlich eine HTTPS-Adresse aus `EXPO_PUBLIC_IAP_VERIFICATION_URL`. Der Endpunkt muss das Store-Kaufobjekt serverseitig gegen Apple beziehungsweise Google prüfen. Ein Client-Schlüssel oder ein Google-Service-Account darf niemals in die App gelangen.

Die erfolgreiche Antwort muss mindestens diese Struktur erfüllen:

```json
{
  "status": "active",
  "productId": "<verifizierte Store-Produkt-ID>",
  "transactionId": "<Store-Transaktions-ID oder null>",
  "environment": "production",
  "expiresAt": "<ISO-Zeitpunkt oder null>",
  "verifiedAt": "<ISO-Zeitpunkt>"
}
```

`productId` muss exakt mit der angeforderten Store-ID übereinstimmen. Ein abgelaufenes, widerrufenes, ausstehendes oder nicht verifiziertes Ergebnis wird nicht als Premium behandelt. Bei einem Lifetime-Produkt ist `expiresAt` explizit `null`.

## Noch erforderliche Produktions-Gates

Die Billing-Domäne enthält bewusst noch keinen produktiven Store-Adapter. Vor der Freischaltung müssen ein Expo-Custom-Development-Build, reale Store-Produkte, der HTTPS-Verifikationsservice, Restore Purchases, Pending- und Refund-Fälle sowie Testkäufe mit Sandbox-/License-Tester-Konten abgenommen werden. Google weist für neue Apps und Updates ab dem 31. August 2026 auf Billing Library 8 oder höher hin. [Google Play Billing – Testing](https://developer.android.com/google/play/billing/test)

Die lokale Billing-Schicht meldet bei fehlender Konfiguration einen sicheren Unavailable-Zustand. Dieser Zustand ist beabsichtigt und verhindert, dass die App eine Store-Funktion oder ein Premium-Entitlement vortäuscht.

## Paywall- und Kaufprozess-UI

Die Native-App enthält nun eine wiederverwendbare `Paywall`-Komponente. Sie gruppiert die Produktkarten nach Kommandoebene, zeigt ausschließlich vom Store gelieferte Preise, bietet `Kaufen` und `Käufe wiederherstellen` an und unterscheidet Lade-, Fehler-, nicht verfügbare und aktivierte Zustände.

Die Paywall wird über den Button `Pläne` geöffnet. Beim Öffnen werden Store-Produkte nur dann geladen, wenn der Katalog vollständig konfiguriert ist. Ohne Konfiguration zeigt die UI einen klaren Vorbereitungsstatus; sämtliche Kaufaktionen bleiben deaktiviert. Nach einem Kauf aktualisiert die App den lokalen Tierstatus erst nach erfolgreicher serverseitiger Entitlement-Prüfung und erfolgreichem Abschluss der Store-Transaktion.

Der Kauf- und Restore-Ablauf folgt den Store-Lebenszyklusanforderungen. Pending-, abgelaufene, widerrufene oder nicht verifizierte Zustände werden nicht als aktiver Premiumzugang dargestellt. Die Store-Produktpreise sind die maßgebliche Anzeigequelle; lokale Preislisten dienen nur der Produktdefinition und nicht als Beleg für einen erfolgten Kauf.

## Client-SDK: automatische Wiederherstellung

Der native Client verwendet `expo-iap` 5.5.0 über `src/billing/expoIapAdapter.ts`. Beim Verbinden werden die Purchase- und Error-Listener registriert. Restore Purchases führt den SDK-Restore aus und fragt danach die aktuell verfügbaren Käufe ab. Jedes Ergebnis wird einzeln an den bestehenden Verifikationsendpunkt übertragen; erst nach erfolgreicher Serverprüfung wird die Transaktion abgeschlossen und das Entitlement übernommen.

Die App führt Restore Purchases automatisch einmal beim Start und anschließend höchstens alle 15 Minuten beim Wechsel in den Vordergrund aus. Gleichzeitige Restore-Läufe werden über einen In-Flight-Schutz verhindert. iOS-Käufe erhalten ein `appAccountToken`; Android-Käufe erhalten `obfuscatedAccountId` und `obfuscatedProfileId`, damit der Server den Store-Nachweis einem stabilen App-Konto zuordnen kann.

Die SDK-Verbindung wird nur mit vollständigem Produktkatalog und HTTPS-Verifikationsendpunkt aktiviert. Bei fehlender Konfiguration bleibt der vorhandene sichere Unconfigured-Adapter aktiv.

Quelle: [Expo IAP / OpenIAP-Dokumentation](https://hyochan.github.io/expo-iap/)
