Vollständig im Projekt abspeichern:

TGM ALARM CENTER — MASTER-UMSETZUNGSPLAN

BATTLE-TESTED RELEASE-FASSUNG 4.0 — VOLLSTÄNDIG KONSOLIDIERTE PRODUKTIONSFASSUNG

Status: COMPLETE — Plan konsolidiert
Baseline: sämtliche bestehenden Masterplan-Anforderungen bleiben unverändert verbindlich bestehen
Erweiterung: alle im Projektstand TGM-ALARM-CENTER-COMPLETE.zip erkennbaren zusätzlichen Anforderungen, Implementierungsdetails, Release-Gates und Korrekturen sind integriert
Produktziel: hochwertige, zuverlässige, verkaufbare TGM-Alarmzentrale für Android und iOS
Grundprinzip: kein Scheinprodukt, keine Dummy-Funktionen, keine nicht verifizierbaren Erfolgsbehauptungen, keine ungesicherten Alarmzustände


---

0. VERBINDLICHER MASTERSTATUS



Der bisherige Masterplan bleibt vollständig erhalten und wird nicht durch diese Fassung gekürzt oder ersetzt.

Alle bereits definierten Anforderungen zu:

Alarmzentrale

Account-/Profilverwaltung

Bubble-Alarme

GW-/GW-Bubble-Alarme

Custom Events

Vorwarnungen

Bubble-Ende-Warnung

GW-Bubble-Zyklen

Countdown

lokaler Zeitdarstellung

UTC-Zeitmodell

persistenter Speicherung

Benachrichtigungen

Tier-/Premium-System

Android-/iOS-Betrieb

UX/UI

TGM-Material- und Farbsprache

Datenschutz

Verkauf

Store-Release

Qualitätssicherung

Fehlerbehandlung

Recovery

Offline-Verhalten

Release-Gates

bleiben verbindlich.

Die vorliegende Fassung integriert darüber hinaus sämtliche im gelieferten Projektstand tatsächlich erkennbaren Erweiterungen.


---

1. PRODUKTDEFINITION



1.1 Produktzweck

TGM Alarm Center ist eine dedizierte persönliche Alarmzentrale für TGM-Spieler.

Die App verwaltet Ereignisse und schützt den Nutzer insbesondere davor:

Bubble-Zeiten zu verpassen

den Beginn eines GW-/GW-Bubble-Fensters zu verpassen

das Ende eines Schutzfensters zu übersehen

Custom Events zu vergessen

wichtige Vorwarnungen nicht rechtzeitig wahrzunehmen

durch falsche Zeitdarstellung oder Zeitzonenfehler einen Termin zu verpassen

wiederkehrende Events fälschlich als einmalig oder umgekehrt zu behandeln


---

2. ALARMKLASSEN



Es existieren verbindlich drei Alarmtypen:

2.1 Bubble

Standard-TGM-Bubble-Alarm.

Standardvorbelegung:

Titel: „Bubble-Zeitfenster“

Typ: Bubble

Vorwarnungen: 60 Minuten und 15 Minuten

Wiederholung: einmalig

Standardton: Pulse

2.2 GW Bubble

GW-/Guild-War-bezogener Alarm.

Standardvorbelegung:

Titel: „GW-Zeitfenster“

Typ: GW Bubble

Vorwarnungen: 60, 30 und 15 Minuten

Wiederholung: einmalig

Standardton: Siren

2.3 Eigenes Event

Freies benutzerdefiniertes Ereignis.

Standardvorbelegung:

Titel: „Mein TGM-Event“

Typ: Custom

Vorwarnung: 15 Minuten

Wiederholung: einmalig

Standardton: Chime


---

3. GW-BUBBLE-SONDERLOGIK



Die bereits festgelegte GW-Bubble-Sonderlogik bleibt ausdrücklich Bestandteil des Masterplans.

3.1 Wiederkehrendes 5-Tage-GW-Bubble-Fenster

Es muss ein dediziertes GW-Bubble-Zeitmodell unterstützt werden:

Zyklus: alle 5 Tage

Bubble-Dauer: 24 Stunden

Beginn des Bubble-Fensters

Ende des Bubble-Fensters

eigenständige Warnung vor Beginn

eigenständige Warnung vor Ende

Anzeige des verbleibenden Schutzfensters

eindeutige Kennzeichnung „Bubble aktiv“

eindeutige Kennzeichnung „Bubble endet“

Nachfolgezyklus muss korrekt berechnet werden

3.2 Ende-Warnung

Das Bubble-Ende ist kein optionales Komfortfeature.

Es ist eine Kernfunktion.

Die App muss rechtzeitig warnen, damit der Nutzer nicht plötzlich ohne Bubble-Schutz dasteht.

Die Planung muss daher mindestens unterscheiden:

Vorwarnung vor Beginn

Beginn

Vorwarnung vor Ende

Ende

nächster Zyklus

3.3 Wiederholungsberechnung

Die Berechnung darf nicht auf simplen UI-Timer-Zuständen beruhen.

Sie muss:

auf einem absoluten Zeitwert basieren

über Neustarts hinweg korrekt bleiben

Zeitzonenwechsel korrekt behandeln

nach App-Neustart reproduzierbar sein

nach Prozessende rekonstruiert werden

nach Geräte-Neustart neu geplant werden

bereits erledigte Ereignisse nicht erneut auslösen


---

4. CUSTOM EVENTS



Custom Events sind produktive Ereignisse und keine Demo-Funktion.

Der Nutzer muss:

frei benennbare Events erstellen

Datum eingeben

Uhrzeit eingeben

Vorwarnungen festlegen

Wiederholung definieren

Event aktivieren/deaktivieren

Event bearbeiten

Event löschen

Event als erledigt markieren

Events dauerhaft speichern

können.

Custom Events müssen denselben Zuverlässigkeitsstandard wie Bubble- und GW-Alarme erfüllen.


---

5. ALARM-EDITOR



Der Alarm-Editor ist die zentrale Eingabemaske.

5.1 Schnellstart

Bei neuen Alarmen werden verbindlich die drei Schnellstartvorlagen angezeigt:

Bubble

GW Bubble

Eigenes Event

Die Vorlage übernimmt automatisch:

Typ

sinnvollen Standardtitel

Vorwarnungen

Wiederholungsmodus

Tonhinweis

Der Nutzer kann anschließend jede dieser Einstellungen verändern.

5.2 Typauswahl

Die Typauswahl muss drei Zustände besitzen:

Bubble

GW Bubble

Eigenes Event

Die Auswahl muss visuell eindeutig sein.

5.3 Bezeichnung

Titel:

Pflichtfeld

trimmen

maximale Länge

kein leeres Event

eindeutige und verständliche Darstellung auf Dashboard und Notification

5.4 Datum

Datumsformat:

JJJJ-MM-TT

Es muss eine strikte Kalenderprüfung erfolgen.

Unzulässig sind beispielsweise:

30. Februar


31. April



ungültige Monatswerte

ungültige Tageswerte

unvollständige Datumseingaben

5.5 Uhrzeit

Format:

HH:MM

Unzulässig:

ungültige Stunden

ungültige Minuten

unvollständige Eingaben

5.6 Zukunftsprüfung

Bei einmaligen Events muss der Zeitpunkt in der Zukunft liegen.

Ein Zeitpunkt in der Vergangenheit darf nicht als neuer einmaliger Alarm gespeichert werden.

Bei täglich wiederkehrenden Events muss ein gültiger Ausgangszeitpunkt vorhanden sein.


---

6. VORWARNUNGEN



Unterstützte Standardwerte:

15 Minuten

30 Minuten

60 Minuten

Vorwarnungen sind unabhängig voneinander aktivierbar.

Die Auswahl muss:

persistent gespeichert werden

korrekt im Scheduler ankommen

nach Änderung neu geplant werden

bei Deaktivierung tatsächlich verschwinden

bei Wiederaktivierung wieder geplant werden

Vorwarnungen dürfen niemals als rein optischer UI-Zustand implementiert werden.


---

7. WIEDERHOLUNG



Unterstützte Basismodi:

einmalig

täglich

Die bestehende tägliche Alarmfunktion bleibt vollständig erhalten.

Bei täglich wiederkehrenden Alarmen muss:

der nächste Termin korrekt errechnet werden

