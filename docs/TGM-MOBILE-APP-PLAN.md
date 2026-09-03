# TGM ALARM CENTER — Mobile-App-Plan

**Status:** Planung hinterlegt
**Produkt:** TGM ALARM CENTER
**Zielplattformen:** Android und iOS
**Ausgangsbasis:** aktueller Branch `main`
**Dokumenttyp:** verbindlicher Vorbereitungs- und Umsetzungsplan
**Autor:** Manus AI

## 1. Ziel und Leitbild

TGM ALARM CENTER wird als zuverlässige, lokal funktionierende Mobile App für Android und iOS geplant. Die App unterstützt Spieler von *The Grand Mafia* dabei, Bubble-Zeitfenster, GW-Bubble-Schutzfenster, deren Ende, eigene Events und zugehörige Vorwarnungen nicht zu verpassen.

Die mobile Umsetzung ist kein separates Demo-Produkt. Sie übernimmt die fachlichen Regeln des bestehenden TGM-Kerns und führt sie in eine native Bedienoberfläche mit lokalen Benachrichtigungen, persistenter Speicherung, Offline-Fähigkeit und reproduzierbarer Zeitberechnung über App-, Prozess- und Geräte-Neustarts hinweg.

> **Leitprinzip:** Ein Alarm gilt erst dann als produktiv umgesetzt, wenn er korrekt berechnet, dauerhaft gespeichert, lokal geplant, nach Neustarts rekonstruiert und vom Nutzer zuverlässig bestätigt oder verwaltet werden kann.

## 2. Ist-Stand des Repositorys

Das Repository enthält bereits einen produktiven Webstand sowie native Einstiegspunkte. `App.tsx` verwendet React Native und `expo-notifications`; die fachliche Logik liegt überwiegend in `src/domain`, die lokale Speicherung in `src/storage` und die nativen Benachrichtigungen in `src/native`. Das Repository beschreibt die Datenhaltung als lokal und ohne externe Alarmdienste.

| Bereich | Vorhandener Stand | Konsequenz für die Mobile-App |
|---|---|---|
| Fachliche Alarm-Engine | `src/domain` vorhanden | Als gemeinsame, UI-unabhängige Quelle der Wahrheit weiterverwenden |
| Native Oberfläche | `App.tsx` vorhanden | In eine klare Mobile-Navigation und screen-orientierte Struktur überführen |
| Lokale Speicherung | `src/storage` vorhanden | Persistenz, Migrationen und Wiederherstellung auf mobilen Neustart prüfen |
| Benachrichtigungen | `src/native/notifications.ts` und Expo Notifications vorhanden | Scheduling, Berechtigungen, Sounds und Plattformgrenzen end-to-end absichern |
| Alarm-Sounds | WAV-Dateien unter `assets/notifications` vorhanden | Als native Notification-Sounds paketieren und auf Android/iOS validieren |
| Web-App | HTML/CSS/JavaScript mit Service Worker | Als bestehende Oberfläche erhalten; Mobile-App separat validieren |
| Tests und Gates | Typecheck, Lint, Tests, Release- und Store-Skripte vorhanden | Um native Geräte-, Berechtigungs- und Notification-Gates erweitern |

## 3. Verbindlicher Funktionsumfang

### 3.1 Alarmtypen

Die App unterstützt drei Alarmtypen mit editierbaren Vorbelegungen:

| Alarmtyp | Standardtitel | Standardvorwarnungen | Wiederholung | Standardton |
|---|---|---|---|---|
| Bubble | Bubble-Zeitfenster | 60 und 15 Minuten | einmalig | Pulse |
| GW Bubble | GW-Zeitfenster | 60, 30 und 15 Minuten | einmalig | Siren |
| Eigenes Event | Mein TGM-Event | 15 Minuten | einmalig | Chime |

Die Typauswahl muss visuell eindeutig sein. Jede Vorlage darf anschließend vollständig angepasst werden.

### 3.2 GW-Bubble-Sonderlogik

Der GW-Bubble-Zyklus wird als absolutes Zeitmodell umgesetzt. Unterstützt werden ein 5-Tage-Zyklus, ein 24-stündiges Schutzfenster, eine Vorwarnung vor dem Beginn, der Beginn, eine Vorwarnung vor dem Ende, das Ende und die korrekte Berechnung des nächsten Zyklus. Während des Schutzfensters zeigt die App eindeutig „Bubble aktiv“ und die verbleibende Zeit an; vor dessen Ablauf wird der Status „Bubble endet“ verwendet.

