import {
  requriesInput,
  requriesMeasure,
  useGetCategory,
  useGetAllCategories,
} from "./category/category";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Button,
  Dialog,
  DialogContent,
  Stack,
  CircularProgress,
  CircularProgressProps,
  Box,
  Divider,
  Typography,
  Alert,
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
} from "@mui/material";
import {
  Event,
  useGetEventsCollection,
  useGetEventsForDate,
} from "./category/event";
import { useState } from "react";
import { RxDocument } from "rxdb";
import { v7 as uuid } from "uuid";
import { Form, Formik, useFormikContext } from "formik";
import { atom, useAtom, useAtomValue } from "jotai";
import { addState } from "./Menu";
import dayjs from "dayjs";
import * as Yup from "yup";
import { DatePicker } from "@mui/x-date-pickers";
import { CategorySelect } from "./category/CategorySelect";
import {
  Target,
  useGetTargetsForDate,
  useGetTargetStatus,
} from "./category/target";
import { Delete } from "@mui/icons-material";
import { getDefaultUnit, toBest } from "./UnitSelect";
import { convertMany } from "convert";

export const selectedDate = atom(
  dayjs().hour(0).minute(0).second(0).millisecond(0).valueOf()
);

export function Home() {
  return (
    <>
      <DateSelect />
      <Typography variant="h4" align="center">
        Ziele
      </Typography>
      <Targets />
      <Divider />
      <Typography variant="h4" align="center">
        Erledigt
      </Typography>
      <Events />
    </>
  );
}

function Events() {
  const date = useAtomValue(selectedDate);
  const { result: events } = useGetEventsForDate(
    date,
    dayjs(date).add(1, "day").valueOf()
  );
  return (
    <>
      <AddLayer />
      <List>
        {events.map((event) => (
          <Row event={event} key={event.id} />
        ))}
      </List>
    </>
  );
}

function Row({ event }: { event: RxDocument<Event> }) {
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const category = useGetCategory(event.category);

  let secondary = event.data;

  if (category?.type === "valueAccumulative") {
    secondary = category && toBest(category, event.data).replace(".", ",");
  }

  return (
    <>
      <ListItem key={event.id} disablePadding>
        <ListItemButton onClick={handleClickOpen}>
          <ListItemIcon>{category?.icon}</ListItemIcon>
          <ListItemText
            primary={dayjs(event.timestamp).format("HH:mm")}
            secondary={secondary}
          />
          <ListItemIcon
            onClick={(e) => {
              e.stopPropagation();
              event.remove();
            }}
          >
            <Delete />
          </ListItemIcon>
        </ListItemButton>
      </ListItem>
      <EventsDialog
        event={event.toMutableJSON()}
        handleClose={handleClose}
        open={open}
        persist={(data) => event.patch(data)}
      />
    </>
  );
}

function AddLayer() {
  const [open, setOpen] = useAtom(addState);

  const handleClose = () => {
    setOpen(false);
  };

  const collection = useGetEventsCollection();

  const persist = (data: Event) =>
    collection?.insert({
      ...data,
      id: uuid(),
    });

  return (
    <>
      <EventsDialog
        event={{ category: "", id: "", timestamp: Date.now(), data: "" }}
        handleClose={handleClose}
        persist={persist}
        open={open}
      />
    </>
  );
}

const validationSchema = Yup.object().shape({
  category: Yup.string().required("Pflichtfeld"),
});

