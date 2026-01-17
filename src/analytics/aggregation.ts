import dayjs from "dayjs";
import convert, { Unit } from "convert";
import { Category } from "../category/category";
import { getDefaultUnit } from "../MeasureSelect";

/**
 * Aggregation mode type
 */
export type AggregationMode = "daily" | "weekly" | "monthly" | "custom";

/**
 * Calculates the period boundaries for a given date based on aggregation mode.
 *
 * @param mode - Aggregation mode (daily, weekly, monthly, custom)
 * @param weekStartDay - Day the week starts (0=Sunday, 1=Monday)
 * @param aggregationDays - Number of days for custom aggregation
 * @param date - The date timestamp to get boundaries for
 * @param startDate - Optional start date for custom aggregation
 * @returns Object with `from` and `to` timestamps (exclusive end)
 */
export function getAggregationBoundaries(
  mode: AggregationMode,
  weekStartDay: number,
  aggregationDays: number | undefined,
  date: number,
  startDate?: number
): { from: number; to: number } {
  const selected = dayjs(date);

  switch (mode) {
    case "weekly": {
      const currentDay = selected.day();
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
      if (!aggregationDays || !startDate) {
        // Fallback to daily if no aggregationDays or startDate
        return {
          from: selected.startOf("day").valueOf(),
          to: selected.add(1, "day").startOf("day").valueOf(),
        };
      }

      const dtstart = dayjs(startDate).startOf("day");
      const daysSinceStart = selected.startOf("day").diff(dtstart, "day");
      const periodIndex = Math.floor(daysSinceStart / aggregationDays);
      const periodStart = dtstart.add(periodIndex * aggregationDays, "day");
      const periodEnd = periodStart.add(aggregationDays, "day");

      return { from: periodStart.valueOf(), to: periodEnd.valueOf() };
    }

    case "daily":
    default:
      return {
        from: selected.startOf("day").valueOf(),
        to: selected.add(1, "day").startOf("day").valueOf(),
      };
  }
}

// Helper to handle convert's different return types
function toQuantity(converted: number | { quantity: number; unit: Unit }): number {
  return typeof converted === "number" ? converted : converted.quantity;
}

/**
 * Aggregates events by period (weekly, monthly, custom).
 *
 * @param events - Array of events with timestamp and data
 * @param mode - Aggregation mode
 * @param weekStartDay - Day the week starts (0=Sunday, 1=Monday)
 * @param aggregationDays - Number of days for custom aggregation
 * @param fromDate - Start of date range
 * @param toDate - End of date range
 * @param category - Category for unit conversion
 * @param startDate - Optional start date for custom aggregation
 * @param targetUnit - Optional target unit for conversion
 * @returns Array of { x: Date (period start), y: number (period total) }
 */
export function aggregateEventsByPeriod(
  events: { timestamp: number; data: string }[],
  mode: AggregationMode,
  weekStartDay: number,
  aggregationDays: number | undefined,
  fromDate: dayjs.Dayjs,
  toDate: dayjs.Dayjs,
  category: Category,
  startDate?: number,
  targetUnit?: Unit
): { x: Date; y: number }[] {
  // Build list of period start dates within the range
  const periods: { from: number; to: number }[] = [];
  let currentDate = fromDate.startOf("day");
  const endDate = toDate.startOf("day");

  // Get the first period that contains currentDate
  const firstBoundaries = getAggregationBoundaries(
    mode,
    weekStartDay,
    aggregationDays,
    currentDate.valueOf(),
    startDate
  );

  // Add the first period
  periods.push(firstBoundaries);

  // Move to next period start and continue
  currentDate = dayjs(firstBoundaries.to);

  while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, "day")) {
    const boundaries = getAggregationBoundaries(
      mode,
      weekStartDay,
      aggregationDays,
      currentDate.valueOf(),
      startDate
    );

    // Avoid duplicates
    if (periods.length === 0 || periods[periods.length - 1].from !== boundaries.from) {
      periods.push(boundaries);
    }

    // Move to next period
    currentDate = dayjs(boundaries.to);
  }

  // Initialize period totals
  const periodTotals = new Map<number, number>();
  periods.forEach((period) => {
    periodTotals.set(period.from, 0);
  });

  // Sum events by period
  events.forEach((event) => {
    const eventBoundaries = getAggregationBoundaries(
      mode,
      weekStartDay,
      aggregationDays,
      event.timestamp,
      startDate
    );

    if (periodTotals.has(eventBoundaries.from)) {
      const eventValue = Number(event.data);
      if (!isNaN(eventValue)) {
        periodTotals.set(
          eventBoundaries.from,
          (periodTotals.get(eventBoundaries.from) || 0) + eventValue
        );
      }
    }
  });

  // Convert to array with unit conversion
  const defaultUnit = getDefaultUnit(category);

  // If no target unit is set, determine it based on the maximum value
  let effectiveTargetUnit = targetUnit;
  if (!effectiveTargetUnit && defaultUnit) {
    const maxValue = Math.max(...Array.from(periodTotals.values()));
    if (maxValue > 0) {
      effectiveTargetUnit = convert(maxValue, defaultUnit).to("best").unit;
    }
  }

  return periods
    .sort((a, b) => a.from - b.from)
    .map((period) => ({
      x: dayjs(period.from).toDate(),
      y: defaultUnit
        ? toQuantity(
            convert(periodTotals.get(period.from) || 0, defaultUnit).to(
              effectiveTargetUnit ?? "best"
            )
          )
        : periodTotals.get(period.from) || 0,
    }));
}