der Tageszyklus nach App-Neustart erhalten bleiben

die Übersicht „täglich“ anzeigen

der nächste konkrete Termin sichtbar sein

vergangene Termine nicht erneut als aktueller Termin erscheinen

der nächste zukünftige Termin automatisch ermittelt werden

Die Architektur muss später erweiterbar sein für zusätzliche Wiederholungsregeln, ohne bestehende Datensätze zu zerstören.


---

8. PROTECTION-/GESCHÜTZT-FUNKTION



Ein Alarm kann als geschützt markiert werden.

Geschützte Alarme:

erhalten einen sichtbaren Schutzstatus

dürfen nicht versehentlich übersehen werden

werden im Alarmdatensatz persistent gespeichert

zeigen in der Übersicht ein entsprechendes Schutzsymbol

Die Schutzmarkierung ist vom normalen Aktivierungsstatus getrennt.


---

9. ZEITMODELL



9.1 Interne Speicherung

Alarme werden intern in UTC gespeichert.

Beispiel:

2026-09-01T10:30:00.000Z

9.2 Anzeige

Die App zeigt dem Nutzer die lokale Gerätezeit.

9.3 UTC-Hinweis

Im Dashboard kann zusätzlich die zugrunde liegende UTC-Zeit dargestellt werden, wenn dies dem Nutzer bei der Planung hilft.

9.4 Zeitzonenwechsel

Die App darf bei einem Zeitzonenwechsel nicht den absoluten Eventzeitpunkt verändern.

Die lokale Darstellung darf sich ändern, der gespeicherte Zeitpunkt nicht.

9.5 DST/Sommerzeit

Zeitumstellungen müssen in den Testplan aufgenommen werden.

Besonders zu testen:

Frühjahrssprung

Herbstumstellung

lokale Datumsgrenze

wiederkehrende tägliche Ereignisse über DST


---

10. COUNTDOWN



Der Countdown ist Bestandteil des Dashboards.

Unterstützte Darstellung:

Tage + Stunden

Stunden + Minuten

Minuten

„jetzt“

Der Countdown basiert ausschließlich auf dem tatsächlichen Eventzeitpunkt.

Keine statische oder UI-basierte Fake-Zählung.


---

11. „ALS NÄCHSTES“-ENGINE



Die App muss das nächste relevante Ereignis identifizieren.

Dabei werden berücksichtigt:

Vorwarnung

Hauptereignis

Wiederholung

aktiv/deaktiviert

erledigte Ereignisse

aktuelle Zeit

Account-Zuordnung

Die Ereignisse werden chronologisch sortiert.


---

12. PERSISTENZ



Der bestehende local-first-Ansatz bleibt Pflicht.

Persistiert werden insbesondere:

Accounts

Alarme

aktive Accountauswahl

Alarmstatus

Schutzstatus

Wiederholung

Vorwarnungen

Erledigungen

Notification-Einstellungen

Teststatus

Scheduler-Zuordnungen soweit erforderlich

Schema-Version

Ein App-Neustart darf keine erneute Dateneingabe erzwingen.


---

13. ACCOUNT-SYSTEM



Accounts repräsentieren unterschiedliche TGM-Kommandos bzw. Profile.

Ein Account enthält:

ID

Name

Farbe

Erstellungszeitpunkt

Die aktive Accountauswahl wird persistent gespeichert.

Alarme sind einem Account eindeutig zugeordnet.


---

14. MULTI-ACCOUNT-ARCHITEKTUR



Die bestehende Tier-Architektur bleibt verbindlich.

Free

1 Account

1 Alarm je Account

1 Event je Account

Street Boss

2 Accounts

2 Alarme je Account

2 Events je Account

Caporegime

3 Accounts

3 Alarme je Account

3 Events je Account

Godfather

unbegrenzt Accounts

unbegrenzt Alarme

unbegrenzt Events

Die Kapazitätsprüfung muss zentral erfolgen.

Kein UI-only-Limit.


---

15. TIER-/VERKAUFSSYSTEM



Verbindliche Preise:

Tier	Monat	Jahr	Lifetime

Free	0 €	0 €	0 €
Street Boss	4,99 €	39,99 €	79,99 €
Caporegime	7,99 €	69,99 €	129,99 €
Godfather	12,99 €	99,99 €	199,99 €

Jahrespreise zeigen:

effektiven Monatswert

Sparbadge

jährliche Ersparnis

Berechnete Sparwerte:

Street Boss: 33 %

Caporegime: 27 %

Godfather: 36 %

Die bestehende Plan-Auswahl bleibt Endkunden-UI ohne interne technische Metadaten.


---

16. TIER-GATES



Bei Erreichen eines Limits:

Vorgang nicht heimlich durchführen

kein Datenverlust

keine Teilanlage

eindeutige Rückmeldung

direkte Weiterleitung zur Tierauswahl

sinnvoller Ziel-Tier vorausgewählt

Bei Free-Limit:

Street Boss vorauswählen

CTA: „Street Boss im Store aktivieren“


---

17. WICHTIGE ARCHITEKTURKORREKTUR — TIER-LOGIK



Die aktuelle Projektimplementierung enthält eine wichtige Konsolidierungsanforderung:

Tier-Prüfungen dürfen nicht an mehreren Stellen unabhängig und teilweise mit festen Free-Limits erfolgen.

Verbindlich:

Account-Gate zentral

Alarm-Gate zentral

Event-Gate zentral

Duplicate-Gate zentral

UI und Geschäftslogik verwenden dieselbe Tierquelle

kein hartcodiertes Free-Limit in Premium-Funktionen

aktiver Tierstatus muss aus dem echten Entitlement-System kommen


---

18. NOTIFICATION-ARCHITEKTUR



Native Benachrichtigungen sind Kernbestandteil des Produkts.

Unterstützt werden:

Android

iOS

Web darf keine erfolgreiche native Zustellung vortäuschen.


---

19. ANDROID EXACT ALARM



Android benötigt die vorgesehenen Exact-Alarm-Voraussetzungen.

Verbindlich:

POST_NOTIFICATIONS

SCHEDULE_EXACT_ALARM

zeitkritischer Notification-Channel

genaue Zeitplanung

Rescheduling bei relevanten Änderungen


---

20. NOTIFICATION CHANNEL



Der zeitkritische Kanal:

time-critical-events

muss produktiv registriert werden.

Der Channel muss:

eindeutige ID besitzen

angemessene Priorität besitzen

Alarmton korrekt verwenden

Vibration gemäß Nutzerpräferenz berücksichtigen

nach App-Start bzw. Berechtigungsprüfung verfügbar sein


---

21. REALE ALARMTÖNE



Das Projekt enthält drei echte lokale Tondateien:

alarm-pulse.wav

alarm-siren.wav

alarm-chime.wav

Diese sind produktive Bestandteile und dürfen nicht durch Platzhalter ersetzt werden.

Sie müssen:

in der Expo-Konfiguration registriert werden

auf Android korrekt eingebunden werden

auf iOS korrekt eingebunden werden

im Notification-System konsistent referenziert werden


---

22. TONPROFILE



Es existieren drei Tonklassen:

Pulse

Standardton für Bubble.

Siren

kritischere Toncharakteristik für GW.

Chime

ruhigerer Ton für Custom Events.

Das Tonprofil muss unabhängig von der Benachrichtigungseinstellung persistent gespeichert werden.


---

23. NOTIFICATION-PREFERENZEN



Persistente Benachrichtigungseinstellungen umfassen:

Alarmton

Vorwarnungston aktiv

Hauptereignis-Ton aktiv

Vibration aktiv

kritische Alarme aktiv

Vorschau anzeigen

Diese Einstellungen sind Bestandteil des App-Datenmodells.

Wichtige Konsistenzregel

Eine Änderung der Notification-Präferenzen muss den bestehenden Scheduler beeinflussen.

Es darf nicht passieren, dass die UI eine Einstellung als geändert zeigt, während bereits geplante Benachrichtigungen weiterhin nach der alten Konfiguration laufen.

Daher muss eine Präferenzänderung eine kontrollierte Neuplanung auslösen, soweit die Änderung den Scheduler betrifft.


---

24. NOTIFICATION-PREVIEW



Der Nutzer kann den aktuell ausgewählten Ton anhören.

Diese Vorschau muss:

