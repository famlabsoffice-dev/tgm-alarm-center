# TGM Alarm Center — Technology Stack Upgrade Plan

Stand: 5. September 2026

## Ziel

Die Anwendung wird auf den höchsten **stabilen, projektkompatiblen** Technologiestand gebracht. Preview-/Canary-Versionen werden nicht produktiv eingesetzt. Die bestehenden Alarm-, Notification-, UTC/DST-, Account-, Billing-, Backup/Restore- und Founder-Testzugangs-Funktionen bleiben unverändert erhalten.

## 1. Node.js aktualisieren

### Sollstand
- Node.js 24.20.0 LTS im Entwicklungs- und CI-Umfeld.
- Versionsmanagement über nvm auf Entwicklerrechnern.
- CI pinnt dieselbe LTS-Version, damit lokale und reproduzierbare Builds denselben Runtime-Unterbau verwenden.

### Umsetzung
```bash
nvm install --lts
nvm use --lts
node -v
```

### Gate
- `node -v` entspricht dem dokumentierten LTS-Ziel.
- CI verwendet exakt denselben Node-LTS-Stand.

## 2. Expo / React Native aktualisieren

### Sollstand
- Expo SDK 57.0.17.
- React Native 0.86.3.
- React 19.2.3.
- Hermes V1.
- Android compile/target SDK 36.
- iOS Deployment Target 16.4+.

Expo SDK 57 ist der aktuelle stabile SDK-Zweig; Expo dokumentiert RN 0.86 und React 19.2.3 für SDK 57. Der Patchstand 57.0.17 enthält die späteren SDK-57-Korrekturen. Canary 58 bleibt ausgeschlossen, weil Stabilität Vorrang vor Vorabversionen hat.

### Umsetzung
```bash
npx expo install expo@latest react-native@latest
```

Für die verifizierte Produktionsauflösung wird der aktuelle stabile Expo-57-Patchstand explizit fixiert und anschließend mit `expo install --fix` die gesamte Expo-Abhängigkeitsfamilie ausgerichtet.

### Gate
- `package.json` enthält den freigegebenen Zielstand.
- `expo-doctor` meldet keine inkompatiblen Expo-Abhängigkeiten.
- React Native und Expo sind aufeinander abgestimmt.

## 3. Abhängigkeiten automatisch kompatibel ausrichten

### Umsetzung
```bash
npx expo install --fix
```

Die CI erzeugt daraus den reproduzierbaren Dependency-Graph und schreibt den verifizierten `pnpm-lock.yaml` zurück in das Repository.

### Gate
- Kein manuell erfundener Lockfile-Inhalt.
- `pnpm install` funktioniert auf dem CI-Runner.
- Der Lockfile entspricht dem tatsächlichen Paketgraphen.

## 4. Native Ordner und Build-Caches bereinigen

### Umsetzung
```bash
npx expo prebuild --clean
```

CI führt den Clean-Prebuild non-interactive aus. Die generierten nativen Projekte bleiben Build-Artefakte des Expo-Workflows und werden nicht als unkontrollierte Handänderungen behandelt.

### Gate
- Android- und iOS-Native-Projekte lassen sich frisch generieren.
- Keine veralteten Prebuild-Artefakte blockieren den Build.
- App-Konfiguration, Notification-Plugins, Exact-Alarm-/Boot-Konfiguration und Plattformziele bleiben nach dem Prebuild erhalten.

## 5. Toolchain auf aktuelle stabile Qualitätslinie anheben

- TypeScript 7.0.2.
- ESLint 10.9.1.
- Node 24.20.0.
- pnpm bleibt auf dem reproduzierbaren Projektstand 10.15.1, bis ein konkreter kompatibler Upgradebedarf nachgewiesen ist.

## 6. Produktions-Gates nach jedem Upgrade

Reihenfolge:

1. `expo-doctor`
2. `typecheck`
3. `lint`
4. vollständige Domain-/Repository-Tests
5. Native Notification Contract
6. Native Device Matrix Gate
7. Android Reliability Gate
8. Mobile Build Gate
9. Store Configuration Gate
10. `expo config --type public`
11. signierter Android-AAB-Build

Ein Gate-Fehler wird behoben und der komplette Validierungslauf erneut ausgeführt. Es wird kein PASS aus synthetischen oder erfundenen Device-Evidenzen abgeleitet.

## 7. Reale Native-Zielvalidierung

Nach erfolgreichem Software-/CI-Gate erfolgt die physische Matrix weiterhin auf realen Geräten:

- Android AOSP/Pixel-Klasse
- Samsung One UI
- Xiaomi/HyperOS
- iPhone/iPad

Zu prüfen bleiben insbesondere sichtbare Benachrichtigungszustellung, Reboot-Recovery, Lock-/Background-Zustellung, Permission-Änderungen, OEM-/Battery-Restriction-Verhalten sowie DST-/Zeitzonenwechsel.

## 8. Abschlusskriterium

`COMPLETE` wird erst gesetzt, wenn:

- die stabile Zielversion im Repository fixiert ist,
- `pnpm-lock.yaml` reproduzierbar erzeugt und committed ist,
- alle automatischen Quality Gates PASS sind,
- der signierte Produktionsbuild erfolgreich erzeugt wird,
- und die verbleibende reale Gerätematrix mit echten Geräten verifiziert wurde.
