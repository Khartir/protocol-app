import { requriesInput, useGetCategory } from "./category/category";
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
} from "@mui/material";
import {
  Event,
  useGetEventsCollection,
  useGetEventsForDate,
} from "./category/event";
import { useState } from "react";
import { RxDocument } from "rxdb";
import { v7 as uuid } from "uuid";
import { Form, Formik } from "formik";
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
import { ValueInput } from "./Targets";

export const selectedDate = atom(
  dayjs().hour(0).minute(0).second(0).millisecond(0).valueOf()
);

export function Home() {
  return (
    <>
      <DateSelect />
      <Typography variant="h2" align="center">
        Ziele
      </Typography>
      <Targets />
      <Divider />
      <Typography variant="h2" align="center">
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
      <TableContainer component={Paper}>
        <Table>
          <TableBody>
            {events.map((event) => (
              <Row event={event} key={event.id} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
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
  return (
    <>
      <TableRow key={event.id} onClick={handleClickOpen}>
        <TableCell>{category?.icon}</TableCell>
        <TableCell>{dayjs(event.timestamp).format()}</TableCell>
        <TableCell onClick={() => event.remove()}>
          <Delete />
        </TableCell>
      </TableRow>
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
  if (
    dayjs().hour(0).minute(0).second(0).millisecond(0).isBefore(dayjs(date))
  ) {
    return <AlertDialog open={open} handleClose={handleClose}></AlertDialog>;
  }
  const initialValues = {
    ...event,
    timestamp: dayjs(event.timestamp),
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogContent>
        <Formik
          onSubmit={(values) => {
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
    <DatePicker
      value={dayjs(date)}
      onAccept={(value) => {
        if (value) {
          setDate(value.valueOf());
        }
      }}
      slotProps={{
        shortcuts: {
          items: [
            {
              label: "Heute",
              getValue: () => {
                return dayjs().hour(0).minute(0).second(0).millisecond(0);
              },
            },
          ],
        },
      }}
    />
  );
}

function Targets() {
  const date = useAtomValue(selectedDate);
  const targets = useGetTargetsForDate(
    date,
    dayjs(date).add(1, "day").valueOf()
  );
  return (
    <TableContainer component={Paper}>
      <Table>
        <TableBody>
          {targets.map((target) => (
            <TargetRow target={target} key={target.id} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
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
      <TableRow key={target.id} onClick={handleClick}>
        <TableCell>
          <CircularProgressWithLabel
            variant="determinate"
            value={useGetTargetStatus(target)}
            label={category?.icon}
          />
        </TableCell>
        <TableCell>
          {target.name}
          <br />
          TODO: Status in Schrift
        </TableCell>
      </TableRow>

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
