import { RRule } from "rrule";
import { ExtractDocumentTypeFromTypedRxJsonSchema, toTypedRxJsonSchema } from "rxdb";
import { useRxCollection, useRxData } from "rxdb-hooks";
import { useGetEventsForDateAndCategory } from "./event";
import { useAtomValue } from "jotai";
import dayjs from "dayjs";
import { selectedDate } from "../home/atoms";
import { Category, useGetCategory } from "./category";
import { toBest } from "../measure-utils";

/**
 * RxDB schema for the targets collection.
 * Targets define recurring goals with RRule schedules.
 * v1: Added periodType, periodDays, weekStartDay for multi-day targets
 */
export const targetSchema = {
  version: 1,
  primaryKey: "id",
  type: "object",
  properties: {
    id: {
      type: "string",
      maxLength: 100,
    },
    name: {
      type: "string",
    },
    category: {
      type: "string",
    },
    schedule: {
      type: "string",
    },
    config: {
      type: "string",
    },
    periodType: {
      type: "string",
      enum: ["daily", "weekly", "monthly", "custom"],
    },
    periodDays: {
      type: "number",
    },
    weekStartDay: {
      type: "number",
    },
  },
  required: ["id", "category", "schedule", "config", "periodType", "weekStartDay"],
} as const;

/**
 * RxDB collection configuration for targets.
 * Includes schema and migration strategies for version upgrades.
 */
