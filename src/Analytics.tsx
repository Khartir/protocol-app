import { Heading } from "./styling/Heading";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Dialog,
  DialogContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import { DragIndicator, ExpandMore } from "@mui/icons-material";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import * as Yup from "yup";
import { AllCategorySelect } from "./category/CategorySelect";
import { Form, Formik, useFormikContext } from "formik";

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
import { durationSchema, validateMeasurement } from "./measurementValidation";
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

  // If no target unit is set, determine it based on the maximum value
  let effectiveTargetUnit = targetUnit;
  if (!effectiveTargetUnit && defaultUnit) {
    const maxValue = Math.max(...Array.from(dailyTotals.values()));
    if (maxValue > 0) {
      effectiveTargetUnit = convert(maxValue, defaultUnit).to("best").unit;
    }
  }

  return Array.from(dailyTotals.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, value]) => ({
      x: dayjs(dateKey).toDate(),
      y: defaultUnit
        ? toQuantity(convert(value, defaultUnit).to(effectiveTargetUnit ?? "best"))
        : value,
    }));
}

function arrayMove<T>(array: T[], from: number, to: number): T[] {
  const newArray = array.slice();
  const [removed] = newArray.splice(from, 1);
  newArray.splice(to, 0, removed);
  return newArray;
}

export function Analytics() {
  const { result: graphs } = useGetAllGraphs();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = graphs.findIndex((g) => g.id === active.id);
    const newIndex = graphs.findIndex((g) => g.id === over.id);

    const reorderedGraphs = arrayMove(graphs, oldIndex, newIndex);

    await Promise.all(
      reorderedGraphs.map((graph, index) => graph.patch({ order: index }))
    );
  };

  return (
    <>
      <DateSelect />
      <Heading>Auswertung</Heading>
      <AddLayer />
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={graphs.map((g) => g.id)}
          strategy={verticalListSortingStrategy}
        >
          {graphs.map((graph) => (
            <SortableAccordionRow graph={graph} key={graph.id} />
          ))}
        </SortableContext>
      </DndContext>
    </>
  );
}

function AddLayer() {
  const [open, setOpen] = useAtom(addState);
  const { result: graphs } = useGetAllGraphs();

  const handleClose = () => {
    setOpen(false);
  };

  const collection = useGetGraphsCollection();

  const persist = (data: Graph) => {
    const maxOrder =
      graphs.length > 0 ? Math.max(...graphs.map((g) => g.order ?? 0)) + 1 : 0;
    collection?.insert({ ...data, id: uuid(), order: maxOrder });
  };

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
          order: 0,
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
  range: durationSchema().required("Pflichtfeld"),
});

function LimitInput({ name, label }: { name: string; label: string }) {
  const formik = useFormikContext<{ [key: string]: string }>();
  const category = useGetCategory(formik.values.category);

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    formik.handleBlur(e);

    if (formik.values[name]) {
      const result = validateMeasurement(formik.values[name], category?.config);
      if (result !== true) {
        setTimeout(() => formik.setFieldError(name, result), 0);
      }
    }
  };

  return (
    <TextField
      fullWidth
      value={formik.values[name]}
      onChange={formik.handleChange}
      onBlur={handleBlur}
      error={formik.touched[name] && Boolean(formik.errors[name])}
      helperText={formik.touched[name] && formik.errors[name]}
      label={label}
      name={name}
    />
  );
}

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
            if (values.range) {
              values.range = convertMany(values.range.replace(",", "."))
                .to("seconds")
                .toString();
            }
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
                  placeholder="7d"
                  name="range"
                />
                {formik.values.type !== "table" && (
                  <>
                    <LimitInput name="upperLimit" label="Obergrenze" />
                    <LimitInput name="lowerLimit" label="Untergrenze" />
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

function SortableAccordionRow({ graph }: { graph: RxDocument<Graph> }) {
  const [open, setOpen] = useState(false);
  const { openDeleteConfirm, ConfirmDelete } = useDeleteConfirm(graph);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: graph.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : ("auto" as const),
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Accordion defaultExpanded={false}>
        <AccordionSummary
          expandIcon={<ExpandMore />}
          sx={{
            "& .MuiAccordionSummary-content": {
              alignItems: "center",
            },
          }}
        >
          <Box
            component="span"
            {...attributes}
            {...listeners}
            sx={{
              cursor: "grab",
              touchAction: "none",
              mr: 1,
              display: "flex",
              alignItems: "center",
              p: 0.5,
              borderRadius: 1,
              "&:hover": { bgcolor: "action.hover" },
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <DragIndicator fontSize="small" />
          </Box>
          <Box sx={{ flex: 1 }}>{graph.name}</Box>
          <Box
            component="span"
            sx={{
              display: "flex",
              alignItems: "center",
              p: 0.5,
              borderRadius: 1,
              "&:hover": { bgcolor: "action.hover" },
            }}
            onClick={(e) => {
              e.stopPropagation();
              handleClickOpen();
            }}
          >
            <Edit fontSize="small" />
          </Box>
          <Box
            component="span"
            sx={{
              display: "flex",
              alignItems: "center",
              p: 0.5,
              borderRadius: 1,
              "&:hover": { bgcolor: "action.hover" },
            }}
            onClick={(e) => {
              e.stopPropagation();
              openDeleteConfirm();
            }}
          >
            <Delete fontSize="small" />
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Graphs graph={graph} />
        </AccordionDetails>
      </Accordion>
      <AnalyticsDialog
        graph={graph.toMutableJSON()}
        handleClose={handleClose}
        open={open}
        persist={(data) => graph.patch(data)}
      />
      <ConfirmDelete />
    </div>
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
  let dataSet: { x: Date; y: number }[];
  if (isAccumulative) {
    dataSet = aggregateEventsByDay(data, fromDate, toDate, category, targetUnit);
  } else {
    // For non-accumulative values: consistent unit based on maximum
    let effectiveTargetUnit = targetUnit;
    if (!effectiveTargetUnit && data.length > 0) {
      try {
        // Convert all values to base unit (e.g. seconds), find max, determine best unit
        const defaultUnit = getDefaultUnit(category);
        if (defaultUnit) {
          const baseValues = data.map((e) => {
            try {
              return convertMany(e.data.replace(",", ".")).to(defaultUnit);
            } catch {
              return 0;
            }
          });
          const maxBaseValue = Math.max(...baseValues);
          if (maxBaseValue > 0) {
            effectiveTargetUnit = convert(maxBaseValue, defaultUnit).to("best").unit;
          }
        }
      } catch {
        // Fallback on parse errors
      }
    }

    dataSet = data.map((event) => {
      try {
        return {
          x: dayjs(event.timestamp).toDate(),
          y: toQuantity(
            convertMany(event.data.replace(",", ".")).to(effectiveTargetUnit ?? "best")
          ),
        };
      } catch {
        return {
          x: dayjs(event.timestamp).toDate(),
          y: 0,
        };
      }
    });
  }

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
