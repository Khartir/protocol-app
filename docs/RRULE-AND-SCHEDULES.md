# RRule Scheduling System

This document describes the recurring schedule system used for targets in Protokol App.

## Overview

Targets use [RRule](https://github.com/jakubroztocil/rrule) (iCalendar RRULE) for defining recurring schedules. This allows flexible patterns like daily, weekly, or custom recurrence.

## Key Files

- `src/category/target.ts` - Target schema, schedule evaluation
- `src/Targets.tsx` - Target management with RRuleBuilder component

## Dependencies

```json
{
  "rrule": "^2.8.1",
  "react-rrule-builder-ts": "^0.0.18"
}
```

---

## Schedule Format

Schedules are stored as RRule strings in the `schedule` field of targets:

```
DTSTART:20240101T000000Z
RRULE:FREQ=DAILY;INTERVAL=1
```

### Components

| Part       | Description                               |
| ---------- | ----------------------------------------- |
| `DTSTART`  | Start date in UTC (required)              |
| `RRULE`    | Recurrence rule                           |
| `FREQ`     | Frequency: DAILY, WEEKLY, MONTHLY, YEARLY |
| `INTERVAL` | Every N periods (default: 1)              |
| `BYDAY`    | Specific days (e.g., MO,WE,FR)            |
| `COUNT`    | Total occurrences limit                   |
| `UNTIL`    | End date                                  |

### Examples

**Daily:**

```
DTSTART:20240101T000000Z
RRULE:FREQ=DAILY;INTERVAL=1
```

**Every other day:**

```
DTSTART:20240101T000000Z
RRULE:FREQ=DAILY;INTERVAL=2
```

**Weekly on Monday, Wednesday, Friday:**

```
DTSTART:20240101T000000Z
RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR
```

**Monthly on the 1st:**

```
DTSTART:20240101T000000Z
RRULE:FREQ=MONTHLY;BYMONTHDAY=1
```

---

## Timezone Handling

### Critical: UTC Conversion

RRule operates in UTC. The app stores events in local time. This requires careful conversion:

```typescript
// Convert local time to UTC for RRule evaluation
const fromDate = dayjs(from).tz("utc", true).subtract(1, "s");
const toDate = dayjs(to).tz("utc", true);
```

**`.tz("utc", true)`** - Keeps the same wall clock time but interprets it as UTC. This is important because:

1. User selects "January 15" in their local timezone
2. We need to check if a rule fires on "January 15" in UTC terms
3. Using `true` prevents time shifting

### Setup

Timezone plugins are initialized in `main.tsx`:

```typescript
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);
```

---

## Schedule Evaluation

### `getCount(target, from, to)`

Internal function that counts schedule occurrences in a date range.

```typescript
const getCount = (target: Target, from: number, to: number) => {
  const rule = RRule.fromString(target.schedule);
  // sub 1 second, because the from date is not inclusive
  const fromDate = dayjs(from).tz("utc", true).subtract(1, "s");
  const toDate = dayjs(to).tz("utc", true);
  return rule.between(fromDate.toDate(), toDate.toDate()).length;
};
```

**Parameters:**

- `target` - Target with schedule string
- `from` - Start timestamp (local time, milliseconds)
- `to` - End timestamp (local time, milliseconds)

**Returns:** Number of occurrences in the range

**Note:** The `from` date subtracts 1 second because `rule.between()` is exclusive on the start.

---

### `useGetTargetsForDate(from, to)`

Hook that returns targets scheduled for a date range.

```typescript
export const useGetTargetsForDate = (from: number, to: number) => {
  const targets = useGetAllTargets();

  return targets.result
    .map((target) => (getCount(target, from, to) >= 1 ? target : null))
    .filter((target) => target !== null);
};
```

**Logic:**

1. Fetch all targets
2. For each target, check if `getCount() >= 1`
3. Return only targets with at least one occurrence

**Usage:**

```typescript
// Get targets for today
const from = dayjs().startOf("day").valueOf();
const to = dayjs().endOf("day").valueOf();
const todaysTargets = useGetTargetsForDate(from, to);
```

---

### Target Status Calculation

When calculating target completion, `getCount()` determines the expected count:

```typescript
// In useGetTargetStatus()
case "todo":
case "value":
  expected = getCount(target, from, to);
  // ...
  const percentage = Math.min((events.length / expected) * 100, 100);
```

For `todo` and `value` types, `expected` is the number of schedule occurrences (how many times the target should be completed).

For `valueAccumulative`, the expected value comes from `target.config` (a specific amount like "2000" ml).

---

## UI Component: RRuleBuilder

The app uses `react-rrule-builder-ts` for schedule editing:

```typescript
import RRuleBuilder from "react-rrule-builder-ts";

<RRuleBuilder
  rrule={formik.values.schedule}
  onChange={(rrule) => formik.setFieldValue("schedule", rrule)}
  dateAdapter={DayjsUtcDateAdapter}
/>
```

### Date Adapter

Custom adapter ensures UTC handling:

```typescript
const DayjsUtcDateAdapter: DateAdapter = {
  // ... adapter implementation
};
```

---

## Common Patterns

### Daily Target

User wants to drink water every day:

```
RRULE:FREQ=DAILY
```

- `getCount()` returns 1 for any single day

### Multiple Times Daily

User wants to exercise 3 times per day:

Store `config: "3"` and use:

```
RRULE:FREQ=DAILY
```

- For `todo`/`value` types, expected = `getCount() * config`

### Weekday Only

User wants to take medication on weekdays:

```
RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR
```

- `getCount()` returns 1 for weekdays, 0 for weekends

### Every Other Day

User wants to run every 2 days:

```
RRULE:FREQ=DAILY;INTERVAL=2
```

- `getCount()` returns 1 on scheduled days, 0 otherwise

### Specific Day of Month

User wants to pay rent on the 1st:

```
RRULE:FREQ=MONTHLY;BYMONTHDAY=1
```

---

## Debugging Schedules

### Check if date is scheduled

```typescript
const rule = RRule.fromString(target.schedule);
const from = dayjs("2024-01-15").tz("utc", true).subtract(1, "s");
const to = dayjs("2024-01-16").tz("utc", true);
const count = rule.between(from.toDate(), to.toDate()).length;
console.log(`Scheduled ${count} times on Jan 15`);
```

### List all occurrences

```typescript
const rule = RRule.fromString(target.schedule);
const dates = rule.all((_, i) => i < 10); // First 10
console.log(dates);
```

### Get human-readable description

```typescript
const rule = RRule.fromString(target.schedule);
console.log(rule.toText()); // "every day"
```

---

## Edge Cases

### DST (Daylight Saving Time)

Using `.tz("utc", true)` avoids most DST issues by treating local dates as UTC dates. However, be aware:

- A daily target at midnight local time should fire once per day
- During DST transitions, the actual wall clock time shifts

### Timezone Mismatch

If the user travels to a different timezone:

- Events are stored in local time
- Targets evaluate against the device's current timezone
- This may cause unexpected behavior

### Future Dates

`useGetTargetStatus()` only shows meaningful progress for the current day. Future date targets show 0 events completed.

---

## Integration Example

Complete flow for checking today's targets:

```typescript
// 1. Get date range for today
const from = useAtomValue(selectedDate);
const to = dayjs(from).add(1, "day").valueOf();

// 2. Get scheduled targets
const targets = useGetTargetsForDate(from, to);

// 3. For each target, get status
targets.map((target) => {
  const status = useGetTargetStatus(target);
  // status = { value, percentage, expected, color }
});
```
