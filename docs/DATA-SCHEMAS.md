# Data Schemas Reference

This document provides complete reference for all RxDB collections and their schemas.

## Overview

The app uses four RxDB collections stored in IndexedDB:

| Collection   | Schema Version | Purpose                                          |
| ------------ | -------------- | ------------------------------------------------ |
| `categories` | v2             | Category definitions (types, units, hierarchies) |
| `events`     | v0             | Timestamped data entries                         |
| `targets`    | v1             | Goals with recurring schedules and periods       |
| `graphs`     | v4             | Analytics visualization configs                  |

---

## Categories Collection

**File:** `src/category/category.ts`
**Schema Version:** 2

Categories define what types of data can be tracked.

### Schema

| Field      | Type             | Required | Description                                                         |
| ---------- | ---------------- | -------- | ------------------------------------------------------------------- |
| `id`       | string (max 100) | Yes      | UUID v7 primary key                                                 |
| `name`     | string           | Yes      | Display name                                                        |
| `icon`     | string           | No       | Emoji icon for display                                              |
| `type`     | enum             | Yes      | Category behavior type                                              |
| `config`   | string           | Yes      | Unit configuration (e.g., "volume", "time", "mass") or empty string |
| `children` | string[]         | No       | Child category IDs for composite tracking                           |
| `inverted` | boolean          | No       | If true, lower values are better (upper limit tracking)             |

### Category Types

| Type                | German Label            | Description                                  | Requires Input | Requires Unit |
| ------------------- | ----------------------- | -------------------------------------------- | -------------- | ------------- |
| `todo`              | Aufgabe                 | Simple task/checkbox                         | No             | No            |
| `value`             | Mit einfachem Messwert  | Single measurement per entry                 | Yes            | Yes           |
| `valueAccumulative` | Mit summiertem Messwert | Values are summed (e.g., daily water intake) | Yes            | Yes           |
| `protocol`          | Protokoll               | Event logging, count-based                   | Yes            | No            |

### Type Constants

```typescript
export const categoryTypes = {
  todo: "Aufgabe",
  value: "Mit einfachem Messwert",
  valueAccumulative: "Mit summiertem Messwert",
  protocol: "Protokoll",
} as const;
```

### Helper Functions

```typescript
// Returns true if category type requires user input
requiresInput(type: string): boolean

// Returns true if category type requires unit configuration
requiresMeasure(type: string): boolean
```

### Migration History

| From | To  | Changes                                                  |
| ---- | --- | -------------------------------------------------------- |
| 0    | 1   | Identity migration                                       |
| 1    | 2   | Identity migration (added `inverted` field with default) |

---

## Events Collection

**File:** `src/category/event.ts`
**Schema Version:** 0

Events are timestamped data entries linked to categories.

### Schema

| Field       | Type             | Required | Description                                   |
| ----------- | ---------------- | -------- | --------------------------------------------- |
| `id`        | string (max 100) | Yes      | UUID v7 primary key                           |
| `category`  | string           | Yes      | Foreign key to Categories collection          |
| `timestamp` | number           | Yes      | Unix timestamp in milliseconds (local time)   |
| `data`      | string           | Yes      | Event data (numeric values stored as strings) |

### Data Format

The `data` field stores values as strings:

- For `todo`: Empty string `""`
- For `value`/`valueAccumulative`: Numeric value in default unit (e.g., `"500"` for 500ml)
- For `protocol`: Text description

### Query Patterns

Events are typically queried by:

1. **Date range** - Using `timestamp` field with `$gte` and `$lt`
2. **Category** - Either single category or including children for composite categories

```typescript
// Query events for a date range
useGetEventsForDate(from: number, to: number)

// Query events for date + category (handles composite categories)
useGetEventsForDateAndCategory(from: number, to: number, category: Category)
```

---

## Targets Collection

**File:** `src/category/target.ts`
**Schema Version:** 1

Targets define recurring goals with RRule schedules and configurable period types.

### Schema

| Field          | Type             | Required | Description                                        |
| -------------- | ---------------- | -------- | -------------------------------------------------- |
| `id`           | string (max 100) | Yes      | UUID v7 primary key                                |
| `name`         | string           | No       | Display name for the target                        |
| `category`     | string           | Yes      | Foreign key to Categories collection               |
| `schedule`     | string           | Yes      | RRule string (iCalendar RRULE format)              |
| `config`       | string           | Yes      | Target value (e.g., expected count or measurement) |
| `periodType`   | enum             | Yes      | Period for event aggregation                       |
| `periodDays`   | number           | No       | Custom period length in days (for `custom` type)   |
| `weekStartDay` | number           | Yes      | Week start day (0=Sunday, 1=Monday)                |

### Period Types

Targets can span multiple days. The `periodType` determines how events are aggregated:

| Type      | German Label      | Description                                   |
| --------- | ----------------- | --------------------------------------------- |
| `daily`   | Täglich           | Single day (default, original behavior)       |
| `weekly`  | Wöchentlich       | Full week, respects `weekStartDay`            |
| `monthly` | Monatlich         | Full calendar month                           |
| `custom`  | Benutzerdefiniert | Custom period using `periodDays` from DTSTART |

