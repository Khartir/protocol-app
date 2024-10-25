import { useGetAllCategories, useGetCategory } from "./category/category";
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
} from "@mui/material";
import {
  Event,
  useGetAllEvents,
  useGetEventsCollection,
} from "./category/event";
import { useState } from "react";
import { RxDocument } from "rxdb";
import { v7 as uuid } from "uuid";
import { useFormik } from "formik";
import { useAtom } from "jotai";
import { addState } from "./Menu";
export function Home() {
  return <Events />;
}

function Events() {
  const { result: events } = useGetAllEvents();
  return (
    <>
      <AddLayer />
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Icon</TableCell>
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
      </TableRow>
      {/* <CategoriesDialog
        category={category.toMutableJSON()}
        handleClose={handleClose}
        open={open}
        persist={(data) => category.patch(data)}
      /> */}
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
      timestamp: new Date().toISOString(),
    });

  return (
    <>
      <EventsDialog
        event={{ category: "", id: "", timestamp: "" }}
        handleClose={handleClose}
        persist={persist}
        open={open}
      />
    </>
  );
}

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
  const formik = useFormik({
    initialValues: event,
    onSubmit: (values) => {
      persist(values);
      handleClose();
    },
  });

  const { result: categories } = useGetAllCategories();

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogContent>
        <form onSubmit={formik.handleSubmit}>
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
              >
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="outlined" fullWidth onClick={handleClose}>
              Abbrechen
            </Button>
            <Button color="primary" variant="contained" fullWidth type="submit">
              Speichern
            </Button>
          </Stack>
        </form>
      </DialogContent>
    </Dialog>
  );
}
