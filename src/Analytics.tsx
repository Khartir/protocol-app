import { Heading } from "./styling/Heading";
import {
  Button,
  Dialog,
  DialogContent,
  Stack,
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import * as Yup from "yup";
import { AllCategorySelect } from "./category/CategorySelect";
import { Form, Formik } from "formik";

import { useAtom, useAtomValue } from "jotai";
import { addState } from "./app/Menu";
import { v7 as uuid } from "uuid";
import {
  Graph,
  graphTypes,
  useGetAllGraphs,
  useGetGraphsCollection,
} from "./analytics/graph";
import { TableGraph } from "./analytics/TableGraph";
import { useGetEventsForDateAndCategory } from "./category/event";
import convert, { convertMany, Unit } from "convert";
import dayjs from "dayjs";
import { Category, useGetCategory } from "./category/category";
import { LineChart, LineSeries } from "@mui/x-charts/LineChart";
import { Delete, Edit } from "@mui/icons-material";
import { useState } from "react";
import { RxDocument } from "rxdb";
import { useDeleteConfirm } from "./ConfirmDelete";
import { DateSelect, selectedDate } from "./home/Home";
import { getDefaultUnit } from "./MeasureSelect";
import { PiecewiseColorConfig } from "../node_modules/@mui/x-charts/esm/models/colorMapping.js";

// Helper to handle convert's different return types:
// .to("best") returns { quantity, unit }, .to(specificUnit) returns number
function toQuantity(
  converted: number | { quantity: number; unit: Unit }
): number {
  return typeof converted === "number" ? converted : converted.quantity;
}

function aggregateEventsByDay(
  events: { timestamp: number; data: string }[],
  fromDate: dayjs.Dayjs,
  toDate: dayjs.Dayjs,
  category: Category,
  targetUnit?: Unit
): { x: Date; y: number }[] {
  // Initialize all days in range with 0
  const dailyTotals = new Map<string, number>();
  let currentDay = fromDate.startOf("day");
  const endDay = toDate.startOf("day");
  while (currentDay.isBefore(endDay) || currentDay.isSame(endDay, "day")) {
    dailyTotals.set(currentDay.format("YYYY-MM-DD"), 0);
    currentDay = currentDay.add(1, "day");
  }

  // Sum events by day (data stored as raw number in default unit)
  events.forEach((event) => {
    const dayKey = dayjs(event.timestamp).format("YYYY-MM-DD");
    if (dailyTotals.has(dayKey)) {
      const eventValue = Number(event.data);
      if (!isNaN(eventValue)) {
        dailyTotals.set(dayKey, (dailyTotals.get(dayKey) || 0) + eventValue);
      }
    }
  });

  // Convert to array with unit conversion
  const defaultUnit = getDefaultUnit(category);
  return Array.from(dailyTotals.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, value]) => ({
      x: dayjs(dateKey).toDate(),
      y: defaultUnit
        ? toQuantity(convert(value, defaultUnit).to(targetUnit ?? "best"))
        : value,
    }));
}

export function Analytics() {
  const { result: graphs } = useGetAllGraphs();
  return (
    <>
      <DateSelect />
      <Heading>Auswertung</Heading>
      <AddLayer />
      <List>
        {graphs.map((graph) => (
          <Row graph={graph} key={graph.id} />
        ))}
      </List>
    </>
  );
}

function AddLayer() {
  const [open, setOpen] = useAtom(addState);

  const handleClose = () => {
    setOpen(false);
  };

  const collection = useGetGraphsCollection();

  const persist = (data: Graph) => collection?.insert({ ...data, id: uuid() });

  return (
    <>
      <AnalyticsDialog
        graph={{
          id: "",
          category: "",
          type: "line",
          name: "",
          config: "",
          range: "",
        }}
        handleClose={handleClose}
        persist={persist}
        open={open}
      />
    </>
  );
}

const validationSchema = Yup.object().shape({
  type: Yup.string().required("Pflichtfeld"),
  category: Yup.string().required("Pflichtfeld"),
});

function AnalyticsDialog({
  graph: { config, ...graph },
  handleClose,
  open,
  persist,
}: {
  graph: Graph;
  open: boolean;
  handleClose: () => void;
  persist: (data: Graph) => void;
}) {
  const initialValues = {
    ...graph,
    upperLimit: config?.upperLimit,
    lowerLimit: config?.lowerLimit,
  };
  initialValues.range = initialValues.range
    ? convert(Number.parseInt(initialValues.range), "seconds")
        .to("best")
        .toString()
    : "";

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogContent>
        <Formik
          onSubmit={(values) => {
            values.range = convertMany(values.range).to("seconds").toString();
            const config = {
              upperLimit: values.upperLimit,
              lowerLimit: values.lowerLimit,
            };
            delete values.upperLimit;
            delete values.lowerLimit;
            persist({ ...values, config });
            handleClose();
          }}
          initialValues={initialValues}
          validationSchema={validationSchema}
        >
          {(formik) => (
            <Form>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.name && Boolean(formik.errors.name)}
                  helperText={formik.touched.name && formik.errors.name}
                  label="Name"
                  name="name"
                />
                <FormControl fullWidth>
                  <InputLabel id="type-label">Typ</InputLabel>
                  <Select
                    labelId="type-label"
                    name="type"
                    label="Typ"
                    value={formik.values.type}
                    onChange={formik.handleChange}
                  >
                    {Object.entries(graphTypes).map(([value, label]) => (
                      <MenuItem key={value} value={value}>
                        {label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <AllCategorySelect />
                <TextField
                  fullWidth
                  value={formik.values.range}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.range && Boolean(formik.errors.range)}
                  helperText={formik.touched.range && formik.errors.range}
                  label="Standard-Dauer"
                  placeholder="7d, 1w"
                  name="range"
                />
                {formik.values.type !== "table" && (
                  <>
                    <TextField
                      fullWidth
                      value={formik.values.upperLimit}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.upperLimit &&
                        Boolean(formik.errors.upperLimit)
                      }
                      helperText={
                        formik.touched.upperLimit && formik.errors.upperLimit
                      }
                      label="Obergrenze"
                      name="upperLimit"
                    />
                    <TextField
                      fullWidth
                      value={formik.values.lowerLimit}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={
                        formik.touched.lowerLimit &&
                        Boolean(formik.errors.lowerLimit)
                      }
                      helperText={
                        formik.touched.lowerLimit && formik.errors.lowerLimit
                      }
                      label="Untergrenze"
                      name="lowerLimit"
                    />
                  </>
                )}
                <Button variant="outlined" fullWidth onClick={handleClose}>
                  Abbrechen
                </Button>
                <Button
                  color="primary"
                  variant="contained"
                  fullWidth
                  type="submit"
                >
                  Speichern
                </Button>
              </Stack>
            </Form>
          )}
        </Formik>
      </DialogContent>
    </Dialog>
  );
}

