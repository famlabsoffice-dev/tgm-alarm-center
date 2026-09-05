# Live-Vorschau-Test

## Initiale Vorschau

URL: http://127.0.0.1:4173/

Die Web-Vorschau lädt erfolgreich unter dem Titel „TGM ALARM CENTER“. Die initiale Ansicht ist das bestehende Dashboard mit Audio aktivieren, Übersicht, Alarme, Accounts, Gaming-Töne, Pläne & Preise, Einstellungen, den drei Schnellstart-Aktionen sowie den Vorlagen für Bubble Alarm, Massacre Alarm, Event Alarm, Individual Timer und RSS Timer.

Der Browser hat beim ersten Laden einen Screenshot unter `/home/ubuntu/screenshots/127_0_0_1_2026-09-02_14-42-13_5358.webp` gespeichert.

Der erste Klickversuch auf „Alarme“ schlug wegen eines veralteten DOM-Snapshots fehl. Vor dem nächsten Klick muss die Seite erneut aufgenommen werden.

## Erwartete Live-Prüfungen

Die folgenden Bereiche werden nacheinander geprüft: Alarmansicht, Suche und Filter, Alarm-Editor, Accounts, Gaming-Töne, Pläne & Preise sowie Einstellungen mit Backup-Aktionen.

## Live-Test: Dashboard, Alarm-Liste und Editor

Die Alarmnavigation öffnet `http://127.0.0.1:4173/#alarms` erfolgreich. Die Ansicht zeigt „Alle Gaming-Alarme“, die drei Zusatzaktionen für Event Alarm, Individual Timer und RSS Timer sowie die Bubble-Alarm-Erstellung.

Der Bubble-Alarm-Editor öffnet sich als funktionsfähiger Dialog. Sichtbar und interaktiv sind Bezeichnung, Alarmtyp, Datum, Uhrzeit, 60-/30-/15-Minuten-Vorwarnungen, Wiederholung, Alarmton, Schutzstatus, Aktivstatus, Ton anhören, Abbrechen und Alarm speichern.

Der Live-Stand startet ohne gespeicherte Alarme. Die Eingabefelder und die echte Editorstruktur sind erreichbar.

## Live-Test: Alarm erstellen

Der Editor wurde mit „Live-Test Bubble“, dem Datum 03.09.2026 und 12:00 Uhr ausgefüllt. Das Speichern war erfolgreich.

Die Alarm-Liste zeigt anschließend einen aktiven, geschützten Bubble Alarm mit 60-Minuten-Vorwarnung, Siren-Ton, nächstem Termin 03.09.2026, 12:00 und den Aktionen Bearbeiten, Pausieren, Erledigt, Duplizieren und Löschen. Zusätzlich wurde ein Account „Mein TGM-Account“ automatisch sichtbar. Der Browser zeigte die Erfolgsmeldung „Gaming-Alarm angelegt.“.

## Live-Test nach Web-Shell-Umstellung

Die neu geladene Vorschau unter `http://127.0.0.1:4173/?preview=modern` rendert jetzt die neue statusleistenfreie Mobile-Shell: kompakter TGM-Header, goldener Titel „TGM ALARM-CENTER“, roter LIVE-Punkt, dunkle Karten, cream-goldene Typografie sowie die fixierte Bottom-Navigation.

Die Dashboard-Ansicht zeigt den gespeicherten Live-Test-Bubble-Alarm, Statusstatistiken, nächste Alarmmomente und Schnellstart-Karten. Die Accounts-Ansicht wurde erfolgreich geöffnet und zeigt den aktiven „Mein TGM-Account“, die zugehörige Alarmanzahl und den lokalen Systemstatus im neuen Kartenlayout.

## Live-Test: Gaming-Töne

Die Gaming-Töne-Ansicht ist im neuen Mobile-Look erreichbar. Pulse, Siren und Chime werden als getrennte Karten mit Tonvorschau angezeigt. Die Aktion „Audio aktivieren“ wurde erfolgreich ausgeführt; der Button wechselte auf „Audio aktiviert“, die drei Vorschauen auf „Ton anhören“ und die Erfolgsmeldung „Gaming-Alarmtöne sind aktiviert.“ wurde eingeblendet.

## Live-Test: Pläne & Preise

Die Pläne-&-Preise-Ansicht rendert im neuen mobilen Kartenlayout. Alle sechs Tarifstufen, Laufzeiten, EUR-/USD-Store-Preise, Limits und Feature-Listen sind sichtbar.

Die lokale Aktion „Testphase starten“ wurde erfolgreich ausgeführt. Der Status wechselte auf „TESTPHASE · Godfather“, die Meldung „Kostenlose Testphase gestartet. Alle Funktionen sind für 72 Stunden freigeschaltet.“ erschien und die Tarifbuttons wurden entsprechend aktualisiert.

## Live-Test: Einstellungen

Die Einstellungen sind im neuen Mobile-Look erreichbar. Sichtbar sind vier reale Alarmoptionen: Vorwarnungen mit Ton, Hauptereignisse mit Ton, Vibration auf Mobilgeräten und Zeitkritische Alarmstärke. Zusätzlich sind Backup exportieren, Backup importieren, lokale Datenlöschung sowie lokale Zeit-, Alarm- und Accountdaten sichtbar.

Ein direkter Klick auf den Checkbox-Snapshot war stale; vor dem Interaktionstest ist ein erneuter DOM-Snapshot erforderlich.

## Live-Test: neue Web-Shell und Einstellungen

Nach dem Reload mit der neuen Asset-Version ist die alte breite Desktop-Shell nicht mehr aktiv. Die Webvorschau zeigt zentriert die statusleistenfreie TGM-Mobile-Shell mit TGM-Crest, „TGM ALARM-CENTER“, rotem LIVE-Punkt, dunklen Karten und fixer Bottom-Navigation.

Die Einstellungsansicht ist direkt erreichbar. Sie zeigt die vier schaltbaren Alarmpräferenzen, Backup exportieren/importieren, lokale Datenlöschung sowie das lokale Zeitmodell. Der vorherige stale-DOM-Fehler wurde durch einen neuen Snapshot behoben.

## Live-Test: Einstellungen und Backup

Die Checkbox „Vorwarnungen mit Ton“ wurde erfolgreich umgeschaltet; die Erfolgsmeldung „Einstellung gespeichert.“ erschien und die Einstellung blieb im gerenderten State erhalten.

„Backup exportieren“ wurde aus der Einstellungen-Ansicht erfolgreich ausgelöst. Die Web-App zeigte „Backup exportiert.“.

## Live-Test: Alarm-Liste und Bearbeiten

Die Alarm-Liste rendert jetzt im neuen TGM-Mobile-Look: rote Statusakzentleiste, crimson AKTIV-Pill, goldene Schutz-/Vorwarnungs-Badges, nächster Termin, Countdown und die echten Aktionen Bearbeiten, Pausieren, Erledigt, Duplizieren und Löschen.

Der Bearbeitungsdialog öffnet sich als mobile Bottom-Sheet-Karte mit Bezeichnung, Alarmtyp, Datum, Uhrzeit, Vorwarnungen, Wiederholung, Alarmton, Schutzstatus, Aktivstatus und Speichern/Abbrechen.
