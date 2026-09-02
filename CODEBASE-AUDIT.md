# TGM ALARM CENTER — Codebase-Audit

**Prüfstand:** `main` bei Commit `33e2c49a65415f80894a14110e86fe6c4f1ddfea`  
**Datum:** 01.09.2026  
**Arbeitsbaum:** sauber, abgesehen von der bereits erzeugten unversionierten Analyse-Datei `REPOSITORY_AUSLESUNG.md`  
**Gesamturteil:** **Aktuell nicht releasefähig für die Web-PWA.** Die native TypeScript-Seite besteht die statischen Prüfungen, aber die Web-PWA enthält eine reproduzierbare Blocker-Regression.

## Executive Summary

Der wichtigste Befund ist kein theoretisches Risiko, sondern ein **bestätigter Laufzeitfehler**: Im aktuellen `app.js` fehlen mehrere zentrale Definitionen, darunter DOM-Referenzen, der initiale State sowie `now`, `iso`, `uid`, `esc`, `formatDateInput`, `formatTimeInput` und `countdown`. Der letzte Commit `chore(pricing): synchronize web pricing with domain` hat diese 36 Zeilen entfernt. `node --check`, `pnpm test` und das markerbasierte Web-Core-Gate erkennen den Fehler nicht, weil sie nur Syntax beziehungsweise Textmarker prüfen. Ein direkter Browserlauf gegen `index.html` bleibt leer; die App initialisiert den `#app`-Container nicht.

Daneben bestehen strukturelle Risiken bei der Datenvalidierung, der lokalen Lizenz-/Trial-Logik, der Zuverlässigkeit des Browser-Schedulers, der nativen Exact-Alarm-Berechtigung und der Testabdeckung. Die Befunde sind für eine lokal orientierte Spielhilfe beherrschbar, müssen aber vor einer kommerziellen oder App-Store-Freigabe systematisch geschlossen werden.

## Priorisierte Befunde

| ID | Priorität | Bereich | Befund | Auswirkung |
|---|---|---|---|---|
| F-01 | **P0 — Blocker** | Web Runtime | Der aktuelle Web-Core referenziert mehrere nicht definierte Hilfsvariablen/-funktionen. | Leerer Bildschirm, keine Web-PWA-Nutzung möglich. |
| F-02 | **P0 — Blocker** | Release Automation | `sync-web-pricing.mjs` verändert `app.js` mit Regex und entfernte im letzten Commit den Laufzeit-Scaffold. | Wiederholbare Regression bei künftigen Preis-Synchronisierungen. |
| F-03 | **P1 — hoch** | Datenintegrität | Web-Import und `localStorage` haben keine Größen- und Kardinalitätsgrenzen; `persist()` behandelt Quota-/Storage-Fehler nicht. | Browserabsturz, Zustandsverlust oder Denial of Service durch manipulierte Backups. |
| F-04 | **P1 — hoch** | Alarmzuverlässigkeit | Der Browser-Scheduler arbeitet als `setInterval` und verarbeitet nur ein zweiminütiges Fälligkeitsfenster. | Alarme können nach Tab-Hintergrund, Sleep oder Browser-Drosselung verpasst werden. |
| F-05 | **P1 — hoch** | Native Notifications | `exactAlarm` wird unter Android pauschal als `true` gesetzt; die tatsächliche Berechtigung wird nicht geprüft oder angefordert. | Falscher Bereitschaftsstatus und potenziell unpünktliche Benachrichtigungen. |
| F-06 | **P1 — hoch** | Kommerzielle Integrität | Plan, Trial und Family-Freischaltung sind vollständig clientseitig und über Accountnamen manipulierbar. | Kein belastbarer Kauf-/Lizenzschutz; Preise sind nur Anzeige, keine Abrechnung. |
| F-07 | **P2 — mittel** | Security/DOM | Importierte Web-Accountfarben werden nur als String validiert und in ein `style`-Attribut eingesetzt. | CSS-Injection beziehungsweise externe Ressourcenanforderungen aus manipulierten lokalen Daten möglich. |
| F-08 | **P2 — mittel** | Native Performance | Nach State-Änderungen werden alle lokalen Notifications storniert und für alle aktiven Alarme sequentiell neu geplant. | unnötige I/O-Last, Race-Risiken bei schnellen Änderungen und mögliche OS-Limits. |
| F-09 | **P2 — mittel** | Qualitätssicherung | Die Web-Prüfung ist überwiegend markerbasiert; DOM-Flows, Backup-Grenzfälle und Scheduler-Recovery fehlen. | `PASS` ist derzeit kein belastbarer Beleg für funktionierende End-to-End-Webnutzung. |
| F-10 | **P3 — niedrig** | Wartbarkeit/UX | `app.js` enthält UI, State, Domainlogik, Persistenz, Audio und Scheduler in einer monolithischen Datei; jede Sekunde wird das komplette HTML neu gerendert. | Höhere Änderungs- und Regressionskosten, potenziell störende Repaints und Fokusverluste. |

