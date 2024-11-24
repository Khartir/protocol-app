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
  Select,
  Stack,
  TextField,
  Typography,
  FormHelperText,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { useState } from "react";
import { RxDocument } from "rxdb";
import { useAtom } from "jotai";
import { addState } from "./Menu";
import * as Yup from "yup";
import { MeasureSelect } from "./UnitSelect";

export function Settings() {
  const { result: categories } = useGetAllCategories();
  return (
    <>
      <Typography variant="h4" sx={{ textAlign: "center" }}>
        Kategorien
      </Typography>
      <AddLayer />
      <List>
        {categories.map((category) => (
          <Row category={category} key={category.id} />
        ))}
      </List>
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
      <ListItem key={category.id}>
        <ListItemButton onClick={handleClickOpen}>
          <ListItemIcon>{category.icon}</ListItemIcon>
          <ListItemText primary={category.name} />
          {/* add delete */}
        </ListItemButton>
      </ListItem>
      <CategoriesDialog
        category={category.toMutableJSON()}
        handleClose={handleClose}
        open={open}
        persist={(data) => category.patch(data)}
      />
    </>
  );
}

const validationSchema = Yup.object().shape({
  icon: Yup.string().required("Pflichtfeld"),
  name: Yup.string().required("Pflichtfeld"),
  type: Yup.string().required("Pflichtfeld"),
});

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
          validationSchema={validationSchema}
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
                  error={formik.touched.icon && Boolean(formik.errors.icon)}
                  helperText={formik.touched.icon && formik.errors.icon}
                />
                <TextField
                  fullWidth
                  name="name"
                  label="Name"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.name && Boolean(formik.errors.name)}
                  helperText={formik.touched.name && formik.errors.name}
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
                    error={formik.touched.type && Boolean(formik.errors.type)}
                  >
                    {Object.entries(categoryTypes).map(([value, label]) => (
                      <MenuItem key={value} value={value}>
                        {label}
                      </MenuItem>
                    ))}
                  </Select>
                  {formik.touched.type && formik.errors.type && (
                    <FormHelperText error>{formik.errors.type}</FormHelperText>
                  )}
                </FormControl>
                <MeasureSelect />
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
        category={{ name: "", type: "todo", id: "", icon: "", config: "" }}
        handleClose={handleClose}
        persist={persist}
        open={open}
      />
    </>
  );
}