produktiv funktionieren

den tatsächlich ausgewählten Ton verwenden

klar erkennbare UI besitzen

keine Dummy-Aktion sein


---

25. NOTIFICATION-AKTIONEN



Es gibt getrennte Aktionen:

Öffnen

Für Vorwarnungen und Hauptereignisse.

Aktion:

öffnet den zugehörigen Alarm

führt in den Editor bzw. zur Alarmansicht

Erledigt

Nur für Hauptereignisse.

Aktion:

markiert genau diese Event-Occurrence als erledigt

persistiert die Erledigung

verhindert erneute Planung dieses konkreten Ereignisses

Eine Vorwarnung darf nicht über „Erledigt“ den gesamten Alarm fälschlich abschließen.


---

26. EVENT-COMPLETION



Erledigungen werden nicht nur als globales Boolean gespeichert.

Die konkrete Kombination aus:

Alarm-ID

Eventzeitpunkt

wird berücksichtigt.

Dadurch können wiederkehrende Events sauber unterscheiden:

Termin A erledigt

Termin B weiterhin offen


---

27. SCHEDULER



Der Scheduler ist eine zentrale Komponente.

Er muss:

alte Scheduler-IDs entfernen

aktuelle Events neu berechnen

Vorwarnungen berechnen

Hauptereignisse berechnen

erledigte Occurrences ignorieren

neue IDs speichern

deaktivierte Alarme nicht planen

maximal vorgesehene Anzahl an Notifications berücksichtigen

nach Änderungen neu planen

nach App-Start neu planen


---

28. RESCHEDULING



Neuplanung auslösen bei:

App-Start

Alarm erstellen

Alarm bearbeiten

Alarm aktivieren/deaktivieren

Alarm löschen

Alarm als erledigt markieren

relevanten Notification-Einstellungsänderungen

Restore

Account-bezogenen Alarmänderungen

Recovery nach Scheduler-Fehler


---

29. DELETE-LOGIK



Beim Löschen eines Alarms müssen:

1. dessen bestehende Scheduler-Einträge gecancelt werden


2. der Datensatz entfernt werden


3. Persistenz aktualisiert werden


4. keine verwaisten Notifications zurückbleiben



Die UI enthält bereits eine zweite Bestätigungsebene; diese bleibt Pflicht.


---

30. DUPLIKATION



Die bestehende Duplicate-Funktion ist Bestandteil der Architektur.

Sie muss:

das Original unverändert lassen

eine neue ID erzeugen

den Titel sinnvoll ergänzen

zunächst deaktiviert sein

keine alten Scheduler-IDs übernehmen

keine erledigten Eventzeitpunkte übernehmen

Tier-Limits korrekt berücksichtigen


---

31. DEAKTIVIEREN / PAUSIEREN



Ein Alarm kann pausiert werden.

Bei Deaktivierung:

keine neuen Notifications planen

bestehende Scheduler-Entries entfernen

Alarmdatensatz behalten

Status „PAUSIERT“ anzeigen

Beim Reaktivieren:

Scheduler neu aufbauen

nächste gültige Occurrence berechnen


---

32. WEB-HEALTH-VERHALTEN



Die Web-Vorschau darf keine native Alarmzustellung vortäuschen.

Auf Web muss klar sein:

native Berechtigungen nicht verfügbar

OS-Notification-Auslieferung nicht verifizierbar

lokale native Tests müssen auf Android/iOS erfolgen

Der Health-Status darf nicht fälschlich „alles erfolgreich“ anzeigen.


---

33. HEALTH CENTER



Der Health-Bereich muss Zustände getrennt anzeigen für:

Plattformunterstützung

Notification-Berechtigung

Channel

lokalen Testlauf

Scheduler-Zustand

gegebenenfalls Exact-Alarm-Voraussetzungen

Status muss zwischen:

OK

Warnung

nicht verfügbar

Fehler

unterscheiden.


---

34. LOKALER TESTLAUF



Der Nutzer muss einen echten lokalen Test auslösen können.

Der Test darf nur als erfolgreich gelten, wenn der relevante native Testpfad tatsächlich erfolgreich bestätigt wurde.

Web darf diesen Status nicht vortäuschen.

Das bestehende Testdatum:

testConfirmedAt

bleibt persistent.


---

35. RECOVERY



Die zusätzliche Recovery-Anforderung wird verbindlich erweitert.

Bei täglichen Alarmen muss die App nach:

Neustart

App-Hintergrund

Prozessneustart

verloren gegangenen Scheduler-Einträgen

den nächsten gültigen Termin wiederherstellen.

Vergangene Termine dürfen nicht als neue zukünftige Termine zurückspringen.


---

36. KALENDERVALIDIERUNG



Die bestehende strikte Kalendervalidierung bleibt Pflicht.

Validierung muss sowohl:

syntaktisch

semantisch

kalenderlogisch

zeitlich

erfolgen.


---

37. DASHBOARD



Das Dashboard zeigt mindestens:

aktive Kommandoebene

nächsten relevanten Alarm

Countdown

lokale Zeit

gegebenenfalls UTC-Zeit

Alarmtyp

Alarmstatus

nächste Vorwarnung

weitere kommende Events

Health-Zustand

Anzahl aktiver Alarme

Anzahl geplanter Alarme

Account-Anzahl


---

38. DASHBOARD-PRIORISIERUNG



Das wichtigste zukünftige Ereignis steht an erster Stelle.

Beispiel:

1. Vorwarnung 10:15


2. Hauptereignis 10:30


3. nächster Tageszyklus



Die App darf nicht stattdessen den Haupttermin anzeigen, wenn vorher eine relevante Vorwarnung ansteht.


---

39. ALARMÜBERSICHT



Jeder Alarm zeigt:

Titel

Typ

einmalig/täglich

nächsten Zeitpunkt

aktiv/pausiert

Account

Schutzstatus

Bearbeiten

Aktivieren/Deaktivieren

Löschen

Bei abgelaufenen einmaligen Alarmen:

„kein weiterer Termin“

und nicht fälschlich ein neuer Termin.

Der Datensatz bleibt verwaltbar, bis der Nutzer ihn löscht.


---

40. ACCOUNT-SETUP



Die Accountverwaltung muss:

Account erstellen

aktiven Account zeigen

Accountfarbe anzeigen

aktiven Account persistent halten

Tier-Gates respektieren

Bei Überschreitung des Limits muss die Tierauswahl angeboten werden.


---

41. BACKUP & RESTORE



Die im Projekt neu vorhandene Backup-Funktion wird vollständig als Kernanforderung übernommen.

Export

Backup enthält:

Accounts

Alarme

aktive Accountauswahl

Teststatus

Notification-Präferenzen

Schema-Version

Format:

JSON

Envelope:

Formatkennung

Version

Exportzeitpunkt

Daten


---

42. BACKUP-FORMAT



Verbindliche Kennung:

tgm-alarm-center-backup

Aktuelle Backup-Version:

1

Die Formatversion muss von der internen App-Schema-Version getrennt behandelbar bleiben.


---

43. RESTORE-VALIDIERUNG



Vor Übernahme muss validiert werden:

JSON-Syntax

Formatkennung

Backup-Version

Schema-Version

Accountfelder

Alarmfelder

IDs

Notification-Präferenzen

aktive Account-ID

Teststatus

Arrays

Datentypen

Ungültige Backups werden vollständig abgewiesen.

Keine Teilimporte aus beschädigten Daten.


---

44. RESTORE-SICHERHEIT



Ein Restore darf nicht:

beliebige unbekannte Strukturen unkontrolliert übernehmen

Scheduler-IDs blind wiederverwenden

alte OS-Notification-IDs erneut verwenden

ungültige Daten dauerhaft speichern

Nach Restore:

Scheduler-IDs verwerfen

Alarme neu planen

neue lokale Scheduler-IDs erzeugen


---

45. BACKUP-EXPORT AUF NATIVE GERÄTEN



Native Plattform:

echte lokale JSON-Datei erzeugen

System-Share-Sheet verwenden

Web:

echter JSON-Download

Keine reine Demo-Anzeige.


---

46. BACKUP-IMPORT



Native und Web müssen einen echten Importpfad besitzen.

Nach erfolgreichem Restore:

App-Daten aktualisieren

aktiven Account übernehmen

Präferenzen übernehmen

