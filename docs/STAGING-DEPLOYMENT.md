# Staging-Deployment für TGM ALARM CENTER

`scripts/deploy-staging.sh` installiert ein festgelegtes GitHub-Release-Asset lokal auf einem Staging-Server. Das Skript ist für die Ausführung auf dem Zielserver ausgelegt; es benötigt keinen Node.js-Runtime-Prozess und keine Verbindung zum Quellcheckout.

## Sicherheits- und Installationsverhalten

Das Skript lädt das Web-Archiv und die SHA-256-Datei ausschließlich über HTTPS, verwendet bei gesetztem `TGM_GITHUB_TOKEN` einen Bearer-Header für private GitHub-Releases und schreibt das Token weder in eine Datei noch in die Ausgabe. Vor der Installation werden Prüfsumme, ZIP-Integrität, Pflichtdateien, Audiodateien und der im `BUILD-MANIFEST.json` ausgewiesene Quell-Commit validiert.

Die neue Version wird in einem eigenen Verzeichnis unterhalb von `releases/` installiert. Der produktive Staging-Webserver sollte auf den Symlink `current` zeigen. Der Symlink wird atomar über eine temporäre Verknüpfung und `mv -T` ersetzt, sodass während des Wechsels kein halb installiertes Verzeichnis sichtbar wird. Die bisherige Version wird als `previous` verlinkt. Ein Rollback erfolgt mit `--rollback`.

## Ausführung

Für das private Repository muss der Token über eine geschützte Secret- oder Environment-Variable bereitgestellt werden. Er sollte nur die minimal notwendigen Leserechte für Contents/Releases besitzen und niemals als Kommandozeilenargument übergeben werden.

```bash
export TGM_GITHUB_TOKEN='…'
export TGM_STAGING_ROOT='/var/www/tgm-alarm-center-staging'
export TGM_EXPECTED_COMMIT='416c98ca64028d4501b8230844deb03a8a118223'
./scripts/deploy-staging.sh
```

Ein Rollback auf die unmittelbar vorherige Installation ist möglich mit:

```bash
./scripts/deploy-staging.sh --rollback
```

Das Skript ist standardmäßig auf `v0.0.1` und den zugehörigen verifizierten Commit eingestellt. Für spätere Releases können `TGM_RELEASE_TAG` und `TGM_EXPECTED_COMMIT` gemeinsam gesetzt werden.

## Zwei Ausführungswege

| Ausführungsweg | Vorteile und Trade-offs | Kosten | Einrichtungskomplexität |
|---|---|---:|---:|
| Manuelle oder per SSH gestartete Ausführung auf dem Staging-Server | Einfacher, transparent und gut für kontrollierte Releases; benötigt jedoch einen Operator oder einen vorhandenen SSH-Zugriff | Keine zusätzliche Plattformgebühr | Niedrig |
| Ausführung aus einer CI/CD-Pipeline mit geschütztem Token und SSH-Deploy-Key | Wiederholbar, auditierbar und nach erfolgreichem Gate automatisierbar; benötigt Secret-Management, Netzwerkfreigabe und einen abgesicherten Deploy-Runner | Abhängig vom CI-Anbieter | Mittel |

Für den ersten Staging-Install ist die manuelle bzw. per SSH gestartete Ausführung der leichtere Weg. Für wiederkehrende Deployments sollte derselbe geprüfte Aufruf in eine CI/CD-Pipeline übernommen werden, wobei Token und SSH-Schlüssel ausschließlich als geschützte Secrets hinterlegt werden.

## Voraussetzungen

Der Staging-Server benötigt Bash 4+, `curl`, `sha256sum`, `unzip`, `find`, `grep`, `awk`, `sort`, `readlink`, `ln`, `mv`, `mkdir`, `rm` und `date`. Der Zielpfad muss für den ausführenden Benutzer beschreibbar sein. Der Webserver muss anschließend auf `$TGM_CURRENT_LINK` zeigen und statische Dateien aus diesem Symlink ausliefern.

## Verifikation nach der Installation

Nach einem erfolgreichen Lauf meldet das Skript Release, Installationspfad, aktiven Symlink, manifestierten Commit und validierte SHA-256-Prüfsumme. Danach sollte der produktive Staging-Hostname mit dem Browser-Smoke-Test geprüft werden. Ein echter Remote-Deploy wurde durch die Erstellung dieses Skripts nicht ausgeführt.

