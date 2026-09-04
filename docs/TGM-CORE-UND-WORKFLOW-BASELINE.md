# TGM ALARM CENTER — Projektkern & Workflow-Baseline

**Stand:** 2026-09-04  
**Verbindliche Quelle:** `main`  
**Verifizierter HEAD:** `a44b67ca75974f905b3983d2460e0bd60c8f01ff`  
**Status dieser Baseline:** VERIFIZIERT / FESTGESCHRIEBEN

## 1. Source of Truth

`main` ist die alleinige maßgebliche Produktions- und Bewertungsquelle des TGM ALARM CENTER. Lokale Kopien, Archive und externe ZIP-Stände sind nachrangig und dürfen nicht als Ersatzquelle verwendet werden.

Diese Festlegung entspricht der bestehenden Repository-Regel in `docs/REPOSITORY-SOURCE-OF-TRUTH.md`.

## 2. Produktkern

TGM ALARM CENTER ist eine lokal betriebene Gaming-Alarmzentrale für zeitkritische Ereignisse in **The Grand Mafia**.

Der Kern ist bewusst **local-first / local-only**:

- keine Kontenserver
- keine Cloud-Synchronisierung
- keine externe Alarmdienst-Integration
- Daten verbleiben lokal auf dem jeweiligen Gerät
- Web: Browser-`localStorage`
- Native: `AsyncStorage`

Der Repository-Stand enthält zwei Produktpfade:

### 2.1 Web-PWA — vollständige Endkundenoberfläche

HTML/CSS/JavaScript mit Dashboard, Navigation, Accounts, Alarmverwaltung, Tonverwaltung, Plänen, Einstellungen, Countdown/Timeline, Status- und Schutzmarkierungen sowie Backup/Restore.

Die Web-PWA besitzt zusätzlich:

- installierbare Offline-App-Shell per Service Worker
- lokal eingebundene WAV-Töne
- browserseitigen Scheduler im aktiven Kontext
- bewusste Audio-Freigabe durch Nutzeraktion
- lokale Vibration, sofern Browser/ Gerät dies unterstützt

### 2.2 Expo-/Native-Pfad — iOS/Android

Expo 53 / React Native 0.79 mit lokaler Persistenz und Expo-Notifications. Der native Pfad stellt die lokale Notification- und Datenbasis für mobile Builds bereit.

Die native Oberfläche bildet nicht jede Web-Fläche vollständig ab; insbesondere sind in der aktuell vorliegenden Native-UI nicht alle Web-Account-/Planflächen sichtbar.

## 3. Fachlicher Alarmkern

Das aktuelle Alarmmodell umfasst:

- Bubble Alarm
- Massacre Alarm
- Event Alarm
- Individual Timer
- RSS Timer

Unterstützt werden:

- einmalige Termine
- tägliche Wiederholungen
- fünf-Tage-Massacre-Zyklus
- daraus abgeleitetes 24-Stunden-Schutzfenster
- Endwarnung eine Stunde vor Schutzfenster-Ende
- Ende-Ereignis
- zeitlich vorgeschaltete Vorwarnungen
- bereits bestätigte Vorkommen werden nicht erneut angezeigt/ausgelöst

Bedienfunktionen im Web-Core:

- Schnellvorlagen
- Countdown
- Timeline
- Bearbeiten
- Pausieren
- Erledigen / Bestätigen
- Duplizieren als pausierter Klon
- Löschen
- Alarm aktiv/inaktiv
- Tonprofilwahl
- Backup und Wiederherstellung

## 4. Ton- und Alarmkanäle

Die drei lokalen Tonprofile sind verbindlicher Produktbestandteil:

| Profil | Zweck | Ressource |
|---|---|---|
| Pulse | Events / Standardwarnungen | `assets/notifications/alarm-pulse.wav` |
| Siren | Bubble / Massacre / dringende Schutzfenster | `assets/notifications/alarm-siren.wav` |
| Chime | RSS Timer / eigene Spielereignisse | `assets/notifications/alarm-chime.wav` |

Die Web-Audiowiedergabe wird erst nach bewusster Nutzeraktion freigegeben.

## 5. Domain- und Persistenzarchitektur

Die gemeinsame Fachlogik ist in `src/domain/alarm.ts` gekapselt und umfasst insbesondere:

- Alarmtypen
- Validierung
- Zeitumrechnung
- Wiederholungen
- Benachrichtigungszeitpunkte

Weitere klar abgegrenzte native Module sind:

- Pricing
- Billing/Entitlement-Prüfungen
- Persistenz und State-Migration
- Backup/Restore
- Notifications

Backup/Restore arbeitet validiert und atomar im JSON-Format des Projekts.

## 6. Preise und Tier-Architektur

