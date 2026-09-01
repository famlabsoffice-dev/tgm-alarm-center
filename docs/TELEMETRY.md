# Telemetrie und Logging

## Zweck

Die Telemetrie misst ausschließlich Produktzustände, die für Aktivierung, Retention und Alarmzustellung relevant sind. Alarmtitel, Accountnamen, Alarm-IDs, genaue Kalenderzeiten, Backup-Inhalte und Store-Belege werden nicht erfasst.

## Einwilligung und Speicherung

Die Nutzungsanalyse ist standardmäßig deaktiviert. Sie kann im Einstellungsbereich optional aktiviert und jederzeit deaktiviert werden. Beim Deaktivieren wird die lokale Event-Queue gelöscht. Bis zur Auswahl eines externen Analytics-Backends verbleiben Ereignisse lokal in einer begrenzten Queue von maximal 500 Datensätzen.

Die Queue ist kein Ersatz für ein produktives Analytics-Backend. `TelemetryClient.exportEvents()` liefert ein versioniertes, batchfähiges Exportformat. Ein späterer Transport muss TLS, Authentifizierung, Rate-Limits, Löschfristen und die geltenden Datenschutzanforderungen des Betriebs ergänzen.

## Ereignisse

| Ereignis | Zweck | Daten |
|---|---|---|
| `app_opened` | Aktivitätsbeginn | App-Schema-Version |
| `session_started` | Sitzungszählung | keine Inhaltsdaten |
| `retention_day` | Kohorten-Retention | Tag seit Erstöffnung |
| `activation_completed` | Erster erfolgreicher Alarm | Alarmtyp, Wiederholungsmodus |
| `alarm_created` | Aktivierungs-Funnel | Alarmtyp, Wiederholungsmodus, Anzahl Vorwarnungen |
| `alarm_scheduled` | Planungszustand | Alarmtyp, Wiederholungsmodus, Anzahl Vorwarnungen |
| `alarm_scheduling_failed` | technische Zustellvorstufe | Alarmtyp |
| `alarm_delivery_received` | Benachrichtigung auf Gerät empfangen | Ereignistyp |
| `alarm_confirmed` | Nutzeraktion auf Benachrichtigung | Aktionstyp |
| `backup_exported` / `backup_restored` | Produktnutzung | Anzahl Alarme/Accounts nur beim Restore |
| `purchase_started` / `purchase_completed` / `restore_completed` | Monetarisierungs-Funnel | künftig Produkt-Key, niemals Store-Beleg |
| `telemetry_error` | internes Fehlerlogging | bereinigte, auf 80 Zeichen begrenzte Nachricht |

## Retention-Definition

`retention_day` wird beim ersten App-Start als Tag 0 und danach höchstens einmal pro UTC-Kalendertag erfasst. Die Kohorten-ID ist die lokale pseudonyme Installations-ID. Ohne aktivierte Nutzungsanalyse werden keine Retention-Ereignisse geschrieben.

## Zustellmetriken

`alarm_scheduled` wird erst nach erfolgreicher lokaler Scheduling-Funktion geschrieben. `alarm_delivery_received` wird bei tatsächlichem Notification-Receive-Callback geschrieben. `alarm_confirmed` wird nur nach der tatsächlichen Done-Aktion erfasst. Damit lassen sich geplante, zugestellte und bestätigte Alarme getrennt auswerten.

## Sicherheitsgrenzen

Die Telemetrie darf keine Premiumrechte, Alarmzustände oder Store-Entitlements vergeben. Sie ist vollständig beobachtend. Der lokale Export muss vor einem externen Upload mit einer authentifizierten Nutzer- oder Installationssession verbunden werden; die rohe Installations-ID darf nicht als öffentliche Identität verwendet werden.
