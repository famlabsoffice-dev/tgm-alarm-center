# Datenschutzerklärung

**TGM ALARM CENTER**  
**Stand:** [TT.MM.JJJJ]  
**Verantwortlicher:** [Vollständiger Name oder Firma]  
**Anschrift:** [Straße, Hausnummer, PLZ, Ort, Land]  
**E-Mail:** [Datenschutz-E-Mail-Adresse]

> **Arbeitsentwurf vor Veröffentlichung:** Diese Datenschutzerklärung muss vor der Veröffentlichung mit den tatsächlichen Datenflüssen, der finalen Release-Binary, den aktivierten SDKs, dem Sitz des Verantwortlichen und den eingesetzten Dienstleistern abgeglichen und rechtlich geprüft werden.

## 1. Gegenstand dieser Datenschutzerklärung

Diese Datenschutzerklärung erläutert, welche Informationen bei der Nutzung von TGM ALARM CENTER verarbeitet werden, zu welchen Zwecken dies geschieht, wo die Verarbeitung stattfindet und welche Rechte betroffene Personen haben. TGM ALARM CENTER ist eine lokale Alarm- und Erinnerungsanwendung für Gaming-Events. Die App ist kein offizieller Bestandteil eines Drittanbieter-Spiels und stellt keine Verbindung zu einem externen Spielkonto her, sofern dies in der ausgelieferten Version nicht ausdrücklich anders beschrieben ist.

## 2. Verantwortlicher

Verantwortlich im Sinne der Datenschutz-Grundverordnung (DSGVO) und sonstiger anwendbarer Datenschutzgesetze ist:

**[Vollständiger Name oder Firma]**  
**[Anschrift]**  
**[E-Mail-Adresse]**  
**[Telefon oder weitere Kontaktmöglichkeit, sofern vorgesehen]**

Für Datenschutzanfragen kann die oben genannte Datenschutz-E-Mail-Adresse verwendet werden.

## 3. Welche Daten verarbeitet werden

### 3.1 Lokal gespeicherte Alarm- und Profildaten

Die App kann folgende Informationen lokal auf dem Gerät speichern:

| Datenkategorie | Beispiele | Zweck | Übertragung durch die App |
|---|---|---|---|
| Lokale Profile | Profilname, Accountbezeichnung, ausgewählte Farbe | Zuordnung von Alarmen zu lokalen Profilen | Keine planmäßige Übertragung durch die App |
| Alarmdaten | Alarmname, Alarmtyp, Datum, Uhrzeit, Wiederholung, Zeitzone, Vorwarnungen | Planung und Anzeige von Erinnerungen | Keine planmäßige Übertragung durch die App |
| Einstellungen | Tonprofil, Benachrichtigungseinstellungen, Anzeigeoptionen | Betrieb und Personalisierung der App | Keine planmäßige Übertragung durch die App |
| Verlauf | lokal abgeschlossene Alarmereignisse | Anzeige des lokalen Verlaufs | Keine planmäßige Übertragung durch die App |
| Backup-Dateien | exportierte Alarm- und Einstellungsdaten | Vom Nutzer initiierter Export und Import | Nur durch den Nutzer ausgelöstes Teilen oder Speichern |

Die lokale Speicherung kann je nach Plattform über den lokalen Gerätespeicher und die von der App verwendeten lokalen Speichermechanismen erfolgen. Wer lokale Backups an andere Personen, Cloud-Dienste oder Apps weitergibt, ist für die dortige Verarbeitung verantwortlich.

### 3.2 Benachrichtigungen und Geräteberechtigungen

Die App kann lokale Benachrichtigungen planen, um den Nutzer an gespeicherte Alarme und Vorwarnungen zu erinnern. Dafür können Betriebssystemberechtigungen erforderlich sein. Der Inhalt einer lokalen Benachrichtigung kann den vom Nutzer gewählten Alarmnamen, die Alarmzeit und eine Vorwarnung enthalten.

Die App verwendet für diese Funktion keine Standortbestimmung. Sie benötigt keine Kontakte, keine Kamera, kein Mikrofon und keine SMS-Funktion, sofern diese Berechtigungen nicht in einer späteren Version ausdrücklich ergänzt und in dieser Datenschutzerklärung aktualisiert werden.

