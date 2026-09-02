# TGM ALARM CENTER — IP-Risikoregister und Käufer-Dokumentation

**Dokumentstatus:** Arbeitsentwurf — vor Transaktion rechtlich prüfen  
**Version:** 1.0  
**Stichtag:** [TT.MM.JJJJ]  
**Verkäufer:** [Name / Gesellschaft]  
**Potentieller Käufer:** [Name / Gesellschaft]  
**Vertraulichkeit:** Vertrauliche Due-Diligence-Unterlage; Weitergabe nur an autorisierte Empfänger.

> Dieses Dokument ist eine strukturierte Arbeitsunterlage und keine rechtliche Beratung, Garantie oder Freistellung. Jede Rechteangabe muss durch Originaldokumente, Registerauszüge oder eine schriftliche Bestätigung des jeweiligen Rechteinhabers belegt werden.

## 1. Zweck und Bewertungslogik

Dieses Register soll einem potenziellen Käufer ermöglichen, die Rechtekette, Nutzungsrisiken und Übertragbarkeit von TGM ALARM CENTER nachvollziehbar zu prüfen. Es ersetzt keine anwaltliche IP-Due-Diligence. Nicht belegte Rechte werden im Register als offen behandelt und dürfen in einem Verkaufsexposé nicht als „freigegeben“ oder „lizenziert“ bezeichnet werden.

Die Risikobewertung verwendet fünf Stufen:

| Stufe | Bedeutung | Konsequenz |
|---|---|---|
| Kritisch | Wahrscheinliche Drittansprüche, ungeklärte Kernmarke oder fehlende Rechte an zentralen Assets | Kein Launch oder Closing ohne Lösung |
| Hoch | Erhebliche Unsicherheit mit möglicher Store-, Abmahn- oder Rebranding-Folge | Vor Closing vertraglich lösen oder Kaufpreis zurückbehalten |
| Mittel | Begrenztes, lokalisierbares Risiko oder unvollständige Dokumentation | Nachweis und Fristplan erforderlich |
| Niedrig | Rechte plausibel und Belege weitgehend vollständig | Monitoring und Standardzusicherung ausreichend |
| Geschlossen | Nachweis vollständig, Rechteumfang geprüft und übertragbar | Kein offener Maßnahmenbedarf |

Der Gesamtrisikoscore wird als **Eintrittswahrscheinlichkeit × Auswirkung** bewertet. Beide Werte reichen von 1 bis 5. Ein Score von 15–25 ist kritisch, 8–14 hoch, 4–7 mittel und 1–3 niedrig.

## 2. Produkt- und Rechteumfang

TGM ALARM CENTER umfasst eine lokale Alarm- und Erinnerungsanwendung mit Web-PWA und nativer Expo-/React-Native-Oberfläche. Der Funktionsumfang enthält lokale Profile, einmalige und wiederkehrende Alarme, Vorwarnungen, Countdown, GW-5-Tage-Zyklus, Benachrichtigungen, Tonprofile, Backup/Restore, lokale Persistenz, Store-Billing-Integration, Store-Metadaten und Marketinggrafiken.

Der Rechteumfang ist in die folgenden Kategorien aufzuteilen:

| Kategorie | Zu prüfende Bestandteile |
|---|---|
| Software | Quellcode, Build-Skripte, Tests, Konfiguration, Release-Automation |
| Eigene Inhalte | UI-Design, Texte, eigene Illustrationen, eigene Audioelemente, Store-Metadaten |
| Drittanbieter-Code | Expo, React Native, `expo-iap`, IAPKit, Open-Source-Pakete und Lizenztexte |
| Drittanbieter-Marken | „TGM“, „The Grand Mafia“, Spielbegriffe, Logos und ähnliche Zeichen |
| Drittanbieter-Assets | Spielgrafiken, Screenshots, Figuren, Karten, Symbole, Audio und Texte |
| Plattformrechte | Apple, Google Play, Zahlungs- und Verifikationsdienste |
| Domains und Handles | Domains, Social Handles, App-Store-Accounts und Branding-Profile |
| Daten und Nutzerinhalte | Lokale Backups, Supportdaten und gegebenenfalls spätere Onlinekonten |

