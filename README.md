# TGM ALARM CENTER

Das TGM ALARM CENTER ist eine unabhängige lokale Gaming-Alarmzentrale für zeitkritische Gaming-Events. Es erinnert an Bubble-Zeiten, GW-Bubble-Schutzfenster und eigene Spielereignisse, indem es auf dem jeweiligen Gerät einen Gaming-Alarmton ausgibt.

## Produktumfang

Die Web-App besteht aus reinem HTML, CSS und JavaScript. Sie bietet Accounts, Alarmvorlagen, einmalige Termine, tägliche Wiederholungen, den GW-5-Tage-Zyklus mit 24-Stunden-Schutzfenster, Vorwarnungen, drei lokale Gaming-Tonprofile, einen Countdown, Alarmbestätigung, Pausieren, Duplizieren, Löschen sowie Backup und Wiederherstellung.

Die Daten werden ausschließlich lokal im Browser gespeichert. Der Offline-App-Shell-Service-Worker hält Oberfläche und Tondateien für die lokale Nutzung verfügbar. Browser-Audio wird aus Sicherheitsgründen einmalig durch eine bewusste Nutzeraktion aktiviert.

## Pläne und Preise

Die Pläne unterscheiden sich beim verfügbaren Umfang für Accounts und Alarme. Die zentrale Preisübersicht befindet sich in `app.js`; USD- und JPY-Preise sind als feste Store-Listenpreise hinterlegt und werden nicht bei jeder Anzeige neu umgerechnet.

### Preise in Euro

| Plan | Woche | Monat | 6 Monate | Jahr | Lifetime |
|---|---:|---:|---:|---:|---:|
| Free | 0,00 € | 0,00 € | 0,00 € | 0,00 € | 0,00 € |
| Street Boss | 4,99 € | 14,99 € | 79,99 € | 129,99 € | 199,99 € |
| Caporegime | 7,99 € | 24,99 € | 129,99 € | 199,99 € | 299,99 € |
| Underboss | 9,99 € | 34,99 € | 179,99 € | 299,99 € | 449,99 € |
| Godfather | 19,99 € | 69,99 € | 399,99 € | 599,99 € | 799,99 € |

### Preise in US-Dollar (Store)

| Plan | Woche | Monat | 6 Monate | Jahr | Lifetime |
|---|---:|---:|---:|---:|---:|
| Free | $0.00 | $0.00 | $0.00 | $0.00 | $0.00 |
| Street Boss | $5.99 | $16.99 | $89.99 | $149.99 | $214.99 |
| Caporegime | $9.99 | $27.99 | $149.99 | $229.99 | $319.99 |
| Underboss | $11.99 | $39.99 | $199.99 | $349.99 | $479.99 |
| Godfather | $22.99 | $79.99 | $449.99 | $699.99 | $899.99 |

### Preise in japanischen Yen (Store)

| Plan | Woche | Monat | 6 Monate | Jahr | Lifetime |
|---|---:|---:|---:|---:|---:|
| Free | ¥0 | ¥0 | ¥0 | ¥0 | ¥0 |
| Street Boss | ¥1,000 | ¥2,800 | ¥14,800 | ¥24,000 | ¥37,000 |
| Caporegime | ¥1,500 | ¥4,600 | ¥24,000 | ¥37,000 | ¥55,000 |
| Underboss | ¥1,900 | ¥6,500 | ¥33,000 | ¥56,000 | ¥83,000 |
| Godfather | ¥3,700 | ¥13,000 | ¥74,000 | ¥111,000 | ¥148,000 |

Die hinterlegte Referenzumrechnung nutzt den ECB-Euro-Referenzkurs vom **31.08.2026**: 1 EUR = 1,1596 USD und 1 EUR = 185,22 JPY. Die ECB veröffentlicht diese Referenzkurse werktäglich und weist darauf hin, dass sie primär Informationszwecken dienen. citeturn897252search2

### Funktionsumfang

Die fünf Pläne reichen vom kostenlosen Grundumfang bis zur unbegrenzten Nutzung. Der Plan Underboss umfasst fünf Accounts, zehn Alarme und fünf Events.

### Laufzeiten

Verfügbar sind Laufzeiten von einer Woche, einem Monat, sechs Monaten, einem Jahr sowie eine zeitlich unbegrenzte Nutzung.

### Abrechnung

Die Planwahl wird lokal auf dem Gerät gespeichert. Preise mit dem Hinweis „Store“ dienen als Store-Listenpreise; die tatsächliche Abrechnung erfolgt über den jeweiligen Store.

### Speicherung der Daten

Accounts, Alarme und Einstellungen bleiben lokal im Browser gespeichert. Das Ende der kostenlosen Testphase löscht keine vorhandenen Daten.

## Lokale Gaming-Töne

| Profil | Einsatz | Datei |
|---|---|---|
| Pulse | normale Bubble-Zeit und Standardwarnungen | `assets/notifications/alarm-pulse.wav` |
| Siren | GW-Bubble und dringende Schutzfenster | `assets/notifications/alarm-siren.wav` |
| Chime | eigene Spielereignisse | `assets/notifications/alarm-chime.wav` |

## Start

Für die Web-App genügt ein statischer HTTP-Server im Repository-Root. Danach ist `index.html` der Einstiegspunkt. Der Service Worker funktioniert nur über HTTP(S), nicht über `file://`.

Für den nativen Expo-Pfad stehen `App.tsx`, die Domain-Engine und die lokalen Notification-Module weiterhin zur Verfügung. Beide Oberflächen verwenden ausschließlich lokale Gaming-Alarmfunktionen.

## Prüfungen

```bash
node scripts/verify-web-core.mjs
node --check app.js
node --check sw.js
pnpm test
pnpm typecheck
```

Die Daten verlassen das Gerät nicht. Es gibt keine Kontenserver, keine Synchronisation und keine Schnittstellen für externe Alarmdienste.