Die Berechnung darf nicht an einen laufenden UI-Timer gebunden sein. Sie muss aus gespeicherten absoluten Zeitwerten rekonstruiert werden können und darf erledigte Ereignisse nach Neustarts nicht erneut auslösen.

### 3.3 Eigene Events und Wiederholungen

Nutzer können eigene Events benennen, terminieren, mit Vorwarnungen versehen, aktivieren, deaktivieren, bearbeiten, löschen, duplizieren und als erledigt markieren. Einmalige Events müssen in der Zukunft liegen. Tägliche Events behalten ihren Zyklus, berechnen den nächsten konkreten Termin und zeigen keine veralteten vergangenen Termine als aktuell an. Die Datenstruktur wird so angelegt, dass spätere Wiederholungsregeln ergänzt werden können, ohne bestehende Datensätze zu zerstören.

### 3.4 Zeitmodell

Alarme werden intern als absolute UTC-Zeitwerte gespeichert. Die Oberfläche zeigt die lokale Gerätezeit. Ein Wechsel der Zeitzone darf den absoluten Termin nicht verändern; nur die lokale Darstellung darf sich ändern. Frühjahrssprung, Herbstumstellung, lokale Datumsgrenzen und tägliche Wiederholungen über die Sommerzeit gehören zum Testumfang.

### 3.5 Lokale Benachrichtigungen

Die App fordert Benachrichtigungsberechtigungen bewusst und verständlich an, verarbeitet den Fall einer Ablehnung und führt den Nutzer zu den Systemeinstellungen, wenn eine spätere Aktivierung erforderlich ist. Für jeden Alarm werden Haupttermin und aktivierte Vorwarnungen geplant. Änderungen, Deaktivierungen, Löschungen und Erledigungen müssen alte Planungen zuverlässig entfernen oder ersetzen.

Android- und iOS-spezifische Einschränkungen, insbesondere exakte Alarmplanung, Hintergrundverhalten, Berechtigungszustände, Notification Channels, Sound-Zuordnung und Neustart-Recovery, werden in separaten Plattformtests geprüft. Die Oberfläche darf einen Alarm nicht als erfolgreich geplant anzeigen, wenn das Betriebssystem die Planung nicht bestätigt.

### 3.6 Lokale Daten und Backup

Accounts, Alarme, Einstellungen, Notification-Präferenzen und der aktive Tarif werden lokal gespeichert. Backup und Wiederherstellung bleiben Bestandteil des Funktionsumfangs. Importierte Daten werden vor dem Speichern schema-validiert; ungültige oder inkompatible Daten werden mit einer verständlichen Fehlermeldung abgewiesen, ohne den bestehenden Datenbestand zu überschreiben.

## 4. Zielarchitektur

Die Architektur trennt Fachlogik, Persistenz, native Plattformdienste und Darstellung. Dadurch kann die bestehende Domänen-Engine weiterverwendet und unabhängig von React Native getestet werden.

| Schicht | Verantwortung | Geplante Struktur |
|---|---|---|
| UI und Navigation | Screens, Tabs, Formulare, Statusanzeigen, Accessibility | `App.tsx` beziehungsweise screen-orientierte Komponenten |
| Application State | Alarmbestand, Einstellungen, Berechtigungs- und Readiness-Zustand | React State/Context; Persistenz über Storage-Service |
| Domain | Alarmtypen, Validierung, UTC-Zeitmodell, Wiederholung, GW-Zyklus | `src/domain` als UI-freie Quelle der Wahrheit |
| Storage | Versioniertes Schema, Migration, Backup/Restore | `src/storage` mit atomarem Schreiben und Fehlerbehandlung |
| Native Adapter | Notifications, Sounds, Plattformberechtigungen, App-Lifecycle | `src/native` mit klaren Android-/iOS-Adaptern |
| Assets und Konfiguration | App-Icon, Splash, Sounds, Bundle-Identifier, EAS-Konfiguration | `assets`, `app.json`, `eas.json` |
| Qualitätssicherung | Unit-, Integrations-, Geräte- und Store-Gates | `tests` und bestehende `scripts` erweitern |

Der State wird nicht aus UI-Timern abgeleitet. Für Anzeige-Countdowns wird die verbleibende Zeit aus `eventTime - currentTime` neu berechnet. Alle Änderungen an Alarmen laufen über validierte Domain-Funktionen und aktualisieren anschließend persistente Daten sowie die nativen Planungen.

## 5. Mobile-Navigation und Screens

Die App erhält eine verständliche, kurze Navigation mit einem Dashboard als Einstiegspunkt. Der genaue Navigationsmechanismus wird im Implementierungsschritt an den bestehenden Expo-Stand angepasst; die fachlichen Ziele der Screens sind verbindlich.