function Row({ graph }: { graph: RxDocument<Graph> }) {
  const [open, setOpen] = useState(false);
  const { openDeleteConfirm, ConfirmDelete } = useDeleteConfirm(graph);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };
  return (
    <>
      <ListItem key={graph.id}>
        <ListItemText>{graph.name}</ListItemText>
        <ListItemIcon onClick={handleClickOpen}>
          <Edit />
        </ListItemIcon>
        <ListItemIcon
          onClick={(e) => {
            e.stopPropagation();
            openDeleteConfirm();
          }}
        >
          <Delete />
        </ListItemIcon>
      </ListItem>
      <Graphs graph={graph} />
      <AnalyticsDialog
        graph={graph.toMutableJSON()}
        handleClose={handleClose}
        open={open}
        persist={(data) => graph.patch(data)}
      />
      <ConfirmDelete />
    </>
  );
}

function Graphs({ graph }: { graph: Graph }) {
  switch (graph.type) {
    case "line":
      return <LineGraph graph={graph} />;
    case "bar":
      return <BarGraph graph={graph} />;
    case "table":
      return <TableGraph graph={graph} />;
  }
}

function LineGraph({ graph }: { graph: Graph }) {
  const category = useGetCategory(graph.category);
  const to = useAtomValue(selectedDate);
  const fromDate = dayjs(to).subtract(Number.parseInt(graph.range), "seconds");
  const toDate = dayjs(to).endOf("day");

  const data = useGetEventsForDateAndCategory(
    fromDate.valueOf(),
    toDate.valueOf(),
    category
  );
  if (!category) {
    return "";
  }
  const series: LineSeries[] = [{ dataKey: "y" }];
  const isAccumulative = category.type === "valueAccumulative";

  // Determine target unit from limits (if set) for consistent units
  let targetUnit: Unit | undefined;
  if (graph.config?.upperLimit) {
    targetUnit = convertMany(graph.config.upperLimit.replace(",", ".")).to(
      "best"
    ).unit;
  } else if (graph.config?.lowerLimit) {
    targetUnit = convertMany(graph.config.lowerLimit.replace(",", ".")).to(
      "best"
    ).unit;
  }

  // Branch based on category type
  const dataSet = isAccumulative
    ? aggregateEventsByDay(data, fromDate, toDate, category, targetUnit)
    : data.map((event) => {
        try {
          return {
            x: dayjs(event.timestamp).toDate(),
            y: toQuantity(
              convertMany(event.data.replace(",", ".")).to(targetUnit ?? "best")
            ),
          };
        } catch (e) {
          return {
            x: dayjs(event.timestamp).toDate(),
            y: 0,
          };
        }
      });

  let colorMap: PiecewiseColorConfig | undefined = undefined;

  if (graph.config?.upperLimit) {
    const upperLimit = convertMany(
      graph.config?.upperLimit.replace(",", ".")
    ).to("best").quantity;
    series.push({
      data: new Array(dataSet.length).fill(upperLimit),
      showMark: false,
    });
    if (!colorMap) {
      colorMap = {
        type: "piecewise",
        thresholds: [upperLimit],
        colors: ["green", "red"],
      };
    }
  }

  if (graph.config?.lowerLimit) {
    const lowerLimit = toQuantity(
      convertMany(graph.config?.lowerLimit.replace(",", ".")).to(
        targetUnit ?? "best"
      )
    );
    series.push({
      data: new Array(dataSet.length).fill(lowerLimit),
      showMark: false,
    });
    if (!colorMap) {
      colorMap = {
        type: "piecewise",
        thresholds: [lowerLimit],
        colors: ["red", "green"],
      };
    } else {
      colorMap.thresholds.unshift(lowerLimit);
      colorMap.colors.unshift("orange");
    }
  }

  return (
    <LineChart
      dataset={dataSet}
      xAxis={[
        {
          dataKey: "x",
          scaleType: "time",
          valueFormatter: (date) =>
            isAccumulative
              ? dayjs(date).format("DD.MM.")
              : dayjs(date).format("HH:mm DD.MM."),
        },
      ]}
      yAxis={[
        {
          width: 60,
          colorMap,
        },
      ]}
      series={series}
      height={300}
    />
  );
}

function BarGraph({ graph }: { graph: Graph }) {
  return <></>;
}
