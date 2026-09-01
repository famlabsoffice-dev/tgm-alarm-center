# TGM ALARM CENTER — Repository Source of Truth

**Status: verbindlich**  
**Festgelegt: 2026-09-01**

## Verbindliche Produktionsquelle

Der GitHub-Branch `main` ist die alleinige Source of Truth für **TGM ALARM CENTER**.

Alle weiteren Arbeitsstände, lokalen Kopien und ZIP-Archive sind gegenüber `main` nachrangig und dürfen nicht eigenständig als Produktionsquelle eingesetzt werden.

## Branch-Entscheidung

`main` enthält den vollständigen Stand des Produktions-Core-Branches und liegt gegenüber `feature/tgm-alarm-center-production-core` um 18 Commits voraus, ohne Rückstand.

Daraus folgt:

- Keine Rückführung von `main` auf den Feature-Branch.
- Kein Rollback auf ältere Stände.
- Keine Vermischung mit externen ZIP-Ständen als vermeintliche Masterquelle.
- Änderungen werden grundsätzlich auf Basis des aktuellen `main`-Stands bewertet und umgesetzt.
- Vor einer Produktionsfreigabe sind die tatsächlichen Tests und Validierungsgates des aktuellen `main`-Stands zu prüfen.

## Referenzstand

Aktueller verbindlicher HEAD zum Zeitpunkt dieser Festlegung:

`34171e8deec07df1f936d45243fba8aafae7a301`

Commit: `docs: synchronize repository source-of-truth with current main`

## Geltungsbereich

Diese Festlegung gilt für die weitere Entwicklung, Verifikation, Fehlerkorrektur und Release-Bewertung von TGM ALARM CENTER.
