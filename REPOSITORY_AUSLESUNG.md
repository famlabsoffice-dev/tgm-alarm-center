# TGM ALARM CENTER — verifizierte Repository-Auslesung

**Status:** COMPLETE  
**Repository:** `famlabsoffice-dev/tgm-alarm-center`  
**Verbindlicher Stand:** Branch `main`, Commit `33e2c49a65415f80894a14110e86fe6c4f1ddfea` vom 01.09.2026, 09:01:31 UTC  
**Lokaler Arbeitsbaum:** `/home/ubuntu/tgm-alarm-center` — sauber, keine uncommitteten Änderungen

> Der Repository-eigene Referenzentscheid legt `main` als alleinige Produktionsquelle fest. Lokale Kopien, Archive sowie der Feature-Branch sind demgegenüber nachrangig.

## Produktstand

TGM ALARM CENTER ist eine **lokal betriebene Alarmzentrale für The Grand Mafia**. Die vollständige, produktführende Oberfläche ist als installierbare Web-PWA umgesetzt; zusätzlich enthält das Repository einen Expo-/React-Native-Pfad für iOS und Android. Beide Pfade arbeiten ausschließlich mit lokalen Gerätedaten und lokalen Alarmfunktionen. Es sind weder ein Backend, eine Cloud-Synchronisierung noch externe Alarm- oder Kontendienste implementiert.

| Bereich | Verifizierte Umsetzung |
|---|---|
| Web-PWA | HTML, CSS und JavaScript mit Dashboard, Navigation, Accountverwaltung, Alarmverwaltung, Tonverwaltung, Plänen und Einstellungen |
| Native App | Expo 53, React Native 0.79 und lokale Expo-Notifications mit iOS-/Android-Konfiguration |
| Datenhaltung | Browser: `localStorage`; nativ: `AsyncStorage`; jeweils mit Versionierung, Normalisierung und Migrationslogik |
| Offline-Betrieb | Versionierter Service-Worker-Cache für App-Shell, Manifest, Icon und drei WAV-Töne |
| Plattformen | Web, iOS und Android; Expo-Konfiguration mit Bundle-/Paket-ID `com.tgm.alarmcenter` |

## Fachliche Funktionen

Das Alarmmodell umfasst Bubble Alarm, Massacre Alarm, Event Alarm, Individual Timer und RSS Timer. Es unterstützt einmalige Termine, tägliche Wiederholungen und den fünf-Tage-Massacre-Zyklus. Ein Massacre-Zyklus erzeugt zusätzlich ein 24-Stunden-Schutzfenster, eine Endwarnung eine Stunde vor Ablauf und ein Ende-Ereignis. Vorwarnungen werden zeitlich vor dem jeweiligen Hauptereignis eingeordnet; bereits bestätigte Vorkommen erscheinen nicht erneut.

Die Web-Oberfläche enthält das umfassendste Bedienkonzept: Schnellvorlagen, Countdown und Timeline, Status- und Schutzmarkierungen, Bearbeiten, Pausieren, Erledigen, Duplizieren als pausierter Klon sowie Löschen. Es existieren drei eingebundene, lokale WAV-Profile: **Pulse** für Events, **Siren** für Bubble/Massacre und **Chime** für RSS-Timer. Der Browser-Audiokontext wird erst nach einer bewusst ausgelösten Freigabe aktiviert, danach spielen fällige Termine Ton und lösen – sofern verfügbar und aktiviert – Vibration aus.

| Funktion | Web-PWA | Expo-/Native-Pfad |
|---|---:|---:|
| Lokale Accounts und Planlimits | Ja | Datenmodell und Limitprüfung vorhanden |
| Alarmzeitlogik und Wiederholungen | Ja | Ja |
| Lokale Tonausgabe | Ja, WAV über Browser-Audio | Über lokale Notification-Konfiguration |
| Lokale Benachrichtigungen | Browser-Scheduler im aktiven Kontext | Geplante Expo-Notifications inklusive Aktionen |
| Backup und Wiederherstellung | JSON, validiert und atomar | JSON, validiert und atomar |
| Vollständige kommerzielle Planauswahl im UI | Ja | Nicht in der aktuell vorliegenden Native-UI sichtbar |

