# TGM ALARM CENTER — Interner Teamtest

## Zweck

Diese Anleitung beschreibt die interne Testversion der TGM ALARM CENTER App. Sie dient ausschließlich der Prüfung der eigentlichen App-Funktionen. App-Store-Produkte, In-App-Käufe, Billing und der produktive Billing-Server sind für diesen Test nicht erforderlich.

## Interne Buildprofile

Das Repository enthält im `eas.json` das Profil `team`. Es erzeugt eine direkt installierbare Android-APK und einen internen iOS-IPA-Build. Beide Builds verwenden dieselbe native App-Oberfläche und dieselbe Alarm-, Speicher-, Backup- und Benachrichtigungslogik wie die geplante Produktions-App.

| Plattform | Artefakt | Installation | Store-Anbindung erforderlich |
|---|---|---|---|
| Android | APK | APK auf Testgeräten installieren; gegebenenfalls Installation aus unbekannter Quelle einmalig erlauben | Nein |
| iOS | internes IPA | Geräte müssen für den internen Ad-hoc-Build registriert sein; anschließend Installation über den bereitgestellten internen Verteilungslink oder das IPA | Nein, Apple-Entwickler- und Geräteberechtigungen sind für iOS technisch trotzdem erforderlich |
| Web/PWA | ZIP unter `dist/tgm-alarm-center-web.zip` | Auf einem HTTP(S)-Server bereitstellen oder lokal über den vorgesehenen Webserver starten | Nein |

## Buildbefehle

Vor dem Build müssen Node.js, pnpm und ein angemeldeter EAS-Zugang mit Berechtigung für das Expo-Projekt verfügbar sein. Der EAS-Zugang dient ausschließlich der Erzeugung der internen Testartefakte; es wird kein Store-Upload ausgelöst.

```bash
pnpm install --frozen-lockfile
pnpm build:team:android
pnpm build:team:ios
```

Der Android-Befehl erzeugt einen internen APK-Build. Der iOS-Befehl erzeugt einen internen IPA-Build und kann bei einem neuen Gerät dessen Geräte-Registrierung beziehungsweise die erforderliche Apple-Berechtigung verlangen. Die signierten Dateien und Installationslinks werden von EAS ausgegeben.

Für die Web-App stehen zusätzlich folgende Befehle zur Verfügung:

```bash
pnpm build:web
pnpm package:web
pnpm serve:web
```

Die Web-App darf nicht über `file://` getestet werden, weil Service Worker und Browser-Audio nur über HTTP(S) zuverlässig funktionieren.

## Testumfang für das Team

### 1. Grundstart und lokale Speicherung

Die Tester installieren die interne Version, starten die App und prüfen, dass die Oberfläche ohne Konto, Login und Netzwerkverbindung geöffnet wird. Ein angelegtes Profil, ein Alarm und eine Änderung in den Einstellungen müssen nach dem vollständigen Schließen und erneuten Öffnen erhalten bleiben.

### 2. Profile und Alarmverwaltung

Zu prüfen sind das Anlegen, Bearbeiten und Löschen von Profilen sowie das Anlegen, Bearbeiten, Duplizieren und Löschen von Alarmen. Die App muss ungültige Datums- und Zeitwerte verständlich zurückweisen. Ein Alarm muss einem Profil zugeordnet und als aktiv oder pausiert dargestellt werden können.

### 3. Alarmtypen

Jeder Schnellstart-Typ wird einmal angelegt und gespeichert: Bubble, GW-Bubble, eigenes Event, individueller Alarm und RSS-bezogener Alarm. Die Anzeige des Alarmtyps, der Bezeichnung, der Zeit und des zugehörigen Profils muss nach dem Speichern korrekt bleiben.

### 4. Wiederholungen und Zeitmodell

Zu prüfen sind einmalige Alarme, tägliche Wiederholungen und der fünf-tägige GW-Zyklus. Die Eingabe erfolgt in lokaler Gerätezeit. Nach dem Speichern und nach einem Neustart muss die Anzeige weiterhin der lokalen Gerätezeit entsprechen. Tageswechsel, Monatswechsel und ungültige Kalendertage sind mindestens einmal zu prüfen.

