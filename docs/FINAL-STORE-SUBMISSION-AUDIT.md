# Finaler Store-Einreichungs-Audit

**Projekt:** TGM ALARM CENTER  
**Prüfstand:** `main` bei `9d7b266`  
**Prüfdatum:** 01.09.2026  
**Gesamtergebnis:** **NO-GO für die tatsächliche Einreichung; Code- und Asset-Gates bestehen**

## Executive Summary

Die lokale Codebasis und die Store-Asset-Pipeline sind technisch grün. Android ist auf Target API 36 konfiguriert. Die Billing-Integration, Produktkataloge, Restore- und Verifikationsstrecken sind im Code vorhanden. Die Apple-Screenshot-Sets liegen in 6,9- und 6,5-Zoll-Portraitgrößen, sind RGB-PNGs ohne Alphakanal und wurden um die zuvor identifizierten irreführenden Elemente bereinigt.

Eine tatsächliche Einreichung ist dennoch noch nicht freigegeben. In der Umgebung fehlt ein EAS-/Expo-Token, daher existieren keine signierten AAB-/IPA-Artefakte. Öffentliche Datenschutz- und Support-URLs sind nicht in den Release-Metadaten hinterlegt. Die realen Play-Console- und App-Store-Connect-Produkte, Preise, IAPKit-Produktionsschlüssel und Entwicklerkonten konnten nicht verifiziert werden. Außerdem stehen Markenfreigabe, physische Geräte-/Sandbox-Tests und die finale Binary-Abnahme aus.

## Nachweislich bestanden

| Bereich | Ergebnis | Nachweis |
|---|---|---|
| TypeScript | PASS | `pnpm typecheck` |
| Lint | PASS | `pnpm lint` |
| Domain-/Billing-Tests | PASS — 9/9 | `pnpm test` |
| Store-Konfiguration | PASS | `pnpm verify:store-config` |
| Vollständige Release-Pipeline | PASS | `pnpm verify:release` |
| Android Target SDK | PASS | API 36 in `app.json` |
| App IDs | PASS | `com.tgm.alarmcenter` für Android/iOS |
| Billing-Code | PASS auf Codeebene | `expo-iap`, Katalog, Kauf, Restore, Verifikation |
| Apple-Screenshot 6,9 Zoll | PASS formal | 1290 × 2796 px, RGB, ohne Alpha |
| Apple-Screenshot 6,5 Zoll | PASS formal | 1284 × 2778 px, RGB, ohne Alpha |
| Git-Zustand | PASS | `main` sauber und mit Remote synchronisiert |

## Google Play

| Einreichungspunkt | Status | Begründung |
|---|---|---|
| Package ID | **PASS** | `com.tgm.alarmcenter` konfiguriert |
| Target API | **PASS** | API 36 konfiguriert; Google verlangt für neue Apps ab 31.08.2026 API 36 [1] |
| App Bundle | **BLOCKER** | Kein signiertes `.aab` vorhanden; EAS-Token fehlt |
| Play Billing | **CODE PASS / EXTERN OFFEN** | Code vorhanden; 20 Abonnements und 5 Einmalkäufe müssen real in Play Console angelegt und getestet werden |
| IAPKit | **BLOCKER** | Produktionsschlüssel fehlt; ohne Schlüssel kein Entitlement-Grant |
| Data Safety | **OFFEN** | Muss in Play Console für Binary und alle Drittanbieter-SDKs vollständig ausgefüllt werden [2] |
| Datenschutz-URL | **BLOCKER** | Keine öffentliche, produktive URL im Listing nachgewiesen; Google verlangt sie auch bei Apps ohne Datenerhebung [2] |
| Account deletion | **BEDINGT OFFEN** | Falls lokale Profile als App-Konten bewertet werden oder künftig Kontoerstellung eingeführt wird, müssen In-App- und Web-Löschpfad bereitgestellt werden [3] |
| Content Rating / Zielgruppe | **OFFEN** | Play-Console-Formulare nicht nachgewiesen |
| Closed Test | **OFFEN** | Bei betroffenen persönlichen Entwicklerkonten 12 Tester über 14 aufeinanderfolgende Tage erforderlich |
| Screenshots | **BEDINGT PASS** | Formate technisch geprüft; finale Screenshots müssen gegen signierte Binary abgeglichen werden |
| Markenrechte | **BLOCKER** | „TGM“ und spielbezogene Begriffe benötigen dokumentierte Freigabe |
| Support-Kontakt | **OFFEN** | Öffentliche Support-Seite und Kontaktangaben nicht nachgewiesen |

## Apple App Store

