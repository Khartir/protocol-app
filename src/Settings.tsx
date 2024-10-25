import { Form, Formik } from "formik";
import {
  Category,
  categoryTypes,
  useGetAllCategories,
  useGetCategoriesCollection,
} from "./category/category";
import { v7 as uuid } from "uuid";
import {
  Button,
  Dialog,
  DialogContent,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
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

export function Settings() {
  const { result: categories } = useGetAllCategories();
  return (
    <>
      <Typography variant="h1" sx={{ textAlign: "center" }}>
        Einstellungen
      </Typography>
      <AddLayer />
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Icon</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Typ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((category) => (
              <Row category={category} key={category.id} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

function Row({ category }: { category: RxDocument<Category> }) {
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      <TableRow key={category.id} onClick={handleClickOpen}>
        <TableCell>{category.icon}</TableCell>
        <TableCell>{category.name}</TableCell>
        <TableCell>{categoryTypes[category.type]}</TableCell>
      </TableRow>
      <CategoriesDialog
        category={category.toMutableJSON()}
        handleClose={handleClose}
        open={open}
        persist={(data) => category.patch(data)}
      />
    </>
  );
}

function CategoriesDialog({
  category,
  handleClose,
  open,
  persist,
}: {
  category: Category;
  open: boolean;
  handleClose: () => void;
  persist: (data: Category) => void;
}) {
  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogContent>
        <Formik
          onSubmit={(values) => {
            persist(values);
            handleClose();
          }}
          initialValues={category}
        >
          {(formik) => (
            <Form>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  name="icon"
                  label="Icon"
                  value={formik.values.icon}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  // error={formik.touched.email && Boolean(formik.errors.email)}
                  // helperText={formik.touched.email && formik.errors.email}
                />
                <TextField
                  fullWidth
                  name="name"
                  label="Name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  // error={formik.touched.password && Boolean(formik.errors.password)}
                  // helperText={formik.touched.password && formik.errors.password}
                />
                <FormControl fullWidth>
                  <InputLabel id="category-label-type">Typ</InputLabel>

                  <Select
                    fullWidth
                    labelId="category-label-type"
                    name="type"
                    label="Typ"
                    value={formik.values.type}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                  >
                    {Object.entries(categoryTypes).map(([value, label]) => (
                      <MenuItem key={value} value={value}>
                        {label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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

  const collection = useGetCategoriesCollection();

  const persist = (data: Category) =>
    collection?.insert({ ...data, id: uuid() });

  return (
    <>
      <CategoriesDialog
        category={{ name: "", type: "simple", id: "", icon: "" }}
        handleClose={handleClose}
        persist={persist}
        open={open}
      />
    </>
  );
}