### 3.3 Store-Käufe und Entitlements

Wenn kostenpflichtige Tarife aktiviert sind, verarbeitet die App Kauf- und Wiederherstellungsinformationen, die von Google Play Billing oder Apple StoreKit bereitgestellt werden. Dazu können eine Produkt-ID, ein Transaktionsstatus und ein von der Store-Plattform bereitgestelltes Verifikations- beziehungsweise Transaktionstoken gehören.

Die Zahlung wird durch Google Play oder Apple abgewickelt. Zahlungsdaten wie vollständige Kreditkartennummern werden von TGM ALARM CENTER nicht verarbeitet. Für die Anzeige beziehungsweise Freischaltung eines gekauften Tarifs wird die Store-Transaktion verifiziert. Die App gewährt ein kostenpflichtiges Entitlement erst nach erfolgreicher Verifikation.

### 3.4 Verifikation über IAPKit

Für die technische Kaufverifikation kann die App den von der Store-Plattform gelieferten Verifikationsnachweis an IAPKit beziehungsweise den im finalen Build konfigurierten Verifikationsdienst übertragen. Vor Veröffentlichung müssen der tatsächliche Anbietername, dessen Sitz, die Verarbeitung, Speicherdauer, Unterauftragsverarbeiter und die gültige Datenschutzerklärung des Dienstleisters ergänzt und geprüft werden.

**Dienstleister:** [Tatsächlicher Anbietername]  
**Zweck:** Verifikation von Store-Transaktionen und Entitlements  
**Daten:** [Tatsächliche Produkt-ID, Transaktions-/Kaufnachweis und technische Metadaten]  
**Rechtsgrundlage:** [Art. 6 Abs. 1 lit. b DSGVO / andere zutreffende Rechtsgrundlage]  
**Datenschutzerklärung des Dienstleisters:** [URL]

Wenn der Dienst nicht in der finalen Binary aktiviert ist, ist dieser Abschnitt vor Veröffentlichung zu entfernen oder entsprechend zu korrigieren.

### 3.5 Technische Daten, Analyse und Absturzberichte

In der aktuell vorgesehenen lokalen Architektur werden keine eigenen Analytics-, Werbe- oder Crash-Reporting-Dienste vorausgesetzt. Vor Veröffentlichung muss jedoch geprüft werden, ob Expo, React Native, `expo-iap`, das Betriebssystem, der Verifikationsdienst oder weitere Drittanbieter-SDKs technische Daten, Diagnoseinformationen, Gerätekennungen, IP-Adressen oder Nutzungsdaten verarbeiten. Alle tatsächlich verarbeiteten Daten sind in der finalen Datenschutzerklärung und in den Store-Formularen anzugeben.

**Aktivierte Analyse- oder Crash-Dienste:** [Keine / vollständige Liste mit Links und Datenflüssen]

## 4. Zwecke und Rechtsgrundlagen

Die Verarbeitung erfolgt, soweit anwendbar, zu folgenden Zwecken:

| Zweck | Mögliche Rechtsgrundlage |
|---|---|
| Bereitstellung der Alarm- und Erinnerungsfunktionen | Art. 6 Abs. 1 lit. b DSGVO oder Art. 6 Abs. 1 lit. f DSGVO |
| Speicherung lokal gewählter Einstellungen | Art. 6 Abs. 1 lit. b DSGVO |
| Durchführung und Wiederherstellung von Store-Käufen | Art. 6 Abs. 1 lit. b DSGVO |
| Beantwortung von Supportanfragen | Art. 6 Abs. 1 lit. b oder lit. f DSGVO |
| Erfüllung gesetzlicher Pflichten | Art. 6 Abs. 1 lit. c DSGVO |
| Fehleranalyse, sofern ein entsprechender Dienst aktiviert ist | [konkrete Rechtsgrundlage ergänzen] |

Die konkrete Rechtsgrundlage muss vor Veröffentlichung durch den Verantwortlichen festgelegt werden.

## 5. Empfänger und Drittanbieter