Scheduler neu aufbauen

Dashboard aktualisieren


---

47. PERSISTENZ-SCHEMA



Das App-Schema besitzt eine Versionsnummer.

Aktuell:

schemaVersion: 1

Migrationen müssen für spätere Versionen vorgesehen werden.

Keine destruktive Änderung des bestehenden Datenformats.


---

48. MIGRATION



Für jede zukünftige Schemaänderung gilt:

neue Version definieren

alte Version erkennen

deterministisch migrieren

Datenverlust verhindern

Migration testen

Version nach Migration aktualisieren


---

49. TGM-UI/UX



Die bestehende TGM-Referenzanalyse wird vollständig umgesetzt.

Grundsprache:

dunkles Anthrazit/Navy

metallische Panels

Gold für Primäraktionen

Grün/Mint für positive Zustände

Rot für destruktive Aktionen

helle Primärschrift

gedämpfte Sekundärschrift

klare Rahmen

dezente Schatten

keine sterile Standard-App-Optik


---

50. TGM-FARBPALETTE



Verbindliche Basiswerte:

Hintergrund: #090C12

Panel: #171B21

Card: #1E242B

stärkere Card: #252C34

Text: #EAE6D8

Sekundärtext: #9BA0A5

Mint: #79C95B

Gold: #F0C76A

Amber: #D6A84F

Border: #38414A

Blau: #58B7E8

Danger: #D65A50

Rot: #B94A43


---

51. NAVIGATION



Hauptnavigation bleibt:

Heute

Alarme

Profil

Sekundärscreens:

Pläne

Alarm Editor

Account Setup

Health

Benachrichtigungen

Backup & Wiederherstellung


---

52. UI-ZUSTÄNDE



Jede produktive Aktion benötigt sichtbare Zustände:

normal

gedrückt

aktiv

deaktiviert

speichern

Fehler

Erfolg

leer

gesperrt

bestätigen

Keine Buttons ohne echte Funktion.


---

53. LEERZUSTÄNDE



Die App muss einen sauberen Erststart besitzen:

keine erfundenen Testalarme

keine Fake-Daten

eindeutige Erklärung

direkte Account-Erstellung

direkte Alarmanlage


---

54. ONBOARDING



Erststart:

1. App öffnen


2. Account anlegen


3. ersten Alarm erstellen


4. Notification-Zustellung vorbereiten


5. Health prüfen



Onboarding darf den Nutzer nicht in Sackgassen führen.


---

55. ACCESSIBILITY



Produktive Controls benötigen:

Accessibility-Role

Accessibility-Label

ausreichende Touch-Ziele

verständliche Zustände

sichtbaren Fokus

sinnvolle Textgrößen

keine ausschließlich farbabhängige Bedeutung


---

56. TOUCH / MOBILE UX



Alle wichtigen Controls müssen komfortabel bedienbar sein.

Besonders:

Alarm erstellen

Speichern

Aktivieren/Deaktivieren

Löschen

Bestätigen

Import/Export

Notification-Test

Plan auswählen


---

57. RESPONSIVE LAYOUT



Die App muss für unterschiedliche Mobilformate stabil bleiben.

Getestet werden mindestens:

375 × 812

kleinere Android-Geräte

größere iPhones

Geräte mit Safe-Area

Geräte mit Dynamic Island/Notch

Tablets gemäß Plattformanforderung


---

58. QUERFORMAT



Der frühere funktionale Anspruch auf robuste mobile Darstellung bleibt bestehen.

Soll die Anwendung später einen festen Landscape-Modus erhalten, muss dies plattformweit bewusst und konsistent umgesetzt werden; ein inkonsistenter Mischbetrieb darf nicht entstehen.

Für Release ist die tatsächlich konfigurierte Orientation verbindlich zu testen.


---

59. FEHLERBEHANDLUNG



Fehler müssen:

erkannt

verständlich dargestellt

abgefangen

nicht verschluckt

werden.

Keine rohe Stacktrace-Ausgabe an Endkunden.


---

60. DATENINTEGRITÄT



Alle Änderungen werden atomar bzw. logisch konsistent gespeichert.

Kein Fall darf einen Zustand erzeugen, bei dem:

UI „gespeichert“ zeigt

Daten nicht gespeichert wurden

Scheduler nicht zum Datensatz passt

alte Scheduler-Einträge hängen bleiben


---

61. UI/SCHEDULER-KONSISTENZ



Ein Alarm gilt erst als vollständig geändert, wenn:

1. Daten geändert


2. Scheduler aktualisiert


3. Persistenz konsistent


4. UI aktualisiert



wurden.

Fehler in Schritt 2 dürfen nicht stillschweigend als vollständiger Erfolg präsentiert werden.


---

62. NOTIFICATION-PRÄFERENZ-SCHEDULER-KONSISTENZ



Besonders verbindliche Erweiterung aus dem Projektstand:

Wenn der Nutzer den Alarmton, Vibrationsstatus oder Benachrichtigungsstatus ändert, müssen bereits geplante Notifications bei Bedarf neu aufgebaut werden.

Die Persistenz allein genügt nicht.


---

63. SECURITY



Keine geheimen Schlüssel:

im Client

im Repository

in Backup-Dateien

in UI-Strings

Backups enthalten nur die tatsächlich notwendigen App-Daten.


---

64. CLOUD-SYNC — PRODUKTIONSERWEITERUNG



Eine zukünftige Cloud-Synchronisierung darf nicht als vorhanden dargestellt werden, solange kein produktiver Backend-Service existiert.

Für die Production-Ausbaustufe:

echtes Konto

verschlüsselte Übertragung

verschlüsselte Speicherung sensibler Daten

Sync-Konfliktstrategie

Geräteverwaltung

Logout

Session-Handling

Datenlöschung


---

65. CLOUD-SYNC-MODELL



Die Architektur muss local-first bleiben.

Regel:

Lokale Alarmfunktion darf nicht davon abhängen, dass eine Internetverbindung besteht.

Cloud dient für:

Backup

Synchronisierung

Gerätewechsel

Wiederherstellung

nicht als notwendige Laufzeitabhängigkeit des Alarm-Schedulers.


---

66. OFFLINE-FIRST



Ohne Internet müssen weiterhin funktionieren:

Anzeigen bestehender Alarme

Erstellen

Bearbeiten

Löschen

lokale Speicherung

Scheduler

lokale Notifications


---

67. NETZWERKFEHLER



Cloud-bezogene Fehler dürfen lokale Alarmfunktionen nicht blockieren.

Keine Fehlermeldung darf dem Nutzer vermitteln, dass sein lokaler Alarm gelöscht oder unsicher sei, wenn lediglich die Cloud nicht erreichbar ist.


---

68. AUTHENTIFIZIERUNG



Das Projekt besitzt OAuth-/Auth-Infrastruktur.

Für Production müssen:

reale Provider-Konfiguration

Session-Sicherheit

Token-Lebenszyklen

Logout

Session-Recovery

Accountbindung

Datenisolierung

verifiziert werden.


---

69. BACKEND-DATENMODELL



Für den produktiven Cloud-Ausbau benötigt es mindestens logisch getrennte Entitäten für:

Nutzer

App-Accounts

Alarme

Notification-Präferenzen

Entitlements

Sync-Metadaten

Geräte

Audit-/Revision-Informationen, soweit datenschutzrechtlich zulässig


---

70. ENTITLEMENT-SYSTEM



Premiumstatus darf nicht dauerhaft aus einer Client-Konstante stammen.

Notwendig:

Store-Kauf

serverseitige Verifikation

Entitlement-Synchronisation

Ablaufprüfung

Restore Purchases

Lifetime-Entitlement

Test-/Sandbox-Zustände

Missbrauchsschutz


---

71. STORE-BILLING



Offene Production-Gates:

iOS

echte StoreKit-Produkte

Purchase Flow

Restore Purchases

Receipt/Transaction Verification

Subscription Status

Lifetime Status

Android

echte Google-Play-Produkte

Purchase Flow

Abo-Status

Lifetime-Status

Purchase Verification

Restore/Resync


---

72. PREMIUM-KAUF-FLOW



Ein Nutzer darf nur dann als Premium behandelt werden, wenn das Entitlement verifiziert wurde.

Kein:

„Fake Unlock“

UI-only Premium

