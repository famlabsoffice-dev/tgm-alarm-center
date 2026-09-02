# TGM ALARM CENTER — Repository Source of Truth

**Status: verbindlich**  
**Festgelegt: 2026-09-01**

## Verbindliche Produktionsquelle

Der GitHub-Branch `main` ist die alleinige Source of Truth für **TGM ALARM CENTER**.

Alle weiteren Arbeitsstände, lokalen Kopien und ZIP-Archive sind gegenüber `main` nachrangig und dürfen nicht eigenständig als Produktionsquelle eingesetzt werden.

## Branch-Entscheidung

`main` enthält den vollständigen Stand des Produktions-Core-Branches. Der Branch `feature/tgm-alarm-center-production-core` ist gegenüber `main` nachrangig und darf nicht als Produktionsquelle verwendet werden.

Daraus folgt:

- Keine Rückführung von `main` auf den Feature-Branch.
- Kein Rollback auf ältere Stände.
- Keine Vermischung mit externen ZIP-Ständen als vermeintliche Masterquelle.
- Änderungen werden grundsätzlich auf Basis des aktuellen `main`-Stands bewertet und umgesetzt.
- Vor einer Produktionsfreigabe sind die tatsächlichen Tests und Validierungsgates des aktuellen `main`-Stands zu prüfen.

## Referenzstand

Der jeweils aktuelle Commit von `main` ist der verbindliche Referenzstand. Commit-Hashes und Branch-Abstände werden bewusst nicht statisch in diesem Dokument festgeschrieben, damit die Source-of-Truth-Dokumentation nach weiteren legitimen Commits nicht selbst veraltet.

## Geltungsbereich

Diese Festlegung gilt für die weitere Entwicklung, Verifikation, Fehlerkorrektur und Release-Bewertung von TGM ALARM CENTER.