export const targetCollection = {
  schema: targetSchema,
  migrationStrategies: {
    1: (old: Target) => ({
      ...old,
      // Ensure config is a string (some old data may have numbers)
      config: String(old.config),
      periodType: "daily",
      weekStartDay: 1,
    }),
  },
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const schemaTyped = toTypedRxJsonSchema(targetSchema);

export type Target = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>;

/**
 * Returns all targets from the database.
 * @returns Reactive array of Target documents
 */
export const useGetAllTargets = () => {
  return useRxData<Target>("targets", (collection) => collection.find());
};

/**
 * Returns the targets RxDB collection for direct mutations.
 * @returns RxCollection for insert/patch/remove operations
 */
export const useGetTargetsCollection = () => useRxCollection<Target>("targets");

/**
 * Returns targets that should be displayed for the selected date.
 * For daily targets: shows if scheduled on that day.
 * For multi-day targets (weekly/monthly/custom): shows if selected date falls
 * within a period that has at least one scheduled occurrence.
 *
 * @param from - Start timestamp (inclusive, local time milliseconds)
 * @param to - End timestamp (exclusive, local time milliseconds)
 * @returns Array of Target documents to display for the range
 */
export const useGetTargetsForDate = (from: number, to: number) => {
  const targets = useGetAllTargets();

  return targets.result
    .map((target) => {
      if (target.periodType === "daily") {
        // Daily targets: show only if scheduled on this specific day
        return getCount(target, from, to) >= 1 ? target : null;
      }

      // Multi-day targets: show if there's at least one occurrence in the period
      const boundaries = getPeriodBoundaries(target, from);
      return getCount(target, boundaries.from, boundaries.to) >= 1 ? target : null;
    })
    .filter((target) => target !== null);
};

/**
 * Calculates the completion status of a target for the selected date.
 * Uses the global selectedDate atom and queries related events.
 * For multi-day targets, aggregates events from the entire period.
 *
 * @param target - Target to calculate status for
 * @returns Status object with value, percentage, expected, color, and period boundaries
 *
 * @example
 * const status = useGetTargetStatus(target);
 * // status = { value: "500 ml", percentage: 50, expected: "1 l", color: "color-mix(...)", from: 1705276800000, to: 1705881600000 }
 */
export const useGetTargetStatus = (
  target: Target
): {
  value: string | number;
  percentage: number;
  expected: string | number;
  color: string;
  from: number;
  to: number;
} => {
  const selectedDateValue = useAtomValue(selectedDate);
  const { from, to } = getPeriodBoundaries(target, selectedDateValue);
  const category = useGetCategory(target.category);
  const events = useGetEventsForDateAndCategory(from, to, category);
  let expected: number = 0;

  switch (category?.type) {
    case "todo":
    case "value":
      expected = getCount(target, from, to);
    // eslint-disable-next-line no-fallthrough
    case "protocol":
      // eslint-disable-next-line no-case-declarations
      const percentage = Math.min((events.length / expected) * 100, 100);
      return {
        value: events.length,
        percentage,
        expected,
        color: getColor(category, percentage),
        from,
        to,
      };
    case "valueAccumulative": {
      const sum = events.reduce((result, event) => result + Number(event.data), 0);
      let percentage = Math.min(100, (sum / Number(target.config)) * 100);
      const color = getColor(category, percentage);

      if (category.inverted && percentage < 100) {
        percentage = 100 - percentage;
      }

      return {
        value: toBest(category, sum).replace(".", ","),
        percentage,
        expected: toBest(category, target.config).replace(".", ","),
        color,
        from,
        to,
      };
    }
    default:
      return {
        value: "",
        percentage: 0,
        expected: "0",
        color: "pink",
        from,
        to,
      };
  }
};

/**
 * Calculates the period boundaries (from/to) for a target based on its periodType.
 * Used to determine the date range for event aggregation.
 *
 * @param target - Target with periodType and optional periodDays/weekStartDay
 * @param selectedDateValue - The selected date timestamp (local time milliseconds)
 * @returns Object with `from` and `to` timestamps (exclusive end)
 */
export const getPeriodBoundaries = (
  target: Target,
  selectedDateValue: number
): { from: number; to: number } => {
  const selected = dayjs(selectedDateValue);

  switch (target.periodType) {
    case "weekly": {
      const weekStartDay = target.weekStartDay ?? 1;
      // dayjs day() returns 0=Sunday, 1=Monday, etc.
      const currentDay = selected.day();
      // Calculate days to subtract to get to week start
      let daysToSubtract = currentDay - weekStartDay;
      if (daysToSubtract < 0) {
        daysToSubtract += 7;
      }
      const weekStart = selected.subtract(daysToSubtract, "day").startOf("day");
      const weekEnd = weekStart.add(7, "day");
      return { from: weekStart.valueOf(), to: weekEnd.valueOf() };
    }

    case "monthly": {
      const monthStart = selected.startOf("month");
      const monthEnd = monthStart.add(1, "month");
      return { from: monthStart.valueOf(), to: monthEnd.valueOf() };
    }

    case "custom": {
      const periodDays = target.periodDays;
      if (!periodDays) {
        // Fallback to daily if no periodDays
        return {
          from: selected.startOf("day").valueOf(),
          to: selected.add(1, "day").startOf("day").valueOf(),
        };
      }

      // Parse DTSTART from schedule
      const dtstartMatch = target.schedule.match(/DTSTART:(\d{8})/);
      if (!dtstartMatch) {
        // Fallback to daily if no DTSTART
        return {
          from: selected.startOf("day").valueOf(),
          to: selected.add(1, "day").startOf("day").valueOf(),
        };
      }

      const dtstartStr = dtstartMatch[1];
      const dtstart = dayjs(
        `${dtstartStr.slice(0, 4)}-${dtstartStr.slice(4, 6)}-${dtstartStr.slice(6, 8)}`
      ).startOf("day");

      // Calculate which period the selected date falls into
      const daysSinceStart = selected.startOf("day").diff(dtstart, "day");
      const periodIndex = Math.floor(daysSinceStart / periodDays);
      const periodStart = dtstart.add(periodIndex * periodDays, "day");
      const periodEnd = periodStart.add(periodDays, "day");

      return { from: periodStart.valueOf(), to: periodEnd.valueOf() };
    }

    case "daily":
    default:
      // Daily or unknown/invalid: single day
      return {
        from: selected.startOf("day").valueOf(),
        to: selected.add(1, "day").startOf("day").valueOf(),
      };
  }
};

/**
 * Calculates how many times a target is scheduled in a date range.
 * Uses RRule evaluation with UTC timezone conversion.
 *
 * @param target - Target with RRule schedule
 * @param from - Start timestamp (inclusive, local time milliseconds)
 * @param to - End timestamp (exclusive, local time milliseconds)
 * @returns Number of scheduled occurrences
 */
export const getCount = (target: Target, from: number, to: number) => {
  const rule = RRule.fromString(target.schedule);
  // sub 1 second, because the from date is not inclusive
  // convert to utc because rrule requires utc and we work in local time
  const fromDate = dayjs(from).tz("utc", true).subtract(1, "s");
  const toDate = dayjs(to).tz("utc", true);
  return rule.between(fromDate.toDate(), toDate.toDate()).length;
};

/**
 * Calculates the color for a target based on completion percentage.
 * Returns a CSS color-mix value transitioning from red -> yellow -> green.
 * For inverted categories, the color scheme is reversed.
 *
 * @param category - Category (used for inverted flag)
 * @param percentage - Completion percentage (0-100)
 * @returns CSS color-mix string
 */
export function getColor(category: Category, percentage: number) {
  let colors = ["red", "yellow", "green"];
  if (category.inverted) {
    colors = colors.reverse();
  }

  let colorPercentage = percentage;
  if (colorPercentage > 50) {
    colorPercentage -= 50;
    colors.shift();
  }

  colorPercentage *= 2;

  const color = `color-mix(in srgb, ${colors[0]}, ${colors[1]} ${colorPercentage}%)`;
  return color;
}