dauerhafter Teststatus im Production-Build

unbestätigtes Purchase-Success-Flag


---

73. TEST / SANDBOX



Store-Testumgebungen müssen strikt von Production getrennt werden.


---

74. REBOOT



Native Geräte müssen nach:

vollständigem Neustart

App-Neustart

korrekt mit bestehenden Alarmen weiterarbeiten.

Der Scheduler muss dazu aus der persistierten Datenbasis rekonstruierbar sein.


---

75. FORCE-CLOSE



Test:

App vollständig schließen

Event abwarten

Notification muss auf unterstützten Geräten korrekt erscheinen


---

76. ANDROID DOZE



Testmatrix:

Bildschirm aus

Gerät im Standby

Energiesparmodus

Doze

Hersteller-spezifische Akkuoptimierung


---

77. OEM-MATRIX



Mindestens relevante Android-OEMs prüfen.

Insbesondere unterschiedliche Notification-/Battery-Policies.


---

78. IOS-HINTERGRUNDVERHALTEN



Prüfen:

App geschlossen

App im Hintergrund

Device Locked

Focus Modes

Notification Permissions

Critical/Time-sensitive Verhalten gemäß tatsächlich zulässiger iOS-Konfiguration


---

79. NOTIFICATION-BERECHTIGUNGEN



Drei Zustände sauber unterscheiden:

nicht gefragt

verweigert

gewährt

Bei Verweigerung:

Nutzer informieren

zu Systemeinstellungen führen, wo sinnvoll

keine falsche Erfolgsmeldung


---

80. CRITICAL ALERTS



criticalAlertsEnabled bleibt Datenmodellbestandteil.

Eine tatsächliche Critical-Alert-Funktion darf jedoch nur als aktiv gelten, wenn die jeweilige Plattformberechtigung und technische Zulassung tatsächlich vorhanden ist.


---

81. HEALTH-LOGIK



Der Health-Indikator darf nie nur von einem Bool abhängen.

Beispiel für einen vollständigen Status:

Plattform unterstützt Notifications

Berechtigung erteilt

Channel vorhanden

Exact Alarm verfügbar

lokaler Test erfolgreich

Scheduler befüllt

letzte Planung erfolgreich


---

82. TESTAUTOMATION



Die bestehende Testbasis bleibt Pflicht.

Bereits vorhandene Testbereiche:

Alarm löschen

Alarmvorlagen

Auth Logout

Backup

Tier-Konfiguration

Time Engine

werden weitergeführt.


---

83. TIME-ENGINE-TESTS



Pflicht:

Zukunft

Vergangenheit

einmalig

täglich

Tageswechsel

mehrere Vorwarnungen

unmögliche Kalenderdaten

UTC-Konvertierung

lokale Darstellung

Countdown

erledigte Occurrences

Horizon-Berechnung


---

84. ALARM-TEMPLATE-TESTS



Jede Vorlage muss prüfen:

ID

Typ

Standardtitel

Vorwarnungen

Wiederholung

Sound-Hinweis


---

85. BACKUP-TESTS



Pflicht:

gültiges Backup

ungültiges JSON

falsches Format

falsche Version

fehlende Felder

falsche Datentypen

ungültige Accountdaten

ungültige Alarmdaten

ungültige Präferenzen

Restore

Rescheduling nach Restore


---

86. TIER-TESTS



Jede Stufe prüfen:

Account-Limit

Alarm-Limit

Event-Limit

Upgrade

Grenzwert exakt

Grenzwert +1

Godfather ohne Limit

Besonders wichtig:

Keine feste Free-Gate-Logik darf Premium-Limits überschreiben.


---

87. REGRESSION TESTS



Bei jeder Scheduleränderung müssen mindestens folgende Szenarien erneut getestet werden:

einmaliger Alarm

täglicher Alarm

mehrere Warnungen

Delete

Disable

Enable

Complete

Restore

App-Recovery


---

88. WEB SMOKE TEST



Der Mobile-Web-Preview muss mindestens zeigen:

Erststart

Account

Alarmanlage

Alarmübersicht

Dashboard

Health

Plans

Notification Settings

Backup


---

89. NATIVE RELEASE TEST



Web darf nur ein Vorfilter sein.

Finaler Test muss auf:

realem Android-Gerät

realem iPhone

erfolgen.


---

90. REQUIRED NATIVE TEST MATRIX



Android

frisch installiert

Notification permission

Exact Alarm

App foreground

App background

App force-closed

Device reboot

Device locked

Battery saver

Doze

OEM differences

timezone change

DST

offline

online

iOS

frisch installiert

Permission

lock screen

background

force close

reboot

Focus

sound

vibration

timezone

DST

offline

online


---

91. DOUBLE-TRIGGER-SCHUTZ



Ein konkretes Event darf nicht mehrfach verarbeitet werden.

Mechanismen:

eindeutige Eventzeit

Scheduler-ID

Completion-State

dedizierte Action-Verarbeitung

Rescheduling-Filter


---

92. STALE-SCHEDULER-SCHUTZ



Alte Scheduler-Einträge müssen beim Replan zuverlässig entfernt werden.

Der Datensatz darf niemals mit veralteten Triggern gekoppelt bleiben.


---

93. MAXIMUM-SCHEDULING-HORIZONT



Der aktuelle Scheduler nutzt eine begrenzte Zukunftsplanung.

Für Production muss definiert werden:

wie viele Tage voraus geplant wird

wann automatisch nachgeplant wird

wie viele native Notifications maximal gleichzeitig gehalten werden

wie wiederkehrende Alarme nachgezogen werden

Die Grenze darf nicht dazu führen, dass ein zukünftiger Termin unbemerkt verloren geht.


---

94. LARGE-SCALE ALARM PLANUNG



Bei vielen Accounts und Alarmen muss:

deterministische Sortierung

Priorisierung

Limitierung

Chunking

Rescheduling

gewährleistet sein.


---

95. BENACHRICHTIGUNGSBODY



Notifications müssen ausreichend Kontext enthalten:

Alarm-/Eventname

Typ

gegebenenfalls Beginn/Ende

konkrete Eventzeit

Nicht nur ein generisches „Alarm“.


---

96. BUBBLE-END-NOTIFICATION



Sonderanforderung:

Eine Bubble-Ende-Notification muss explizit kommunizieren:

dass der Schutz endet

wann er endet

dass eine neue Bubble erforderlich werden kann


---

97. GW-BUBBLE-BEGINN



Beginnmeldung muss explizit kommunizieren:

GW Bubble beginnt

genaue lokale Zeit

gegebenenfalls Countdown


---

98. GW-BUBBLE-ENDE



Endemeldung muss stärker priorisiert werden als ein normales Custom Event.

Sie muss verhindern helfen, dass der Nutzer „oben ohne“ bleibt.


---

99. CUSTOM-EVENT-VORWARNUNGEN



Custom Events verwenden dieselbe Notification-Infrastruktur wie Kernalarme.

Keine Sonderarchitektur mit geringerer Zuverlässigkeit.


---

100. PROFIL



Das Profil enthält:

aktiver Account

Tier

Nutzung

Benachrichtigungen

Health

Backup

Grundsätze / App-Information


---

101. PLANANSICHT



Planseite enthält:

Free

Street Boss

Caporegime

Godfather

monatlich

jährlich

Lifetime

Preise

effektiven Monatswert

Sparbadges

Kapazitäten

aktueller Plan

CTA


---

102. VERKAUFS-UX



Die App darf keine technischen Implementierungsdetails verkaufen.

Endkunden-UI zeigt:

Nutzen

Kapazität

Preis

Aktivstatus

Upgrade

nicht:

interne IDs

Debugstatus

SDK-Namen

Datenbankdetails

Schedulerdetails


---

103. KEINE PLACEHOLDER



Verboten:

TODO

Pass

Dummy-Logik

Fake-Shop

Fake-Payment

fingierte Notification-Erfolge

erfundene Gerätekompatibilität

leere Buttons


---

104. KEINE VERWIRRENDE WEB-FAKE-ZUSTELLUNG



Web darf keinen Browser-Popup-Timer als gleichwertigen Beweis für Android/iOS-Zustellung ausgeben.


---

105. PRODUKTIVE DATEN



Keine:

erfundenen Accounts

erfundenen Alarme