## Detaillierte Befunde

### F-01 — Web-PWA durch fehlende Runtime-Definitionen blockiert

**Beobachtung.** Der aktuelle `app.js` verwendet bereits in `freeTrialActive()` `state` und `now()`, in `normalize()` `iso()`, `formatDateInput()` und `formatTimeInput()`, in `saveAlarm()` `uid()` sowie an zahlreichen Stellen `esc()` und `countdown()`. Die erforderlichen Definitionen sind im aktuellen Commit nicht vorhanden. Ebenso fehlen die Initialisierungen von `app`, `modalRoot`, `toastRoot`, `overlayRoot`, `state`, `view`, `editingId`, `modalMode`, `audioContext`, `currentAudio`, `ticker`, `toastTimer`, `alertTimer` und `navScrollLeft`.

**Verifikation.** Der Parent-Commit enthält diese Definitionen in `app.js` zwischen den früheren Zeilen 37 und 65; der aktuelle Commit löscht exakt 36 Zeilen. Ein direkter Browserlauf gegen `file:///home/ubuntu/tgm-alarm-center/index.html` zeigte einen leeren `#app`-Container mit `innerHTML.length === 0`. Die Syntaxprüfung bleibt trotzdem erfolgreich, weil nicht definierte Namen erst zur Laufzeit fehlschlagen.

**Korrektur.** Die entfernten Runtime-Definitionen müssen unverändert wiederhergestellt werden. Danach sind mindestens ein Browser-Smoke-Test mit leerem Speicher, Alarmanlage, Navigation, Backup-Import und Audioaktivierung sowie ein Test gegen einen vorhandenen Legacy-State erforderlich.

### F-02 — Preis-Synchronisierung ist nicht strukturell sicher

`scripts/sync-web-pricing.mjs` hält die komplette Preis- und Featurematrix separat als zweite Datenquelle und ersetzt Blöcke in `app.js` per regulärem Ausdruck. Die Erkennung basiert auf Mustern wie `const TIER_PRICING = ... const TIER_FEATURES` und einem mehrzeiligen Abschlussmuster für `TIER_FEATURES`. Das ist fragil: Änderungen an Formatierung, Kommentaren oder Blockgrenzen können fremde Laufzeitabschnitte erfassen. Genau diese Art Regression ist im letzten Commit sichtbar geworden.

**Korrektur.** Eine einzige kanonische Pricing-Quelle sollte erzeugt werden. Für den Web-Core bietet sich ein kleines, maschinenlesbares JSON/ES-Modul an, das aus `src/domain/pricing.ts` oder einer gemeinsamen Datenquelle generiert wird. Der Generator muss vor dem Schreiben parsen, die erwarteten Sentinel-Blöcke prüfen, eine vollständige Datei- oder AST-Transformation verwenden und anschließend automatisch `pnpm lint`, `pnpm test`, `pnpm typecheck`, `node --check app.js` sowie einen Browser-Smoke-Test ausführen. Bei einem fehlgeschlagenen Gate darf kein Commit erzeugt werden.

