# Browser-Smoke-Test

Der erste Browser-Lauf zeigte eine leere Oberfläche, obwohl HTML, CSS und JavaScript geladen wurden. Die Ursache war die Initialisierungsreihenfolge im `app.js`: Der Zustand wurde vor der Initialisierung der `iso`-Hilfsfunktion geladen. Der Zustand wird jetzt erst nach der Definition aller Hilfsfunktionen geladen.

Die korrigierte App wurde anschließend direkt im Browser ausgeführt. Das Dashboard erzeugte 4.057 Zeichen DOM-Inhalt und lief ohne Initialisierungsfehler. Zusätzlich wurde die Script-URL auf `app.js?v=4` versioniert und der Offline-Cache auf `tgm-alarm-center-v4` angehoben, damit die Korrektur nicht durch einen alten Service-Worker verdeckt wird.
Der versionierte Browser-Lauf zeigt das vollständige Dashboard mit Übersicht, Alarme, Accounts, Gaming-Töne und Einstellungen. Die Audio-Aktivierung wurde per Nutzeraktion erfolgreich durchgeführt; der Status wechselte auf „Gaming-Töne aktiv“ und „Töne bereit“.

Der Editor wurde mit einem realen Testtermin geöffnet. Nach Eingabe von „Night Bubble“, Datum und Uhrzeit wurde der Alarm gespeichert; automatisch entstand der lokale Account „Mein TGM-Kommando“. Dashboard, Countdown, 60-Minuten-/15-Minuten-Vorwarnungen, Hauptereignis, Schutzmarkierung sowie die Alarmaktionen wurden sichtbar korrekt gerendert.

Die Ansicht „Gaming-Alarmtöne“ zeigt Pulse, Siren und Chime mit jeweiliger Verwendung. Die Pulse-Vorschau wurde mit aktivierter Audioengine ausgelöst; der Button blieb verfügbar und die Seite blieb stabil.
Live-Preview-Test: Der erste öffentliche Linkversuch war wegen der ursprünglichen Bindung an `127.0.0.1` nicht erreichbar. Nach Umstellung des statischen Preview-Servers auf `0.0.0.0` war der öffentliche Link erreichbar und zeigte das vollständige Dashboard. Die Audioengine wurde in der öffentlichen Vorschau per Nutzeraktion aktiviert; der Status wechselte auf „Gaming-Töne aktiv“ und „Töne bereit“.

Öffentlicher Live-Test: Die Seite „Gaming-Alarmtöne“ zeigt Pulse, Siren und Chime mit ihren Spielverwendungen. Die Audioengine war aktiviert; der Pulse-Vorschaubutton wurde ausgelöst und die Vorschau blieb stabil.

Die Siren- und Chime-Vorschaubuttons wurden nacheinander in der öffentlichen Live-Vorschau ausgelöst. Beide Interaktionen wurden ohne sichtbaren Fehler verarbeitet; die Tonansicht blieb stabil und alle drei lokalen Gaming-Tonprofile waren verfügbar.

Zusätzlicher Live-Audiotest: Die Browser-Medienfunktion wurde instrumentiert, um echte `HTMLMediaElement.play()`-Aufrufe nachzuweisen. Der instrumentierte Pulse-Vorschaubutton wurde ausgelöst.

Instrumentierter Audiolauf: Siren und Chime wurden in der öffentlichen Vorschau über ihre jeweiligen Vorschaubuttons ausgelöst. Die Seite blieb stabil und die Play-Aufrufe wurden ohne sichtbare Browserfehler verarbeitet.

Technischer Audio-Nachweis in der öffentlichen Live-Vorschau: `playCalls: 3`, `playErrors: []`, `audioState: Gaming-Töne aktiv`. Die Dateien `alarm-pulse.wav`, `alarm-siren.wav` und `alarm-chime.wav` wurden jeweils geladen und abgespielt.
Korrekturtest: Nach Cache-Reset lädt die Live-Vorschau die neue App-Shell v5. Die Hauptnavigation enthält jetzt sichtbar den Punkt „Tier-Pläne“ zwischen „Gaming-Töne“ und „Einstellungen“. Der Portrait-Sperrbildschirm ist entfernt; die Oberfläche bleibt als normale scrollbare App-Shell verfügbar.

Korrekturtest: In der Live-Vorschau öffnet der Punkt „Accounts“ die Kommandoverwaltung. Der Button „+ Account anlegen“ öffnet den vollständigen Account-Editor mit Bezeichnung, Farbe und Speichern.

Kommando-Button-Test: Nach dem Anlegen des Testkommandos „Hauptkommando“ erscheint oberhalb der Navigation ein echter Button mit dem Label „Hauptkommando“ und dem Hinweis „Kommando wechseln“. Der Account wurde erfolgreich gespeichert.

Live-Korrekturtest: Der obere Button „Hauptkommando“ navigiert beim Anklicken zur Kommandoverwaltung und zeigt einen Bestätigungshinweis. Die neue Ansicht „Tier-Pläne“ ist erreichbar und zeigt Free, Street Boss, Caporegime und Godfather mit den vereinbarten Limits, EUR-Preisen, USD-Store-Preisen, Jahresersparnissen und lokaler Planaktivierung.

Finaler Korrekturtest: Frischer Chromium-Hochkantlauf bei 390×844 rendert die App sichtbar ohne Portrait-Sperrbildschirm. Die Navigation ist technisch horizontal scrollbar: `overflow-x: auto`, `touch-action: pan-x`, `scrollWidth 698 > clientWidth 461`, programmatisches Scrollen von `scrollLeft 0` auf `237` erfolgreich. Der obere Kommando-Button navigiert zur Kommandoverwaltung. Die Tier-Plan-Ansicht zeigt Free, Street Boss, Caporegime und Godfather mit Limits und Preisen.
Navigation-/Copy-Korrektur: Die neue Live-App-Shell lädt die sachliche Headline „Bubble- und GW-Zeiten im Blick.“ sowie den TGM-bezogenen Erklärungstext zu Bubble-Zeiten, GW-Schutzfenstern und eigenen Events. Die Versionierung liefert die aktuelle App-JavaScript-Datei 6 und die Navigation enthält den stabilen View-Zustand.

Navigation-Stabilitätstest: Live-Klick auf „Accounts“ setzt URL und Inhalt auf `#accounts`. Anschließender Klick auf „Gaming-Töne“ setzt URL und Inhalt auf `#sounds`. Nach dem periodischen Render bleibt `#sounds` aktiv; die Ansicht springt nicht auf Übersicht zurück.
