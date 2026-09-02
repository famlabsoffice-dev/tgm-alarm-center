# PR #3 — Saubere Neubasierung auf `main`

**Projekt:** TGM ALARM CENTER  
**Zielbranch:** `main`  
**Basis-Commit:** `6700d8b`  
**Ausgangs-PR:** [PR #3](https://github.com/famlabsoffice-dev/tgm-alarm-center/pull/3)  
**Ausgangsproblem:** Ein testweiser Additiv-Merge von PR #3 erzeugte 47 TypeScript-Fehler.  
**Zielstatus:** konfliktfreier, typgeprüfter, getesteter und reviewbarer Pull Request.

> **Grundsatz:** PR #3 wird nicht mit `ours` oder `theirs` als pauschaler Konfliktstrategie zusammengeführt. Die aktuelle `main`-Architektur ist die führende Quelle; fachliche PR-3-Änderungen werden einzeln neu portiert und nach jedem Schichtenabschnitt validiert.

## 1. Zieldefinition und Nichtziele

Der Rebase soll die sicherheitsrelevante Billing- und Entitlement-Härtung von PR #3 auf den aktuellen `main`-Stand übertragen. Dazu gehören der sichere Kaufzustand, serverseitig verifizierbare Entitlements, Offline-Cache-Regeln, Restore-Verhalten, Webhook-Signaturprüfung, idempotente Ereignisverarbeitung und datensparsame Telemetrie.

Nicht Ziel des ersten Rebase-Schritts ist, externe Infrastruktur vorzutäuschen. Google-Play-Servicekonto, Apple-App-Store-Server-Notifications, IAPKit-Produktionsschlüssel, Datenbank, Domain, Signierung und reale Store-Sandbox bleiben externe Aktivierungsschritte. Der portierte Code muss ohne gesetzte Produktionsgeheimnisse sicher fehlschlagen und darf lokale Käufe nicht unbestätigt freischalten.

## 2. Sicherheitsvorkehrungen vor Beginn

Vor jedem Rebase wird ein unveränderter Referenzpunkt gespeichert. Die Arbeitskopie muss sauber sein; lokale Store-Assets, Credentials und Build-Artefakte dürfen nicht in den Rebase einfließen.

```bash
git fetch origin main refs/pull/3/head

git switch -c rebase/pr3-on-main origin/main
git tag -f review/pr3-original origin/pr-3

git status --short --branch

git diff --check
```

Die Originalreferenz `review/pr3-original` darf während der Arbeit nicht überschrieben werden. Jeder Portierungsschritt erhält einen eigenen Commit. So können fehlerhafte Schichten einzeln zurückgesetzt werden, ohne den gesamten Rebase zu verlieren.

## 3. PR-3-Änderungslandkarte

| Schicht | PR-3-Dateien | Portierungsstrategie | Abhängigkeit |
|---|---|---|---|
| Native App und Paywall | `App.tsx`, `src/billing/Paywall.tsx` | Gegen aktuelle `App.tsx`-Props und bestehendes Billing-Panel neu verdrahten | Aktueller Katalog und App-State |
| Store-Adapter | `src/billing/adapter.ts`, `src/billing/expoIapAdapter.ts`, `src/billing/index.ts` | API gegen installierte `expo-iap`-Version prüfen und Adapter isoliert halten | `expo-iap`, aktueller Produktkatalog |
| Produktkatalog | `src/billing/catalog.ts` | Aktuellen 25-ID-Katalog als kanonische Quelle behalten; PR-3-Metadaten nur ergänzen | `main`-Katalog |
| Entitlements | `src/billing/entitlements.ts`, `src/billing/offlineCache.ts`, `src/billing/service.ts` | Reines Modell zuerst portieren, danach Store-Lifecycle anschließen | Tier-Rangfolge, Perioden, Verifikation |
| Account-Zuordnung | `src/billing/account.ts` | Lokale Profile von echten Serverkonten strikt trennen | Lokaler Storage, serverseitige Identität |
| Serverkonfiguration | `server/config.ts`, `server/index.ts` | Nur sichere Konfigurationshülle portieren; Secrets ausschließlich aus Runtime-Umgebung | Node-Runtime, Deployment-Konfiguration |
| Verifikation | `server/providers.ts`, `server/security.ts` | Kryptografische Claims-, Audience-, Issuer-, Zeit- und Signaturprüfungen portieren | Provider-Schlüssel und Zertifikate |
| Webhooks | `server/repository.ts`, `server/webhooks.ts` | Idempotente Event-Verarbeitung mit atomarer Persistenz portieren | Datenbank oder persistenter Store |
| Telemetrie | `src/telemetry/telemetry.ts`, `docs/TELEMETRY.md` | Opt-in-/Datensparsamkeitsmodell gegen finale Datenflüsse prüfen | Privacy- und Store-Angaben |
| Tests | `tests/domain.test.ts`, `tests/server.test.ts` | Tests auf aktuelle Exporte und Typen umstellen; negative Sicherheitsfälle ergänzen | Alle Modellschichten |
| Gates und CI | `scripts/verify-native-config.mjs`, `.github/workflows/web-core.yml` | Aktuelles Full-Gate erweitern, nicht durch ältere Workflow-Version ersetzen | `pnpm verify:full-release` |

## 4. Rebase- und Portierungsreihenfolge

### Phase A — Referenz und Konfliktinventar

Zuerst wird ein temporärer Branch von `origin/main` erstellt. PR #3 wird nicht direkt in `main` rebased. Anschließend werden alle geänderten Dateien, Exporte, Paketänderungen und Abhängigkeiten erfasst.

```bash
git diff --name-status review/pr3-original...origin/pr-3
git diff --stat review/pr3-original...origin/pr-3
git log --oneline --reverse review/pr3-original..origin/pr-3
pnpm install --frozen-lockfile
pnpm typecheck
```

Das Ergebnis wird als Fehlerbaseline gespeichert. Die bekannten 47 Fehler werden in Kategorien eingeteilt: veraltete Exporte, inkompatible Typen, fehlende Abhängigkeiten, Konflikte mit dem aktuellen Katalog, App-Prop-Konflikte und Server-/Node-Umgebungsprobleme.

### Phase B — Paket- und Toolchain-Abgleich

Vor dem Quellcode werden `package.json`, `pnpm-lock.yaml`, `tsconfig`, Expo-Konfiguration und CI-Workflow abgeglichen. Die Versionen des aktuellen `main` bleiben führend, sofern PR #3 keine zwingende Sicherheitsabhängigkeit enthält.

Folgende Regeln gelten:

1. `expo-iap` wird nicht auf eine ältere PR-Version zurückgesetzt.
2. `pnpm-lock.yaml` wird nur durch `pnpm install` aktualisiert, niemals manuell.
3. Keine Serverabhängigkeit wird in den mobilen Client importiert.
4. Keine Node-spezifischen Module dürfen in Expo-/React-Native-Code gelangen.
5. `eas.json`, Android API 36 und vorhandene Store-Assets dürfen nicht rückgängig gemacht werden.
6. Der bestehende `pnpm verify:full-release`-Orchestrator bleibt der einzige lokale Gesamt-Gate-Einstieg.

**Gate A:** `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm lint` und `pnpm test` müssen vor jeder Billing-Portierung auf dem temporären Branch grün sein.

### Phase C — Reines Entitlement-Modell

Zuerst werden `src/billing/entitlements.ts` und `src/billing/offlineCache.ts` portiert. Diese Dateien dürfen keine Store-SDK-Aufrufe enthalten. Sie erhalten nur klar typisierte Modelle und reine Funktionen.

Die folgenden Invarianten sind zwingend:

| Invariante | Erwartung |
|---|---|
| Unbestätigter Kauf | Kein bezahltes Entitlement |
| `source: none` | Immer `free` |
| Abgelaufene Subscription | `free`, sofern kein anderes gültiges Entitlement besteht |
| Server-Entitlement | Nur nach Signatur-/Provider-Verifikation akzeptiert |
| Offline-Cache | Nur innerhalb der definierten maximalen Cache-Zeit nutzbar |
| Lokaler Kaufstatus | Darf Server-Entitlement nicht vortäuschen |
| Höchster Tarif | Nur aus gültigen, nicht widerrufenen Entitlements berechnen |
| Lifetime | Kein Ablaufdatum, aber weiterhin gültige Store-Verifikation erforderlich |

**Gate B:** Reine Unit-Tests für gültige, abgelaufene, widerrufene, nicht signierte, zu alte und widersprüchliche Entitlements bestehen.

### Phase D — Kanonischer Produktkatalog

Der aktuelle `main`-Katalog mit 25 Produkten bleibt die einzige Quelle für Tier, Billing-Periode und plattformspezifische IDs. PR-3-Katalogfelder dürfen nur übernommen werden, wenn sie auf diese IDs abbildbar sind.

Jede Produkt-ID muss folgende Prüfungen bestehen:

- Google-Play-ID ist vorhanden.
- Apple-Produkt-ID ist vorhanden.
- Plan und Periode sind gültig.
- Subscription und Lifetime werden unterschieden.
- Kein Produkt verweist auf einen unbekannten Tier.
- Keine ID ist doppelt.
- Alle bezahlten Tiers sind in den Tests abgedeckt.

**Gate C:** Katalogtests, Pricing-Tests und Store-Config-Gate bestehen gemeinsam.

### Phase E — Store-Adapter isolieren

`src/billing/adapter.ts` definiert ein plattformneutrales Interface. `src/billing/expoIapAdapter.ts` implementiert nur die konkrete `expo-iap`-Anbindung. UI-Komponenten dürfen nicht direkt mehrere konkurrierende Store-Lifecycle-Implementierungen enthalten.

Der Adapter muss folgende Zustände explizit behandeln:

| Zustand | Verhalten |
|---|---|
| Store nicht verfügbar | UI zeigt nicht verfügbar; kein Grant |
| Produktkatalog leer | Kein Kaufbutton als erfolgreich ausgeben |
| Kauf pending | Status anzeigen; nicht freischalten |
| Kauf abgebrochen | Kein Fehler-Entitlement; Nutzer kann erneut versuchen |
| Kauf erhalten | Token zur Verifikation weitergeben |
| Verifikation ungültig | Transaktion nicht als Entitlement übernehmen |
| Verifikation erfolgreich | Erst danach Transaktion beenden |
| Restore | Jede wiederhergestellte Transaktion erneut verifizieren |
| Doppelte Transaktion | Idempotent verarbeiten |
| Netzwerkfehler | Kein unbestätigter Grant; retryfähiger Zustand |

**Gate D:** Adaptertests laufen mit simulierten Store-Ereignissen, ohne echte Store-Credentials vorauszusetzen.

### Phase F — Server- und Webhook-Schicht portieren

Die Serverdateien werden erst nach dem reinen Modell und Adapter übernommen. `server/security.ts` muss die Signatur, den Algorithmus, Issuer, Audience, `iat`, `exp`, Zeitfenster und Claim-Typen prüfen. Unsichere Algorithmen und fehlende Claims werden abgewiesen.

`server/repository.ts` muss Event-IDs idempotent speichern. Ein bereits verarbeitetes Event darf keinen zweiten Entitlement-Grant, keine Verlängerung und keine erneute Nebenwirkung auslösen.

`server/webhooks.ts` muss Apple- und Google-Ereignisse getrennt behandeln. Ein unbekanntes Produkt, unbekannter Nutzer, fehlender Token oder widersprüchlicher Status wird sicher verworfen und revisionsfähig protokolliert.

**Gate E:** Servertests bestehen für gültige Tokens, falsche Audience, falschen Issuer, abgelaufene Tokens, ungültige Signaturen, Replay-Events, unbekannte Produkte und unbekannte Nutzer.

### Phase G — App- und Paywall-Integration

Erst wenn Katalog, Entitlement-Service und Adapter typgeprüft sind, wird `App.tsx` angepasst. Die aktuelle Alarm- und Notification-Logik bleibt unverändert, außer wenn ein klarer Callback für den bestätigten Tier nötig ist.

Die Paywall muss:

1. Produktpreise aus dem Store anzeigen, nicht aus statischen Preisannahmen.
2. Kaufbuttons bei nicht geladenen Produkten deaktivieren.
3. Pending, Fehler, Restore und erfolgreiche Aktivierung klar unterscheiden.
4. Keine lokale Auswahl allein als bezahltes Entitlement speichern.
5. Restore beim Start und auf explizite Nutzeraktion unterstützen.
6. Einen sicheren Zustand anzeigen, wenn der Verifikationsdienst nicht erreichbar ist.
7. Keine Serverfehler, Tokens oder internen Diagnosedaten im Endkunden-UI zeigen.

**Gate F:** Typecheck, Lint, Unit-Tests und ein UI-Smoke-Test für Free-, Pending-, Verified-, Restore- und Error-Zustand bestehen.

### Phase H — Telemetrie und Datenschutz

`src/telemetry/telemetry.ts` wird nur übernommen, wenn die finale Datenflussbeschreibung aktualisiert wird. Ereignisse dürfen keine Kauf-Tokens, E-Mail-Adressen, vollständigen Nutzer-IDs, Alarmtitel oder Backup-Inhalte enthalten.

Vor Aktivierung müssen Zweck, Rechtsgrundlage, Opt-in/Opt-out, Speicherdauer, Drittanbieter, internationale Übertragung und Löschung in den Datenschutzseiten und Store-Formularen konsistent sein.

**Gate G:** Telemetrie-Tests beweisen, dass sensible Daten redigiert beziehungsweise nicht erzeugt werden.

### Phase I — Native Konfiguration und CI

`scripts/verify-native-config.mjs` wird auf den aktuellen `main`-Stand portiert. Es muss API 36, Bundle-/Package-ID, Notification-Permissions, Sounds, Billing-Plugin, Paywall-Aktionen, Restore-Operationen, Offline-Cache-Regeln und Exact-Alarm-Reporting prüfen.

Der CI-Workflow darf den bestehenden Node-22-/pnpm-10-Workflow nicht durch eine ältere Node-20-/pnpm-9-Version ersetzen. Der Workflow ruft den zentralen Full-Gate-Lauf auf.

**Gate H:** `pnpm verify:full-release` läuft in der lokalen Umgebung vollständig durch; im CI wird derselbe Befehl mit dem exakten Commit ausgeführt.

## 5. Vorgehen bei den 47 Fehlern

| Fehlerklasse | Behandlung |
|---|---|
| Fehlender Export | Export aus der aktuellen Zielarchitektur ergänzen oder Import auf kanonischen Export ändern |
| Veralteter Typname | Gegen aktuellen Domain-/Billing-Typ ersetzen, nicht per `any` unterdrücken |
| Falsche `expo-iap`-Signatur | Installierte Typdefinition als API-Vertrag verwenden |
| App-Prop-Konflikt | Adapter-/Service-Callback definieren; keine parallelen Kaufzustände im UI |
| Katalog-Konflikt | Aktuellen 25-ID-Katalog behalten, PR-3-Funktionen darauf mappen |
| Server-/Client-Grenze | Servercode aus Expo-Bundle fernhalten |
| Fehlende Dependency | Nur mit geprüfter, produktionsrelevanter Dependency ergänzen; Lockfile reproduzierbar aktualisieren |
| Implizites `any` | Konkreten Domaintyp definieren; keine globale TypeScript-Abschaltung |
| Testimport fehlt | Exportvertrag korrigieren und Negativtest ergänzen |
| Runtime-only API im Node-Test | Plattformadapter mockbar machen oder pure Funktion extrahieren |
| Veraltete Dokumentation | Nach erfolgreichem Port aktualisieren, nicht als Ersatz für Codeänderung verwenden |

Jeder Fehler wird einzeln behoben. Nach jeder Fehlerklasse werden zunächst `pnpm typecheck` und der betroffene Testbereich ausgeführt. Erst wenn die Fehlerzahl sinkt und keine neue Fehlerklasse entsteht, wird die nächste Schicht bearbeitet.

## 6. Commit-Struktur des bereinigten PR

Die neu basierte PR sollte keine unprüfbare Großzusammenführung enthalten. Empfohlen wird folgende Commit-Reihenfolge:

```text
refactor(billing): align entitlement types with current main
feat(billing): add verified entitlement model and safe offline cache
feat(billing): add platform adapter against installed expo-iap API
feat(billing): integrate verified paywall and restore lifecycle
feat(billing): add server verification and idempotent webhook handling
feat(telemetry): add privacy-preserving billing event telemetry
 test(billing): add negative verification, replay, restore and expiry cases
ci(release): include native config and server checks in full gate
docs(release): document rebased billing architecture and external activation gates
```

Jeder Commit muss einzeln typprüfbar sein oder ausdrücklich als Teil einer unmittelbar folgenden, atomaren Commitgruppe markiert werden. Der finale PR sollte keine generierten Artefakte, lokalen Credentials oder veralteten Store-Mockups enthalten.

## 7. Abnahmekriterien für den Merge

### Technische Kriterien

| Kriterium | Muss erfüllt sein |
|---|---:|
| `pnpm install --frozen-lockfile` | Ja |
| `pnpm typecheck` ohne Fehler | Ja |
| `pnpm lint` ohne Fehler | Ja; Warnungen separat dokumentieren |
| Alle Domain-/Billing-/Servertests | Ja |
| `pnpm verify:store-config` | Ja |
| `pnpm verify:native-config` | Ja |
| `pnpm verify:full-release` | Ja |
| Expo-Konfiguration | Ja |
| Kein `any` zur Fehlerunterdrückung | Ja |
| Keine geheimen Werte im Diff | Ja |
| Keine Client-Freischaltung ohne Verifikation | Ja |
| Keine doppelte Store-Lifecycle-Implementierung | Ja |
| Arbeitsbaum sauber | Ja |

### Sicherheitskriterien

Ein Merge ist abzulehnen, wenn Kauf- oder Restore-Transaktionen vor der Verifikation beendet werden, wenn ein lokaler Cache einen unbestätigten bezahlten Tier erzeugt, wenn Webhook-Events nicht idempotent sind, wenn Signatur-Claims nicht vollständig geprüft werden oder wenn Secrets in Code, Tests, Dokumentation oder Build-Artefakten auftauchen.

### Produktkriterien

Die Free-Funktionalität bleibt ohne Billing-Credentials nutzbar. Bei fehlendem Store oder fehlender Verifikation zeigt die App einen sicheren, verständlichen Fehlerzustand. Bezahlte Funktionen werden nicht als aktiv dargestellt, solange keine gültige Entitlement-Antwort vorliegt. Die bestehende Alarm-, Notification-, Backup- und Store-Metadatenfunktion darf durch die Portierung nicht regressieren.

## 8. Finaler Integrationsablauf

1. Branch von `origin/main` erstellen und PR #3 unverändert taggen.
2. Fehlerbaseline mit `pnpm typecheck` speichern.
3. Paket- und Toolchain-Abgleich abschließen.
4. Entitlement-Modell und Offline-Cache portieren.
5. Produktkatalog auf aktuelle 25 IDs abgleichen.
6. Plattformadapter gegen installierte `expo-iap`-Typen implementieren.
7. Verifikation-vor-Finish und Restore-Lifecycle anschließen.
8. Server-Signaturprüfung und idempotente Webhooks portieren.
9. Paywall und App-State integrieren.
10. Telemetrie gegen Datenschutzmodell prüfen.
11. Native Config-Gate und CI-Gate integrieren.
12. Nach jeder Schicht alle betroffenen Gates ausführen.
13. Einmaligen Full-Gate-Lauf auf dem finalen Branch ausführen.
14. Code Review anhand der Sicherheitskriterien durchführen.
15. Force-Push nur auf den PR-Branch, niemals direkt auf `main`.
16. PR #3 erst nach grünen CI-Gates und Review in `main` mergen.
17. Nach dem Merge den kanonischen Release- und Store-Status aktualisieren.

## 9. Erwartetes Ergebnis

Der Erfolg ist nicht daran zu messen, dass PR #3 formal als Rebase ohne Konflikt endet. Erfolgreich ist der Vorgang erst, wenn die fachlich relevanten Sicherheitsfunktionen gegen den aktuellen `main`-Stand portiert sind, alle 47 ursprünglichen TypeScript-Fehler beseitigt wurden, die neuen Tests tatsächlich gegen aktuelle Exporte laufen, `pnpm verify:full-release` besteht und der Pull Request keine Rücksetzung von API 36, Store-Assets, Billing-Katalog, Datenschutzunterlagen oder Release-Dokumentation enthält.

## 10. Externe Vorbehalte bleiben separat

Auch nach einem erfolgreichen Rebase bleiben echte Store-Produkte, IAPKit-Produktionsschlüssel, Google-/Apple-Signing, physische Geräte, Sandbox-/Lizenztests, Datenschutz-/Support-URLs und die Markenfreigabe externe Voraussetzungen. Der Rebase schließt ausschließlich repositoryinterne technische Blocker.

## References

[1]: https://github.com/famlabsoffice-dev/tgm-alarm-center/pull/3 "TGM ALARM CENTER — Pull Request #3"
[2]: https://github.com/famlabsoffice-dev/tgm-alarm-center/commits/main "TGM ALARM CENTER — main commit history"
[3]: https://docs.expo.dev/guides/in-app-purchases/ "Expo — In-app purchases"
[4]: https://developer.android.com/google/play/billing "Android — Google Play Billing"
[5]: https://developer.apple.com/in-app-purchase/ "Apple — In-App Purchase"
