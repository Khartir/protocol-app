import { Typography, Box, List, ListItem } from "@mui/material";
import { useAtomValue } from "jotai";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import { Graph } from "./graph";
import { selectedDate } from "../home/Home";
import { Category, useGetCategory, useGetCategories } from "../category/category";
import { useGetEventsForDateAndCategory } from "../category/event";
import { getDefaultUnit, toBest } from "../MeasureSelect";
import { convertMany } from "convert";
import { getAggregationBoundaries, AggregationMode } from "./aggregation";

dayjs.extend(weekOfYear);

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

  const hasChildren = (category.children?.length ?? 0) > 0;

  // Build list of all periods in range
  interface Period {
    from: number;
    to: number;
    key: string;
    label: string;
  }
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

  // Group events by period and category
  // Map<periodKey, Map<categoryId, sum>>
  const periodData = new Map<string, Map<string, number>>();

  for (const period of periods) {
    periodData.set(period.key, new Map());
  }

  const isProtocol = category.type === "protocol";
  const isSimpleValue = category.type === "value";
  const defaultUnit = getDefaultUnit(category);

  for (const event of events) {
    // Find which period this event belongs to
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
        // Protocol categories: count entries
        increment = 1;
      } else if (isSimpleValue && defaultUnit) {
        // Simple measurements: stored with unit, convert to base unit
        try {
          increment = Math.round(convertMany(event.data.replace(",", ".")).to(defaultUnit));
        } catch {
          increment = 0;
        }
      } else {
        // Accumulated values: stored as raw number
        increment = Number(event.data || 0);
      }
      periodMap.set(event.category, current + increment);
    }
  }

  if (hasChildren) {
    // Compact list per period with subcategory breakdown
    const activeChildren = childCategories.filter((child) => {
      for (const periodMap of periodData.values()) {
        if ((periodMap.get(child.id) ?? 0) > 0) return true;
      }
      return false;
    });

    if (activeChildren.length === 0) {
      return <Typography color="text.secondary">Keine Daten</Typography>;
    }

    return (
      <List dense sx={{ mb: 2 }}>
        {periods.map((period) => {
          const periodMap = periodData.get(period.key)!;
          let periodTotal = 0;
          const childValues: { name: string; value: number }[] = [];

          activeChildren.forEach((child) => {
            const value = periodMap.get(child.id) ?? 0;
            if (value > 0) {
              childValues.push({
                name: `${child.icon ?? ""} ${child.name}`.trim(),
                value,
              });
              periodTotal += value;
            }
          });

          return (
            <ListItem
              key={period.key}
              sx={{ flexDirection: "column", alignItems: "flex-start", py: 1 }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                {period.label}
              </Typography>
              {childValues.length > 0 ? (
                <Box sx={{ pl: 1, width: "100%" }}>
                  {childValues.map((cv, idx) => (
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
                      {formatValue(category, periodTotal)}
                    </Typography>
                  </Box>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ pl: 1 }}>
                  -
                </Typography>
              )}
            </ListItem>
          );
        })}
      </List>
    );
  }

  // Simple list without subcategories: Period | Value
  const hasAnyData = Array.from(periodData.values()).some(
    (periodMap) => (periodMap.get(category.id) ?? 0) > 0
  );

  if (!hasAnyData) {
    return <Typography color="text.secondary">Keine Daten</Typography>;
  }

  return (
    <List dense sx={{ mb: 2 }}>
      {periods.map((period) => {
        const periodMap = periodData.get(period.key)!;
        const value = periodMap.get(category.id) ?? 0;

        return (
          <ListItem
            key={period.key}
            sx={{ display: "flex", justifyContent: "space-between", py: 0.5 }}
          >
            <Typography variant="body2" fontWeight="bold" sx={{ flex: 1 }}>
              {period.label}
            </Typography>
            <Typography variant="body2" sx={valueStyle}>
              {formatValue(category, value)}
            </Typography>
          </ListItem>
        );
      })}
    </List>
  );
}
