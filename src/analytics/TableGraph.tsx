import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
} from "@mui/material";
import { useAtomValue } from "jotai";
import dayjs from "dayjs";
import { Graph } from "./graph";
import { selectedDate } from "../home/Home";
import { useGetCategory, useGetCategories } from "../category/category";
import { useGetEventsForDateAndCategory } from "../category/event";
import { toBest } from "../MeasureSelect";

interface TableGraphProps {
  graph: Graph;
}

export function TableGraph({ graph }: TableGraphProps) {
  const date = useAtomValue(selectedDate);
  const from = dayjs(date)
    .subtract(Number.parseInt(graph.range), "seconds")
    .valueOf();
  const to = dayjs(date).endOf("day").valueOf();

  const category = useGetCategory(graph.category);
  const childCategories = useGetCategories(category?.children ?? []);
  const events = useGetEventsForDateAndCategory(from, to, category);

  if (!category) {
    return <Typography color="error">Kategorie nicht gefunden</Typography>;
  }

  if (events.length === 0) {
    return <Typography color="text.secondary">Keine Daten</Typography>;
  }

  const hasChildren = (category.children?.length ?? 0) > 0;

  // Group events by category ID and sum values
  const grouped = new Map<string, number>();

  for (const event of events) {
    const current = grouped.get(event.category) ?? 0;
    grouped.set(event.category, current + Number(event.data || 0));
  }

  // Build rows
  const rows: { label: string; value: string; rawValue: number }[] = [];
  let grandTotal = 0;

  if (hasChildren) {
    // Show breakdown by subcategory
    for (const [catId, sum] of grouped) {
      const cat =
        catId === category.id
          ? category
          : childCategories.find((c) => c.id === catId);
      if (cat && sum > 0) {
        rows.push({
          label: `${cat.icon ?? ""} ${cat.name}`.trim(),
          value:
            category.type === "valueAccumulative"
              ? toBest(category, sum).replace(".", ",")
              : String(sum),
          rawValue: sum,
        });
        grandTotal += sum;
      }
    }
  } else {
    // Single category - show total
    const sum = grouped.get(category.id) ?? 0;
    if (sum > 0) {
      rows.push({
        label: `${category.icon ?? ""} ${category.name}`.trim(),
        value:
          category.type === "valueAccumulative"
            ? toBest(category, sum).replace(".", ",")
            : String(sum),
        rawValue: sum,
      });
      grandTotal = sum;
    }
  }

  const showValueColumn =
    category.type === "valueAccumulative" || category.type === "value";

  return (
    <TableContainer component={Paper} sx={{ mb: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Kategorie</TableCell>
            {showValueColumn && <TableCell align="right">Wert</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={index}>
              <TableCell>{row.label}</TableCell>
              {showValueColumn && (
                <TableCell align="right">{row.value}</TableCell>
              )}
            </TableRow>
          ))}
          {hasChildren && showValueColumn && (
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>Gesamt</TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>
                {category.type === "valueAccumulative"
                  ? toBest(category, grandTotal).replace(".", ",")
                  : String(grandTotal)}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