| Screen | Zweck | Zentrale Aktionen |
|---|---|---|
| Dashboard | Nächste Alarme, Countdown, aktive GW-Bubble und Status | Alarm öffnen, bestätigen, pausieren, duplizieren |
| Alarm-Editor | Neue und bestehende Alarme vollständig verwalten | Typ, Titel, Datum, Uhrzeit, Vorwarnungen, Wiederholung, Ton, Schutzstatus |
| Schnellstart | Vorlagen für Bubble, GW Bubble und eigenes Event | Vorlage auswählen und anschließend bearbeiten |
| Alarmdetails | Vollständige Übersicht eines Alarms | Bearbeiten, aktivieren/deaktivieren, erledigen, löschen |
| Kalender-/Listenansicht | Chronologische Übersicht und Tageswiederholungen | Filtern, sortieren, Termin öffnen |
| Einstellungen | Benachrichtigungen, Töne, Vibration, Zeitdarstellung, Tarif, Datenschutz | Präferenzen ändern und Berechtigungen prüfen |
| Backup und Wiederherstellung | Lokale Sicherung exportieren und importieren | Datei auswählen, validieren, wiederherstellen |
| Konto und Tarif | Bestehende Account-/Tier-Funktionen abbilden | Tarifstatus anzeigen und lokal verwalten |

Jeder Screen verwendet sichere Bereiche für Statusleiste und Home Indicator. Scrollbare Inhalte werden als mobile Listen umgesetzt; Alarm- und Aktionselemente erhalten sichtbares Press-Feedback, Ladezustände und Fehlerrückmeldungen.

## 6. Umsetzungsphasen

### Phase 1 — Bestandsaufnahme und technische Baseline

Die bestehenden Domain-, Storage- und Notification-Module werden inventarisiert. Es wird festgelegt, welche Teile unverändert übernommen, welche Adapter ergänzt und welche UI-Teile aus `App.tsx` in wiederverwendbare Komponenten aufgeteilt werden. Vor Änderungen werden `typecheck`, `lint` und die vorhandenen Tests als Baseline ausgeführt und dokumentiert.

### Phase 2 — Mobile Shell und Navigation

Die native App erhält eine stabile Grundstruktur, einen Dashboard-Einstieg, die Alarm-Liste, den Editor, Details und Einstellungen. App-Name, Bundle-Identifier, Icons, Splash-Screen, Statusbar-Verhalten und App-Links werden für Android und iOS konsistent konfiguriert.

### Phase 3 — Alarmverwaltung und Domänenintegration

Bubble, GW Bubble und eigene Events werden über eine gemeinsame validierte Alarmstruktur angebunden. Schnellstartvorlagen, CRUD-Aktionen, Schutzstatus, Erledigung, Aktivierung und Duplizierung werden vollständig umgesetzt. Die UI zeigt nur Zustände, die aus dem tatsächlichen Domain- und Storage-State stammen.

### Phase 4 — Scheduling, Recovery und Plattformverhalten

Vorwarnungen, Haupttermine, GW-Bubble-Beginn und GW-Bubble-Ende werden nativ geplant. Bei Alarmänderungen werden bestehende Requests synchronisiert. Beim App-Start, bei Resume, nach Prozessende und nach Geräte-Neustart wird der aktuelle Datenbestand geladen und die notwendige Planung rekonstruiert. Nicht unterstützte oder verweigerte Plattformzustände werden sichtbar behandelt.

### Phase 5 — Persistenz, Backup und Offline-Betrieb

Das lokale Datenmodell erhält eine Versionierung mit Migrationen. Backup und Restore werden gegen beschädigte, alte und inkompatible Dateien abgesichert. Der Kernbetrieb muss ohne Netzwerkverbindung funktionieren; externe Dienste dürfen für lokale Alarme keine Voraussetzung sein.

### Phase 6 — Qualitätssicherung und Store-Vorbereitung

Neben bestehenden JavaScript- und Domain-Tests werden native Tests für Berechtigungen, Scheduling, Zeitzonen, Sommerzeit, Lifecycle und Sound-Zuordnung ergänzt. Android- und iOS-Builds werden in isolierten Installationen geprüft. Erst nach bestandenen Gates werden Store-Metadaten, Screenshots, Datenschutz- und Supportseiten als releasefähig betrachtet.

## 7. Test- und Abnahmekriterien

Die Mobile-App gilt erst als vorbereitungs- und umsetzungsbereit, wenn alle folgenden Kriterien in der Zielumgebung nachweisbar sind.