### F-03 — Backup- und Persistenzgrenzen fehlen

Die Web-Normalisierung in `app.js` übernimmt Arrays und Objekte aus `localStorage` beziehungsweise dem JSON-Import ohne Gesamtgrenze für Anzahl von Accounts, Alarmen oder `completedOccurrences`. Warnungen werden zwar auf maximal sieben Tage begrenzt, aber die Anzahl der Warnungen ist nicht begrenzt. `persist()` schreibt direkt in `localStorage`; ein volles Storage-Quota kann dadurch aus UI-Handlern heraus eine ungefangene Exception auslösen. Ein manipuliertes Backup kann somit über große JSON-Strukturen erhebliche CPU-, Speicher- und Speicherplatzkosten verursachen.

**Korrektur.** Vor `JSON.parse` sollte eine maximale Dateigröße gelten. Nach dem Parsen sind maximale Objekt-/Arraygrößen, maximale Titel-/ID-Längen, maximale Historiengröße und die zulässigen Tariflimits zu prüfen. `persist()` sollte atomar über einen temporären Schlüssel schreiben, Quota-Fehler abfangen und einen sichtbaren Wiederherstellungszustand anbieten. Importierte Accountfarben müssen auf ein enges Format wie `^#[0-9A-Fa-f]{6}$` begrenzt werden.

### F-04 — Browser-Scheduler ist für Hintergrundbetrieb nicht zuverlässig genug

`fireDueMoments()` wird über ein sekündliches `setInterval` und bei `focus`/`visibilitychange` ausgeführt. `dueMoments()` akzeptiert fällige Momente nur, wenn sie höchstens 120 Sekunden zurückliegen. Hintergrundtabs, Energiesparmodi, pausierte Browserprozesse und Geräte-Sleep können länger aussetzen; nach der Rückkehr werden solche Termine nicht mehr ausgelöst. Außerdem ist die Anzeige ein DOM-Overlay und keine systemweite Browser-Notification.

**Korrektur.** Die Web-Version sollte die Produktgrenze explizit als „nur bei laufendem Browserkontext“ behandeln oder echte Web Notifications mit Permission, Service-Worker-Handling und einem robusten Catch-up-Modell einsetzen. Fällige Ereignisse müssen anhand eines persistenten Cursor-/Occurrence-Modells idempotent nachgeholt werden, ohne alte Warnungen endlos rückwirkend abzuspielen. Für kritische Alarme bleibt der native Pfad mit OS-Scheduler die zuverlässigere Zielplattform.

### F-05 — Android-Exact-Alarm-Status ist nicht echt geprüft

`initializeNotifications()` setzt `exactAlarm: Platform.OS === 'android'`. Das bedeutet: Auf Android wird `exactAlarm` bereits anhand des Betriebssystems als wahr gemeldet, nicht anhand einer realen Berechtigung oder eines erfolgreichen Test-Schedules. Zwar ist `SCHEDULE_EXACT_ALARM` in `app.json` deklariert, doch daraus folgt nicht automatisch, dass die Berechtigung erteilt ist.

**Korrektur.** Die tatsächliche Plattformberechtigung und die Verfügbarkeit eines exakten Triggers müssen über die verwendete Expo-/Android-API verifiziert werden. Der Status sollte drei Werte unterscheiden: unterstützt, Berechtigung erteilt und Testbenachrichtigung erfolgreich geplant. Der UI-Button „Gerätetest“ sollte tatsächlich eine kurzfristige lokale Testbenachrichtigung planen und wieder entfernen; aktuell zeigt er nur eine Meldung.