## 3. Zentrales IP-Risikoregister

| ID | Gegenstand | Rechteinhaber / Quelle | Aktueller Nachweis | W’keit | Auswirkung | Score | Stufe | Maßnahme | Verantwortlich | Frist | Status |
|---|---|---|---|---:|---:|---:|---|---|---|---|---|
| IP-001 | Wortzeichen „TGM“ | Zu verifizieren | Recherche und Registerauszüge erforderlich | 4 | 5 | 20 | Kritisch | EUIPO-, DPMA-, TMview- und WIPO-Clearance; Lizenz oder Rebranding | [Name] | [Datum] | Offen |
| IP-002 | Bezeichnung „The Grand Mafia“ | Möglicherweise Phantix Games / verbundene Gesellschaft | Offizielle Betreiberseite als Hinweis, kein Lizenznachweis | 4 | 5 | 20 | Kritisch | Rechteinhaber und Vertretungsmacht verifizieren; schriftliche Lizenz einholen | [Name] | [Datum] | Offen |
| IP-003 | Logo und visuelle Anmutung | Zu verifizieren | Asset-Inventar und Herkunftsnachweis erforderlich | 4 | 5 | 20 | Kritisch | Entfernen oder ausdrücklich lizenzieren | [Name] | [Datum] | Offen |
| IP-004 | Spielbezogene Begriffe „GW“, „Godfather“ usw. | Drittanbieter / möglicherweise generisch oder markenrechtlich geschützt | Einzelprüfung fehlt | 3 | 4 | 12 | Hoch | Begriffsliste erstellen und Clearance durchführen | [Name] | [Datum] | Offen |
| IP-005 | Store-Screenshots und Feature Graphic | Eigene Gestaltung / Drittinhalte prüfen | Finales Asset-Set vorhanden | 2 | 4 | 8 | Hoch | Jede Grafik mit UI-, Marken- und Asset-Herkunft abgleichen | [Name] | [Datum] | Teilweise offen |
| IP-006 | App-Name „TGM ALARM CENTER“ | Verkäufer, vorbehaltlich Clearance | Keine belastbare Freigabe | 4 | 5 | 20 | Kritisch | Lizenz oder neutraler Markenname | [Name] | [Datum] | Offen |
| IP-007 | Store-Keywords und Beschreibungen | Verkäufer / Stores | Metadaten-Datei vorhanden | 3 | 4 | 12 | Hoch | Markenbegriffe nur mit Freigabe oder anwaltlicher Clearance nutzen | [Name] | [Datum] | Offen |
| IP-008 | Drittanbieter-Code | Jeweiliger Open-Source-Rechteinhaber | `package.json`, Lockfile und Lizenzinventar erforderlich | 2 | 4 | 8 | Hoch | SBOM und Lizenzreport erzeugen; Copyleft-Pflichten prüfen | [Name] | [Datum] | Offen |
| IP-009 | IAPKit und Store-Verifikation | Jeweiliger Dienstleister | Vertrags-, Datenschutz- und Nutzungsbedingungen prüfen | 2 | 4 | 8 | Hoch | Providervertrag, Subprocessor-Liste und Übertragbarkeit prüfen | [Name] | [Datum] | Offen |
| IP-010 | Domains und Social Handles | Verkäufer / Registrar | Registrar- und Accountnachweise erforderlich | 2 | 3 | 6 | Mittel | Transferfähigkeit, Ablauf und 2FA-Übergabe dokumentieren | [Name] | [Datum] | Offen |
| IP-011 | Entwickler-/Store-Accounts | Verkäufer / Apple / Google | Kontoinhaberschaft und Transferregeln prüfen | 2 | 4 | 8 | Hoch | App-Transfer, Vertragsübernahme und Signierung klären | [Name] | [Datum] | Offen |
| IP-012 | Lokale Backup-Daten | Nutzer | Keine zentrale Datenbank vorgesehen | 1 | 3 | 3 | Niedrig | Datenschutz- und Löschprozess dokumentieren | [Name] | [Datum] | Offen |
| IP-013 | Markteintritt ohne Lizenz | Drittanbieter | Lizenzanfrage versendet, keine Zustimmung | 4 | 5 | 20 | Kritisch | Launch unter ungeklärtem Markennamen stoppen | [Name] | Sofort | Offen |
| IP-014 | Übertragbarkeit einer späteren Lizenz | Lizenzgeber | Noch kein Vertrag | 4 | 5 | 20 | Kritisch | Assignment-, Change-of-Control- und Käuferklausel sichern | [Name] | [Datum] | Offen |

