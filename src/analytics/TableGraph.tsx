import { Typography, Box, List, ListItem } from "@mui/material";
import { useAtomValue } from "jotai";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import { Graph } from "./graph";
import { selectedDate } from "../home/Home";
import { Category, useGetCategory, useGetCategories } from "../category/category";
import { Event, useGetEventsForDateAndCategory } from "../category/event";
import { getDefaultUnit, toBest } from "../MeasureSelect";
import { convertMany } from "convert";
import { getAggregationBoundaries, AggregationMode } from "./aggregation";

dayjs.extend(weekOfYear);

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

interface TableGraphProps {
  graph: Graph;
}

function formatValue(category: Category, value: number): string {
  if (value === 0) return "-";
  if (category.type === "valueAccumulative" || category.type === "value") {
    return toBest(category, value).replace(".", ",");
  }
  return String(value);
}

const valueStyle = { minWidth: 80, textAlign: "right" as const };

/**
 * Format period label based on aggregation mode
 */
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

export function TableGraph({ graph }: TableGraphProps) {
  const date = useAtomValue(selectedDate);
  const fromDate = dayjs(date).subtract(Number.parseInt(graph.range), "seconds");
  const toDate = dayjs(date).endOf("day");

  const category = useGetCategory(graph.category);
  const childCategories = useGetCategories(category?.children ?? []);
  const events = useGetEventsForDateAndCategory(fromDate.valueOf(), toDate.valueOf(), category);

  // Get aggregation config
  const aggregationMode = (graph.config?.aggregationMode ?? "daily") as AggregationMode;
  const weekStartDay = graph.config?.weekStartDay ?? 1;
  const aggregationDays = graph.config?.aggregationDays;

  if (!category) {
    return <Typography color="error">Kategorie nicht gefunden</Typography>;
  }

  // Build list of all periods in range
  const periods: Period[] = [];
  let currentDate = fromDate.startOf("day");
  const endDate = toDate.startOf("day");

  // Get the first period boundaries
  let boundaries = getAggregationBoundaries(
    aggregationMode,
    weekStartDay,
    aggregationDays,
    currentDate.valueOf()
  );

  periods.push({
    from: boundaries.from,
    to: boundaries.to,
    key: String(boundaries.from),
    label: formatPeriodLabel(aggregationMode, boundaries.from, boundaries.to),
  });

  // Move to next period start
  currentDate = dayjs(boundaries.to);

  while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, "day")) {
    boundaries = getAggregationBoundaries(
      aggregationMode,
      weekStartDay,
      aggregationDays,
      currentDate.valueOf()
    );

    // Avoid duplicates
    if (periods[periods.length - 1].from !== boundaries.from) {
      periods.push({
        from: boundaries.from,
        to: boundaries.to,
        key: String(boundaries.from),
        label: formatPeriodLabel(aggregationMode, boundaries.from, boundaries.to),
      });
    }

    currentDate = dayjs(boundaries.to);
  }

  // Prepare table data using the extracted function
  const tableData = prepareTableData({
    events,
    category,
    childCategories,
    periods,
    aggregationMode,
    weekStartDay,
    aggregationDays,
  });

  // Render based on data type
  if (tableData.type === "withChildren") {
    const hasAnyData = tableData.periods.some((p) => p.children.length > 0);
    if (!hasAnyData) {
      return <Typography color="text.secondary">Keine Daten</Typography>;
    }

    return (
      <List dense sx={{ mb: 2 }}>
        {tableData.periods.map((period) => (
          <ListItem
            key={period.key}
            sx={{ flexDirection: "column", alignItems: "flex-start", py: 1 }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
              {period.label}
            </Typography>
            {period.children.length > 0 ? (
              <Box sx={{ pl: 1, width: "100%" }}>
                {period.children.map((cv, idx) => (
                  <Box key={idx} sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" sx={{ flex: 1 }}>
                      {cv.name}
                    </Typography>
                    <Typography variant="body2" sx={valueStyle}>
                      {formatValue(category, cv.value)}
                    </Typography>
                  </Box>
                ))}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    borderTop: "1px solid",
                    borderColor: "divider",
                    mt: 0.5,
                    pt: 0.5,
                  }}
                >
                  <Typography variant="body2" fontWeight="bold" sx={{ flex: 1 }}>
                    Gesamt
                  </Typography>
                  <Typography variant="body2" fontWeight="bold" sx={valueStyle}>
                    {formatValue(category, period.sum)}
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ pl: 1 }}>
                -
              </Typography>
            )}
          </ListItem>
        ))}
      </List>
    );
  }

  if (tableData.type === "simpleValueMultiple") {
    const hasAnyData = tableData.periods.some((p) => p.events.length > 0);
    if (!hasAnyData) {
      return <Typography color="text.secondary">Keine Daten</Typography>;
    }

    return (
      <List dense sx={{ mb: 2 }}>
        {tableData.periods.map((period) => (
          <ListItem
            key={period.key}
            sx={{ flexDirection: "column", alignItems: "flex-start", py: 1 }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
              {period.label}
            </Typography>
            {period.events.length > 0 ? (
              <Box sx={{ pl: 1, width: "100%" }}>
                {period.events.map((ev, idx) => (
                  <Box key={idx} sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" sx={{ flex: 1 }}>
                      {ev.time}
                    </Typography>
                    <Typography variant="body2" sx={valueStyle}>
                      {ev.displayValue}
                    </Typography>
                  </Box>
                ))}
                {period.events.length > 1 && (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      borderTop: "1px solid",
                      borderColor: "divider",
                      mt: 0.5,
                      pt: 0.5,
                    }}
                  >
                    <Typography variant="body2" fontWeight="bold" sx={{ flex: 1 }}>
                      Gesamt
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" sx={valueStyle}>
                      {formatValue(category, period.sum)}
                    </Typography>
                  </Box>
                )}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ pl: 1 }}>
                -
              </Typography>
            )}
          </ListItem>
        ))}
      </List>
    );
  }

  // Simple list: simpleValueSingle, accumulated, protocol
  const hasAnyData = tableData.periods.some((p) => p.sum > 0);
  if (!hasAnyData) {
    return <Typography color="text.secondary">Keine Daten</Typography>;
  }

  return (
    <List dense sx={{ mb: 2 }}>
      {tableData.periods.map((period) => (
        <ListItem
          key={period.key}
          sx={{ display: "flex", justifyContent: "space-between", py: 0.5 }}
        >
          <Typography variant="body2" fontWeight="bold" sx={{ flex: 1 }}>
            {period.label}
          </Typography>
          <Typography variant="body2" sx={valueStyle}>
            {formatValue(category, period.sum)}
          </Typography>
        </ListItem>
      ))}
    </List>
  );
}
