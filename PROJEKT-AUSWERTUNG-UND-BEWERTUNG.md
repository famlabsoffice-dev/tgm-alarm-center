# TGM ALARM CENTER — Projektauswertung und Bewertung

**Bewertungsstand:** 04.09.2026  
**Repository:** `famlabsoffice-dev/tgm-alarm-center`  
**Bewerteter Commit:** `c0fe835` — `fix(web): harden persisted state and backup import`  
**Bewertung:** Manus AI

## 1. Gesamturteil

Das TGM ALARM CENTER ist ein technisch weit fortgeschrittenes, lokal orientiertes Gaming-Alarmprodukt für zeitkritische Ereignisse in *The Grand Mafia*. Der aktuelle Stand erfüllt die wesentlichen internen Qualitäts-, Sicherheits-, Account-Isolations-, Zeitberechnungs-, Benachrichtigungs- und Release-Verträge. Die Web-PWA ist nach einer früheren Blank-Screen-Regression wieder funktionsfähig. Der zuletzt gepushte Patch schließt zusätzlich eine relevante Datenintegritätslücke beim Laden großer lokaler Zustände und beim Import ungültiger Backups.

**Gesamtbewertung: 8,7 von 10 Punkten.** Für einen technisch abgesicherten Release Candidate ist das Projekt gut aufgestellt. Die aktive Account-Projektion, die inkrementelle Countdown-Aktualisierung und der erweiterte Browser-Smoke-Test verbessern Nutzerwert, Datenschutz und Wartbarkeit. Für einen belastbaren kommerziellen App-Store-Launch fehlen jedoch weiterhin externe Betriebsnachweise, reale Store-Konfigurationen, physische Gerätetests und ein vollständig produktives Entitlement-/Abrechnungsmodell. Diese Punkte sind keine aktuell ungeprüften internen Codefehler, sondern bewusst außerhalb des lokalen Arbeitsablaufs liegende Vorbedingungen.

| Bewertungsbereich | Gewicht | Ergebnis | Bewertung |
|---|---:|---:|---:|
| Produktumfang und Nutzerwert | 15 % | 9,0/10 | 1,35 |
| Architektur und Wartbarkeit | 15 % | 8,8/10 | 1,32 |
| Zeit-, Alarm- und Lifecycle-Zuverlässigkeit | 20 % | 9,0/10 | 1,80 |
| Account-Isolation und Datensicherheit | 15 % | 9,0/10 | 1,35 |
| Test-, Release- und Regressionstauglichkeit | 20 % | 9,0/10 | 1,80 |
| Kommerzialisierung und Store-Reife | 10 % | 7,0/10 | 0,70 |
| UX- und Bestseller-Potenzial | 5 % | 7,5/10 | 0,38 |
| **Gesamt** | **100 %** |  | **8,69 ≈ 8,7/10** |

## 2. Produkt und Zielbild

Das Produkt konzentriert sich auf lokale Gaming-Alarme. Der Funktionsumfang umfasst Accounts, Bubble-Alarme, Massacre-Alarme, eigene Ereignisse, Individual Timer, RSS Timer, tägliche Wiederholungen, den GW- beziehungsweise Massacre-5-Tage-Zyklus, 24-Stunden-Schutzfenster, Vorwarnungen, lokale Tonprofile, Countdowns, Alarmbestätigung, Pausieren, Duplizieren, Löschen sowie Backup und Wiederherstellung. Die Daten bleiben lokal auf dem Gerät; eine Cloud-Synchronisation oder ein Serverkonto gehört nicht zum aktuellen Web-Produktmodell.[1]

Diese Produktentscheidung ist für Datenschutz, Offline-Nutzung und geringe Betriebsabhängigkeit vorteilhaft. Sie begrenzt zugleich die Möglichkeiten für geräteübergreifende Synchronisation, serverseitige Entitlements und zentrale Wiederherstellung. Die aktuelle Produktpositionierung ist daher eher eine zuverlässige lokale Spezialanwendung als ein vollwertiges vernetztes Command Center.

## 3. Architektur- und Implementierungsbewertung

Die Web-App besteht aus HTML, CSS und JavaScript. Der native Pfad basiert auf Expo, React Native, TypeScript und Expo Notifications. Die Domain-Logik ist von der nativen UI und der lokalen Speicherung getrennt. Für Account-Aktionen, Benachrichtigungsplanung, Backup und Storage existieren eigene TypeScript-Module. Im Web-Core wurden zusätzlich klare Besitzprojektionen, inkrementelle Live-Updates und gezielte Rendergrenzen eingeführt. `app.js` bleibt als Deployment-Einheit kompakt, verwendet aber weniger unnötige Vollrenderings. Die verbleibende monolithische Dateistruktur ist weiterhin ein Wartbarkeitsthema.[2]

