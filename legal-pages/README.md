# Rechtliche Seiten — Veröffentlichungscheckliste

Diese Vorlagen sind für die Veröffentlichung auf einer öffentlichen HTTPS-Domain vorbereitet. Vor der Veröffentlichung müssen die Betreiberangaben, URLs, Aufbewahrungsfristen, Dienstleister und Rechtsgrundlagen mit der finalen App und der tatsächlichen Organisation ergänzt werden.

## Empfohlene öffentliche URLs

| Zweck | Empfohlener Pfad | Datei |
|---|---|---|
| Deutsche Datenschutzerklärung | `/privacy` oder `/datenschutz` | `privacy-policy-de.md` |
| Englische Datenschutzerklärung | `/en/privacy` | `privacy-policy-en.md` |
| Deutscher Support | `/support` | `support-de.md` |
| Englischer Support | `/en/support` | `support-en.md` |
| Daten- und Kontolöschung | `/data-deletion` oder `/datenloeschung` | `data-deletion-de.md` |
| Nutzungsbedingungen | `/terms` oder `/nutzungsbedingungen` | `terms-of-use-de.md` |

## Vor Veröffentlichung ersetzen

| Feld | Erforderliche Angabe |
|---|---|
| Betreiber | Vollständiger Name oder Firmenname |
| Anschrift | Vollständige ladungsfähige Postanschrift |
| Kontakt | Support- und Datenschutz-E-Mail |
| Datenschutz-URL | Öffentliche HTTPS-URL ohne Login |
| Support-URL | Öffentliche HTTPS-URL ohne Login |
| Lösch-URL | Öffentliche HTTPS-URL ohne Login, sofern erforderlich |
| Rechtsgrundlagen | Vom Verantwortlichen bestätigte Rechtsgrundlagen |
| Aufbewahrung | Tatsächlich geltende Fristen |
| Dienstleister | Tatsächlich eingesetzte IAP-, E-Mail-, Analytics- und Crash-Dienste |
| Internationale Transfers | Länder und geeignete Garantien, sofern vorhanden |
| Markenhinweis | Geprüfte Rechte an „TGM“ und spielbezogenen Begriffen |
| Aktualisierungsdatum | Datum der ersten Veröffentlichung und jeder Änderung |

## Store-Übernahme

Google Play benötigt eine Datenschutzrichtlinie und eine vollständige Data-Safety-Erklärung für die veröffentlichte App. Apple benötigt eine Privacy-Policy-URL und App-Privacy-Angaben. Die Angaben müssen die finale Binary einschließlich `expo-iap`, IAPKit und aller weiteren Drittanbieter-SDKs abbilden.

Wenn die App keine echten Onlinekonten anbietet, muss die Löschseite klar zwischen lokalen Profilen und Onlinekonten unterscheiden. Wenn Konten später eingeführt werden, ist ein echter In-App- und Web-Löschpfad zu ergänzen.

## Freigabekriterium

Die Seiten sind erst veröffentlichungsbereit, wenn keine eckigen Betreiberfelder mehr enthalten sind, alle verlinkten URLs erreichbar sind, die Datenschutzerklärung mit der finalen Binary abgeglichen wurde, die Store-Formulare dieselben Angaben enthalten und eine fachkundige rechtliche Prüfung erfolgt ist.
