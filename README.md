# TGM ALARM CENTER

Das TGM ALARM CENTER ist eine lokale Gaming-Alarmzentrale für **The Grand Mafia**. Es erinnert an Bubble-Zeiten, GW-Bubble-Schutzfenster und eigene Spielereignisse, indem es auf dem jeweiligen Gerät einen Gaming-Alarmton ausgibt.

## Produktumfang

Die Web-App besteht aus reinem HTML, CSS und JavaScript. Sie bietet Accounts, Alarmvorlagen, einmalige Termine, tägliche Wiederholungen, den GW-5-Tage-Zyklus mit 24-Stunden-Schutzfenster, Vorwarnungen, drei lokale Gaming-Tonprofile, einen Countdown, Alarmbestätigung, Pausieren, Duplizieren, Löschen sowie Backup und Wiederherstellung.

Die Daten werden ausschließlich lokal im Browser gespeichert. Der Offline-App-Shell-Service-Worker hält Oberfläche und Tondateien für die lokale Nutzung verfügbar. Browser-Audio wird aus Sicherheitsgründen einmalig durch eine bewusste Nutzeraktion aktiviert.

## Tier-Pläne

Die Limits und Preise sind zentral in `src/domain/alarm.ts` und `src/domain/pricing.ts` definiert. Die EUR-Zielpreise sind die zentrale Preis-Konfiguration. Für USD sind direkte Kursäquivalente sowie empfohlene, verkaufsfähige Store-Listenpreise hinterlegt.

| Tier | Accounts | Alarme | Events | Monat EUR | Jahr EUR | Lifetime EUR | Monat USD Store | Jahr USD Store | Lifetime USD Store |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Free | 1 | 1 | 1 | 0,00 € | 0,00 € | 0,00 € | $0.00 | $0.00 | $0.00 |
| Street Boss | 2 | 2 | 2 | 4,99 € | 39,99 € | 79,99 € | $4.99 | $44.99 | $89.99 |
| Caporegime | 3 | 3 | 3 | 7,99 € | 69,99 € | 129,99 € | $9.99 | $79.99 | $149.99 |
| Godfather | unbegrenzt | unbegrenzt | unbegrenzt | 12,99 € | 99,99 € | 199,99 € | $14.99 | $119.99 | $229.99 |

### Direkte USD-Kursäquivalente

| Tier | Monat USD | Jahr USD | Lifetime USD |
|---|---:|---:|---:|
| Free | $0.00 | $0.00 | $0.00 |
| Street Boss | $5.79 | $46.39 | $92.79 |
| Caporegime | $9.27 | $81.19 | $150.79 |
| Godfather | $15.07 | $115.99 | $231.99 |

Die empfohlene Store-Staffelung verwendet übliche psychologische Preisanker. Street Boss kann beim Monatsabo optional mit $5.99 statt $4.99 positioniert werden, wenn die USD-Position näher am EUR-Äquivalent bleiben soll. Die gespeicherten Jahresersparnisse gegenüber 12 Monatszahlungen betragen für Street Boss ca. 25 %, für Caporegime ca. 33 % und für Godfather ca. 33 %.

Die in `src/domain/pricing.ts` hinterlegten Nutzwert- und Business-Wert-Richtwerte dienen der Produkt- und Preisplanung: Free $0 Kaufpreis bei einem geschätzten vermiedenen Incident-Wert von häufig $5–50+, Street Boss typischer Monatsnutzen $8–20, Caporegime $15–40, Godfather $25–80+; subjektive Godfather-Lifetime-Amortisation bei intensiver Nutzung ca. 3–9 Monate. Die ARR-Skizze rechnet konservativ mit 15–30 % Store-Gebühren und den Szenarien 1.500, 4.000 und 10.000 zahlende Nutzer mit starkem Jahresabo-Mix sowie den hinterlegten LTV-Richtwerten.

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