### F-06 — Clientseitige Tarif- und Family-Logik ist kein Lizenzschutz

Die Web-PWA speichert den gewählten Plan in `localStorage`. Eine 72-Stunden-Testphase wird ebenfalls lokal geführt. Zusätzlich gewährt ein frei wählbarer Accountname aus einer festen Liste automatisch Godfather Lifetime. Wer die lokalen Daten oder den Namen ändert, kann die Freischaltung manipulieren. Für eine rein lokale kostenlose Spielhilfe ist das als Demo-Verhalten nachvollziehbar; für echte Bezahlpläne ist es kein belastbares Entitlement-System.

**Korrektur.** Vor produktiver Monetarisierung müssen Store-Receipt-/Purchase-Validierung und ein signiertes, fälschungssicheres Entitlement eingeführt werden. Die lokale UI darf nur einen vom Store beziehungsweise einem vertrauenswürdigen Backend bestätigten Status anzeigen. Die aktuelle Funktionalität sollte im Produkt klar als lokale Auswahl beziehungsweise Preview gekennzeichnet werden und nicht den Eindruck einer bereits implementierten Abrechnung erwecken.

### F-07 — Importierte Farben sind im Web nicht eng genug validiert

Die Web-Normalisierung akzeptiert für `account.color` jeden nichtleeren String. Die Accountansicht setzt diesen Wert anschließend in `style="background:..."`. Zwar werden die HTML-Attribute dynamisch escaped, aber das ist keine CSS-Validierung. Ein manipuliertes lokales Storage-Objekt oder Backup kann unerwartete CSS-Werte und externe Ressourcenanforderungen einbringen.

**Korrektur.** Nur sechsstellige Hexfarben oder eine feste Allowlist akzeptieren und beim Rendern zusätzlich über `CSS.supports` beziehungsweise eine eigene strikte Regex absichern. Noch robuster ist eine Klassen-/Token-Zuordnung statt dynamischer CSS-Werte.

### F-08 — Native Notification-Planung skaliert schlecht und kann Rennen erzeugen

Der Effect in `App.tsx` ruft nach relevanten State-Änderungen `cancelAllScheduled()` auf und plant anschließend für jeden aktiven Alarm alle kommenden Momente neu. Die Schleife wartet jedes Schedule einzeln ab. Bei schnellen Änderungen können alte und neue Effects zeitlich überlappen; die lokale Variable `cancelled` verhindert nicht, dass bereits gestartete native Scheduling-Aufrufe nach einer Bereinigung noch zurückkehren. Zusätzlich wird kein explizites Maximum der gleichzeitig geplanten Notifications gesetzt.

**Korrektur.** Ein zentraler, serialisierter Scheduler mit Generationstoken oder Mutex sollte genau eine Reconciliation durchführen. Nur geänderte Alarme sollten neu geplant werden; IDs geplanter Notifications müssen persistiert werden. Die Anzahl bevorstehender Termine sollte auf die Plattformgrenzen begrenzt und bei Überschreitung transparent angezeigt werden.

### F-09 — Bestehende Gates beweisen zu wenig

`scripts/verify-web-core.mjs` prüft korrekte Verlinkungen, Syntax, Assets und viele Stringmarker. Das verhindert Tippfehler in bestimmten Produktbegriffen, führt aber keinen echten DOM-Start durch und testet keine Benutzerinteraktion. Die vorhandenen Domain-Tests decken Zeitlogik und Pricing ab, nicht jedoch den Web-Import, die Quota-Fehler, den Scheduler nach Visibility-Wechsel, den nativen Permission-Status oder die Limitdurchsetzung über alle UI-Flows. Deshalb konnte der aktuelle Blocker trotz `pnpm test` und `pnpm typecheck` bestehen bleiben.

