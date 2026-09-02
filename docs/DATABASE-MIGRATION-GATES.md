# Datenbank-Migrations-Gates

## Geltungsbereich

Der aktuelle TGM-Webstand `v0.0.1` besitzt kein serverseitiges Backend und keine Datenbank. Der produktive Webzustand ist localStorage-basiert. Deshalb darf der aktuelle Release keine Datenbankmigration ausführen. `scripts/migration-gates.sh preflight` meldet diesen Zustand ausdrücklich als nicht anwendbar; `expand`, `application-deploy` und `contract` werden bei deaktiviertem Backend sicher blockiert.

## Getrennte Release-Gates

| Gate | Zweck | Freigabevoraussetzung |
|---|---|---|
| `preflight` | Backup, Verbindung, Berechtigungen, Kapazität und Advisory Lock bestätigen | Alle Preflight-Signale sind `1`, Schema-Version ist gesetzt |
| `expand` | Additive, rückwärtskompatible Migrationen prüfen | Preflight freigegeben, versionierte SQL-Dateien vorhanden, keine destruktiven Operationen |
| `application-deploy` | Neue Anwendung erst nach Expand-Gate zulassen | Expand-Nachweis vorhanden |
| `contract` | Destruktives Cleanup in einem separaten Release zulassen | Backfill vollständig, Beobachtung stabil, Rollback-Frist abgelaufen, explizite Freigabe |

Die Gates führen selbst keine SQL-Anweisung aus. Sie bilden die unveränderliche Policy-Schranke, die zwischen einem Deployment-Orchestrator und einer später einzuführenden Datenbankmigration liegt. Jede reale Datenbankintegration muss vor Nutzung der Backend-Gates zusätzlich ein versioniertes Migrationssystem mit Prüfsummen, Backup-Nachweisen und Advisory Lock implementieren.

## Lokale Ausführung

Der sichere aktuelle Pfad lautet:

```bash
pnpm run verify:migrations
```

Das Ergebnis ist im aktuellen Stand ein erfolgreicher, datenbankneutraler Preflight. Es werden keine Tabellen verändert und keine Migrationen simuliert.

Ein zukünftiger Backend-Preflight benötigt mindestens folgende bestätigte Variablen:

```bash
TGM_BACKEND_ENABLED=1 \
TGM_EXPECTED_SCHEMA_VERSION=2026-09-01 \
TGM_BACKUP_VERIFIED=1 \
TGM_CONNECTION_VERIFIED=1 \
TGM_PERMISSIONS_VERIFIED=1 \
TGM_CAPACITY_VERIFIED=1 \
TGM_ADVISORY_LOCK_VERIFIED=1 \
TGM_MIGRATION_STATE_DIR=/var/lib/tgm-alarm-center/migrations \
./scripts/migration-gates.sh preflight
```

Destruktive oder inkompatible Operationen wie `DROP TABLE`, `DROP COLUMN`, inkompatible Umbenennungen, `ALTER TYPE` und erzwungene `NOT NULL`-Änderungen werden im Expand-Gate abgelehnt. Das Contract-Gate verlangt zusätzlich abgeschlossenen Backfill, eine stabile Beobachtungsphase, eine abgelaufene Rollback-Frist und die explizite Freigabe `TGM_CONTRACT_APPROVAL=APPROVED`.

## CI-Verhalten

`.github/workflows/migration-gates.yml` führt bei Pushes auf `main`, Pull Requests und manueller Ausführung ausschließlich `verify:migrations` mit `TGM_BACKEND_ENABLED=0` aus. Damit ist der aktuelle localStorage-only-Stand im CI sichtbar abgesichert, ohne eine nicht vorhandene Datenbank zu verändern. Nach Einführung eines Backends müssen Preflight, Application-Deployment und Contract-Cleanup als getrennte Pipeline-Gates mit echten, geschützten Betriebsnachweisen integriert werden.

## Fehlerverhalten

Ein Backup-, Verbindungs-, Berechtigungs-, Kapazitäts- oder Advisory-Lock-Fehler stoppt den Preflight vor jedem Traffic-Switch. Ein fehlgeschlagener Backfill wird nicht automatisch als Contract-Freigabe gewertet. Der Application-Rollback bleibt auf Anwendungsebene atomar; das Expand-Schema bleibt bestehen. Eine Down-Migration ist kein primärer Rollback-Mechanismus.
