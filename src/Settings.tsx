import { useFormik } from "formik";
import { PrimitiveAtom, useAtom, useAtomValue, useSetAtom } from "jotai";
import {
  categoriesAtom,
  categoriesAtomSplit,
  Category,
  categoryTypes,
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
import { Add } from "@mui/icons-material";

const rows: any[] = [];

export function Settings() {
  const categories = useAtomValue(categoriesAtomSplit);
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
              <Row category={category} key={category.toString()} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}

function Row({ category }: { category: PrimitiveAtom<Category> }) {
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };
  const [item, setCategory] = useAtom(category);
  return (
    <>
      <TableRow key={item.id} onClick={handleClickOpen}>
        <TableCell>{item.icon}</TableCell>
        <TableCell>{item.name}</TableCell>
        <TableCell>{categoryTypes[item.type]}</TableCell>
      </TableRow>
      <CategoriesDialog
        category={item}
        handleClose={handleClose}
        setCategory={setCategory}
        open={open}
      />
    </>
  );
}

function CategoriesDialog({
  category,
  handleClose,
  setCategory,
  open,
}: {
  category: Category;
  open: boolean;
  setCategory: (category: Category) => void;
  handleClose: () => void;
}) {
  const formik = useFormik({
    initialValues: category,
    onSubmit: (values) => {
      setCategory({ ...values, id: uuid() });
      handleClose();
    },
  });

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogContent>
        <form onSubmit={formik.handleSubmit}>
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
            <Button color="primary" variant="contained" fullWidth type="submit">
              Speichern
            </Button>
          </Stack>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AddLayer() {
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };
  const setCategories = useSetAtom(categoriesAtom);
  const setCategory = (category: Category) => {
    setCategories((prev) => [...prev, category]);
  };
  return (
    <>
      <Button variant="contained" color="primary" onClick={handleClickOpen}>
        <Add />
      </Button>
      <CategoriesDialog
        category={{ name: "", type: "simple", id: "", icon: "" }}
        handleClose={handleClose}
        setCategory={setCategory}
        open={open}
      />
    </>
  );
}
