# TGM ALARM CENTER — GO-TO-MARKET & SKALIERUNGS-ROADMAP

## Strategische Leitentscheidung

TGM ALARM CENTER wird nicht als allgemeine Alarm-App positioniert. Die Kernpositionierung ist eine spezialisierte lokale Alarmzentrale für aktive The Grand Mafia-Spieler, insbesondere für Faction-Mitglieder mit wiederkehrenden Bubble-, Massacre- und Event-Zeitfenstern.

Der Markteintritt ist community-first: zuerst relevante Factions mit hoher Nutzungstiefe gewinnen, danach erfolgreiche Nutzungsmuster über weitere Communities und Sprachen vervielfältigen. Breite bezahlte Werbung startet erst, wenn Aktivierung, Retention und Bezahlconversion belastbar nachgewiesen sind.

### 90-Tage-Ziel

Nicht maximale Installationszahl, sondern Nachweis von drei Verhaltenssignalen:

1. Nutzer legen regelmäßig Alarme an.
2. Nutzer kehren zu relevanten Zeitpunkten zurück.
3. Nutzer bezahlen für zusätzlichen Umfang.

## Phase 0 — Launch-Basis, Tag 1–7

### Definition of Done

| Bereich | Zielzustand |
|---|---|
| Produktseite | Ein Satz zur Funktion, Screenshots, Plattformen, Preise, Support und Datenschutz sichtbar |
| Benennung | Bubble Alarm, Massacre Alarm, Event Alarm, Individual Timer und RSS Timer konsistent |
| Rechtliche Klarheit | Keine Darstellung als offizielles TGM-Produkt; Namens-, Marken- und Store-Prüfung dokumentiert |
| Onboarding | Neuer Nutzer legt in höchstens drei Minuten den ersten Alarm an |
| Audio | Siren, Pulse und Chime bewusst aktivier- und testbar |
| Store-Readiness | App-ID, Notification-Sounds, Datenschutzangaben, Screenshots und Version konsistent |
| Messung | Installation, Aktivierung, erster Alarm, zweite Nutzung, Upgrade und Kündigung messbar |
| Support | Supportadresse und Antwortprozess für Fehler, Erstattungen und Löschanfragen vorhanden |

### Intern bereits fest verankert

- Lokale Speicherung und Offline-App-Shell.
- Lokale Alarmtöne: Pulse, Siren und Chime.
- Einheitliche Produktbezeichnungen in der Web-Oberfläche.
- Lokale Plan- und Preisdefinitionen inklusive Free Trial und Store-Listenpreisen.
- Accounts, Alarmplanung, Wiederholungen, GW/Massacre-5-Tage-Zyklus, Vorwarnungen, Countdown, Bestätigung, Pausieren, Duplizieren, Löschen und Backup/Restore.
- Account-Isolation für sichtbare Alarme und account-scoped Mutationen.
- Notification-Scheduling bleibt unabhängig von der aktuell ausgewählten UI-Account-Ansicht.
- Browser-Smoke-Locale auf `de-DE` deterministisch festgelegt.

### Externe Launch-Gates — bewusst nicht simuliert

Folgende Punkte benötigen eine externe Identität, einen Store, einen Dienst oder eine rechtliche Prüfung und werden nicht durch erfundene Werte als erledigt markiert:

- produktive Supportadresse und tatsächlich erreichbarer Supportkanal
- finale Marken-/Namensprüfung
- finale Store-Einreichung und App-ID-Zuordnung
- produktive Store-Datenschutz-/Listing-Felder
- externe Analytics-/Conversion-Infrastruktur
- reale Installations- und Kündigungsdaten

## Phase 1 — Community Proof, Tag 8–30

Ziel: hohe Nutzungstiefe statt Reichweite.

- Erste Factions mit aktivem Bubble-/Massacre-/Event-Management als Kernzielgruppe.
- Onboarding auf den ersten erfolgreichen Alarm optimieren.
- Erfolgssignal: wiederholte Nutzung ohne manuelle Erklärung.
- Feedback nach konkreten Alarmereignissen sammeln, nicht nach bloßen Installationen.
- Häufige Alarmmuster als Templates priorisieren.
- Keine breite Paid-Acquisition vor belastbarer Retention.

