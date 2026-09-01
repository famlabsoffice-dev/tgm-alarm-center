# TGM ALARM CENTER

Das TGM ALARM CENTER ist eine lokale Gaming-Alarmzentrale für **The Grand Mafia**. Es erinnert an Bubble-Zeiten, GW-Bubble-Schutzfenster und eigene Spielereignisse, indem es auf dem jeweiligen Gerät einen Gaming-Alarmton ausgibt.

## Produktumfang

Die Web-App besteht aus reinem HTML, CSS und JavaScript. Sie bietet Accounts, Alarmvorlagen, einmalige Termine, tägliche Wiederholungen, den GW-5-Tage-Zyklus mit 24-Stunden-Schutzfenster, Vorwarnungen, drei lokale Gaming-Tonprofile, einen Countdown, Alarmbestätigung, Pausieren, Duplizieren, Löschen sowie Backup und Wiederherstellung.

Die Daten werden ausschließlich lokal im Browser gespeichert. Der Offline-App-Shell-Service-Worker hält Oberfläche und Tondateien für die lokale Nutzung verfügbar. Browser-Audio wird aus Sicherheitsgründen einmalig durch eine bewusste Nutzeraktion aktiviert.

## Tier-Pläne

Es gibt fünf klar getrennte Tiers von Free bis Godfather. Die zentrale EUR-Preisliste befindet sich in `src/domain/pricing.ts`; die Tier-Limits befinden sich in `src/domain/alarm.ts`. USD- und JPY-Preise werden als stabile lokale Listenpreise aus der EUR-Basis abgeleitet und nicht bei jedem Checkout live umgerechnet.

### EUR-Zielpreise

| Tier | Woche | Monat | 6 Monate | Jahr | Lifetime |
|---|---:|---:|---:|---:|---:|
| Free | 0,00 € | 0,00 € | 0,00 € | 0,00 € | 0,00 € |
| Street Boss | 4,99 € | 14,99 € | 79,99 € | 129,99 € | 199,99 € |
| Caporegime | 7,99 € | 24,99 € | 129,99 € | 199,99 € | 299,99 € |
| Underboss | 9,99 € | 34,99 € | 179,99 € | 299,99 € | 449,99 € |
| Godfather | 19,99 € | 69,99 € | 399,99 € | 599,99 € | 799,99 € |

### USD-Store-Listenpreise

| Tier | Woche | Monat | 6 Monate | Jahr | Lifetime |
|---|---:|---:|---:|---:|---:|
| Free | $0.00 | $0.00 | $0.00 | $0.00 | $0.00 |
| Street Boss | $5.99 | $16.99 | $89.99 | $149.99 | $214.99 |
| Caporegime | $9.99 | $27.99 | $149.99 | $229.99 | $319.99 |
| Underboss | $11.99 | $39.99 | $199.99 | $349.99 | $479.99 |
| Godfather | $22.99 | $79.99 | $449.99 | $699.99 | $899.99 |

### JPY-Store-Listenpreise

| Tier | Woche | Monat | 6 Monate | Jahr | Lifetime |
|---|---:|---:|---:|---:|---:|
| Free | ¥0 | ¥0 | ¥0 | ¥0 | ¥0 |
| Street Boss | ¥1,000 | ¥2,800 | ¥14,800 | ¥24,000 | ¥37,000 |
| Caporegime | ¥1,500 | ¥4,600 | ¥24,000 | ¥37,000 | ¥55,000 |
| Underboss | ¥1,900 | ¥6,500 | ¥33,000 | ¥56,000 | ¥83,000 |
| Godfather | ¥3,700 | ¥13,000 | ¥74,000 | ¥111,000 | ¥148,000 |

Die hinterlegte Referenzumrechnung nutzt den ECB-Euro-Referenzkurs vom **31.08.2026**: 1 EUR = 1,1596 USD und 1 EUR = 185,22 JPY. Die ECB veröffentlicht diese Referenzkurse werktäglich und weist darauf hin, dass sie primär Informationszwecken dienen. citeturn897252search2

### Klare Stufen

Fünf Tiers von Free bis Godfather decken jeden Spielerbedarf ab – vom Gelegenheitsspieler bis zum Multi-Account-Profi. Underboss bildet die mittlere Profi-Stufe mit fünf Accounts, zehn Alarmen und fünf Events.

### Flexible Laufzeiten

Wöchentliche Einstiege bis hin zur Lifetime-Absicherung bieten maximale Flexibilität bei der Buchung.

### Ehrliches Billing

Klare Abgrenzung zwischen lokaler Planwahl und realer Store-Abrechnung. Keine versteckten Kosten und keine serverseitige Kontenpflicht.

### Datensicherheit

Alle Daten bleiben lokal. Der Trial-Ablauf respektiert die Einrichtung des Nutzers und löscht niemals Informationen.

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