**Korrektur.** Playwright- oder Chromium-Smoke-Tests mit isoliertem Profil ergänzen: Initialisierung, Alarm erstellen/bearbeiten/duplizieren/löschen, Accountwechsel, Tariflimit, Trial, Backup-Export/-Import, fehlerhaftes Backup, Audiofreigabe, Reload, Offline-Cache und Visibility-Recovery. Der Test muss den sichtbaren DOM, Console Errors und mindestens einen kritischen Nutzerfluss assertieren.

### F-10 — Monolithischer Web-Core und Vollrender jede Sekunde

`app.js` vereint Renderfunktionen, State, Normalisierung, Persistenz, Audio und Scheduler in einer IIFE mit 606 Zeilen. Der Ticker ruft jede Sekunde `fireDueMoments()` und `render()` auf. Das ist zwar für wenige Alarme funktional, erhöht aber die Regressionswahrscheinlichkeit und rendert unnötig auch bei unverändertem State.

**Korrektur.** Domain-, Storage-, Scheduler- und UI-Module trennen. Den Countdown separat aktualisieren, statt das gesamte HTML zu ersetzen; State-Änderungen gezielt rendern. Ein zentraler Event-Dispatcher und DOM-Event-Delegation können erhalten bleiben, aber die Funktionen sollten typisiert und mit Verträgen für importierte Daten abgesichert werden.

## Empfohlene Reihenfolge

| Reihenfolge | Maßnahme | Ziel |
|---:|---|---|
| 1 | F-01 beheben und Browser-Smoke-Test hinzufügen | Web-PWA sofort wieder startfähig machen |
| 2 | F-02 Generator auf sichere, kanonische Datenquelle umstellen | Wiederholung derselben Regression verhindern |
| 3 | F-09 echte Runtime-/Import-/Scheduler-Tests ergänzen | False-Positive-`PASS` verhindern |
| 4 | F-03 Backup- und Persistenzgrenzen einführen | Datenintegrität und DoS-Resilienz erhöhen |
| 5 | F-04 und F-05 Scheduler-/Permission-Modell korrigieren | Alarmzuverlässigkeit auf Web und Native verbessern |
| 6 | F-06 Monetarisierung fachlich entscheiden | Preview-Modell von echter Store-Lizenzierung trennen |
| 7 | F-07, F-08 und F-10 härten | Defense-in-Depth, Skalierung und Wartbarkeit verbessern |

## Verifizierter Prüfstatus

| Prüfung | Ergebnis |
|---|---|
| `pnpm install --frozen-lockfile` | Erfolgreich |
| `pnpm lint` | Erfolgreich |
| `pnpm test` | Erfolgreich; 8 Tests, davon 8 bestanden |
| `pnpm typecheck` | Erfolgreich |
| `node --check app.js` | Erfolgreich, erkennt den Runtime-Fehler nicht |
| Direkter Browserlauf der Web-PWA | **Fehlgeschlagen: leerer `#app`-Container** |
| Vergleich mit Parent-Commit | **Bestätigt: 36 zentrale Runtime-Zeilen wurden entfernt** |

## Quellen

[1]: https://github.com/famlabsoffice-dev/tgm-alarm-center/blob/main/app.js "Aktueller Web-Core"
[2]: https://github.com/famlabsoffice-dev/tgm-alarm-center/blob/main/scripts/sync-web-pricing.mjs "Preis-Synchronisierung"
[3]: https://github.com/famlabsoffice-dev/tgm-alarm-center/blob/main/scripts/verify-web-core.mjs "Web-Core-Verifikationsgate"
[4]: https://github.com/famlabsoffice-dev/tgm-alarm-center/blob/main/src/native/notifications.ts "Native Notification-Implementierung"
[5]: https://github.com/famlabsoffice-dev/tgm-alarm-center/blob/main/src/storage/store.ts "Native Persistenz und Normalisierung"
[6]: https://github.com/famlabsoffice-dev/tgm-alarm-center/blob/main/src/backup/backup.ts "Native Backup-Validierung"