function EventsDialog({
  event,
  handleClose,
  open,
  persist,
}: {
  event: Event;
  open: boolean;
  handleClose: () => void;
  persist: (data: Event) => void;
}) {
  const date = useAtomValue(selectedDate);
  const { result: categories } = useGetAllCategories();
  if (
    dayjs().hour(0).minute(0).second(0).millisecond(0).isBefore(dayjs(date))
  ) {
    return <AlertDialog open={open} handleClose={handleClose}></AlertDialog>;
  }
  const initialValues = {
    ...event,
    timestamp: dayjs(event.timestamp),
  };

  const category = useGetCategory(event.category);

  if (category?.type === "valueAccumulative") {
    initialValues.data = toBest(category, initialValues.data);
  }

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogContent>
        <Formik
          onSubmit={(values) => {
            const category = categories.filter(
              (category) => category.id === values.category
            )[0];
            if (category.type === "valueAccumulative") {
              values.data = convertMany(values.data.replace(",", ".")).to(
                getDefaultUnit(category)
              );
            }
            persist({ ...values, timestamp: values.timestamp.valueOf() });
            handleClose();
          }}
          initialValues={initialValues}
          validationSchema={validationSchema}
        >
          {(formik) => (
            <Form>
              <Stack spacing={2}>
                <CategorySelect />
                <DateTimePicker
                  label="Zeitpunkt"
                  value={dayjs(formik.values.timestamp)}
                  onChange={(value) => {
                    formik.setFieldValue("timestamp", value);
                  }}
                  slotProps={{
                    shortcuts: {
                      items: [
                        {
                          label: "Jetzt",
                          getValue: () => {
                            return dayjs();
                          },
                        },
                      ],
                    },
                  }}
                />
                <ValueInput name="data" />
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

function AlertDialog({
  open,
  handleClose,
}: {
  open: boolean;
  handleClose: () => void;
}) {
  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogContent>
        <Alert severity="warning">
          Ein Ziel in der Zukunft kann nicht erledigt werden.
        </Alert>
      </DialogContent>
    </Dialog>
  );
}

function DateSelect() {
  const [date, setDate] = useAtom(selectedDate);
  return (
    <>
      <DatePicker
        value={dayjs(date)}
        sx={{ width: "10rem" }}
        onAccept={(value) => {
          if (value) {
            setDate(value.valueOf());
          }
        }}
      />
      <Button
        variant="outlined"
        size="large"
        onClick={() =>
          setDate(dayjs().hour(0).minute(0).second(0).millisecond(0).valueOf())
        }
      >
        Heute
      </Button>
    </>
  );
}

function Targets() {
  const date = useAtomValue(selectedDate);
  const targets = useGetTargetsForDate(
    date,
    dayjs(date).add(1, "day").valueOf()
  );
  return (
    <List>
      {targets.map((target) => (
        <TargetRow target={target} key={target.id} />
      ))}
    </List>
  );
}

function TargetRow({ target }: { target: RxDocument<Target> }) {
  const category = useGetCategory(target.category);
  const collection = useGetEventsCollection();
  const [open, setOpen] = useState(false);
  const date = useAtomValue(selectedDate);
  const now = dayjs();

  const event = {
    category: target.category,
    timestamp: dayjs(date)
      .hour(now.hour())
      .minute(now.minute())
      .second(now.second())
      .valueOf(),
    id: uuid(),
    data: "",
  };

  const showDialog =
    dayjs().hour(0).minute(0).second(0).millisecond(0).isBefore(dayjs(date)) ||
    requriesInput(category?.type);

  const handleClick = () => {
    if (showDialog) {
      setOpen(true);
      return;
    }
    collection?.insert(event);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const persist = (data: Event) => collection?.insert(data);

  return (
    <>
      <ListItem key={target.id} disablePadding>
        <ListItemButton onClick={handleClick}>
          <ListItemIcon>
            <CircularProgressWithLabel
              variant="determinate"
              value={useGetTargetStatus(target)}
              label={category?.icon}
            />
          </ListItemIcon>
          <ListItemText primary={target.name} />
        </ListItemButton>
      </ListItem>

      {showDialog && (
        <EventsDialog
          event={event}
          handleClose={handleClose}
          open={open}
          persist={persist}
        />
      )}
    </>
  );
}

function CircularProgressWithLabel({
  label,
  ...props
}: CircularProgressProps & { value: number; label: string | undefined }) {
  return (
    <Box sx={{ position: "relative", display: "inline-flex" }}>
      <CircularProgress variant="determinate" {...props} />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: "absolute",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {label}
      </Box>
    </Box>
  );
}

function ValueInput({ name }: { name: string }) {
  const formik = useFormikContext<{ [name: string]: string }>();
  const category = useGetCategory(formik.values.category);
  if (!requriesInput(category?.type)) {
    return <></>;
  }

  return (
    <TextField
      fullWidth
      multiline
      name={name}
      label="Wert"
      value={formik.values[name]}
      onChange={formik.handleChange}
      onBlur={formik.handleBlur}
      error={formik.touched[name] && Boolean(formik.errors[name])}
      helperText={formik.touched[name] && formik.errors[name]}
    />
  );
}
