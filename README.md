# Protokol App

Eine Progressive Web App (PWA) zum Protokollieren und Tracken von Gesundheitsdaten und Gewohnheiten.

## Funktionen

- **Kategorien**: Verschiedene Tracking-Typen (Aufgaben, Messwerte, akkumulierte Werte, Protokolle)
- **Ereignisse**: Zeitgestempelte Einträge mit optionalen Messwerten
- **Ziele**: Wiederkehrende Ziele mit flexiblen Zeitplänen (täglich, wöchentlich, etc.)
- **Auswertungen**: Linien-Diagramme und Tabellen zur Visualisierung
- **Offline-First**: Alle Daten werden lokal gespeichert (IndexedDB)
- **Backup/Restore**: Export und Import aller Daten als JSON

## Zielgerät

Primär entwickelt für: **Samsung Galaxy A10** (Budget-Android, ~6,2" Display)

## Schnellstart

```bash
# Abhängigkeiten installieren
bun install

# Entwicklungsserver starten
bun run dev

# Produktions-Build erstellen
bun run build
```

## Befehle

| Befehl            | Beschreibung                |
| ----------------- | --------------------------- |
| `bun install`     | Abhängigkeiten installieren |
| `bun run dev`     | Entwicklungsserver mit HMR  |
| `bun run build`   | Produktions-Build           |
| `bun run lint`    | ESLint ausführen            |
| `bun run preview` | Produktions-Build testen    |

## Tech Stack

- **Framework**: React 18 + TypeScript + Vite 5
- **Datenbank**: RxDB mit IndexedDB (Dexie)
- **State**: Jotai für globalen State
- **UI**: Material-UI v6
- **Formulare**: Formik + Yup
- **Zeitpläne**: RRule für wiederkehrende Ziele

## Dokumentation

Detaillierte technische Dokumentation (Englisch):

- [Architecture](docs/ARCHITECTURE.md) - Systemarchitektur und Aufbau
- [Data Schemas](docs/DATA-SCHEMAS.md) - Datenbankschemas und Sammlungen
- [Development](docs/DEVELOPMENT.md) - Entwicklungsanleitung
- [Units and Conversion](docs/UNITS-AND-CONVERSION.md) - Einheitenkonvertierung
- [RRule and Schedules](docs/RRULE-AND-SCHEDULES.md) - Zeitplan-System

## Lizenz

Privat