### 5. Vorwarnungen und Schutzstatus

Für einen Alarm sind die Vorwarnungen 60, 30 und 15 Minuten einzeln sowie in Kombination zu aktivieren und zu entfernen. Der Schutzstatus muss ein- und ausgeschaltet werden können. Die Darstellung der Vorwarnungen und des Schutzstatus muss mit der gespeicherten Konfiguration übereinstimmen.

### 6. Alarmaktionen

Ein fälliger oder angezeigter Alarm muss bestätigt und pausiert werden können. Ein abgeschlossener einmaliger Alarm darf nach einem Neustart nicht erneut als ausstehend erscheinen. Das Duplizieren eines Alarms muss einen eigenständigen, bearbeitbaren Alarm erzeugen.

### 7. Lokale Benachrichtigungen und Sounds

Auf einem echten Android- oder iOS-Gerät sind Benachrichtigungsberechtigungen zu erteilen und anschließend ein kurzer Testalarm anzulegen. Zu prüfen sind die Benachrichtigung im Vordergrund, im Hintergrund und nach dem erneuten Öffnen der App. Die drei lokalen Sounds werden in den vorgesehenen Alarmprofilen geprüft: Pulse für normale Warnungen, Siren für GW- und dringende Schutzfenster sowie Chime für eigene Ereignisse.

Ein physisches Gerät ist für diesen Test erforderlich. Ein Browser oder ein Simulator kann die vollständige Systembenachrichtigung und das reale Audioverhalten nicht ersetzen.

### 8. Backup und Wiederherstellung

Das Team exportiert ein Backup mit mehreren Profilen, verschiedenen Alarmtypen, Wiederholungen und Einstellungen. Danach werden lokale Daten verändert oder entfernt und das Backup wieder importiert. Zu prüfen sind die vollständige Wiederherstellung, die unveränderte lokale Zeitdarstellung und die Zurückweisung eines offensichtlich ungültigen oder inkompatiblen Backupformats.

### 9. Offline-Verhalten und Neustart

Die App ist ohne Netzwerkverbindung zu starten. Profile, Alarme, Einstellungen und gespeicherte Backups müssen lokal verfügbar bleiben. Nach erzwungenem Beenden, Neustart des Geräts und erneutem Öffnen darf kein gültiger lokaler Datenbestand verloren gehen.

### 10. Layout und Bedienbarkeit

Mindestens ein kleiner und ein großer Telefonbildschirm sowie, sofern verfügbar, ein Tablet sind zu prüfen. Die Tester kontrollieren Querformat, Eingabefelder, Tastaturverhalten, Scrollbereiche, Modalfenster, Button-Zustände, Fehlermeldungen und die Lesbarkeit im dunklen Design.

## Automatische Validierung vor Übergabe

Vor der Übergabe an das Team werden die folgenden Prüfungen ausgeführt:

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm verify:javascript
pnpm verify:whitespace
pnpm verify:full-release
pnpm verify:migrations
```

Diese Prüfungen validieren die Kernlogik und die Web-Oberfläche. Die reale Geräteprüfung der Benachrichtigungen, Sounds, Tastatur, App-Lebenszyklen und nativen Layouts bleibt ein manueller Bestandteil des Teamtests.

## Übergabe an das Team

Die Übergabe besteht aus dem Android-APK-Build beziehungsweise dem iOS-Installationslink, dieser Anleitung und einem Testprotokoll mit App-Version, Gerät, Betriebssystemversion, Tester, Testdatum, Ergebnis und reproduzierbaren Fehlerbeschreibung. Jeder Fehler sollte mit den Schritten zur Reproduktion, erwarteten Ergebnis, tatsächlichen Ergebnis und einem Screenshot oder Bildschirmvideo dokumentiert werden.

## Abgrenzung

Für diese interne Testversion werden weder Store-Produkte noch Kaufvorgänge, Entitlements, Apple- oder Google-Webhooks, Billing-Server, App-Store-Listings oder Produktions-URLs benötigt. Der interne Teamtest bewertet ausschließlich die installierbare App und ihre lokalen Kernfunktionen.
