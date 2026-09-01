# Store Launch Readiness — TGM ALARM CENTER

## Technischer Stand

Der native Release ist auf die gemeinsame App-ID `com.tgm.alarmcenter` konfiguriert. Android verwendet Compile SDK 36, Target SDK 36 und Build Tools 36.0.0. Drei Notification-Sounds, die App-ID, Bundle-Identifier, Icon und die erforderlichen Notification-Permissions werden durch `pnpm verify:store-config` geprüft.

Die Anwendung arbeitet derzeit lokal. Accounts, Alarme, Einstellungen und Backups werden auf dem Gerät gespeichert. Es gibt keinen Server, keine Synchronisation und keine erkennbare Google-Play-Billing- oder Apple-StoreKit-Integration.

## Erledigte technische Gates

| Gate | Status | Prüfbefehl |
|---|---|---|
| Android Target API 36 | PASS | `pnpm verify:store-config` |
| Android Compile SDK 36 | PASS | `pnpm verify:store-config` |
| Android Build Tools 36.0.0 | PASS | `pnpm verify:store-config` |
| Android-/iOS-App-ID | PASS | `pnpm verify:store-config` |
| Notification-Sound-Dateien | PASS | `pnpm verify:store-config` |
| Native TypeScript-Typen | PASS | `pnpm typecheck` |
| Lint | PASS | `pnpm lint` |
| Domain- und Web-Tests | PASS | `pnpm test` |
| Web-Browser-Smoke | PASS | `pnpm browser:smoke` |

## Vor dem Google-Play-Upload

Ein signierter Android-App-Bundle-Build muss mit einer kompatiblen Android-16-Toolchain erzeugt und auf physischen Geräten getestet werden. Zu prüfen sind App-Start, Android 15/16, Notification-Permission, Exact-Alarm-Zustand, Akkuoptimierung, Gerätesperre, Neustart, Sound, Landscape-Layout sowie Backup und Restore.

Der Play-Console-Eintrag benötigt Datenschutz-URL, Support-URL, vollständige Store-Metadaten, App-Content-Angaben, Zielgruppe, Altersfreigabe, Data-Safety-Angaben und Werbeerklärung. Bei einem persönlichen Entwicklerkonto, das nach dem 13.11.2023 erstellt wurde, muss vor Produktionszugang ein Closed Test mit mindestens zwölf dauerhaft opt-in Testern über vierzehn aufeinanderfolgende Tage abgeschlossen werden.

## Vor dem Apple-Upload

Ein signierter iOS-Build muss mit einer Xcode-Version und dem iOS-26-SDK erzeugt werden. Zu prüfen sind iPhone und iPad, Notification-Berechtigungen, gesperrter Bildschirm, Hintergrund, Neustart, Zeitzonenwechsel, Sommerzeit, Audio, Landscape-Layout, Accessibility und Backup/Restore.

App Store Connect benötigt Privacy Nutrition Labels, Datenschutz-URL, Support-URL, Altersfreigabe, Export-Compliance-Angaben, Screenshots, lokalisierte Metadaten, Preis- und Verfügbarkeitsdaten sowie vollständige Review Notes. Die App Privacy-Angaben müssen exakt zur ausgelieferten Binary und zu allen eingebundenen Drittanbieter-SDKs passen.

## Monetarisierung

Die vorhandene Tarifmatrix ist ein lokales Produktmodell und kein Store-Entitlement. Vor kostenpflichtiger Veröffentlichung muss für jeden bezahlten Tarif eine echte Google-Play-Billing- beziehungsweise Apple-StoreKit-Produkt-ID eingerichtet werden. Erforderlich sind Kauf, Pending-Status, Wiederherstellung, Ablauf, Kündigung, Refund, Revocation, Sandbox-/Lizenztest und eine vertrauenswürdige Entitlement-Prüfung.

Bis diese Integration abgeschlossen ist, dürfen kostenpflichtige Tarife nicht als tatsächlich käufliche oder dauerhaft geschützte Store-Funktionen beworben werden. Ein kostenloser Store-Launch ist technisch und rechtlich der sichere Zwischenstand.

## Rechtliche Prüfung

Vor der Einreichung müssen Rechte an der Bezeichnung *The Grand Mafia*, an Spielbegriffen, Logos, Screenshots und sonstigen markenbezogenen Assets geklärt werden. Die App darf keine offizielle Partnerschaft suggerieren, wenn keine schriftliche Autorisierung besteht. Datenschutz- und Support-Seiten müssen unter öffentlich erreichbaren HTTPS-URLs verfügbar sein.

## Finales Release-Gate

Der Store-Launch ist erst dann `GO`, wenn ein real signierter Android- und iOS-Build erzeugt, auf physischen Geräten geprüft, in den jeweiligen Testprogrammen validiert, mit korrekten Store-Daten beschrieben und ohne offene Billing-, Datenschutz- oder Markenrisiken eingereicht wurde. Die automatische Repository-Prüfung ersetzt keine Play-Console-, App-Store-Connect- oder Gerätefreigabe.
