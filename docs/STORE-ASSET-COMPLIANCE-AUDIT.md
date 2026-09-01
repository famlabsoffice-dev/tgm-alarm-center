# Store-Asset- und Metadaten-Konformitätsprüfung

**Projekt:** TGM ALARM CENTER  
**Geprüfter Stand:** `main` nach `ae85d21` und Store-Asset-Commit `d8065ee`  
**Prüfdatum:** 01.09.2026  
**Ergebnis:** **GO mit Korrekturen; finale Store-Einreichung derzeit NO-GO**

## Zusammenfassung

Die Store-Texte sind in den geprüften Feldern hinsichtlich App-Name, Google-Play-Kurzbeschreibung, Apple-Untertitel und Apple-Keyword-Länge konform. Die Texte enthalten keine Preise, Rankings, unautorisierten Erfolgsgarantien, Testimonials oder irreführenden Store-Symbole. Die Beschreibungen positionieren die App als unabhängige Utility und weisen auf die notwendige Prüfung der Drittanbieter-Marken hin.

Die Grafikdateien sind valide PNG-Dateien ohne Alphakanal und zeigen keine Preise, Bewertungen, Download-Buttons, Rankings, Gewalt oder erkennbaren Drittanbieter-Spiel-Logos. Die visuellen Mockups sind jedoch noch keine endgültigen Belege für die ausgelieferte Binary. Apple verlangt für App-Store-Screenshots konkrete akzeptierte Gerätegrößen; die vorhandenen 1440 × 2560 px liegen nicht in den aktuell aufgeführten iPhone-Größen. Für Apple müssen echte Screenshots in einer akzeptierten Größe erzeugt werden. Der GW-Zyklus-Screenshot enthält außerdem die Aussage „Alle Systeme online“; diese muss entfernt werden, wenn kein realer Online-Systemstatus geliefert wird.

## Technische Prüfung

| Asset | Geprüfte Daten | Ergebnis |
|---|---|---|
| Master-Icon | 1920 × 1920 px, PNG, RGB, 5,6 MiB | Als Master geeignet; Store-Varianten erzeugt |
| Google-Play-Icon | 512 × 512 px, PNG, RGB | **PASS** für bereitgestellte Icon-Größe |
| Apple-App-Icon | 1024 × 1024 px, PNG, RGB | **PASS** für bereitgestellte Icon-Größe |
| Feature Graphic | 2560 × 1440 px, PNG, RGB | Visuell geeignet; vor Play-Upload auf Play-Console-Spezifikation prüfen |
| Screenshots | 1440 × 2560 px, PNG, RGB, ohne Alphakanal | Für Google grundsätzlich nutzbares Hochformat; für Apple auf akzeptierte Gerätegröße neu exportieren |
| JSON-Manifest | gültiges JSON | **PASS** |

## Metadatenprüfung

| Feld | Wert/Länge | Ergebnis |
|---|---:|---|
| Google-Play-Titel `de-DE` | 16 Zeichen | **PASS**, max. 30 |
| Google-Play-Kurzbeschreibung `de-DE` | 72 Zeichen | **PASS**, max. 80 |
| Google-Play-Kurzbeschreibung `en-US` | 68 Zeichen | **PASS**, max. 80 |
| Apple-Name | 16 Zeichen | **PASS**, max. 30 |
| Apple-Untertitel `de-DE` | 25 Zeichen | **PASS**, max. 30 |
| Apple-Untertitel `en-US` | 26 Zeichen | **PASS**, max. 30 |
| Apple-Keywords `de-DE` | 76 Zeichen | **PASS**, max. 100 |
| Apple-Keywords `en-US` | 76 Zeichen | **PASS**, max. 100 |
| Preis-/Rankingclaims | keine gefunden | **PASS** |
| Unautorisierte Testimonials | keine gefunden | **PASS** |
| Drittanbieter-Marken | „TGM“ und spielbezogene Begriffe vorhanden | **EXTERNE FREIGABE ERFORDERLICH** |

## Google Play

Die Texte erfüllen die geprüften Zeichenlimits und beschreiben sichtbare Kernfunktionen. Das App-Icon ist textfrei und enthält keine irreführenden Installations-, Download- oder Ranking-Symbole. Die Feature Graphic hat eine klare Textzone, verwendet keine Preise oder Store-Ranking-Aussagen und enthält ein eigenständiges Alarmmotiv. Die Screenshots zeigen eine plausible App-Erfahrung und sind technisch im üblichen Hochformat angelegt.

Vor dem Upload muss die Feature Graphic noch im Play-Console-Formular geprüft werden, weil Google die erlaubten Assettypen und Darstellungen je Store-Fläche verwaltet. Die finale Screenshot-Auswahl muss aus einem echten Release-Build stammen oder pixelgenau mit der Binary übereinstimmen. Die externe Marketingfreigabe in der Play Console sollte nur aktiviert werden, wenn die abgebildeten Marken und Assets dafür freigegeben sind.

