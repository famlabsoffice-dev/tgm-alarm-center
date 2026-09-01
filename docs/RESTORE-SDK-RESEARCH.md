# Client-Restore-SDK-Recherche

Quelle: https://hyochan.github.io/expo-iap/

Die aktuelle Expo-IAP-Dokumentation verweist auf OpenIAP und beschreibt eine gemeinsame API für iOS und Android. Der Kaufpfad nutzt `requestPurchase` und `finishTransaction`; Transaktionen sollen erst nach serverseitiger Belegprüfung abgeschlossen werden. Die Bibliothek benötigt für Expo einen nativen Development-/Production-Build und ist nicht nur innerhalb von Expo Go verfügbar.

Für Restore Purchases wird der Store-Adapter des Projekts über eine `restorePurchases()`-Methode an die SDK-Funktion `getAvailablePurchases` angebunden. Jedes zurückgegebene Kaufobjekt wird einzeln an den bestehenden Server-Verifikationsendpunkt übergeben, bevor `finishTransaction` ausgeführt wird.