## 4. Rechte- und Asset-Matrix

Für jedes externe oder potenziell externe Element muss der folgende Datensatz ausgefüllt werden:

| Feld | Einzutragende Information |
|---|---|
| Asset-ID | Eindeutige ID, beispielsweise `ASSET-001` |
| Bezeichnung | Name und kurze Beschreibung |
| Speicherort | Repository-Pfad, Store-Datei oder URL |
| Typ | Marke, Copyright, Design, Code, Audio, Text, Domain oder Account |
| Ersteller | Person oder Unternehmen |
| Rechteinhaber | Juristische Person mit Nachweis |
| Entstehungsdatum | Datum und Version |
| Erwerbsgrund | Eigenentwicklung, Auftrag, Kauf, Open Source oder Lizenz |
| Vertrag | Vertragstitel, Datum, Parteien und Anlage |
| Lizenzumfang | Territorium, Dauer, Plattform, Medien, Exklusivität |
| Kommerzielle Nutzung | Erlaubt, eingeschränkt oder offen |
| Bearbeitung | Erlaubt oder eingeschränkt |
| Unterlizenzierung | Erlaubt, insbesondere für Käufer und Stores |
| Attribution | Erforderlicher Copyright-/Lizenzhinweis |
| Kündigungsfolge | Entfernung, Rebranding oder Übergangsfrist |
| Beweisdatei | Hash, PDF, Registerauszug oder E-Mail mit Header |
| Prüfergebnis | Geschlossen, offen oder Eskalation |

## 5. Beweismittel- und Datenraumindex

Der Käufer sollte die folgenden Unterlagen in einem schreibgeschützten Datenraum erhalten:

```text
01_Corporate_and_Ownership/
  01_Seller_identity.pdf
  02_Company_register_extract.pdf
  03_Signing_authority.pdf

02_Trademark_Clearance/
  01_DPMA_search_report.pdf
  02_EUIPO_search_report.pdf
  03_TMview_search_report.pdf
  04_WIPO_search_report.pdf
  05_Internet_and_domain_search.pdf
  06_Counsel_clearance_memorandum.pdf

03_Licenses_and_Releases/
  01_Phantix_correspondence.pdf
  02_Signed_license_or_release.pdf
  03_Powers_of_attorney.pdf
  04_Brand_guidelines.pdf
  05_Asset_schedule.pdf

04_Copyright_and_Assets/
  01_Asset_inventory.xlsx
  02_Original_design_sources.zip
  03_Contractor_assignments.pdf
  04_Audio_and_font_licenses.pdf
  05_Third_party_asset_log.xlsx

05_Open_Source_and_Third_Party_Code/
  01_SBOM.json
  02_License_report.html
  03_Dependency_lockfiles.zip
  04_Third_party_notices.txt

06_Stores_and_Distribution/
  01_Google_Play_listing_export.pdf
  02_App_Store_Connect_export.pdf
  03_Store_transfer_requirements.pdf
  04_Signing_and_certificate_inventory.pdf

07_Risk_and_Remediation/
  01_IP_risk_register.xlsx
  02_Remediation_log.xlsx
  03_Rebranding_plan.md
  04_Release_hold_notice.pdf
```