**Multi-day targets:**

- Display every day within their period
- Aggregate events from the entire period
- Show period range in UI (e.g., "500 ml von 1 l (13.01 - 19.01)")

### Schedule Format

The `schedule` field contains an RRule string:

```
DTSTART:20240101T000000Z
RRULE:FREQ=DAILY;INTERVAL=1
```

See [RRULE-AND-SCHEDULES.md](./RRULE-AND-SCHEDULES.md) for detailed scheduling documentation.

### Config Format

The `config` field stores the target value:

- For `todo`/`value`: Expected count (e.g., `"3"` for 3 times)
- For `valueAccumulative`: Target amount in default unit (e.g., `"2000"` for 2000ml)
- For `protocol`: Expected count

### Status Calculation

Target status is calculated by `useGetTargetStatus()`:

```typescript
interface TargetStatus {
  value: string | number; // Current progress
  percentage: number; // Completion 0-100
  expected: string | number; // Target value
  color: string; // CSS color-mix expression
  from: number; // Period start timestamp
  to: number; // Period end timestamp (exclusive)
}
```

For multi-day targets, `from` and `to` represent the full period boundaries.

### Color Coding

Progress color uses CSS `color-mix()`:

| Percentage | Normal | Inverted |
| ---------- | ------ | -------- |
| 0%         | Red    | Green    |
| 50%        | Yellow | Yellow   |
| 100%       | Green  | Red      |

### Migration History

| From | To  | Changes                                                                    |
| ---- | --- | -------------------------------------------------------------------------- |
| 0    | 1   | Added `periodType`, `periodDays`, `weekStartDay`; ensured config is string |

---

## Graphs Collection

**File:** `src/analytics/graph.ts`
**Schema Version:** 4

Graphs define analytics visualization configurations.

### Schema

| Field      | Type             | Required | Description                                         |
| ---------- | ---------------- | -------- | --------------------------------------------------- |
| `id`       | string (max 100) | Yes      | UUID v7 primary key                                 |
| `name`     | string           | Yes      | Display name                                        |
| `type`     | enum             | Yes      | Visualization type                                  |
| `category` | string           | Yes      | Foreign key to Categories collection                |
| `range`    | string           | Yes      | Time range in seconds (e.g., `"604800"` for 7 days) |
| `config`   | object           | Yes      | Additional configuration                            |
| `order`    | number           | Yes      | Display order (for drag-and-drop reordering)        |

### Graph Types

| Type    | German Label    | Description               |
| ------- | --------------- | ------------------------- |
| `bar`   | Balken-Diagramm | Bar chart (placeholder)   |
| `line`  | Linien-Diagramm | Line chart with time axis |
| `table` | Tabelle         | Tabular data display      |

### Type Constants

```typescript
export const graphTypes = {
  bar: "Balken-Diagramm",
  line: "Linien-Diagramm",
  table: "Tabelle",
} as const;
```

### Config Object

```typescript
interface GraphConfig {
  upperLimit?: string;       // Upper threshold line (optional)
  lowerLimit?: string;       // Lower threshold line (optional)
  aggregationMode?: string;  // "daily" | "weekly" | "monthly" | "custom"
  aggregationDays?: number;  // Only for "custom" mode
  weekStartDay?: number;     // 0=Sunday, 1=Monday (for weekly aggregation)
  xAxisScaleType?: string;   // "time" | "point" (for line charts)
}
```

See [ANALYTICS-AGGREGATION.md](./ANALYTICS-AGGREGATION.md) for detailed aggregation documentation.

### Migration History

| From | To  | Changes                                                              |
| ---- | --- | -------------------------------------------------------------------- |
| 0    | 1   | Identity migration                                                   |
| 1    | 2   | Added `order` field with default value 0                             |
| 2    | 3   | Added `aggregationMode: "daily"` and `weekStartDay: 1` to config     |
| 3    | 4   | Added `xAxisScaleType: "time"` to config                             |

---

## Collection Relationships

```
Categories
    │
    ├──< Events (category → Categories.id)
    │
    ├──< Targets (category → Categories.id)
    │
    ├──< Graphs (category → Categories.id)
    │
    └──< Categories (children[] → Categories.id)  [self-referential]
```

### Composite Categories

Categories can have child categories via the `children` array. When querying events for a composite category:

1. Check if `category.children` has items
2. If yes, query events where `category IN [parent.id, ...children]`
3. If no, query events where `category = parent.id`

---

## Exported Constants and Schemas

### From `category.ts`

- `categoryTypes` - Type label mapping
- `categoryCollection` - RxDB collection config with migrations

### From `event.ts`

- `eventSchema` - RxDB schema definition

### From `target.ts`

- `targetSchema` - RxDB schema definition
- `targetCollection` - RxDB collection config with migrations
- `getPeriodBoundaries(target, selectedDate)` - Calculate period start/end for a target

### From `graph.ts`

- `graphTypes` - Type label mapping
- `graphCollection` - RxDB collection config with migrations