erfundenen Premium-Käufe

erfundenen Health-Erfolge

im Endkundenbetrieb.


---

106. BACKUP-DATENSCHUTZ



Backups dürfen nur die für die App erforderlichen Daten enthalten.

Keine unnötigen Server- oder Geheimdaten.


---

107. LÖSCHUNG



Nutzer müssen ihre lokalen Daten löschen können.

Für die Production Cloud-Version zusätzlich:

Konto löschen

Cloud-Daten löschen

Entitlements sauber behandeln

lokale Daten entfernen


---

108. APP-RESET



Reset muss:

alle lokalen Daten entfernen

Scheduler-Einträge entfernen

aktive Session korrekt behandeln

App in sauberen Erststartzustand bringen


---

109. VERSIONIERUNG



Zu versionieren:

App

Datenschema

Backupformat

Store-Produkte

Entitlement-Modell

Notification-Konfiguration


---

110. EXPO / NATIVE CONFIGURATION



Die bestehende Expo-Konfiguration muss enthalten:

App-Name

Slug

App-Icon

Bundle Identifier

Android Package

Notification Config Plugin

Notification Sounds

Notification Channel

notwendige Permissions

Splash

Build Properties


---

111. NATIVE ASSETS



Die bestehenden Notification-Audio-Assets sind Production Assets.

Zusätzlich sind zu prüfen:

Icon

adaptive icon

monochrome icon

splash

iOS appearance

Android foreground/background


---

112. APP-IDENTITÄT



Production-Identifiers müssen final festgelegt und konsistent sein.

Aktuell muss insbesondere geprüft werden, dass:

Package ID

Bundle ID

URL Scheme

Store IDs

bewusst und dauerhaft gewählt sind.


---

113. RELEASE-BUILD



Vor Release:

Production env

Release signing

iOS archive

Android AAB

version code

build number

store configuration


---

114. BUILD-REPRODUZIERBARKEIT



Jeder Release-Build muss:

aus bekannter Source

mit dokumentierten Abhängigkeiten

reproduzierbar

ohne lokale Geheimdaten

gebaut werden können.


---

115. DEPENDENCY-SICHERHEIT



Regelmäßig prüfen:

veraltete Dependencies

bekannte CVEs

inkompatible Updates

Expo-Kompatibilität

React Native-Kompatibilität


---

116. STATIC QUALITY GATES



Pflicht:

TypeScript ohne Fehler

Lint ohne Fehler

Unit Tests ohne Fehler

Regression Tests ohne Fehler

Formatierung sauber

git diff --check

Expo-Konfiguration valide


---

117. CURRENT PROJECT VALIDATION



Im gelieferten Projektstand wurden bereits dokumentiert:

TypeScript: bestanden

Lint: bestanden

Tests: 12 bestanden

1 bestehender Auth-Test übersprungen

git diff --check: bestanden

Expo-Konfiguration: erfolgreich

Backup-Abhängigkeiten: geprüft

Web-Smoke-Tests: bestanden

Die dokumentierten Tests werden für die nächste Release-Fassung als Regression-Baseline übernommen.


---

118. LIMITIERUNG DES AKTUELLEN ARCHIVS



Das Projektarchiv selbst liefert noch keinen Nachweis für:

reale StoreKit-Verifikation

reale Google-Play-Verifikation

signierte Store-Builds auf echten Geräten

OEM-Testmatrix

Reboot

Force-Close

Doze

reale Offline-/Online-Matrix

Crash-/ANR-Matrix

finale Store-Metadaten

finale Marken-/IP-Freigabe

Diese Punkte bleiben Production Release Gates.


---

119. STORE-RELEASE-GATE



GO erst wenn:

Billing verifiziert

native Alarmzustellung verifiziert

Reboot getestet

Force-Close getestet

Battery Restrictions getestet

Notification Permissions getestet

Store Metadata final

Privacy final

Terms final

Marken-/IP-Prüfung abgeschlossen


---

120. PRIVACY / DSGVO



Production benötigt:

Datenschutzerklärung

Impressum bzw. erforderliche Anbieterinformationen

Nutzungsbedingungen

Datenverarbeitungsinformationen

Löschkonzept

Exportkonzept

ggf. Auftragsverarbeitungen der eingesetzten Dienste


---

121. NOTIFICATION-DATENSCHUTZ



Lock-Screen-Vorschau muss der Nutzereinstellung folgen.

Bei deaktivierter Vorschau dürfen keine unnötigen Inhalte offen angezeigt werden.


---

122. ANALYTICS



Analytics dürfen Alarmfunktion nicht abhängig machen.

Falls Analytics eingeführt werden:

datensparsam

transparent

DSGVO-konform

ohne unnötige Eventinhalte

keine persönlichen Alarmtexte ohne legitimen Grund


---

123. PERFORMANCE



Die App muss schnell reagieren bei:

Dashboard

Alarmübersicht

Editor

Planseite

Backup

Health

Scheduler-Berechnungen dürfen UI nicht blockieren.


---

124. FEHLER-RECOVERY



Jeder kritische Fehler muss einen definierten Recoverypfad besitzen.

Beispiele:

Notification API schlägt fehl

AsyncStorage ist nicht erreichbar

Backup ist beschädigt

Restore schlägt fehl

Permission fehlt

Scheduler kann nicht planen

Datenschema ist unbekannt


---

125. UNKNOWN SCHEMA



Unbekannte Schema-Version:

nicht blind importieren

Daten nicht überschreiben

klar ablehnen

Nutzer nicht in undefinierten Zustand bringen


---

126. BACKUP-KOMPATIBILITÄT



Zukünftige App-Versionen müssen ältere gültige Backups entweder:

migrieren

oder sauber ablehnen

Eine stillschweigende Datenzerstörung ist verboten.


---

127. NOTIFICATION-RESPONSE-ROUTING



Notification-Aktionen müssen auch funktionieren, wenn die App vorher nicht geöffnet war.

Payload muss ausreichend sein, um das Ziel korrekt zu bestimmen.


---

128. DEEP LINKING



Eine Notification kann die App in den konkreten Alarm führen.

Dabei:

Alarm-ID validieren

nicht vorhandene Alarm-ID sauber behandeln

keine ungültige Route anzeigen


---

129. STATE-SYNCHRONISIERUNG



Navigation und Store müssen konsistent sein.

Wenn eine Notification einen Alarm öffnet:

Store muss geladen sein

Daten müssen verfügbar sein

Zielalarm muss existieren oder sauber als nicht verfügbar behandelt werden


---

130. PERSISTENCE-INITIALISIERUNG



Beim App-Start:

1. Persistenz laden


2. Daten normalisieren


3. Ready-State setzen


4. Scheduler rekonstruieren


5. Notification Response Listener aktivieren


6. UI freigeben



Kein Race Condition zwischen Store und Notification Handling.


---

131. DEFAULT PREFERENCES



Standardwerte bleiben:

Alarmton: Pulse

Warning Sound: aktiv

Alarm Sound: aktiv

Vibration: aktiv

kritische Alerts: aktiv

Vorschau: aktiv


---

132. NORMALISIERUNG



Beim Laden älterer Daten müssen fehlende Notification-Felder mit sicheren Defaults ergänzt werden.


---

133. DUPLIKAT-SCHUTZ



IDs müssen eindeutig sein.

Für produktive Datenstrukturen:

Account-ID eindeutig

Alarm-ID eindeutig

Notification Scheduler IDs nicht wiederverwenden


---

134. USER INPUT SANITIZATION



Eingaben:

trimmen

Längen begrenzen

ungültige Werte ablehnen

JSON-/Backup-Daten typisieren


---

135. DESTRUCTIVE ACTIONS



Destruktive Aktionen benötigen:

klare Bezeichnung

eindeutige rote/danger Darstellung

Bestätigung

Busy-State


---

136. NO DOUBLE ACTION



Während Save/Delete/Restore läuft:

keine parallelen Doppelaktionen

Buttons deaktivieren

Busy-State anzeigen

Ergebnis sauber behandeln


---

137. RESTORE ATOMICITY



Restore ist möglichst atomar.

Entweder:

vollständiger gültiger Restore

oder:

keine Änderung des bestehenden Datenbestands.


---

138. SCHEDULER AFTER RESTORE



Nach Restore:

alte Scheduler-IDs verwerfen