| Prüffeld | Abnahmekriterium |
|---|---|
| Alarmanlage | Jeder Alarmtyp kann erstellt, validiert, gespeichert und angezeigt werden. |
| Zukunftsprüfung | Ein einmaliger Termin in der Vergangenheit wird abgewiesen. |
| GW-Zyklus | Beginn, aktive Dauer, Ende, Vorwarnungen und nächster Zyklus sind reproduzierbar korrekt. |
| Persistenz | Alarme und Einstellungen überstehen App-, Prozess- und Geräte-Neustart. |
| Scheduling | Änderungen, Deaktivierungen und Löschungen hinterlassen keine veralteten aktiven Requests. |
| Zeitmodell | UTC-Speicherung, lokale Anzeige, Zeitzonenwechsel und DST-Fälle sind getestet. |
| Berechtigungen | Erlaubnis, Ablehnung, späteres Wiederfreigeben und nicht unterstützte Zustände sind verständlich behandelt. |
| Offline | Kernfunktionen für lokale Alarme funktionieren ohne Netzwerk. |
| Backup | Gültige Sicherungen werden wiederhergestellt; ungültige Dateien beschädigen keinen Bestand. |
| UX | Es gibt keine leeren Aktionen, keine unklaren Dead Ends und sichtbares Feedback bei Nutzeraktionen. |
| Plattformen | Android und iOS werden jeweils auf Notification-Sound, Hintergrundplanung und Lifecycle geprüft. |
| Qualität | Typecheck, Lint, bestehende Tests und native Release-Gates bestehen ohne Secrets oder Build-Artefakte im Commit. |

## 8. Risiken und Gegenmaßnahmen

| Risiko | Gegenmaßnahme |
|---|---|
| Betriebssystem begrenzt exakte Hintergrundalarme | Plattformstatus erfassen, Verhalten dokumentieren und nur bestätigte Planung als aktiv anzeigen. |
| Notification-Berechtigung wird verweigert | Onboarding-Hinweis, Statusanzeige und direkter Weg zu den Systemeinstellungen. |
| Zeitzonen- oder DST-Fehler | UTC als persistente Quelle, lokale Formatierung nur bei Darstellung, automatisierte Grenzfalltests. |
| Doppelte Benachrichtigungen nach Recovery | Eindeutige Request-IDs, Generationen-/Synchronisationslogik und idempotentes Rescheduling. |
| Beschädigte lokale Daten | Versioniertes Schema, Validierung, atomare Speicherung und sichere Backup-Wiederherstellung. |
| Sound- oder Channel-Abweichungen | Native Build-Assets und reale Geräteprüfung für jede Plattform. |
| Web- und Native-Logik driftet auseinander | Gemeinsame Domain-Engine und fachliche Tests, keine parallele Neuentwicklung der Regeln. |
| Große bestehende `App.tsx` erschwert Wartung | Schrittweise Extraktion nach Screens, Komponenten und Services ohne fachliche Änderung in einem Schritt. |

## 9. Repository- und Änderungsregeln

Die Entwicklung erfolgt auf Basis des aktuellen `main`-Stands, der als alleinige Source of Truth gilt. Jede fachlich zusammenhängende Änderung wird klein, prüfbar und mit einer beschreibenden Commit-Nachricht gespeichert. Vor jedem Commit werden Diff, Secret-Scan, Typecheck, Lint und die relevanten Tests ausgeführt.

Die Planungsdatei dokumentiert ausschließlich die Vorbereitung. Sie verändert keine bestehende Web- oder Native-Funktion. Die bestehende Masterplanung bleibt vollständig gültig und wird durch dieses Dokument lediglich um eine mobile, screen- und plattformorientierte Umsetzungsstruktur ergänzt.

## 10. Definition of Done für die Mobile-App-Vorbereitung

Die Vorbereitung ist abgeschlossen, wenn der Plan im Repository versioniert ist, der aktuelle Codebestand als Ausgangslage erfasst wurde, die Mobile-Zielarchitektur feststeht, der vollständige Alarm- und Scheduling-Umfang beschrieben ist, die Implementierungsphasen priorisiert sind und die Abnahme- sowie Release-Gates eindeutig festgelegt wurden.

Die tatsächliche Mobile-App-Implementierung beginnt erst nach dieser Planungsfreigabe. Sie muss alle in diesem Dokument und im bestehenden Masterplan verbindlich definierten Anforderungen erfüllen; ein bloßes Verpacken der Web-App oder eine Oberfläche mit simulierten Alarmzuständen ist nicht ausreichend.
