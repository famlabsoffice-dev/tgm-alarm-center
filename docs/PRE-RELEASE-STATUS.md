# TGM ALARM CENTER — Release-Status

## Umgesetzter lokaler Gaming-Umfang

- Lokales, versioniertes Datenmodell mit Accounts und aktivem Account.
- Bubble-, GW-Bubble- und eigene Gaming-Alarmvorlagen.
- Strikte lokale Kalender- und Uhrzeitprüfung vor dem Speichern.
- Einmalige Termine und tägliche Wiederholungen.
- Absolute Zeitwerte für konkrete Termine mit Anzeige in der Gerätezeitzone.
- Tägliche Wiederholungen anhand der lokalen Wanduhr, damit Sommerzeitwechsel die eingestellte Uhrzeit nicht verschieben.
- Fünf-Tage-GW-Zyklus mit 24-Stunden-Schutzfenster, Beginn, Ende-Warnung und Ende-Ereignis.
- Vorwarnungen werden vor dem zugehörigen Hauptereignis eingeordnet.
- Ereignisbezogene Erledigungsschlüssel aus Alarm-ID und konkretem Termin.
- Schutzmarkierung unabhängig vom Aktivieren oder Pausieren.
- Duplizieren erzeugt eine neue ID, leert die Erledigungshistorie und speichert den Klon pausiert.
- Pausieren und Aktivieren aktualisieren den lokalen Browser-Scheduler.
- Lokaler Browser-Scheduler mit begrenztem Zeitfenster, Wiederaufnahme nach Tab-Pausen und Schutz vor Doppelton-Auslösung.
- Lokale Gaming-Tonprofile Pulse, Siren und Chime als echte WAV-Dateien.
- Einmalige Audio-Freigabe nach bewusster Nutzeraktion.
- Countdown, nächste Ereignisse, Alarmbestätigung, Pausieren, Duplizieren und Löschen.
- JSON-Backup und strikte atomare Wiederherstellung.
- Landscape-PWA-Konfiguration und versionierter Offline-App-Shell-Cache.
- Responsive HTML/CSS/JS-Oberfläche für Desktop, Tablet und Smartphone.
- Statisches Web-Core-Gate, JavaScript-Syntaxprüfung und Domain-Tests.

## Bewusst nicht enthalten

Das Produkt ist ausschließlich eine lokale Spielhilfe für **The Grand Mafia**. Es enthält keine Cloud-Synchronisation, keine Serverkonten und keine Schnittstellen zu externen Diensten. Es ist kein reales Gefahrenwarnsystem und keine Feuerwehr-, Rauchmelder-, Sensor-, Leitstellen- oder Sicherheitsanwendung.

Die Anwendung gibt Gaming-Alarmtöne lokal auf dem verwendeten Gerät aus. Browser- oder native lokale Benachrichtigungsmechanismen werden ausschließlich als geräteinterne Erinnerung verwendet; es gibt keine externe Weiterleitung.

## Verifizierte Prüfungen

```bash
node scripts/verify-web-core.mjs
node --check app.js
node --check sw.js
pnpm test
pnpm typecheck
```