neue Planung aufbauen

persistierte neue IDs speichern


---

139. RECONCILIATION



Der Scheduler muss eine Reconciliation-Funktion besitzen:

Persistierter Alarmzustand ↔ tatsächlich geplante native Trigger.

Abweichungen müssen automatisch korrigiert werden.


---

140. GESAMTARCHITEKTUR



Die endgültige Architektur besteht logisch aus:

Presentation

Dashboard

Alarmübersicht

Alarm Editor

Profil

Plans

Notification Settings

Health

Backup

Domain

Alarmtypen

Templates

Time Engine

Repeat Engine

Event Completion

Tier Gates

Infrastructure

AsyncStorage

Native Notifications

Secure Storage

Cloud Sync

Billing

Backend

Backup/Restore


---

141. SINGLE SOURCE OF TRUTH



Der Alarm Store ist die zentrale Quelle für:

Alarme

Accounts

Preferences

Teststatus

Restore

Schedule Reconciliation

Keine parallele versteckte Alarmdatenhaltung in UI-Komponenten.


---

142. SINGLE SOURCE OF TRUTH FÜR TIERS



Tier-Konfiguration nur an zentraler Stelle.

Keine widersprüchlichen:

Preisen

Limits

Tier IDs

Labels

in mehreren Dateien.


---

143. SINGLE SOURCE OF TRUTH FÜR ZEITEN



Time Engine ist zentrale Instanz für:

Parse

Speicherung

Next Event

Upcoming Moments

Countdown

lokale Darstellung


---

144. TESTBARE DOMAIN LOGIK



Berechnungslogik muss ohne Native UI testbar sein.

Dazu zählen:

Next Event

Upcoming Moments

Repeat

Warning Times

Completion

Tier Gates

Backup Parsing


---

145. TESTBARE NOTIFICATION LOGIK



Native API und Domainberechnung müssen so getrennt sein, dass die Planung logisch getestet werden kann, ohne echte OS-Notifications für jeden Unit-Test zu benötigen.


---

146. END-TO-END-FLOWS



Pflichtflows:

Flow A — Erststart

Erststart → Account → Alarm → Dashboard

Flow B — Bubble

Bubble erstellen → Warnung → Event → erledigt

Flow C — GW

GW erstellen → Warnungen → Event → erledigt

Flow D — GW-Bubble-Zyklus

Beginn → 24h-Fenster → Ende-Warnung → Ende → nächster Zyklus

Flow E — Custom

Custom erstellen → Warnung → Event

Flow F — Daily

Täglicher Alarm → Event → nächster Tag

Flow G — Restore

Export → Löschen → Import → Scheduler-Recovery

Flow H — Premium

Free-Limit → Planseite → Upgrade → Entitlement


---

147. ERROR FLOWS



Pflicht:

keine Permission

Zeit in Vergangenheit

ungültiges Datum

Backup beschädigt

Tier-Limit erreicht

Store-Kauf fehlgeschlagen

Scheduler fehlgeschlagen

Cloud offline

fehlender Alarm bei Notification-Click


---

148. APP-START-SICHERHEIT



Ein fehlerhaftes Backup oder beschädigter Local Storage darf nicht die gesamte App unbrauchbar machen.

Es muss ein kontrollierter Recoverypfad vorhanden sein.


---

149. RELEASE PRECHECK



Vor Store Upload müssen automatisch bzw. manuell bestätigt werden:

Version

Icons

Splash

Bundle IDs

Permissions

Notification Sounds

Notification Categories

Entitlements

Billing IDs

Environment

Privacy

Store screenshots


---

150. BETA PHASE



Vor Production:

Internal

Entwicklergeräte

technische Tests

Closed Beta

reale Nutzer

reale Alarmfälle

verschiedene Geräte

Release Candidate

keine Known Critical Bugs

native Notification Tests bestanden

Billing bestanden

Restore bestanden


---

151. RELEASE-BLOCKER



Jeder dieser Punkte blockiert Production:

Notification funktioniert auf einem unterstützten Hauptgerät nicht zuverlässig

Scheduler verliert einen geplanten Alarm

Backup verursacht Datenverlust

Premium-Gate lässt unerlaubten Zugriff zu

Purchase ohne verifiziertes Entitlement

falsche Zeitberechnung

Bubble-Ende wird nicht gewarnt

App-Crash beim Restore

kritischer Security-Fehler

falsches Store-Produkt

unklare rechtliche Freigabe


---

152. NON-BLOCKER



Kosmetische Punkte dürfen nur dann nachgelagert werden, wenn sie:

keine Datenintegrität betreffen

keine Alarmzustellung betreffen

keine Navigation blockieren

keine Monetarisierung blockieren

keine Accessibility-Hauptfunktion beeinträchtigen


---

153. OBSERVABILITY



Production sollte mindestens erfassen:

Scheduler-Rebuild erfolgreich/fehlgeschlagen

Notification Permission Status

Restore Success/Failure

Billing State

Crash/ANR

Synchronisierungsfehler

Dabei müssen Datenschutzgrenzen eingehalten werden.


---

154. SAFE LOGGING



Keine Logs mit:

vollständigen privaten Eventtexten

Tokens

Zugangsdaten

Store-Belegen

privaten Nutzerdaten


---

155. UPDATE-SICHERHEIT



App-Updates dürfen bestehende Alarme nicht verlieren.

Nach Update:

Datenmigration

Scheduler-Reconciliation

Health-Check


---

156. STORE-INSTALLATION



Fresh Install:

kein Alarm

kein Account

saubere Defaults

Update:

bestehende Daten erhalten

Restore:

Daten wiederherstellbar


---

157. MULTI-DEVICE-SZENARIO



Für zukünftigen Cloud-Sync:

Gerät A erstellt Alarm → Gerät B synchronisiert.

Konflikte müssen deterministisch aufgelöst werden.


---

158. SYNC-KONFLIKTSTRATEGIE



Mindestens:

Version/Revision

updatedAt

eindeutige IDs

Konfliktauflösung

kein stilles Überschreiben aktueller Daten


---

159. CLOUD-VERSCHLÜSSELUNG



Production Cloud:

TLS

serverseitige Verschlüsselung

möglichst Ende-zu-Ende-Verschlüsselung für besonders sensible Inhalte

Schlüsselmanagement außerhalb des Client-Repositories


---

160. DATENLÖSCHUNG



Cloud-Ausbau muss unterstützen:

einzelnen Account löschen

Alarm löschen

gesamtes Konto löschen

lokale Daten löschen

mit sauberer Scheduler-Bereinigung.


---

161. SUPPORTFÄHIGKEIT



Health und Backup müssen Support-Fälle erleichtern, ohne interne technische Informationen unnötig an Endkunden auszugeben.


---

162. INTERNER DEBUG-MODUS



Die vorhandene Theme-/Dev-Ansicht darf nicht ungeprüft Teil der Production-Navigation werden.

Production UI bleibt rein endkundenorientiert.


---

163. KEINE ENTWICKLER-METADATEN IM ENDKUNDEN-UI



Nicht anzeigen:

Debug IDs

Scheduler IDs

Schema IDs

interne Tier IDs

API URLs

Stacktraces

Build Debug Flags


---

164. TGM-VISUELLE HIERARCHIE



Primär:

Gold

Weiß

Mint

Sekundär:

Grau

Blau

Destruktiv:

Rot

Keine konkurrierenden Primärfarben.


---

165. MATERIAL DESIGN



Panels:

dunkler Metallcharakter

Rahmen

leichte Schatten

klare Staffelung

keine übermäßigen Glassmorphism-Effekte


---

166. ICONOGRAPHIE



Icons müssen den Funktionszustand verständlich unterstützen:

Alarm

Bubble

GW

Event

Health

Backup

Profil

Settings

Delete

Lock


---

167. TYPOGRAPHIE



Priorität:

1. Titel


2. aktuelles Ereignis


3. Countdown


4. Eventzeit


5. Kontext


6. Sekundärinformationen




---

168. EMPTY STATE



Der Empty State darf nicht lediglich „Keine Daten“ sagen.

Er muss direkt zur sinnvollen nächsten Aktion führen.


---

169. SUCCESS STATE



Nach erfolgreichem Speichern muss:

UI zurückkehren

neuer Zustand sichtbar sein

