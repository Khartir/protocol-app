import dayjs from "dayjs";
import { convertMany } from "convert";
import { Category } from "../category/category";
import { Event } from "../category/event";
import { getDefaultUnit, toBest } from "../measure-utils";
import { getAggregationBoundaries, AggregationMode } from "./aggregation";

// Types for prepareTableData
export interface Period {
  from: number;
  to: number;
  key: string;
  label: string;
}

interface EventEntry {
  time: string;
  displayValue: string;
  rawValue: number;
}

interface SimpleValuePeriodData {
  label: string;
  key: string;
  events: EventEntry[];
  sum: number;
}

interface AccumulatedPeriodData {
  label: string;
  key: string;
  sum: number;
}

interface WithChildrenPeriodData {
  label: string;
  key: string;
  children: { name: string; value: number }[];
  sum: number;
}

export type TableData =
  | { type: "simpleValueMultiple"; periods: SimpleValuePeriodData[] }
  | { type: "simpleValueSingle"; periods: AccumulatedPeriodData[] }
  | { type: "accumulated"; periods: AccumulatedPeriodData[] }
  | { type: "withChildren"; periods: WithChildrenPeriodData[] }
  | { type: "protocol"; periods: AccumulatedPeriodData[] };

export interface PrepareTableDataParams {
  events: Event[];
  category: Category;
  childCategories: Category[];
  periods: Period[];
  aggregationMode: AggregationMode;
  weekStartDay: number;
  aggregationDays: number | undefined;
}

/**
 * Prepare table data for rendering.
 * For simple value categories: returns individual events (not summed).
 * For accumulated/protocol categories: returns summed values per period.
 */
export function prepareTableData({
  events,
  category,
  childCategories,
  periods,
  aggregationMode,
  weekStartDay,
  aggregationDays,
}: PrepareTableDataParams): TableData {
  const hasChildren = (category.children?.length ?? 0) > 0;
  const isProtocol = category.type === "protocol";
  const isSimpleValue = category.type === "value";
  const defaultUnit = getDefaultUnit(category);

  // For simple value categories without children, store individual events
  if (isSimpleValue && !hasChildren) {
    const periodEvents = new Map<string, EventEntry[]>();

    for (const period of periods) {
      periodEvents.set(period.key, []);
    }

    for (const event of events) {
      const eventBoundaries = getAggregationBoundaries(
        aggregationMode,
        weekStartDay,
        aggregationDays,
        event.timestamp
      );
      const periodKey = String(eventBoundaries.from);
      const eventList = periodEvents.get(periodKey);

      if (eventList) {
        let rawValue = 0;
        let displayValue = event.data;

        if (defaultUnit) {
          try {
            rawValue = Math.round(convertMany(event.data.replace(",", ".")).to(defaultUnit));
            displayValue = toBest(category, rawValue).replace(".", ",");
          } catch {
            displayValue = event.data;
          }
        }

        eventList.push({
          time: dayjs(event.timestamp).format("HH:mm"),
          displayValue,
          rawValue,
        });
      }
    }

    // Check if any period has multiple events
    const hasMultipleEventsInAnyPeriod = Array.from(periodEvents.values()).some(
      (eventList) => eventList.length > 1
    );

    if (hasMultipleEventsInAnyPeriod) {
      return {
        type: "simpleValueMultiple",
        periods: periods.map((period) => {
          const eventList = periodEvents.get(period.key) ?? [];
          const sum = eventList.reduce((acc, e) => acc + e.rawValue, 0);
          return {
            label: period.label,
            key: period.key,
            events: eventList,
            sum,
          };
        }),
      };
    } else {
      // Single event per period - use simple format
      return {
        type: "simpleValueSingle",
        periods: periods.map((period) => {
          const eventList = periodEvents.get(period.key) ?? [];
          const sum = eventList.length > 0 ? eventList[0].rawValue : 0;
          return {
            label: period.label,
            key: period.key,
            sum,
          };
        }),
      };
    }
  }

  // For accumulated/protocol categories, sum values
  const periodData = new Map<string, Map<string, number>>();

  for (const period of periods) {
    periodData.set(period.key, new Map());
  }

  for (const event of events) {
    const eventBoundaries = getAggregationBoundaries(
      aggregationMode,
      weekStartDay,
      aggregationDays,
      event.timestamp
    );
    const periodKey = String(eventBoundaries.from);
    const periodMap = periodData.get(periodKey);

    if (periodMap) {
      const current = periodMap.get(event.category) ?? 0;
      let increment: number;
      if (isProtocol) {
        increment = 1;
      } else {
        increment = Number(event.data || 0);
      }
      periodMap.set(event.category, current + increment);
    }
  }

  if (hasChildren) {
    return {
      type: "withChildren",
      periods: periods.map((period) => {
        const periodMap = periodData.get(period.key)!;
        const children: { name: string; value: number }[] = [];
        let sum = 0;

        childCategories.forEach((child) => {
          const value = periodMap.get(child.id) ?? 0;
          if (value > 0) {
            children.push({
              name: `${child.icon ?? ""} ${child.name}`.trim(),
              value,
            });
            sum += value;
          }
        });

        return {
          label: period.label,
          key: period.key,
          children,
          sum,
        };
      }),
    };
  }

  if (isProtocol) {
    return {
      type: "protocol",
      periods: periods.map((period) => {
        const periodMap = periodData.get(period.key)!;
        return {
          label: period.label,
          key: period.key,
          sum: periodMap.get(category.id) ?? 0,
        };
      }),
    };
  }

  // Default: accumulated without children
  return {
    type: "accumulated",
    periods: periods.map((period) => {
      const periodMap = periodData.get(period.key)!;
      return {
        label: period.label,
        key: period.key,
        sum: periodMap.get(category.id) ?? 0,
      };
    }),
  };
}