Jede Datei sollte mit SHA-256-Hash, Erstellungsdatum, Quelle und verantwortlicher Person in einem Evidenzindex geführt werden. Originale Verträge und Registerauszüge dürfen nicht ausschließlich als bearbeitbare Dateien abgelegt werden.

## 6. Kommunikationsakte zur Lizenzanfrage

Für jede Kontaktaufnahme mit Phantix Games ist zu speichern:

| Feld | Inhalt |
|---|---|
| Datum und Uhrzeit | Lokale Zeit und Zeitzone |
| Absender | Name, Gesellschaft und Domain |
| Empfänger | Offizielle Adresse und Domain |
| Versandnachweis | E-Mail-Header, Mailserver-Log oder Zustellbestätigung |
| Betreff | Exakter Betreff |
| Nachricht | Unveränderte PDF-Kopie |
| Anlagen | Dateinamen und Hashes |
| Antwortfrist | Organisatorische Frist, keine behauptete gesetzliche Frist |
| Antwort | Vollständige Antwort oder dokumentiertes Schweigen |
| Folgeaktion | Nachfassung, Kanzlei, Rebranding oder Stillstand |

Schweigen ist in diesem Register als **„keine Freigabe erhalten“** zu dokumentieren, nicht als „stillschweigend genehmigt“.

## 7. Lizenz-Mindestumfang für ein käuferfähiges Asset

Eine Lizenz oder Freigabe sollte mindestens folgende Rechte abdecken:

| Thema | Mindestanforderung |
|---|---|
| Zeichen | Exakte Wort- und Bildmarken einschließlich Nummern oder Anhänge |
| Produkt | App-Name, UI, Website, Support und Dokumentation |
| Distribution | Apple App Store, Google Play, Web und weitere vereinbarte Plattformen |
| Marketing | Store-Texte, Screenshots, Social Media, Anzeigen und Presse |
| Territorium | Alle geplanten Länder oder weltweite Nutzung |
| Monetarisierung | Abonnements, Lifetime-Käufe und Werbung, sofern vorgesehen |
| Sprachen | Alle Lokalisierungen |
| Bearbeitung | Größenänderung, Übersetzung, Anpassung und technische Aufbereitung |
| Laufzeit | Mindestlaufzeit, Verlängerung und Übergangsfrist |
| Übertragbarkeit | Käufer, Change of Control, Asset Deal und Rechtsnachfolger |
| Qualität | Brand Guidelines und definierter Freigabeprozess |
| Kündigung | Frist, Nutzerabwicklung, Store-Removal und Rebranding-Fenster |
| Zusicherungen | Rechteinhaberschaft und Vertretungsmacht des Lizenzgebers |
| Streitfälle | Zuständigkeit, Heilungsfrist und gegebenenfalls Freistellung |

## 8. Rebranding-Fallback

Wenn keine belastbare Lizenz eintrifft, wird ein neutraler Markenpfad ausgelöst. Die Nutzung von „TGM“ und „The Grand Mafia“ wird in App-Name, Icon, Feature Graphic, Screenshots, Keywords, Website, Support und Werbung entfernt oder durch eine von einer Kanzlei freigegebene beschreibende Formulierung ersetzt.

Der Fallback muss vor einem Verkauf praktisch umsetzbar sein. Dafür sind ein neuer Name, eine neue Domain, neue Store-Metadaten, ein neues Icon, neue Screenshots, aktualisierte Datenschutz- und Nutzungsbedingungen sowie ein Migrationsplan vorzubereiten. Ein Käufer sollte außerdem eine realistische Aufwandsschätzung für Bundle-ID, Store-Transfer, Billing-Produkt-IDs und bestehende Nutzerkommunikation erhalten.

## 9. Käuferzusicherungen und Kaufvertrag

