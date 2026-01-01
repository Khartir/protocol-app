import { Typography, Box, List, ListItem } from "@mui/material";
import { useAtomValue } from "jotai";
import dayjs from "dayjs";
import { Graph } from "./graph";
import { selectedDate } from "../home/Home";
import {
  Category,
  useGetCategory,
  useGetCategories,
} from "../category/category";
import { useGetEventsForDateAndCategory } from "../category/event";
import { toBest } from "../MeasureSelect";

interface TableGraphProps {
  graph: Graph;
}

function formatValue(category: Category, value: number): string {
  if (value === 0) return "-";
  if (category.type === "valueAccumulative") {
    return toBest(category, value).replace(".", ",");
  }
  return String(value);
}

const valueStyle = { minWidth: 80, textAlign: "right" as const };

export function TableGraph({ graph }: TableGraphProps) {
  const date = useAtomValue(selectedDate);
  const fromDate = dayjs(date).subtract(
    Number.parseInt(graph.range),
    "seconds"
  );
  const toDate = dayjs(date).endOf("day");

  const category = useGetCategory(graph.category);
  const childCategories = useGetCategories(category?.children ?? []);
  const events = useGetEventsForDateAndCategory(
    fromDate.valueOf(),
    toDate.valueOf(),
    category
  );

  if (!category) {
    return <Typography color="error">Kategorie nicht gefunden</Typography>;
  }

  const hasChildren = (category.children?.length ?? 0) > 0;

  // Build list of all days in range
  const days: string[] = [];
  let currentDay = fromDate.startOf("day");
  const endDay = toDate.startOf("day");
  while (currentDay.isBefore(endDay) || currentDay.isSame(endDay, "day")) {
    days.push(currentDay.format("YYYY-MM-DD"));
    currentDay = currentDay.add(1, "day");
  }

  // Group events by day and category
  // Map<dayKey, Map<categoryId, sum>>
  const dailyData = new Map<string, Map<string, number>>();

  for (const day of days) {
    dailyData.set(day, new Map());
  }

  for (const event of events) {
    const dayKey = dayjs(event.timestamp).format("YYYY-MM-DD");
    const dayMap = dailyData.get(dayKey);
    if (dayMap) {
      const current = dayMap.get(event.category) ?? 0;
      dayMap.set(event.category, current + Number(event.data || 0));
    }
  }

  if (hasChildren) {
    // Compact list per day with subcategory breakdown
    const activeChildren = childCategories.filter((child) => {
      for (const dayMap of dailyData.values()) {
        if ((dayMap.get(child.id) ?? 0) > 0) return true;
      }
      return false;
    });

    if (activeChildren.length === 0) {
      return <Typography color="text.secondary">Keine Daten</Typography>;
    }

    return (
      <List dense sx={{ mb: 2 }}>
        {days.map((dayKey) => {
          const dayMap = dailyData.get(dayKey)!;
          let dayTotal = 0;
          const childValues: { name: string; value: number }[] = [];

          activeChildren.forEach((child) => {
            const value = dayMap.get(child.id) ?? 0;
            if (value > 0) {
              childValues.push({
                name: `${child.icon ?? ""} ${child.name}`.trim(),
                value,
              });
              dayTotal += value;
            }
          });

          return (
            <ListItem
              key={dayKey}
              sx={{ flexDirection: "column", alignItems: "flex-start", py: 1 }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                {dayjs(dayKey).format("DD.MM.")}
              </Typography>
              {childValues.length > 0 ? (
                <Box sx={{ pl: 1, width: "100%" }}>
                  {childValues.map((cv, idx) => (
                    <Box
                      key={idx}
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
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
                      {formatValue(category, dayTotal)}
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

  // Simple list without subcategories: Datum | Wert
  const hasAnyData = Array.from(dailyData.values()).some(
    (dayMap) => (dayMap.get(category.id) ?? 0) > 0
  );

  if (!hasAnyData) {
    return <Typography color="text.secondary">Keine Daten</Typography>;
  }

  return (
    <List dense sx={{ mb: 2 }}>
      {days.map((dayKey) => {
        const dayMap = dailyData.get(dayKey)!;
        const value = dayMap.get(category.id) ?? 0;

        return (
          <ListItem
            key={dayKey}
            sx={{ display: "flex", justifyContent: "space-between", py: 0.5 }}
          >
            <Typography variant="body2" fontWeight="bold" sx={{ flex: 1 }}>
              {dayjs(dayKey).format("DD.MM.")}
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
