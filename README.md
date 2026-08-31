# TGM ALARM CENTER

Das TGM ALARM CENTER ist eine lokale Gaming-Alarmzentrale für **The Grand Mafia**. Es erinnert an Bubble-Zeiten, GW-Bubble-Schutzfenster und eigene Spielereignisse, indem es auf dem jeweiligen Gerät einen Gaming-Alarmton ausgibt.

## Produktumfang

Die Web-App besteht aus reinem HTML, CSS und JavaScript. Sie bietet Accounts, Alarmvorlagen, einmalige Termine, tägliche Wiederholungen, den GW-5-Tage-Zyklus mit 24-Stunden-Schutzfenster, Vorwarnungen, drei lokale Gaming-Tonprofile, einen Countdown, Alarmbestätigung, Pausieren, Duplizieren, Löschen sowie Backup und Wiederherstellung.

Die Daten werden ausschließlich lokal im Browser gespeichert. Der Offline-App-Shell-Service-Worker hält Oberfläche und Tondateien für die lokale Nutzung verfügbar. Browser-Audio wird aus Sicherheitsgründen einmalig durch eine bewusste Nutzeraktion aktiviert.

## Lokale Gaming-Töne

| Profil | Einsatz | Datei |
|---|---|---|
| Pulse | normale Bubble-Zeit und Standardwarnungen | `assets/notifications/alarm-pulse.wav` |
| Siren | GW-Bubble und dringende Schutzfenster | `assets/notifications/alarm-siren.wav` |
| Chime | eigene Spielereignisse | `assets/notifications/alarm-chime.wav` |

## Start

Für die Web-App genügt ein statischer HTTP-Server im Repository-Root. Danach ist `index.html` der Einstiegspunkt. Der Service Worker funktioniert nur über HTTP(S), nicht über `file://`.

Für den nativen Expo-Pfad stehen `App.tsx`, die Domain-Engine und die Notification-Module weiterhin zur Verfügung. Beide Oberflächen verwenden ausschließlich lokale Gaming-Alarmfunktionen.

## Prüfungen

```bash
node scripts/verify-web-core.mjs
node --check app.js
node --check sw.js
pnpm test
pnpm typecheck
```

Die Daten verlassen das Gerät nicht. Es gibt keine Kontenserver, keine Synchronisation und keine Schnittstellen für externe Alarmdienste.