## Geschäfts- und Zugriffslogik

Die Preis- und Umfangslogik definiert sechs Stufen: **Free, Street Boss, Caporegime, Underboss, Boss und Godfather**. Sie steuert Account-, Alarm- und kategoriebasierte Limits. Die Web-PWA enthält EUR-Preise sowie feste Store-Listenpreise in USD und JPY für Woche, Monat, sechs Monate, Jahr und Lifetime. Zusätzlich sind eine einmalige 72-Stunden-Testphase mit Godfather-Umfang sowie eine dauerhafte Godfather-Freischaltung für die im Code hinterlegten Family-Account-Namen implementiert. Die Auswahl wird ausschließlich lokal gespeichert; es ist keine echte Store-Abrechnung oder serverseitige Lizenzprüfung implementiert.

## Architektur und Qualitätssicherung

Die zentrale Web-Implementierung liegt in `app.js` (606 Zeilen); die native Benutzeroberfläche in `App.tsx` (542 Zeilen). Die gemeinsam genutzte fachliche Engine (`src/domain/alarm.ts`) kapselt Typen, Validierung, Zeitumrechnung, Wiederholungen und Benachrichtigungszeitpunkte. Das native Datenmodell, das Pricing, Backups und Notifications sind in klar abgegrenzten TypeScript-Modulen angelegt. Das Repository enthält 41 versionierte Dateien und rund 2.627 Zeilen an HTML-, CSS-, JavaScript- und TypeScript-Code.

| Prüfschritt | Ergebnis |
|---|---|
| Abhängigkeitsauflösung mit `pnpm install --frozen-lockfile` | Erfolgreich |
| Statische Codeprüfung mit `pnpm lint` | Erfolgreich |
| Domain-, Web-Core- und Pricing-Tests mit `pnpm test` | Erfolgreich; 8 von 8 Domain-Tests bestanden |
| TypeScript-Prüfung mit `pnpm typecheck` | Erfolgreich |
| Syntaxprüfung von `app.js` und `sw.js` | Erfolgreich |
| Arbeitsbaum nach allen Prüfungen | Sauber |

Die vorhandene GitHub-Actions-Absicherung prüft den Web-Core bei Pushes und Pull Requests gegen `main`. Ein separater Workflow synchronisiert die Preiswerte der Web-Oberfläche aus der TypeScript-Preisdomain und schreibt Änderungen automatisiert nach `main` zurück.

## Einordnung des aktuellen Stands

Der aktuelle Branch stellt einen **funktionsfähigen, lokal orientierten Produkt-Core** bereit. Die Browser-PWA ist die vollständigere Endkundenoberfläche und verfügt über den aktiven Browser-Scheduler, PWA-Offline-Shell, Account- und Plandialoge sowie die umfangreichste Alarmverwaltung. Der Expo-Pfad enthält eine solide Daten-, Back-up- und Notification-Basis, bildet aber im vorliegenden UI nicht alle Web-Flächen – insbesondere Accountverwaltung und Planauswahl – vollständig ab.

Die gesamte Analyse wurde gegen den aktuellen Stand von `main` durchgeführt. Es wurden keine Produktdateien geändert und keine Commits erzeugt.

## Referenzdateien im Repository

| Datei | Zweck |
|---|---|
| `docs/REPOSITORY-SOURCE-OF-TRUTH.md` | Verbindliche Festlegung von `main` als Produktionsquelle |
| `README.md` | Produktumfang, lokale Datenhaltung, PWA- und Expo-Einstieg |
| `app.js` | Vollständiger Web-PWA-Core einschließlich UI, Scheduler, Audio, Backup und Pricing |
| `App.tsx` | Expo-/React-Native-Oberfläche |
| `src/domain/alarm.ts` | Domainmodell, Validierung und Zeitlogik |
| `src/native/notifications.ts` | Planung lokaler Expo-Notifications |
| `src/storage/store.ts` | Native Persistenz und State-Migration |
| `src/backup/backup.ts` | Native Backup-/Restore-Validierung |
| `.github/workflows/*.yml` | CI-Web-Core- und Preis-Synchronisierungs-Workflows |

