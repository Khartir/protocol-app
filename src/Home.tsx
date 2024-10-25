import { useGetAllCategories, useGetCategory } from "./category/category";
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
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  FormHelperText,
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
import { useAtom } from "jotai";
import { addState } from "./Menu";
import dayjs from "dayjs";
import * as Yup from "yup";

export function Home() {
  return <Events />;
}

function Events() {
  const { result: events } = useGetEventsForDate(
    dayjs().hour(0).minute(0).second(0).millisecond(0).valueOf()
  );
  return (
    <>
      <AddLayer />
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Icon</TableCell>
              <TableCell>Zeitpunkt</TableCell>
            </TableRow>
          </TableHead>
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

  const { result: categories } = useGetAllCategories();

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
                <FormControl fullWidth>
                  <InputLabel id="category-label-type">Typ</InputLabel>
                  <Select
                    fullWidth
                    labelId="category-label-type"
                    name="category"
                    label="Kategorie"
                    value={formik.values.category}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={
                      formik.touched.category && Boolean(formik.errors.category)
                    }
                  >
                    {categories.map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {formik.touched.category && formik.errors.category && (
                    <FormHelperText>{formik.errors.category}</FormHelperText>
                  )}
                </FormControl>
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