Lokale Alarm-, Profil- und Einstellungsdaten werden grundsätzlich nicht an den Verantwortlichen übertragen. Empfänger können jedoch die jeweiligen Plattformanbieter sein, wenn die App über deren Store installiert oder ein Kauf über deren Abrechnungssystem durchgeführt wird. Bei aktivierter Kaufverifikation kann zusätzlich der konfigurierte Verifikationsdienst technische Kaufnachweise erhalten.

| Empfänger | Zweck | Daten | Weitere Informationen |
|---|---|---|---|
| Apple Distribution International / Apple | App-Verteilung, StoreKit und Zahlungsabwicklung | Store- und Transaktionsdaten | [Apple-Datenschutzlink eintragen] |
| Google LLC / Google Play | App-Verteilung, Play Billing und Zahlungsabwicklung | Store- und Transaktionsdaten | [Google-Datenschutzlink eintragen] |
| [IAPKit-Anbieter] | Kaufverifikation | [konkrete Daten eintragen] | [Dienstleister-Datenschutzlink] |
| [Support-/E-Mail-Anbieter] | Bearbeitung von Supportanfragen | Vom Nutzer übermittelte Angaben | [Dienstleister-Datenschutzlink] |

Nicht benötigte Anbieter und SDKs sind aus dieser Tabelle und aus der finalen App zu entfernen.

## 6. Speicherdauer und Löschung

Lokale Alarm- und Einstellungsdaten bleiben auf dem Gerät, bis der Nutzer sie innerhalb der App löscht, die App-Daten des Betriebssystems entfernt oder die App deinstalliert. Exportierte Backups bleiben dort gespeichert, wo der Nutzer sie ablegt, bis sie dort gelöscht werden.

Supportanfragen werden nur so lange gespeichert, wie dies zur Bearbeitung, zur Dokumentation des Vorgangs und zur Erfüllung gesetzlicher Aufbewahrungspflichten erforderlich ist. Die konkrete Frist beträgt: **[Frist eintragen]**.

Kauf- und Transaktionsdaten können von Apple oder Google nach deren eigenen Richtlinien und gesetzlichen Pflichten gespeichert werden. Für diese Daten gelten ergänzend die Datenschutzinformationen des jeweiligen Plattformanbieters.

## 7. Rechte betroffener Personen

Betroffene Personen können nach Maßgabe der gesetzlichen Voraussetzungen Auskunft über personenbezogene Daten, Berichtigung unrichtiger Daten, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit und Widerspruch verlangen. Eine erteilte Einwilligung kann jederzeit mit Wirkung für die Zukunft widerrufen werden.

Anfragen sind an **[Datenschutz-E-Mail-Adresse]** zu richten. Darüber hinaus besteht das Recht, sich bei einer Datenschutzaufsichtsbehörde zu beschweren, insbesondere bei der für den Verantwortlichen zuständigen Aufsichtsbehörde.

## 8. Internationale Übermittlungen

Falls ein Dienstleister Daten außerhalb des Europäischen Wirtschaftsraums verarbeitet, sind hier der Empfänger, das Zielland und die verwendete Übermittlungsgrundlage zu ergänzen: **[Angaben ergänzen oder „keine“ bestätigen]**.

## 9. Sicherheit

Die App verwendet angemessene technische und organisatorische Maßnahmen, um die lokale Datenverarbeitung und die Übertragung von Kaufnachweisen zu schützen. Nutzer sollten exportierte Backup-Dateien wie vertrauliche Dateien behandeln und nur an vertrauenswürdige Speicherorte oder Empfänger weitergeben.

## 10. Änderungen dieser Datenschutzerklärung

Diese Datenschutzerklärung kann angepasst werden, wenn sich Funktionen, Datenverarbeitungen, Dienstleister oder gesetzliche Anforderungen ändern. Die jeweils aktuelle Fassung ist unter **[öffentliche Datenschutz-URL]** verfügbar. Das Datum der letzten Änderung steht am Anfang dieser Erklärung.

## 11. Kontakt

Datenschutzfragen und Betroffenenanfragen bitte an:

**[Vollständiger Name oder Firma]**  
**[Datenschutz-E-Mail-Adresse]**  
**[Postanschrift]**

**Letzte Aktualisierung:** [TT.MM.JJJJ]
