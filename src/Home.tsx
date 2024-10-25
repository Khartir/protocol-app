import { useGetCategory } from "./category/category";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogContent,
  Stack,
  CircularProgress,
  CircularProgressProps,
  Box,
  Divider,
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

export const selectedDate = atom(
  dayjs().hour(0).minute(0).second(0).millisecond(0).valueOf()
);

export function Home() {
  return (
    <>
      <DateSelect />
      <Targets />
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
        event={{ category: "", id: "", timestamp: Date.now() }}
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

  const createEvent = () =>
    collection?.insert({
      category: target.category,
      timestamp: Date.now(),
      id: uuid(),
    });

  return (
    <>
      <TableRow key={target.id} onClick={createEvent}>
        <TableCell>
          <CircularProgressWithLabel
            variant="determinate"
            value={useGetTargetStatus(target)}
            label={category?.icon}
          />
        </TableCell>
      </TableRow>
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
