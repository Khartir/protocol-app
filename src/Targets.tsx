import { Form, Formik, useFormikContext } from "formik";
import { v7 as uuid } from "uuid";
import {
  Button,
  Dialog,
  DialogContent,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { RxDocument } from "rxdb";
import { useAtom } from "jotai";
import { addState } from "./Menu";
import * as Yup from "yup";
import {
  Target,
  useGetAllTargets,
  useGetTargetsCollection,
} from "./category/target";
import { CategorySelect } from "./category/CategorySelect";
import { RRuleBuilder } from "react-rrule-builder-ts";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

import utc from "dayjs/plugin/utc";
import { Delete } from "@mui/icons-material";
import { useGetCategory, useGetAllCategories } from "./category/category";
import { toDefault, UnitSelect } from "./UnitSelect";

dayjs.extend(utc);

export function Targets() {
  const { result: targets } = useGetAllTargets();
  return (
    <>
      <Typography variant="h2" sx={{ textAlign: "center" }}>
        Ziele
      </Typography>
      <AddLayer />
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Beschreibung</TableCell>
              <TableCell>Löschen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {targets.map((target) => (
              <Row target={target} key={target.id} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

function Row({ target }: { target: RxDocument<Target> }) {
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <TableRow key={target.id} onClick={handleClickOpen}>
        <TableCell>{target.name}</TableCell>
        <TableCell onClick={() => target.remove()}>
          <Delete />
        </TableCell>
      </TableRow>
      <TargetsDialog
        target={target.toMutableJSON()}
        handleClose={handleClose}
        open={open}
        persist={(data) => target.patch(data)}
      />
    </>
  );
}

const validationSchema = Yup.object().shape({
  name: Yup.string().required("Pflichtfeld"),
  category: Yup.string().required("Pflichtfeld"),
  schedule: Yup.string().required("Pflichtfeld"),
  config: Yup.string(),
});

function TargetsDialog({
  target,
  handleClose,
  open,
  persist,
}: {
  target: Target;
  open: boolean;
  handleClose: () => void;
  persist: (data: Target) => void;
}) {
  const extended = {
    ...target,
    unit: "", // set saved value
  };
  const { result: categories } = useGetAllCategories();
  /*
  TODO:
  xmal in der Woche

  */
  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogContent>
        <Formik
          onSubmit={(values) => {
            const category = categories.filter(
              (category) => category.id === values.category
            )[0];
            if (category.type === "valueAccumulative") {
              values.config = toDefault(
                category.config,
                values.unit,
                values.config
              );
            }
            persist(values);
            handleClose();
          }}
          initialValues={extended}
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
                <CategorySelect />
                <RRuleBuilder
                  dateAdapter={AdapterDayjs}
                  datePickerInitialDate={dayjs()
                    .utc()
                    .hour(0)
                    .minute(0)
                    .second(0)
                    .millisecond(0)}
                  rruleString={formik.values.schedule}
                  onChange={(value) => formik.setFieldValue("schedule", value)}
                />
                <ValueInput name="config" />
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

function AddLayer() {
  const [open, setOpen] = useAtom(addState);

  const handleClose = () => {
    setOpen(false);
  };

  const collection = useGetTargetsCollection();

  const persist = (data: Target) => collection?.insert({ ...data, id: uuid() });

  return (
    <>
      <TargetsDialog
        target={{ name: "", category: "", id: "", schedule: "", config: "" }}
        handleClose={handleClose}
        persist={persist}
        open={open}
      />
    </>
  );
}

function ValueInput({ name }: { name: string }) {
  const formik = useFormikContext<{ [name: string]: string }>();
  const category = useGetCategory(formik.values.category);
  if (!category || category.type !== "valueAccumulative") {
    return <></>;
  }

  // todo handle float, text
  return (
    <>
      <TextField
        fullWidth
        name={name}
        label="Wert"
        value={formik.values[name]}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched[name] && Boolean(formik.errors[name])}
        helperText={formik.touched[name] && formik.errors[name]}
      />
      <UnitSelect />
    </>
  );
}