Die Preis- und Tarifdaten werden im Web-Core synchronisiert und durch ein eigenes Prüfskript gegen erwartete Tier-, Preis- und Featurestrukturen validiert. Der Generator prüft inzwischen die Runtime-Sentinels und verwendet eine klammerbalancierte Deklarationsersetzung. Damit ist die konkrete frühere Regression abgesichert. Eine langfristig sauberere Lösung wäre dennoch eine einzige kanonische Quelle, aus der native und Web-Tarifdaten erzeugt werden.

| Architekturkomponente | Befund | Bewertung |
|---|---|---:|
| Web-PWA | Funktionsfähiger lokaler Offline-Core mit Service Worker und lokalen Tönen | 8,5/10 |
| Native App | Expo-/React-Native-Pfad mit lokaler Notification-Planung | 8,5/10 |
| Domain-Logik | Gute Abdeckung für absolute Zeiten, Wiederholungen und Besitzgrenzen | 9,0/10 |
| Persistenz | Atomarer temporärer Storage-Schreibpfad und Größenbegrenzungen | 8,5/10 |
| Web-Modularität | Klare Besitz- und Rendergrenzen, aber weiterhin eine Deployment-Datei | 7,5/10 |
| Tarifdaten | Validiert, aber mit mehr als einer Datenrepräsentation | 7,5/10 |

## 4. Zuverlässigkeit und Zeitmodell

Die stärkste Seite des Projekts ist die fachliche Zeit- und Alarmmodellierung. Einmalige Termine werden als absolute Zeitwerte verarbeitet. Tägliche Wiederholungen verwenden die konfigurierte lokale Uhrzeit. Der GW-5-Tage-Zyklus wird über feste 24-Stunden-Perioden berechnet. Warnungen, Haupttermin, Endwarnung und Ende werden als getrennte Momente behandelt. Vergangene oder abgeschlossene Vorkommen werden nicht fälschlich erneut geplant.

Die automatisierten Tests decken Zeitzonenwechsel, europäische Sommerzeit, ungültige DST-Zeitpunkte, absolute UTC-Anker, wiederkehrende Alarme, Schutzfenster, abgeschlossene Vorkommen, Reaktivierung, identische Alarmzeitpunkte und globale Benachrichtigungsplanung über mehrere Accounts ab. Die aktuelle Datenbasis bestätigt damit einen belastbaren internen Zuverlässigkeitsvertrag.[3]

Eine verbleibende Produktgrenze ist der Browserbetrieb selbst. Der Browser-Scheduler kann nur arbeiten, solange der Browserkontext wieder aktiviert wird. Der Code besitzt Catch-up-Logik für Rückkehr aus Hintergrundzuständen, aber ein vollständig beendeter oder vom Betriebssystem eingefrorener Browser ist keine gleichwertige Grundlage zu nativen OS-Benachrichtigungen. Für zeitkritische Nutzung bleibt der native Pfad die verlässlichere Zielplattform.

## 5. Account-Isolation und Sicherheit

Die Account-Isolation ist überdurchschnittlich gut abgesichert. Alarme tragen eine Account-Zugehörigkeit. Sichtbare Projektionen werden auf den aktiven Account begrenzt. Mutationen prüfen den Besitz explizit. Die globale Benachrichtigungsplanung bleibt unabhängig vom aktuell sichtbaren Account, sodass ein Accountwechsel nicht versehentlich legitime Termine eines anderen konfigurierten Accounts entfernt. Tests prüfen Bearbeiten, Löschen, Aktivieren, Abschließen, Auswahlwechsel und Benachrichtigungsaktionen gegen fremde oder fehlende Besitzinformationen.[4]

Der lokale Lizenz- und Trial-Mechanismus ist dagegen keine fälschungssichere Abrechnung. Die produktive Architektur enthält zwar serverseitige Verifikations- und Webhook-Bausteine für Apple und Google, aber die externen Store-Voraussetzungen und produktiven Schlüssel gehören nicht zum aktuellen lokalen Arbeitsablauf. Deshalb darf der aktuelle Stand nicht als vollständig produktives Billing-System bewertet werden.