## Phase 2 — Retention Engine, Tag 31–60

Ziel: aus gelegentlicher Nutzung eine tägliche bzw. ereignisgetriebene Gewohnheit machen.

- Wiederkehrende Bubble-/Massacre-Fenster in den Mittelpunkt stellen.
- Zweite Nutzung als zentrale frühe Retention-Metrik behandeln.
- Audio- und Notification-Zuverlässigkeit vor Feature-Ausweitung priorisieren.
- Account-Wechsel und Multi-Account-Nutzung als Retention-Schutz behandeln.
- Upgrade-Momente an echte Nutzungsgrenzen koppeln, nicht an aggressive Unterbrechungen.

## Phase 3 — Monetization Proof, Tag 61–90

Ziel: Zahlungsbereitschaft bei Nutzern mit nachgewiesenem Nutzen.

- Free als funktionierender Einstieg erhalten.
- Premium über Umfang, Accounts, Alarme und Timer differenzieren.
- Conversion nach aktivem Nutzen messen: erster Alarm → wiederholte Nutzung → Limit erreicht → Upgrade.
- Lifetime als hochpreisige Alternative für Power-User erhalten.
- Keine Preisoptimierung anhand einzelner Ausreißer; Entscheidungen erst nach ausreichender Stichprobe.

## Phase 4 — Community Scaling

Erst nach nachgewiesener Aktivierung, Retention und Conversion:

1. Erfolgreiche Faction-Onboarding-Muster standardisieren.
2. Weitere Factions und Community-Hubs erschließen.
3. Erfolgreiche Copy und Templates lokalisieren.
4. Sprachen schrittweise erweitern.
5. Erst danach kontrollierte Paid-Acquisition testen.

## Phase 5 — Skalierungsmodell

Die Skalierung folgt dem Verhältnis **Nutzungstiefe → Retention → Conversion → Reichweite**.

Priorität:

1. Produktzuverlässigkeit
2. Account-Isolation
3. Notification-Reliability
4. Wiederkehrende Nutzung
5. Monetization Proof
6. Community Expansion
7. Lokalisierung
8. Paid Acquisition

## Messmodell ohne externe Infrastruktur

Bis eine externe Analytics-Infrastruktur verfügbar ist, werden Produktentscheidungen ausschließlich anhand vorhandener lokaler Zustände und reproduzierbarer Tests vorbereitet. Es werden keine externen Nutzerzahlen erfunden.

Definierte Ereignisse:

- `install`: Erstkontakt/Installation, soweit durch die jeweilige Plattform technisch feststellbar.
- `activation`: erster erfolgreich gespeicherter Alarm.
- `first_alarm`: erster angelegter Alarm.
- `second_use`: erneute sinnvolle Nutzung nach dem ersten Alarm.
- `upgrade`: Wechsel in einen kostenpflichtigen Plan.
- `cancellation`: Kündigung bzw. Ende eines kostenpflichtigen Plans.

## Produktpositionierung

**Kernbotschaft:** Eine lokale Alarmzentrale für The Grand Mafia, die Bubble-, Massacre- und Event-Zeitfenster zuverlässig im Blick hält.

**Primärer Nutzer:** aktiver Spieler mit wiederkehrenden zeitkritischen Faction-/Event-Abläufen.

**Primärer Nutzen:** weniger verpasste Schutz- und Eventfenster bei minimalem Bedienaufwand.

**Differenzierung:** lokale, spielbezogene Alarmplanung statt generischer Reminder-App.

## Status

**INTERNER GTM-PLAN: COMPLETE**

Alle ohne externe Infrastruktur sinnvoll vorbereitbaren Go-to-Market-Entscheidungen und Qualitätskriterien sind definiert. Externe Launch-Gates werden erst nach realer Einrichtung als bestanden gewertet.