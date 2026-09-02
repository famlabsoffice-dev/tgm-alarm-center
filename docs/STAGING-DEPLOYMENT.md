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

## Produktions-Deployment mit Zero Downtime

`scripts/deploy-production.sh` ist die produktionsspezifische Variante. Sie verwendet denselben geprüften Download-, Integritäts- und Health-Check-Pfad, verlangt jedoch zusätzlich eine HTTPS-Produktions-URL und die explizite Bestätigung `TGM_PRODUCTION_CONFIRM=DEPLOY`. Dadurch kann ein versehentliches Ausführen ohne bewusst gesetzte Produktionsfreigabe keine Aktivierung auslösen.

Die neue Version wird vollständig in einem eigenen Release-Verzeichnis vorbereitet und geprüft. Der laufende Webserver bedient weiterhin `current`. Erst nach erfolgreichem Download, SHA-256-Prüfung, ZIP-Validierung, Manifest-Prüfung und Health-Check wird `current` durch einen atomaren Symlink-Wechsel ersetzt. Der Webserver wird nicht neu gestartet; offene Requests bleiben beim bisherigen statischen Verzeichnis und neue Requests sehen nach dem Wechsel die neue Version.

```bash
export TGM_GITHUB_TOKEN='…'
export TGM_PRODUCTION_URL='https://www.example.com'
export TGM_PRODUCTION_ROOT='/var/www/tgm-alarm-center'
export TGM_EXPECTED_COMMIT='416c98ca64028d4501b8230844deb03a8a118223'
export TGM_PRODUCTION_CONFIRM='DEPLOY'
./scripts/deploy-production.sh
```

Bei einem fehlgeschlagenen Health-Check wird die vorherige Version atomar wieder aktiviert und erneut geprüft. Exit-Code `0` bedeutet erfolgreich aktiviert, Exit-Code `1` bedeutet erfolgreich zurückgerollt und Exit-Code `2` bedeutet, dass eine Sicherheits-, Installations- oder Rollback-Prüfung manuelle Intervention benötigt. Das Produktionsskript wurde nur implementiert und lokal gegen seine Schutzlogik geprüft; ein echter Produktions-Deploy wurde nicht ausgeführt.

## Einmaliger Monitoring-Check für Cron und CI/CD

`scripts/monitor-staging-health.sh` führt genau einen Health-Check aus und ist damit für Cron, systemd-Timer oder eine CI/CD-Nachprüfung geeignet. Das Skript verwendet denselben lokalen und HTTP-basierten Health-Check wie der Deployment-Wrapper, schreibt den letzten Zustand atomar als JSON und verändert weder den aktiven Symlink noch Release-Dateien.

```bash
export TGM_STAGING_URL='https://staging.example.com'
export TGM_STAGING_ROOT='/var/www/tgm-alarm-center-staging'
export TGM_EXPECTED_COMMIT='416c98ca64028d4501b8230844deb03a8a118223'
./scripts/monitor-staging-health.sh
```

Der Standardpfad für den Zustand lautet `$TGM_STAGING_ROOT/.monitoring/staging-health-state.json`. Mit `TGM_MONITOR_STATE_FILE` kann ein zentraler, vom Service-Benutzer beschreibbarer Pfad gesetzt werden. Der Check liefert Exit-Code `0` bei PASS, `1` bei einem technischen Health-Fehler und `2` bei Konfigurations- oder Monitoringfehlern. Für einen automatisierten Alarm kann `TGM_ALERT_WEBHOOK_URL` auf eine HTTPS-Webhook-Adresse gesetzt werden. Der Webhook erhält ausschließlich ein JSON-Ereignis für `failure` oder — sofern `TGM_ALERT_ON_RECOVERY=1` — für `recovery`; das Skript protokolliert keine Zugangsdaten.

Ein Cron-Eintrag für einen fünfminütigen Check wird mit einem dedizierten Service-Benutzer und geschützten Environment-Variablen eingerichtet. Die konkrete Webhook-Adresse gehört in die Secret-Verwaltung des Zielsystems und nicht in das Repository:

```cron
*/5 * * * * . /etc/tgm-alarm-center/staging-health.env && /var/www/tgm-alarm-center/scripts/monitor-staging-health.sh >>/var/log/tgm-alarm-center/staging-health.log 2>&1
```

Die Datei `/etc/tgm-alarm-center/staging-health.env` muss mindestens `TGM_STAGING_URL`, `TGM_STAGING_ROOT` und `TGM_EXPECTED_COMMIT` enthalten und für andere Benutzer unlesbar sein. Bei einem fehlgeschlagenen Check bleibt der Exit-Code `1` erhalten, auch wenn die optionale Alarmzustellung ebenfalls fehlschlägt. Dadurch kann ein Monitoring-System den Ausfall nicht fälschlich als gesund bewerten.

## Deterministische Web-Archivierung

`pnpm run package:web` erzeugt aus dem geprüften `dist/web`-Verzeichnis ein ZIP-Archiv und die zugehörige SHA-256-Datei. Die Archivierung normalisiert Dateizeitstempel auf den ZIP-kompatiblen Epoch-Wert, verwendet eine byte-stabile, lexikografisch sortierte Dateiliste und schließt ZIP-Zusatzattribute aus. Dadurch liefern wiederholte Archivläufe bei identischem Build-Inhalt dieselbe SHA-256-Prüfsumme.

```bash
pnpm run build:web
pnpm run verify:packaging
pnpm run package:web
(cd dist && sha256sum -c tgm-alarm-center-web.zip.sha256)
unzip -tq dist/tgm-alarm-center-web.zip
```

Der deterministische Archivschritt ist Bestandteil von `pnpm run verify:release` und darf in der Release-Pipeline nicht übersprungen werden. Für den veröffentlichten Release bleibt das bestehende Asset `tgm-alarm-center-v0.0.1-web.zip` maßgeblich; die neue Archivroutine wird für nachfolgende Releases und reproduzierbare Rebuild-Nachweise verwendet.

## Offener Realbetriebsnachweis

Die Skripte und Gates sind repositoryseitig implementiert und lokal verifiziert. Ein echter Staging- oder Produktionsnachweis entsteht erst nach Ausführung auf dem jeweiligen Zielserver mit einer gültigen HTTPS-URL, einem beschreibbaren Installationspfad und den geschützten Release-Lesezugängen. Ohne diese Infrastruktur werden keine erfundenen Betriebs- oder Monitoring-Erfolge ausgewiesen.