Scheduler verarbeitet sein

kein Phantomzustand bestehen


---

170. ERROR STATE



Fehler muss:

Ursache verständlich machen

nächsten sinnvollen Schritt geben

Datenzustand erhalten


---

171. FINAL ACCEPTANCE CRITERIA



Das Produkt gilt erst als Production Complete, wenn alle folgenden Kernkategorien bestanden sind:

Funktion

Bubble

GW

Custom

Daily

Warnungen

Bubble-Ende

GW-Zyklus

Complete

Delete

Toggle

Duplicate

Zeit

UTC

Local

Countdown

DST

Zeitzonen

Persistenz

App restart

Backup

Restore

Migration

Notifications

Android

iOS

exact alarms

permissions

sound

vibration

actions

recovery

Monetarisierung

Free

Street Boss

Caporegime

Godfather

Store Purchase

Verification

Restore Purchase

Qualität

TypeScript

Lint

Tests

E2E

Native Device Test

Regression

Crash/ANR

Recht

Datenschutz

Terms

Store Metadata

IP/Brand


---

172. NEUE VERBINDLICHE DELTA-ANFORDERUNGEN AUS TGM-ALARM-CENTER-COMPLETE.zip



Die folgenden Punkte wurden aus dem gelieferten Projektstand als zusätzliche bzw. konkretisierte Anforderungen übernommen:

D1 — Drei versionierte Schnellstartvorlagen müssen vorhanden sein.
D2 — Bubble-Vorlage muss Typ, Titel, 60/15-Minuten-Warnungen, einmalige Wiederholung und Pulse vorbelegen.
D3 — GW-Bubble-Vorlage muss Typ, Titel, 60/30/15-Minuten-Warnungen, einmalige Wiederholung und Siren vorbelegen.
D4 — Custom-Vorlage muss Typ, Titel, 15-Minuten-Warnung, einmalige Wiederholung und Chime vorbelegen.
D5 — Reale lokale Tondateien müssen Bestandteil des Projekts sein.
D6 — Notification-Töne müssen nativ registriert werden.
D7 — Notification-Präferenzen müssen persistent gespeichert werden.
D8 — Vorwarnung und Hauptereignis müssen getrennte Notification-Kategorien besitzen.
D9 — „Öffnen“ muss für Vorwarnungen und Hauptereignisse verfügbar sein.
D10 — „Erledigt“ darf ausschließlich für Hauptereignisse verfügbar sein.
D11 — Erledigung muss an die konkrete Eventzeit gebunden gespeichert werden.
D12 — Erledigte Event-Occurrences dürfen nicht erneut geplant werden.
D13 — Datumseingaben müssen reale Kalenderdaten prüfen.
D14 — Tägliche Alarme müssen Recovery unterstützen.
D15 — Einmalige vergangene Alarme müssen „kein weiterer Termin“ ergeben.
D16 — Das Dashboard muss Vorwarnungen vor dem Hauptereignis priorisieren.
D17 — Health darf auf Web keine native Zustellung vortäuschen.
D18 — Backup muss echten JSON-Export besitzen.
D19 — Backup muss echten Import besitzen.
D20 — Backup muss Format und Version prüfen.
D21 — Backup muss Accountfelder prüfen.
D22 — Backup muss Alarmfelder prüfen.
D23 — Backup muss IDs prüfen.
D24 — Backup muss Notification-Präferenzen prüfen.
D25 — Ungültige Backups müssen vollständig abgewiesen werden.
D26 — Restore muss Scheduler neu planen.
D27 — Native Backup-Dateien müssen über das Share Sheet exportiert werden.
D28 — Web muss einen realen JSON-Download erzeugen.
D29 — Tierauswahl muss Free, Street Boss, Caporegime und Godfather enthalten.
D30 — Jahrespreise müssen effektive Monatswerte darstellen.
D31 — Jahres-Sparbadges müssen korrekt berechnet werden.
D32 — Free-Limit muss deterministisch auf die Planseite führen.
D33 — Profil muss zur Tier-Auswahl führen können.
D34 — Web-Smoke-Tests müssen die wichtigsten Produktrouten prüfen.
D35 — TypeScript, Lint und Regressionstests sind Release-Gates.
D36 — Expo-Konfiguration muss Notification Permissions und Exact Alarm berücksichtigen.
D37 — Zeitkritischer Notification-Channel muss registriert werden.
D38 — Native Signatur-Builds müssen separat verifiziert werden.
D39 — OEM-/Doze-/Force-Close-/Reboot-Tests bleiben externe Gates.
D40 — Store-Billing bleibt bis zur realen Store-Verifikation blockierend.


---

173. KRITISCHE KONSOLIDIERTE KORREKTUREN



Aus dem Projektstand werden zusätzlich folgende Architekturkorrekturen verbindlich:

K1

Tier-Gates dürfen nicht teilweise auf hartcodierten Free-Limits beruhen.

K2

Notification-Präferenzänderungen müssen gegebenenfalls bestehende Scheduler aktualisieren.

K3

Scheduler-State und persistierter Alarm-State müssen nach jeder relevanten Änderung konsistent sein.

K4

Notification-Action-Handling muss Store-Loading und Navigation sauber koordinieren.

K5

Backup-Validator muss nicht nur einzelne Felder, sondern das gesamte Schema streng validieren.

K6

Restore darf keine alten nativen Scheduler IDs wiederverwenden.

K7

Web darf native Funktionalität niemals simuliert als erfolgreich darstellen.

K8

Daily-Recovery muss unabhängig vom UI-Zustand funktionieren.

K9

GW-Bubble-Ende muss genauso ernst behandelt werden wie GW-Bubble-Beginn.

K10

Premium-Funktionalität muss über echtes Entitlement kontrolliert werden.


---

174. FINALE RELEASE-REIHENFOLGE



PHASE 1 — FOUNDATION

Datenmodell, IDs, Schema, Persistenz, Store.

PHASE 2 — TIME ENGINE

UTC, Local Time, Validation, Countdown, Repeat, Occurrences.

PHASE 3 — ALARM DOMAIN

Bubble, GW, Custom, Templates, Completion.

PHASE 4 — GW SPECIAL LOGIC

5-Tage-Zyklus, 24h-Bubble, Beginn-/Ende-Warnung.

PHASE 5 — NATIVE NOTIFICATIONS

Permissions, Channels, Sounds, Exact Alarms, Actions.

PHASE 6 — RECOVERY

Restart, Reboot, Force-Close, Reconciliation.

PHASE 7 — UI/UX

Dashboard, Alarme, Editor, Profil, Health, Settings, Backup.

PHASE 8 — BACKUP/RESTORE

Export, Validation, Import, Scheduler Rebuild.

PHASE 9 — TIERS

Free, Street Boss, Caporegime, Godfather, Gates.

PHASE 10 — BILLING

StoreKit, Google Play, Entitlements, Restore Purchases.

PHASE 11 — CLOUD

Auth, Cloud Sync, Verschlüsselung, Conflict Resolution.

PHASE 12 — QA

Unit, Integration, E2E, Device Matrix, Recovery Matrix.

PHASE 13 — SECURITY / LEGAL

Privacy, Terms, Data Deletion, Store Compliance, IP.

PHASE 14 — STORE

Signing, AAB/IPA, Metadata, Screenshots, Production Environment.

PHASE 15 — FINAL RELEASE

Alle Gates PASS → Production.


---

175. ABSCHLUSSDEFINITION



COMPLETE darf ausschließlich gesetzt werden, wenn:

alle bestehenden Masterplan-Anforderungen erhalten sind

alle oben integrierten Erweiterungen umgesetzt sind

alle kritischen Korrekturen umgesetzt sind

keine Dummy-Funktion existiert

keine versteckte UI-only-Funktion existiert

keine Datenintegritätsfehler bestehen

lokale Alarme zuverlässig funktionieren

Bubble-Ende und GW-Ende zuverlässig gewarnt werden

Backup/Restore vollständig funktionieren

Tier-Gates korrekt funktionieren

native Notification-Zustellung auf realen Geräten bestanden ist

Billing real verifiziert ist

Store- und Rechtsfreigaben abgeschlossen sind

sämtliche Release-Gates PASS sind

Finaler Systemstatus: COMPLETE erst nach bestandener Real-Device-/Store-Validierung.