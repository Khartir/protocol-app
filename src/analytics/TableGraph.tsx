import { Typography, Box, List, ListItem } from "@mui/material";
import { useAtomValue } from "jotai";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import { Graph } from "./graph";
import { selectedDate } from "../home/atoms";
import { Category, useGetCategory, useGetCategories } from "../category/category";
import { useGetEventsForDateAndCategory } from "../category/event";
import { toBest } from "../measure-utils";
import { getAggregationBoundaries, AggregationMode } from "./aggregation";
import { prepareTableData, Period } from "./table-data";

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