Im Kaufvertrag sollten IP-Klauseln nicht pauschal formuliert werden. Sie müssen die tatsächlichen offenen Risiken abbilden. Empfohlene Anlagen sind:

| Anlage | Zweck |
|---|---|
| IP-Risikoregister | Offene und geschlossene Risiken |
| Asset- und Rechteinventar | Herkunft und Rechte je Bestandteil |
| Lizenzverzeichnis | Verträge, Laufzeiten, Territorien und Übertragbarkeit |
| Open-Source-Verzeichnis | Lizenzen und Notice-Pflichten |
| Store-/Account-Liste | Transfer- und Plattformabhängigkeiten |
| Kommunikationsakte | Lizenzanfrage und Antworten |
| Rebranding-Plan | Fallback und Aufwand |
| Offenlegungsliste | Bekannte Ausnahmen von Zusicherungen |

Der Verkäufer sollte keine unbeschränkte Zusicherung abgeben, dass sämtliche Marken- und Drittanbieterrechte „frei von Ansprüchen“ seien, wenn „TGM“ oder Spielbezüge ungeklärt sind. Stattdessen sollte das Risiko ausdrücklich offengelegt und wirtschaftlich über Kaufpreis, Escrow, Holdback, Freistellung oder Closing-Bedingung geregelt werden.

## 10. Closing-Gates

Ein Closing ohne besondere IP-Maßnahme ist nur vertretbar, wenn alle kritischen und hohen Risiken geschlossen sind. Andernfalls sollte mindestens eine der folgenden Lösungen vereinbart werden:

| Lösung | Anwendung |
|---|---|
| Closing Condition | Erwerb erst nach Lizenz oder Rebranding |
| Escrow/Holdback | Teil des Kaufpreises bleibt bis zur Rechteklärung zurückbehalten |
| Preisabschlag | Risiko wird transparent eingepreist |
| Spezifische Freistellung | Verkäufer trägt definierte Ansprüche aus der offenen Nutzung |
| Rebranding-Übernahme | Käufer erwirbt Code, aber nicht die ungeklärte Marke |
| Lizenzoption | Vertrag enthält eine dokumentierte Nachholfrist |

## 11. Aktuelle Käuferzusammenfassung

Der technische Produktbestand ist deutlich weiter fortgeschritten als ein Prototyp. Der aktuelle IP-Wert ist jedoch durch den ungeklärten Bezug zu „TGM“ und „The Grand Mafia“ begrenzt. Ohne Lizenz oder Clearance sollte der Käufer den Asset-Wert primär anhand von Code, eigener UI, Tests und Rebranding-Fähigkeit bewerten.

Eine schriftliche, übertragbare Lizenz für App, Stores, Marketing, Monetarisierung und Käufer würde den strategischen Wert erheblich verbessern. Eine bloße Lizenzanfrage, ein unbeantworteter Kontaktversuch oder die Präsenz einer Marke auf einer offiziellen Betreiberseite ist kein ausreichender Rechtebeleg.

**Aktuelle Freigabeempfehlung:** Kein öffentlicher Launch unter „TGM ALARM CENTER“, solange IP-001, IP-002, IP-003, IP-006, IP-013 und IP-014 nicht geschlossen oder durch einen dokumentierten Rebranding-Prozess ersetzt sind.

## 12. Quellen und Prüfgrundlagen

[1]: https://www.euipo.europa.eu/en/trade-marks/before-applying/availability "EUIPO — Trade mark availability and search"
[2]: https://www.dpma.de/english/trade_marks/trade_mark_search/index.html "DPMA — Trade mark searches"
[3]: https://support.google.com/googleplay/android-developer/answer/9888072?hl=en "Google Play — Intellectual Property"
[4]: https://developer.apple.com/app-store/review/guidelines/ "Apple — App Review Guidelines"
[5]: https://www.phantixgames.com/ "Phantix Games — official game portfolio"
[6]: https://tgm.phantixgames.com/en "The Grand Mafia — official website"