Die Datenvalidierung wurde im letzten Patch weiter gehärtet. Der Loader verwirft lokale Zustände oberhalb des maximalen Backup-Umfangs, bevor `JSON.parse` ausgeführt wird. Der Backup-Import prüft die Dateigröße vor dem Parsen, meldet ungültiges JSON explizit und zeigt eine erfolgreiche Wiederherstellung nur an, wenn der persistente Schreibvorgang erfolgreich war. Accountfarben werden auf sechsstellige Hex-Farben begrenzt. Accounts, Alarme, Historien und gefeuerten Momente besitzen Kardinalitätsgrenzen.

## 6. Test- und Release-Bewertung

Der Prüfstand ist für interne Softwarequalität stark. Der Testlauf bestand aus 34 Tests. Lint, Typecheck, JavaScript-Syntax, Whitespace, Production Floor, Web-Core, Pricing, Android-Reliability, Store-Konfiguration und Mobile-Build-Verifikation waren erfolgreich. Der Browser-Smoke-Test validierte den tatsächlichen HTTP-Start, Dashboard-Rendering, Alarmanlage, Speichern, Reload-Persistenz, Backup-Export, Backup-Import sowie Console- und Page-Errors.

Das Full-Release-Gate war nach Installation der festgelegten Playwright-/Chromium-Testabhängigkeit erfolgreich. Der erste Lauf scheiterte ausschließlich an einer fehlenden lokalen Testumgebungsabhängigkeit, nicht an einem Produktfehler. Nach der reproduzierbaren Installation von Playwright 1.62.1 und Chromium lief der Browser-Smoke-Test erfolgreich durch. Der finale Release-Gate-Status lautet **PASS**.[5]

| Prüfung | Ergebnis |
|---|---|
| Domain-, Reliability-, Account- und Notification-Tests | PASS, 34 Tests |
| Billing-Security-Tests | PASS, 5 Tests |
| Lint | PASS |
| Typecheck | PASS |
| JavaScript-Syntax | PASS, 29 Dateien |
| Whitespace-Prüfung | PASS, 79 Dateien |
| Web-Core- und Pricing-Gate | PASS |
| Browser-Smoke-Test | PASS |
| Android-Reliability-Gate | PASS |
| Store-Config-Gate | PASS |
| Mobile-Build-Gate | PASS |
| Full-Release-Gate | PASS |

## 7. UX-, Markt- und Bestseller-Bewertung

Das Produkt besitzt einen klaren, verständlichen Kernnutzen: Es reduziert das Risiko, zeitkritische Gaming-Ereignisse zu verpassen. Lokale Tonprofile, Countdowns, Schnellstartkarten und Schutzfenster unterstützen diesen Nutzen direkt. Die Konzentration auf einen konkreten Spielkontext ist für eine Nischenanwendung vorteilhaft, weil sie die fachliche Tiefe erhöht.

Für ein App-Store-Bestsellerprodukt reichen technische Korrektheit und Funktionsumfang allein nicht aus. Die aktuelle Oberfläche muss langfristig anhand realer Nutzung auf Einstiegsgeschwindigkeit, Alarmvertrauen, Lesbarkeit im mobilen Querformat, Rückkehrhäufigkeit und Fehlerverständlichkeit optimiert werden. Die sichtbare App hält interne technische Metadaten weitgehend aus dem UI heraus. Eine vollständige Bestsellerbewertung ist ohne reale Nutzungsdaten, Store-Experimente und Retention-Messungen nicht belastbar.

Die strategische Erweiterung zum Command Center ist sinnvoll, sollte aber erst nach Stabilisierung des Kerns erfolgen. Event-Historie, Teamkoordination, Synchronisation und intelligente Presets würden den Nutzwert erhöhen, gleichzeitig aber Account-Isolation, Datenschutz, Synchronisationskonflikte und Backend-Betrieb deutlich komplexer machen.

## 8. Externe Punkte außerhalb des aktuellen Arbeitsablaufs

Die folgenden Themen wurden bewusst nicht als interne Implementierungsaufgaben behandelt:

| Externer Punkt | Aktueller Status | Begründung für Ausschluss |
|---|---|---|
| Google-Play- und App-Store-Einreichung | Vorbereitet, nicht eingereicht | Erfordert externe Entwicklerkonten, Formulare, Signierung und Review-Prozess |
| Reale Store-Produkte und produktive Abrechnung | Nicht aktiviert | Erfordert Store-Konfiguration, Purchase-Receipts, Schlüssel und externe Verifikation |
| Backend, Datenbank und Migrationen | Deaktiviert | Das aktuelle Web-Produkt ist bewusst localStorage-basiert |
| Cloud-Synchronisation und Serverkonten | Nicht Bestandteil des aktuellen Produkts | Würde das Datenschutz- und Architekturmodell verändern |
| Physische Android-/iOS-Gerätetests | Nicht durch Sandbox verifiziert | Erfordern reale Hardware und Betriebssystemzustände |
| Externe Alarm- oder Leitstellenintegrationen | Nicht vorgesehen | Gehören nicht zum lokalen Gaming-Produktkern |
| Command-Center-Erweiterungen | Strategisch zurückgestellt | Reliability-, Isolation- und Release-Gates haben Vorrang |

## 9. Priorisierte interne Empfehlungen

**Priorität 1: Den validierten Kern unverändert stabil halten.** Jede weitere Änderung an Zeitberechnung, Accountbesitz, Benachrichtigungsplanung oder Backup muss denselben Full-Release-Gate durchlaufen. Die bestehenden Tests sind als dauerhafte Produktverträge zu behandeln.

**Priorität 2: Die Web-App modularisieren.** Domainlogik, Persistenz, Scheduler und UI sollten schrittweise aus `app.js` extrahiert werden. Die Extraktion darf erst erfolgen, wenn pro Modul bestehende Browser- und Domain-Verträge erhalten bleiben.

**Priorität 3: Die Preisquelle vereinheitlichen.** Native und Web-Tarife sollten aus einer kanonischen, typisierten Datenquelle erzeugt werden. Dadurch sinkt das Risiko, dass Preis-, Limit- und Featureinformationen zwischen Plattformen auseinanderlaufen.

**Priorität 4: Native Notification-Reconciliation weiter operationalisieren.** Eine serialisierte Reconciliation mit Generationstoken oder Mutex, persistierten Notification-IDs und Plattformgrenzen würde die Robustheit bei schnellen State-Änderungen weiter erhöhen.

**Priorität 5: Erst danach externe Launch-Schritte ausführen.** Store-Einreichung, produktive Abrechnung, physische Geräteabnahme und externe Formulare sollten nur anhand eines unveränderten, signierten Release-Builds erfolgen.

## 10. Schlussbewertung

Der aktuelle Repository-Stand ist ein **interner Release Candidate mit bestandenem Full-Release-Gate**. Die technische Kernqualität ist hoch, besonders bei Zeitlogik, Account-Isolation und Regressionstests. Die wichtigste verbleibende Einschränkung liegt nicht in einem bekannten internen Blocker, sondern in der Trennung zwischen lokal abgesichertem Produktkern und noch nicht ausgeführten externen Betriebs- und Store-Schritten.

Das Projekt ist damit bereit für die nächste interne Entwicklungsphase und für kontrollierte externe Vorbereitung. Es ist noch nicht gleichbedeutend mit einer vollständig live betriebenen, kommerziell abgerechneten App-Store-Anwendung.

## References

[1]: https://github.com/famlabsoffice-dev/tgm-alarm-center/blob/main/README.md "TGM ALARM CENTER — Produktumfang und Betriebsmodell"

[2]: https://github.com/famlabsoffice-dev/tgm-alarm-center/blob/main/docs/TGM-CORE-UND-WORKFLOW-BASELINE.md "TGM Core und Workflow Baseline"

[3]: https://github.com/famlabsoffice-dev/tgm-alarm-center/blob/main/tests/reliability.test.ts "TGM ALARM CENTER — Reliability Tests"

[4]: https://github.com/famlabsoffice-dev/tgm-alarm-center/blob/main/tests/account-alarm-actions.test.ts "TGM ALARM CENTER — Account Isolation Tests"

[5]: https://github.com/famlabsoffice-dev/tgm-alarm-center/blob/main/scripts/verify-full-release.mjs "TGM ALARM CENTER — Full Release Gate"

[6]: https://github.com/famlabsoffice-dev/tgm-alarm-center/blob/main/docs/NEXT-WORK-PLAN.md "TGM ALARM CENTER — Next Work Plan"

[7]: https://github.com/famlabsoffice-dev/tgm-alarm-center/commit/c0fe835 "TGM ALARM CENTER — Bewerteter Commit c0fe835"

---

**Hinweis zum Bewertungsumfang:** Die Bewertung berücksichtigt den Repository-Zustand und die im Arbeitslauf ausgeführten Prüfungen. Externe Store-Konten, reale Kauftransaktionen, physische Geräte und produktive Nutzer-/Retention-Daten wurden nicht als interne Nachweise simuliert.