| Einreichungspunkt | Status | Begründung |
|---|---|---|
| Bundle ID | **PASS** | `com.tgm.alarmcenter` konfiguriert |
| App-Name/Untertitel/Keywords | **PASS formal** | Längenlimits eingehalten |
| IPA | **BLOCKER** | Kein signiertes `.ipa` vorhanden; EAS-Token fehlt |
| iOS SDK/Xcode | **EXTERN ZU VERIFIZIEREN** | Signierter Build mit aktueller Apple-SDK-Kette nicht erstellt |
| StoreKit | **CODE PASS / EXTERN OFFEN** | Code vorhanden; 20 Abonnements und 5 Non-Consumables müssen real in App Store Connect angelegt und getestet werden |
| IAPKit | **BLOCKER** | Produktionsschlüssel fehlt |
| App Privacy | **OFFEN** | App-Privacy-Fragen müssen anhand der finalen Binary und aller SDKs beantwortet werden [4] |
| Privacy Policy URL | **BLOCKER** | Keine produktive öffentliche URL nachgewiesen; Apple verlangt eine Privacy-Policy-URL [4] |
| Screenshots | **PASS formal** | Sets 6,9 Zoll 1290 × 2796 und 6,5 Zoll 1284 × 2778 vorhanden [5] |
| Screenshot-Wahrheit | **OFFEN** | Mockups müssen final mit der signierten App-Binary übereinstimmen; Apple verlangt tatsächliche App-UI [6] |
| Review Notes | **OFFEN** | Kauf-, Restore-, lokale Profil- und Notification-Flows müssen vollständig erklärt werden [7] |
| Altersfreigabe | **OFFEN** | App Store Connect-Einstufung nicht nachgewiesen |
| Export Compliance | **OFFEN** | Für den finalen Build in App Store Connect zu beantworten |
| Markenrechte | **BLOCKER** | „TGM“ und spielbezogene Begriffe benötigen dokumentierte Freigabe |
| Support URL | **OFFEN** | Öffentliche Support-Seite nicht nachgewiesen |

## Harte Blocker vor Upload

Die folgenden Punkte verhindern derzeit eine belastbare Store-Einreichung: fehlende signierte AAB-/IPA-Artefakte, fehlender EAS-/Expo-Token, nicht nachgewiesene Apple- und Google-Signing-Credentials, fehlende öffentliche Datenschutz-URL, fehlender produktiver IAPKit-Schlüssel, nicht verifizierte reale Store-Produkte und Preise sowie fehlende Markenfreigabe.

## Betreiberaktionen außerhalb des Repositorys

Zuerst muss ein EAS-/Expo-Token sicher als Umgebungsvariable bereitgestellt werden. Danach sind die signierten Builds mit `pnpm build:android:aab` und `pnpm build:ios:ipa` zu erzeugen. Die resultierenden Artefakte müssen auf realen Geräten installiert werden.

Anschließend müssen die 25 Produkt-IDs exakt in Google Play Console und App Store Connect angelegt, Preise und regionale Verfügbarkeit gesetzt, Sandbox-/Lizenztests durchgeführt und der IAPKit-Produktionsschlüssel als geheime Build-Konfiguration hinterlegt werden. Die Store-Formulare für Data Safety, App Privacy, Altersfreigabe, Zielgruppe, Content Rating, Export Compliance und gegebenenfalls Account-Löschung sind ausschließlich anhand des tatsächlichen Release-Builds auszufüllen.

Die Apple-Screenshot-Sets sind formal uploadfähig. Sie dürfen erst als final betrachtet werden, wenn die signierte Binary dieselben Texte, Zustände und Funktionen zeigt. Apple akzeptiert ein bis zehn Screenshots pro Plattform und verlangt Dateien ohne Alphakanal [5] [6].

## Schlussstatus

| Store | Technischer Code-/Asset-Status | Tatsächlicher Submission-Status |
|---|---|---|
| Google Play | **Bereit mit externen Konfigurationen** | **NO-GO** |
| Apple App Store | **Bereit mit externen Konfigurationen** | **NO-GO** |

**Finale Bewertung:** Die repositoryseitige Vorbereitung ist abgeschlossen und alle erreichbaren automatischen Gates bestehen. Eine Store-Freigabe kann erst nach Abschluss der externen Signierungs-, Konto-, Produkt-, Datenschutz-, Marken- und Geräte-/Sandbox-Schritte erteilt werden.

## Quellen

[1]: https://support.google.com/googleplay/android-developer/answer/11926878?hl=en "Google Play — Target API level requirements"
[2]: https://support.google.com/googleplay/android-developer/answer/10787469?hl=en "Google Play — Data safety"
[3]: https://support.google.com/googleplay/android-developer/answer/13327111?hl=en "Google Play — App account deletion requirements"
[4]: https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/ "Apple — Manage app privacy"
[5]: https://developer.apple.com/help/app-store-connect/reference/app-information/screenshot-specifications/ "Apple — Screenshot specifications"
[6]: https://developer.apple.com/help/app-store-connect/manage-app-information/upload-app-previews-and-screenshots/ "Apple — Upload app previews and screenshots"
[7]: https://developer.apple.com/app-store/review/guidelines/ "Apple — App Review Guidelines"
