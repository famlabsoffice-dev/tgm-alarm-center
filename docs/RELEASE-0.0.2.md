# TGM ALARM CENTER — Release Upgrade 0.0.2

**Release-Datum:** 5. September 2026  
**Öffentlicher Link:** https://famlabsoffice-dev.github.io/tgm-alarm-center/  
**QR-Link:** identisch mit dem öffentlichen Link  
**Quellstand:** `e59d039d924d119211a4aa49b38154bfbc8ef42a`

## Kurz erklärt — Deutsch

Release 0.0.2 macht aus der bisherigen Alarm-App eine klarere und zuverlässigere Kommandozentrale für Gaming-Termine. Auf der Startseite sieht man sofort den nächsten wichtigen Alarm und den Countdown. Alarme können einmalig, täglich oder im 5-Tage-Zyklus laufen und mehrere Vorwarnungen haben. Die App spielt lokale Töne ab, kann vibrieren und bleibt auch ohne Benutzerkonto und ohne Cloud-Dienst nutzbar.

Zusätzlich können mehrere lokale Accounts verwaltet, Alarme bearbeitet, pausiert, erledigt, dupliziert und gelöscht werden. Die Daten bleiben auf dem Gerät. Mit Backup und Wiederherstellung lassen sich die lokalen Alarmdaten sichern. Die Version enthält außerdem Schutzprüfungen für Berechtigungen, Account-Trennung, Benachrichtigungsplanung, Datenwiederherstellung und lokale Entitlements.

## Simple explanation — English

Release 0.0.2 turns the existing alarm app into a clearer and more reliable command center for gaming events. The home screen immediately shows the next important alarm and its countdown. Alarms can run once, every day, or in a five-day cycle, with several advance warnings. The app can play local sounds, vibrate, and work without a user account or cloud service.

Users can manage several local profiles and edit, pause, complete, duplicate, or delete alarms. Data stays on the device. Backup and restore protect local alarm data. The release also adds safety checks for permissions, profile separation, notification scheduling, data recovery, and local entitlement handling.

## Vorschau-Screenshots

| Ansicht | Datei | Inhalt |
|---|---|---|
| Dashboard | `release-previews/0.0.2/01-dashboard.png` | Startseite und Schnellstart |
| Alarm-Editor | `release-previews/0.0.2/02-alarm-editor.png` | Alarmtyp, Datum, Uhrzeit und Vorwarnungen |
| Aktiver Alarm | `release-previews/0.0.2/03-alarm-dashboard.png` | Kommandozentrale mit Countdown und Schutzstatus |
| Einstellungen | `release-previews/0.0.2/04-settings-backup.png` | Lokale Einstellungen und Backup/Wiederherstellung |

## Bewertung und Bezifferung

| Kategorie | Bewertung | Begründung |
|---|---:|---|
| Funktionsumfang | 9,0/10 | Alarmtypen, Wiederholungen, Vorwarnungen, lokale Töne, Accounts und Backup sind enthalten. |
| Zuverlässigkeit | 9,0/10 | Domain-, Storage-, Notification-, Backup- und Account-Grenzen sind automatisiert getestet. |
| Bedienbarkeit | 8,5/10 | Nächster Alarm und Countdown stehen im Mittelpunkt; die wichtigsten Aktionen sind direkt erreichbar. |
| Datenschutz | 9,0/10 | Alarmdaten werden lokal verarbeitet; kein Cloud-Zwang für die Kernfunktion. |
| Technische Qualität | 9,0/10 | Typecheck, Lint, Release-Build und Browser-Smoke bestanden. |
| Store-Reife | 7,0/10 | Code- und Asset-Gates bestehen; signierte AAB-/IPA-Builds, reale Store-Produkte, Markenfreigaben und finale externe Store-Formulare bleiben offen. |
| **Gesamt** | **8,6/10** | **Starkes, technisch validiertes Release mit klar abgegrenzten externen Store-Aufgaben.** |

### Messbare Release-Kennzahlen

- **86 von 86** automatisierten Tests bestanden.
- **0** fehlgeschlagene Tests.
- **0** Fehler in TypeScript-Typecheck und Release-Build.
- **11** Release-Gate-Stufen erfolgreich durchlaufen.
- **4** Browser-Smoke-Flows erfolgreich geprüft: Start, Alarmanlage, Persistenz/Account-Isolation und Backup-Wiederherstellung.
- **5** lokale Alarmtypen verfügbar: Bubble, Massacre, Event, Individual und RSS.
- **3** lokale Tonprofile verfügbar: Pulse, Siren und Chime.
- **3** Wiederholungsarten verfügbar: einmalig, täglich und alle fünf Tage.
- **3** Standard-Vorwarnungen verfügbar: 60, 30 und 15 Minuten.
- **2** Sprachen in der Oberfläche: Deutsch und Englisch.
- **1** bestehender öffentlicher Link, dessen zentrale Assets bytegenau mit dem geprüften lokalen Release übereinstimmen.

## Release-Status

**Technischer Status:** PASS  
**Öffentlicher Web-Link:** erreichbar und geprüft  
**Browser-Smoke:** PASS  
**Store-Einreichung:** noch nicht freigegeben, solange externe Signierung, Store-Konten, reale Produkte, Datenschutz-/Support-URLs und Markenfreigaben nicht nachgewiesen sind.