## Automatischer Health-Check

`scripts/check-staging-health.sh` prüft nach dem Deployment den aktiven `current`-Symlink, die installierte Release-Version, `RELEASE-COMMIT`, `RELEASE-SHA256`, `BUILD-MANIFEST.json`, alle Pflichtdateien und die drei Alarmton-Dateien. Anschließend ruft es die Staging-URL über HTTPS ab, prüft den Anwendungstitel und verifiziert die Erreichbarkeit der zentralen JavaScript-, CSS-, Service-Worker-, Manifest-, Icon- und Audio-Assets.

Der Standardaufruf erfordert die Staging-URL und den lokalen Installationspfad:

```bash
export TGM_STAGING_URL='https://staging.example.com'
export TGM_STAGING_ROOT='/var/www/tgm-alarm-center-staging'
export TGM_EXPECTED_COMMIT='416c98ca64028d4501b8230844deb03a8a118223'
./scripts/check-staging-health.sh
```

Der Prozess beendet sich mit Exit-Code `0` bei einem vollständigen PASS und mit Exit-Code `1` bei einem technischen Health-Check-Fehler. Konfigurationsfehler wie eine fehlende URL oder eine HTTP-URL ohne explizite Freigabe führen zu Exit-Code `2`. Für Monitoring-Systeme ist eine JSON-Antwort verfügbar:

```bash
TGM_HEALTH_FORMAT=json ./scripts/check-staging-health.sh
```

HTTP-Staging ist standardmäßig abgelehnt. Für ein ausdrücklich internes Testnetz kann `TGM_ALLOW_HTTP=1` gesetzt werden; für öffentlich erreichbares Staging muss HTTPS verwendet werden. Der Health-Check verändert weder Release-Dateien noch den aktiven Symlink.

Nach einem erfolgreichen Deployment kann der Check im selben Serverprozess direkt verkettet werden:

```bash
./scripts/deploy-staging.sh && ./scripts/check-staging-health.sh
```

Für CI/CD sollte `TGM_STAGING_URL`, `TGM_STAGING_ROOT` und `TGM_EXPECTED_COMMIT` aus geschützten Pipeline-Variablen stammen. Das Skript führt keinen automatischen Rollback aus; bei einem fehlgeschlagenen Check bleibt die neue Installation unangetastet, sodass der Operator oder die Pipeline bewusst `./scripts/deploy-staging.sh --rollback` ausführen kann.

## Automatischer Rollback nach fehlgeschlagenem Health-Check

Für ein Deployment mit automatischer Nachprüfung wird `scripts/deploy-staging-with-health.sh` verwendet. Der Wrapper merkt sich vor der Aktivierung den aktuell laufenden Release-Commit, führt das normale Deployment aus und startet danach den Health-Check. Schlägt dieser fehl, wird `deploy-staging.sh --rollback` ausgeführt und der wiederhergestellte vorherige Commit erneut geprüft.

```bash
export TGM_GITHUB_TOKEN='…'
export TGM_STAGING_URL='https://staging.example.com'
export TGM_STAGING_ROOT='/var/www/tgm-alarm-center-staging'
export TGM_EXPECTED_COMMIT='416c98ca64028d4501b8230844deb03a8a118223'
./scripts/deploy-staging-with-health.sh
```

Der Wrapper liefert `0`, wenn Deployment und Health-Check erfolgreich sind. Er liefert `1`, wenn das neue Deployment den Health-Check nicht besteht, der automatische Rollback jedoch erfolgreich war und der vorherige Release wieder gesund antwortet. Exit-Code `2` bedeutet Konfigurationsfehler, fehlgeschlagenes Deployment oder einen nicht erfolgreich verifizierten Rollback; in diesem Fall ist eine manuelle Prüfung erforderlich.

Der Rollback wird nur ausgeführt, wenn vor der Aktivierung ein gültiger vorheriger Release mit `RELEASE-COMMIT` vorhanden war. Ohne belastbaren Vorgänger bleibt der Fehler sichtbar, anstatt eine unbekannte Version zu aktivieren. Der Symlink-Wechsel bleibt atomar; das Skript führt keine destruktive Löschung des aktuell aktiven oder wiederhergestellten Releases durch.