Das Preis-/Limitmodell kennt aktuell sechs Stufen:

**Free, Street Boss, Caporegime, Underboss, Boss, Godfather**.

Es steuert die zulässige Nutzung über Account-, Alarm- und Kategorie-Limits. Die Web-PWA enthält lokale Preis-/Planinformationen einschließlich EUR sowie feste Store-Listenpreise in USD und JPY.

Die Planwahl wird lokal gespeichert. Echte Store-Abrechnung und serverseitige Lizenzverifikation sind im lokalen Test-/Produktkern nicht implementiert.

### Kritische Founder-/Family-Abgrenzung

Der **aktuelle HEAD `a44b67c…` verifiziert ausdrücklich, dass die fünf Founder-/Family-Account-Namen nicht im Web-Client als Paid-Access-Bypass eingebettet sein dürfen**. Der aktuelle Web-Core-Gate prüft auf das Fehlen dieser Namen und der zugehörigen Client-Bypass-Symbole.

Damit ist für diese Baseline verbindlich:

- kein clientseitiger Founder-Paid-Access-Bypass im Web-Core des aktuellen HEAD
- kein erneutes Einbringen dieses Bypasses in `app.js`
- Änderungen an Entitlements müssen getrennt und bewusst geprüft werden

Diese Aussage beschreibt ausschließlich den **tatsächlich verifizierten Repository-Stand** und ist keine Aussage über gewünschte künftige Produktpolitik.

## 7. Workflow-Trennung — verbindliches Modell

Die GitHub-Actions-Workflows werden strikt nach Verantwortungsbereich getrennt:

### A. Web-/Release-Verifikation

**`web-core.yml` — TGM Release Verification**

Verantwortung:

- exakten Commit prüfen
- reproduzierbare Dependency-Installation
- Playwright-Browser-Smoke vorbereiten
- `pnpm verify:release` ausführen
- bei Fehlern Build-Evidence sichern

**`regression.yml` — TGM Regression Full Suite**

Verantwortung:

- Full-Suite-Regression
- Release-Contract über `pnpm verify:regression`
- Playwright-Smoke-Basis
- Regression-Evidence bei Fehlern

Diese Ebene bewertet den Web-/Gesamt-Releasevertrag; sie ist nicht mit Store-Building gleichzusetzen.

### B. Billing-/Entitlement-Sicherheit

**`billing-security-gate.yml` — Billing Security Gate**

Verantwortung:

- Legacy-Client-Bypass härten
- Billing-Sicherheitstest ausführen
- deterministische Änderungen an `app.js` gegebenenfalls automatisch committen

Diese Ebene ist ausschließlich Security-/Entitlement-Härtung, nicht allgemeine Release-Verifikation.

### C. Mobile-Qualität

**`mobile-quality.yml` — mobile-quality**

Verantwortung:

- Typecheck
- Lint
- Domain-/Repository-Tests
- Android-Reliability-Contract
- Mobile-Build-Konfiguration
- Store-Konfiguration
- öffentliche Expo-Konfiguration

Diese Ebene validiert Mobile-Qualität, erzeugt aber keinen Store-Build.

### D. Team-/Family-Test-Build

**`team-test-build.yml` — team-test-build**

Verantwortung:

- ausschließlich manuell über `workflow_dispatch`
- Plattformwahl: `all`, `android`, `ios`
- vollständige Source-Gates vor Build
- EAS-Projektbindung prüfen
- `EXPO_TOKEN` zwingend vorhanden
- EAS-Accountzugriff prüfen
- Android: signierter Preview-APK-Build
- iOS: signierter interner Preview-Build
- Build-Metadaten und Logs als Artefakte sichern

Dieser Workflow ist der **Team-Test-/Preview-Pfad** und darf nicht mit der finalen Store-Release-Verifikation gleichgesetzt werden.

### E. Android-Produktionsbuild

**`android-production-build.yml` — android-production-build**

Verantwortung:

- main als Buildquelle
- Typecheck/Lint/Test
- Android-Reliability-Gate
- Mobile-/Store-Konfigurationsgates
- `EXPO_TOKEN` prüfen
- EAS-Zugriff prüfen
- signierten Production-Android-AAB erzeugen
- Produktions-Build-Metadaten als Artefakt sichern

Dieser Workflow ist ausschließlich für den **Android-Produktionsartefakt-Pfad (AAB)**.

### F. Migration-Gates

**`migration-gates.yml` — TGM Migration Gates**

Verantwortung:

- migrationsbezogener Status
- Preflight
- database-neutraler Prüfpfad
- explizit mit `TGM_BACKEND_ENABLED=0`

Diese Ebene darf nicht als Backend-Einführung missverstanden werden. Sie prüft die Migrationsrobustheit des weiterhin lokalen Kerns.

