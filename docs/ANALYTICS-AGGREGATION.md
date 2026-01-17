# Analytics Aggregation System

This document describes the aggregation modes for analytics graphs in Protokol App.

## Overview

Analytics graphs can aggregate event data by different time periods:

- **Daily** - One data point per day (default)
- **Weekly** - One data point per week
- **Monthly** - One data point per month
- **Custom** - One data point per N days

This applies to both line charts and table graphs.

## Key Files

- `src/analytics/graph.ts` - Graph schema with aggregation config
- `src/analytics/aggregation.ts` - Period boundary calculation and event aggregation
- `src/Analytics.tsx` - LineGraph component using aggregation
- `src/analytics/TableGraph.tsx` - Table display with period grouping

## Dependencies

```json
{
  "dayjs": "^1.11.10"
}
```

Day.js plugins required:
- `weekOfYear` - For week number formatting (KW X)

---

## Aggregation Modes

### Daily (default)

Aggregates events by calendar day.

| Setting | Value |
| ------- | ----- |
| `aggregationMode` | `"daily"` |
| Label format | `"15.01"` |

### Weekly

Aggregates events by week, respecting the configured week start day.

| Setting | Value |
| ------- | ----- |
| `aggregationMode` | `"weekly"` |
| `weekStartDay` | `0` (Sunday) or `1` (Monday) |
| Label format | `"KW 3"` (week number) |

### Monthly

Aggregates events by calendar month.

| Setting | Value |
| ------- | ----- |
| `aggregationMode` | `"monthly"` |
| Label format | `"Jan 24"` |

### Custom

Aggregates events by a custom number of days.

| Setting | Value |
| ------- | ----- |
| `aggregationMode` | `"custom"` |
| `aggregationDays` | Number of days per period |
| Label format | `"01.01 - 14.01"` |

---

## Graph Config

Aggregation settings are stored in the graph's `config` object:

```typescript
interface GraphConfig {
  upperLimit?: string;       // Upper threshold line
  lowerLimit?: string;       // Lower threshold line
  aggregationMode?: string;  // "daily" | "weekly" | "monthly" | "custom"
  aggregationDays?: number;  // Only for "custom" mode
  weekStartDay?: number;     // 0=Sunday, 1=Monday (for weekly)
  xAxisScaleType?: string;   // "time" | "point" (for line charts)
}
```

### X-Axis Scale Type

Controls how x-axis labels are generated for line charts:

| Type | German Label | Description |
| ---- | ------------ | ----------- |
| `time` | Zeitachse (automatisch) | Automatic tick marks based on time range (default) |
| `point` | Pro Datenpunkt | Exactly one label per data point |

Use `point` when you want one-to-one correspondence between data points and labels. This is especially useful for weekly/monthly aggregation where `time` scale may show intermediate dates.

### Schema Migration

Schema v3 added aggregation fields. Migration sets defaults:

```typescript
3: (oldDoc: Graph) => ({
  ...oldDoc,
  config: {
    ...oldDoc.config,
    aggregationMode: "daily",
    weekStartDay: 1,
  },
}),
```

---

## Core Functions

### `getAggregationBoundaries()`

Calculates the period boundaries for a given date.

```typescript
function getAggregationBoundaries(
  mode: AggregationMode,
  weekStartDay: number,
  aggregationDays: number | undefined,
  date: number,
  startDate?: number
): { from: number; to: number }
```

**Parameters:**

- `mode` - Aggregation mode
- `weekStartDay` - Day the week starts (0=Sunday, 1=Monday)
- `aggregationDays` - Number of days for custom aggregation
- `date` - The date timestamp to get boundaries for
- `startDate` - Optional start date for custom aggregation

**Returns:** Object with `from` and `to` timestamps (exclusive end)

**Example:**

```typescript
// Get weekly boundaries for Jan 17, 2024 (Wednesday)
const { from, to } = getAggregationBoundaries(
  "weekly",
  1, // Monday start
  undefined,
  dayjs("2024-01-17").valueOf()
);
// from = Jan 15 (Monday), to = Jan 22 (next Monday)
```

---

### `aggregateEventsByPeriod()`

Groups events by period boundaries and returns chart-ready data.

```typescript
function aggregateEventsByPeriod(
  events: { timestamp: number; data: string }[],
  mode: AggregationMode,
  weekStartDay: number,
  aggregationDays: number | undefined,
  fromDate: dayjs.Dayjs,
  toDate: dayjs.Dayjs,
  category: Category,
  startDate?: number,
  targetUnit?: Unit
): { x: Date; y: number }[]
```

**Parameters:**

- `events` - Array of events with timestamp and data
- `mode` - Aggregation mode
- `weekStartDay` - Day the week starts
- `aggregationDays` - Number of days for custom aggregation
- `fromDate` - Start of date range
- `toDate` - End of date range
- `category` - Category for unit conversion
- `startDate` - Optional start date for custom aggregation
- `targetUnit` - Optional target unit for conversion

**Returns:** Array of `{ x: Date (period start), y: number (period total) }`

**Example:**

```typescript
const data = aggregateEventsByPeriod(
  events,
  "weekly",
  1, // Monday start
  undefined,
  dayjs("2024-01-01"),
  dayjs("2024-01-31"),
  waterCategory
);
// Returns one point per week with summed values
```

---

## LineGraph Integration

The `LineGraph` component uses aggregation based on graph config:

```typescript
const aggregationMode = (graph.config?.aggregationMode ?? "daily") as AggregationMode;
const weekStartDay = graph.config?.weekStartDay ?? 1;
const aggregationDays = graph.config?.aggregationDays;

let dataSet: { x: Date; y: number }[];
if (isAccumulative) {
  if (aggregationMode === "daily") {
    dataSet = aggregateEventsByDay(data, fromDate, toDate, category, targetUnit);
  } else {
    dataSet = aggregateEventsByPeriod(
      data,
      aggregationMode,
      weekStartDay,
      aggregationDays,
      fromDate,
      toDate,
      category,
      undefined,
      targetUnit
    );
  }
}
```

### X-Axis Formatting

Labels are formatted based on aggregation mode:

```typescript
const formatXAxis = (date: Date) => {
  switch (aggregationMode) {
    case "weekly":
      return `KW ${dayjs(date).week()}`;
    case "monthly":
      return dayjs(date).format("MMM YY");
    case "custom":
      return dayjs(date).format("DD.MM.");
    case "daily":
    default:
      return dayjs(date).format("DD.MM.");
  }
};
```

---

## TableGraph Integration

The `TableGraph` component groups data by periods:

```typescript
// Build list of all periods in range
const periods: Period[] = [];
let currentDate = fromDate.startOf("day");

while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, "day")) {
  const boundaries = getAggregationBoundaries(
    aggregationMode,
    weekStartDay,
    aggregationDays,
    currentDate.valueOf()
  );
  // Add period if not duplicate
  periods.push({
    from: boundaries.from,
    to: boundaries.to,
    key: String(boundaries.from),
    label: formatPeriodLabel(aggregationMode, boundaries.from, boundaries.to),
  });
  currentDate = dayjs(boundaries.to);
}
```

### Period Label Formatting

```typescript
function formatPeriodLabel(mode: AggregationMode, periodStart: number, periodEnd: number): string {
  const start = dayjs(periodStart);
  const end = dayjs(periodEnd).subtract(1, "day"); // End is exclusive

  switch (mode) {
    case "weekly":
      return `KW ${start.week()} (${start.format("DD.MM.")} - ${end.format("DD.MM.")})`;
    case "monthly":
      return start.format("MMMM YYYY");
    case "custom":
      return `${start.format("DD.MM.")} - ${end.format("DD.MM.")}`;
    case "daily":
    default:
      return start.format("DD.MM.");
  }
}
```

---

## UI Configuration

In `AnalyticsDialog`, users can configure aggregation:

```tsx
<FormControl fullWidth>
  <InputLabel>Aggregation</InputLabel>
  <Select name="aggregationMode" ...>
    <MenuItem value="daily">Täglich</MenuItem>
    <MenuItem value="weekly">Wöchentlich</MenuItem>
    <MenuItem value="monthly">Monatlich</MenuItem>
    <MenuItem value="custom">Benutzerdefiniert</MenuItem>
  </Select>
</FormControl>

{aggregationMode === "weekly" && (
  <FormControl fullWidth>
    <InputLabel>Woche beginnt am</InputLabel>
    <Select name="weekStartDay" ...>
      <MenuItem value={1}>Montag</MenuItem>
      <MenuItem value={0}>Sonntag</MenuItem>
    </Select>
  </FormControl>
)}

{aggregationMode === "custom" && (
  <TextField
    name="aggregationDays"
    label="Anzahl Tage"
    type="number"
    ...
  />
)}
```

---

## Examples

### Weekly Water Intake Chart

Track water consumption by week:

```typescript
{
  name: "Wasseraufnahme (Woche)",
  type: "line",
  category: waterCategoryId,
  range: "2592000", // 30 days in seconds
  config: {
    aggregationMode: "weekly",
    weekStartDay: 1,
    lowerLimit: "14000 ml", // 14L weekly goal
  },
}
```

### Monthly Exercise Table

View exercise counts by month:

```typescript
{
  name: "Sport (Monat)",
  type: "table",
  category: exerciseCategoryId,
  range: "7776000", // 90 days in seconds
  config: {
    aggregationMode: "monthly",
  },
}
```

### Bi-Weekly Progress

Custom 14-day aggregation:

```typescript
{
  name: "Fortschritt (2 Wochen)",
  type: "line",
  category: progressCategoryId,
  range: "5184000", // 60 days in seconds
  config: {
    aggregationMode: "custom",
    aggregationDays: 14,
  },
}
```

---

## Edge Cases

### Partial Periods at Range Edges

Periods at the start or end of the range may be partial. The first period includes all data from the range start, even if the period started earlier.

### Empty Periods

Periods with no events show as `0` (for charts) or `-` (for tables), maintaining consistency with daily behavior.

### Range Shorter Than One Period

If the date range is shorter than a single aggregation period, one aggregated point is shown containing all events in the range.

### Custom Mode Without Start Date

For custom aggregation, the `startDate` parameter is used to calculate period boundaries. If not provided, falls back to daily behavior.

---

## Relationship to Multi-Day Targets

Analytics aggregation is independent of target periods:

| Feature | Target `periodType` | Graph `aggregationMode` |
| ------- | ------------------- | ----------------------- |
| Purpose | Event accumulation for goal progress | Data visualization grouping |
| Scope | Single target | Single graph |
| Affects | TargetList status display | LineGraph/TableGraph display |

A daily target can be visualized with weekly aggregation, and vice versa.
