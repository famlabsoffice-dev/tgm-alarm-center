# TGM ALARM CENTER — Repository Source of Truth

**Status: verbindlich**  
**Festgelegt:** 2026-09-01  
**Erweiterung:** 2026-09-05

## Verbindliche Produktionsquelle

Der GitHub-Branch `main` ist die alleinige Source of Truth für **TGM ALARM CENTER**.

Alle weiteren Arbeitsstände, lokalen Kopien und ZIP-Archive sind gegenüber `main` nachrangig und dürfen nicht eigenständig als Produktionsquelle eingesetzt werden.

## Branch-Entscheidung

`main` enthält den vollständigen Stand des Produktions-Core-Branches. Der Branch `feature/tgm-alarm-center-production-core` ist gegenüber `main` nachrangig und darf nicht als Produktionsquelle verwendet werden.

Daraus folgt:

- Keine Rückführung von `main` auf den Feature-Branch.
- Kein Rollback auf ältere Stände.
- Keine Vermischung mit externen ZIP-Ständen als vermeintliche Masterquelle.
- Änderungen werden grundsätzlich auf Basis des aktuellen `main`-Stands bewertet und umgesetzt.
- Vor einer Produktionsfreigabe sind die tatsächlichen Tests und Validierungsgates des aktuellen `main`-Stands zu prüfen.

## Referenzstand

Der jeweils aktuelle Commit von `main` ist der verbindliche Referenzstand. Commit-Hashes und Branch-Abstände werden bewusst nicht statisch in diesem Dokument festgeschrieben, damit die Source-of-Truth-Dokumentation nach weiteren legitimen Commits nicht selbst veraltet.

## Dauerhafte Produktstrategie: Track A + Track B

Die Weiterentwicklung erfolgt dauerhaft über zwei kompatible Produkttracks:

### Track A — lizenzierte / offizielle Variante

Maximale 1:1-Integration in die offizielle The-Grand-Mafia-Visualität und Markenwelt, soweit eine ausdrückliche, nachweisbare Lizenz oder Freigabe besteht. Offizielle Logos, Namen, Artwork, Icons, Typografie und besonders enge UI-/Brand-Integration sind nur innerhalb dieser autorisierten Grenze zulässig.

### Track B — eigenständige Variante

Der standardmäßige unabhängige Produktpfad. Er nutzt vollständig eigene Marken-, UI- und Asset-Identität, schöpft aber die zulässige funktionale und atmosphärische Nähe zur Mafia-/Mansion-/Event-Center-Ästhetik maximal aus. Keine irreführende Behauptung offizieller Zugehörigkeit und keine unautorisierten Originalassets.

### Gemeinsamer Kern

Track A und Track B verwenden dieselbe Domain Engine, Event Engine, Zeitlogik, Alarm Policy Engine, Notification Reliability Engine, Persistence, Backup-/Restore-Logik und QA-/Release-Infrastruktur. Brand-/Asset-/UI-Layer bleiben austauschbar.

## Verbindlicher Marken-Arbeitsname

Der aktuelle Arbeits-Branding-Kandidat für Track B ist:

**MAFIA COMMAND CENTER**  
Untertitel: **Event & Alarm Companion**

Vor Store-Launch müssen EUIPO, WIPO, USPTO, App Stores, Domains und relevante Social Handles auf Verfügbarkeit und Kollisionsrisiken geprüft werden. Der Name ersetzt keine rechtliche Markenprüfung.

Nicht als Track-B-Produktname verwenden, solange keine entsprechende Freigabe besteht: `The Grand Mafia Alarm Center`, `TGM Alarm Center`, `Grand Mafia Alert Hub`, `The Grand Mafia Companion` oder Bezeichnungen, die eine offizielle Beziehung vortäuschen.

## Verbindlicher Masterplan

Die vollständige Umsetzung der Zwei-Track-Strategie, die Event-Intelligence-Architektur, das UI-/Asset-Konzept, native Notifications, SQLite-Zielmodell, Remote Config, Community-Verifikation, Monetarisierung, QA und Roadmap stehen in:

`docs/MASTER-PRODUKTPLAN-TRACK-A-B.md`

Dieses Dokument ist ab 2026-09-05 der verbindliche Masterplan für die Integration und Erweiterung des bestehenden Projekts.

## Geltungsbereich

Diese Festlegung gilt für die weitere Entwicklung, Verifikation, Fehlerkorrektur und Release-Bewertung von TGM ALARM CENTER sowie für alle zukünftigen Erweiterungen des Produkts in Track A und Track B.
