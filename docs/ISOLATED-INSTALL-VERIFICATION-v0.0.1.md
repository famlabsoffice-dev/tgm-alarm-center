# Isolierte Installations- und Startprüfung — TGM ALARM CENTER v0.0.1

## Prüfstand

Die Prüfung verwendet ausschließlich das Release-Archiv `tgm-alarm-center-v0.0.1-web.zip`, entpackt nach `/tmp/tgm-installed-v0.0.1`. Der Quellcheckout wird vom gestarteten Webserver nicht als Webroot verwendet.

Der SHA-256-Check des Archivs ist erfolgreich:

`f740f8ee2479bd417692b6c0387a2a67556c9386a63c3a4ca0a719e3a3fd510c`

Das Build-Manifest weist als Quell-Commit exakt `416c98ca64028d4501b8230844deb03a8a118223` aus. Die isolierte Webroot enthält 10 Dateien einschließlich `index.html`, `app.js`, `styles.css`, `sw.js`, `manifest.webmanifest`, `icon.png`, `BUILD-MANIFEST.json` sowie den drei Benachrichtigungs-Audiodateien.

## Installations- und Startbefund

Die Archivintegrität wurde mit `unzip -t` bestätigt. Ein kontrollierter statischer HTTP-Server wurde ausschließlich gegen `/tmp/tgm-installed-v0.0.1` gestartet. Der Browserstart unter `http://127.0.0.1:4174/` war erfolgreich.

Bestätigt wurden der Dokumenttitel `TGM ALARM CENTER`, die sichtbare Dashboard-Oberfläche, die Navigation, der Schnellstart-Bereich und die lokalen Alarmvorlagen. Es wurden beim Start keine offensichtlichen Ladefehler beobachtet.

## Browser-Kernflow bisher

Der primäre Button `Bubble Alarm anlegen` öffnet im isolierten Build den vollständigen Alarm-Editor mit Bezeichnung, Alarmtyp, Datum, Uhrzeit, Vorwarnungen, Wiederholung, Alarmton, Schutzstatus, Aktivstatus und Speichern-/Abbrechen-Aktionen. Der Editor rendert vollständig und interaktiv.

Die Prüfung wird mit Speichern, Reload/Persistenz und der isolierten Verfügbarkeit der statischen Assets fortgesetzt.

## Editor- und Speicherbefund

Im isolierten Browser wurde der Testalarm `Isolierter Installationscheck` mit Datum `2026-09-01`, Uhrzeit `18:00` und den Standard-Vorwarnungen gespeichert. Der Dashboard-State wechselte erfolgreich auf einen aktiven, geschützten Alarm mit drei geplanten Momenten (60 Minuten, 15 Minuten und Hauptereignis). Die Alarmkarte mit Bearbeiten-, Pausieren-, Erledigt-, Duplizieren- und Löschen-Aktionen ist sichtbar; ein Bestätigungs-Toast meldet die erfolgreiche Anlage.

## Reload-, Persistenz- und Runtime-Befund

Nach einem vollständigen Reload bleiben Dashboard und `Isolierter Installationscheck` sichtbar. Der Browser hält den State unter `tgm-alarm-center-web-v2` mit 900 Bytes lokaler Stategröße.

Die direkte Browserprüfung bestätigt den Dokumenttitel `TGM ALARM CENTER`, ein sichtbares Dashboard mit Schnellstart, eine sichtbare Alarmkarte, das geladene Script `app.js?v=17`, das geladene Stylesheet `styles.css?v=5` und eine aktive Service-Worker-Steuerung über `sw.js`. Damit sind der entpackte Start, lokale Persistenz und die zentrale Runtime im isolierten Webroot bestätigt.

## HTTP- und Fehlerfreiheitsbefund

Die Browserkonsole blieb nach Start, Editor-Flow und Reload ohne JavaScript- oder Service-Worker-Fehler.

Alle zehn ausgelieferten Web-Ressourcen antworten aus der isolierten Webroot mit HTTP 200: HTML, JavaScript, CSS, Service Worker, Manifest, Icon, Build-Manifest und die drei WAV-Dateien. Ein nicht vorhandener Pfad antwortet mit HTTP 404. Ein über den URL-Pfad angeforderter Parent-Pfad konnte nicht aus der Webroot gelesen werden und antwortet ebenfalls mit HTTP 404.

## Gesamtstatus

Die vollständige isolierte Installations- und Startprüfung ist erfolgreich abgeschlossen. Das Release-Archiv ist integer, der Tag-Commit ist im Build-Manifest verankert, der entpackte Build startet über HTTP, der Service Worker wird registriert, lokale Persistenz funktioniert nach Reload, der zentrale Alarm-Editor kann speichern und die ausgelieferten Assets sind erreichbar.

Status: **PASS**