**Google-Play-Einschätzung:** **Bedingtes GO** nach Markenfreigabe, finalem Binary-Abgleich, Data-Safety-/Content-Rating-Angaben und gültigen Support-/Datenschutz-URLs.

## Apple App Store

App-Name, Untertitel, Werbetext und Keywords sind formal innerhalb der geprüften Limits. Die Beschreibung verwendet keine konkreten Preise und enthält eine unabhängige Utility-Klarstellung. Das Icon ist als 1024 × 1024 px RGB-PNG-Variante vorhanden und enthält keinen Text.

Die vier bereitgestellten Screenshot-Mockups sind 1440 × 2560 px. Apple führt für aktuelle iPhone-Displays unter anderem 1260 × 2736 px, 1290 × 2796 px, 1284 × 2778 px und 1242 × 2688 px als akzeptierte Größen auf [3]. Die vorhandenen Mockups sind deshalb **nicht als finale Apple-Screenshots freigegeben**. Sie müssen aus der finalen App in einer akzeptierten Zielgröße neu aufgenommen oder korrekt für eine akzeptierte Zielgröße gestaltet werden. Apple verlangt außerdem, dass die Screenshots die App-UI und das tatsächliche Nutzungserlebnis zeigen [3] [4].

**Apple-Einschätzung:** **NO-GO für Upload der aktuellen Screenshot-Dateien**; Texte und Icon sind bedingt freigegeben.

## Visuelle Einzelbefunde

| Asset | Befund | Maßnahme |
|---|---|---|
| Icon | Goldener Wecker mit grünen Signalringen; keine Fremdlogos oder Preise | Store-Varianten verwenden; kleine Größen auf echten Geräten prüfen |
| Feature Graphic | Text „TGM ALARM CENTER“ und „Kein Event verpassen.“; keine Ranking- oder Preisclaims | Markenfreigabe und Play-Console-Upload prüfen |
| Dashboard | Countdown, Alarmkarten und Navigation sichtbar | Gegen finale Binary abgleichen |
| Vorwarnungen | 60, 30 und 15 Minuten sowie „Alarm speichern“ sichtbar | Gegen finale Binary abgleichen |
| GW-Zyklus | 5-Tage-Zyklus und Schutzfenster sichtbar | „Alle Systeme online“ entfernen, falls kein echter Online-Status existiert |
| Backup | Export, Import und lokale Löschung sichtbar | Den künstlichen „ÖFFNEN“-Button entfernen, falls er nicht Teil der App ist |

## Harte externe Freigaben

Die Store-Einreichung bleibt unabhängig von den geprüften Dateien blockiert, solange keine öffentliche Datenschutz-URL und Support-URL vorhanden sind, keine verbindliche Markenfreigabe für „TGM“ und spielbezogene Begriffe vorliegt, die Privacy-/Data-Safety-Angaben gegen die finale Binary geprüft sind, die App-Store-Produktdaten und Preise angelegt sind und signierte Builds mit echten Geräte- und Sandbox-Tests bestehen.

## Konkrete Korrekturen vor Submit

1. Apple-Screenshots aus dem finalen iOS-Build in 6,9-Zoll- oder 6,5-Zoll-Portraitgröße neu aufnehmen.
2. Android-Screenshots gegen die reale Android-API-36-Binary abgleichen.
3. „Alle Systeme online“ aus dem GW-Asset entfernen, sofern kein echter Online-Status vorhanden ist.
4. Den künstlichen „ÖFFNEN“-Button aus dem Backup-Asset entfernen, sofern er nicht Teil der ausgelieferten App ist.
5. „TGM“ und alle geschützten Spielbegriffe erst nach dokumentierter Markenfreigabe verwenden; andernfalls alle entsprechenden Begriffe und visuellen Bezüge neutralisieren.
6. Öffentliche Datenschutz- und Support-URLs einsetzen.
7. Google-Play-Data-Safety-, Content-Rating- und Zielgruppenangaben sowie Apple-App-Privacy-, Altersfreigabe- und Export-Compliance-Angaben anhand der finalen Binary ausfüllen.
8. Bei kostenpflichtigen Tarifen die Produktnamen, Preise, Laufzeiten, Restore-Informationen und Review Notes mit den real angelegten Store-Produkten synchronisieren.

## Quellen

[1]: https://support.google.com/googleplay/android-developer/answer/9866151?hl=en "Google Play — Add preview assets to showcase your app"
[2]: https://support.google.com/googleplay/android-developer/answer/9898842 "Google Play — Metadata policy"
[3]: https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/ "Apple — Screenshot specifications"
[4]: https://developer.apple.com/help/app-store-connect/manage-app-information/upload-app-previews-and-screenshots/ "Apple — Upload app previews and screenshots"
[5]: https://developer.apple.com/app-store/product-page/ "Apple — Creating your product page"