### G. Web-Publishing

**`pages.yml` — Deploy TGM Alarm Center to GitHub Pages**

Verantwortung:

- Web-Core validieren
- GitHub-Pages-Artefakt erzeugen
- GitHub Pages Deployment durchführen

Publishing ist damit getrennt von Release-/Regression-/Mobile-Gates.

### H. Preis-Synchronisierung

**`sync-web-pricing.yml` — TGM Web Pricing Sync**

Verantwortung:

- `app.js`-Preise aus der TypeScript-Preisdomain synchronisieren
- deterministische Änderungen committen

Dieser Workflow ist ein gezielter Daten-/Code-Synchronisationsprozess und kein allgemeiner Test-Workflow.

### I. Repository-Snapshot

**`repository-snapshot.yml` — Repository Snapshot**

Verantwortung:

- ZIP direkt aus `git archive HEAD` erzeugen
- Commit-/Zeit-/Quellenmanifest schreiben
- aktuellen Repository-Snapshot als Artefakt ablegen

Der Snapshot ist eine **abgeleitete Sicherung des Git-Standes**, nicht die Source of Truth.

## 8. Verifizierte Workflow-Gesamtstruktur

Aktuell sind zehn Workflows in `.github/workflows/` vorhanden:

1. `android-production-build.yml`
2. `billing-security-gate.yml`
3. `migration-gates.yml`
4. `mobile-quality.yml`
5. `pages.yml`
6. `regression.yml`
7. `repository-snapshot.yml`
8. `sync-web-pricing.yml`
9. `team-test-build.yml`
10. `web-core.yml`

Die Verantwortlichkeiten überschneiden sich bewusst nur dort, wo ein nachgelagerter Gate-Schritt einen früheren Qualitätsschnitt erneut absichert.

## 9. Release-/Test-Hierarchie

Die operative Reihenfolge ist:

**Source of Truth → Core-Tests → Security-/Domain-Gates → Mobile-/Release-Gates → Browser-Smoke/Regression → Preview-/Team-Build → Production-Build → Publishing/Snapshot**

Dabei gilt:

- Core funktioniert unabhängig von Stores.
- Team-Tests sind unabhängig von Store-Abrechnung.
- Store-Builds benötigen EAS-Zugriff und Secrets.
- Publishing erzeugt keine neue fachliche Wahrheit.
- Snapshots sind Beweismittel/Sicherung, nicht Produktionsquelle.

## 10. Sicherheits- und Änderungsregeln für den weiteren Betrieb

Vor jeder Änderung am Kern:

1. aktuellen `main`-HEAD festhalten
2. relevante Domain-, UI- und Workflow-Abhängigkeiten bestimmen
3. keinen alten ZIP-Stand als Merge-/Restore-Quelle verwenden
4. keine Web-/Native-/Security-Logik ungeprüft vermischen
5. nach Änderung die betroffenen Gates erneut ausführen
6. bei Release-relevanten Änderungen anschließend den vollständigen Release-/Regression-Pfad prüfen

Besonders geschützt sind:

- Alarmzeitlogik
- lokale Persistenz und Migrationen
- Notification-Zeitpunkte
- GW/Massacre-Zyklus
- Tier-/Limitlogik
- Billing-Security-Gates
- Build-/Store-Konfiguration
- Team-Test-Workflow

## 11. Aktueller Verifikationsstand

Auf Repository-Ebene sind folgende Gates und Prüfpfade aktuell definiert:

- `pnpm install --frozen-lockfile`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm verify:billing-security`
- `pnpm verify:production-floor`
- `pnpm verify:javascript`
- `pnpm verify:whitespace`
- `pnpm verify:packaging`
- `pnpm verify:store-config`
- `pnpm verify:mobile-build`
- `pnpm verify:android-reliability`
- `pnpm verify:release`
- `pnpm verify:full-release`
- `pnpm verify:migrations`
- `pnpm verify:regression`
- `pnpm browser:smoke`

Die Repository-Konfiguration belegt diese Prüfpfade; ein GitHub-Connector-Lauf dieser lokalen Kommandos wurde in dieser Baseline **nicht** behauptet. Der letzte sichtbare Commit-Status für `a44b67c…` enthielt über den verwendeten Status-Endpunkt keine eingetragenen Checks.

## 12. Nicht-Veränderungsgebot für diese Baseline

Dieses Dokument beschreibt den bestehenden Stand und definiert seine Trennung. Es ersetzt keine Produktdatei und verändert keine Runtime-Logik.

Jede spätere Änderung am Kern muss gegen diese Baseline abgeglichen werden. Wird die Architektur geändert, muss diese Datei in demselben Änderungszyklus aktualisiert werden.
