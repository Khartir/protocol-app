import { Form, Formik, useFormikContext } from "formik";
import {
  Category,
  categoryTypes,
  useGetAllCategories,
  useGetCategoriesCollection,
  useGetPossibleChildren,
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
  FormHelperText,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  styled,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { useState } from "react";
import { RxDocument } from "rxdb";
import { useAtom } from "jotai";
import * as Yup from "yup";
import { MeasureSelect } from "./MeasureSelect";
import { Heading } from "./styling/Heading";
import { addState } from "./app/Menu";
import { Database } from "./database/setup";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import FileUploadIcon from "@mui/icons-material/FileUpload";
import { CategorySelect } from "./category/CategorySelect";
import { useRxDB } from "rxdb-hooks";

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

export function Settings() {
  const { result: categories } = useGetAllCategories();
  const db = useRxDB();
  return (
    <>
      <Heading>Kategorien</Heading>
      <AddLayer />
      <List>
        {categories.map((category) => (
          <Row category={category} key={category.id} />
        ))}
      </List>
      <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={() => download(db)}>
        Backup erstellen
      </Button>
      <Button
        component="label"
        role={undefined}
        variant="contained"
        tabIndex={-1}
        startIcon={<FileUploadIcon />}
      >
        Backup einspielen
        <VisuallyHiddenInput
          type="file"
          accept="application/json"
          onChange={(event) => upload(db, event.target.files)}
          multiple
        />
      </Button>
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
                {formik.values.type === "valueAccumulative" && (
                  <FormControlLabel
                    control={
                      <Checkbox
                        name="inverted"
                        onChange={(e) => {
                          formik.setFieldValue("inverted", e.target.checked);
                        }}
                        checked={formik.values.inverted ?? false}
                        onBlur={formik.handleBlur}
                      />
                    }
                    label="Als Obergrenze"
                  />
                )}
                <MeasureSelect />
                <ChildrenSelectWrapper />
                <Button variant="outlined" fullWidth onClick={handleClose}>
                  Abbrechen
                </Button>
                <Button color="primary" variant="contained" fullWidth type="submit">
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

function ChildrenSelectWrapper() {
  const { values } = useFormikContext<Category>();
  if (!values.type || !values.config) {
    return "";
  }

  return <ChildrenSelect />;
}

function ChildrenSelect() {
  const { values } = useFormikContext<Category>();

  const categories = useGetPossibleChildren(values.type, values.config, values.id);

  if (0 === categories.length) {
    return "";
  }

  return <CategorySelect categories={categories} name="children" multiple={true} />;
}

function AddLayer() {
  const [open, setOpen] = useAtom(addState);

  const handleClose = () => {
    setOpen(false);
  };

  const collection = useGetCategoriesCollection();

  const persist = (data: Category) => collection?.insert({ ...data, id: uuid() });

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

const download = async (db: Database | undefined) => {
  if (!db) {
    return;
  }

  const data = await db.exportJSON();
  const file = new File([JSON.stringify(data)], "backup.json", {
    type: "application/json",
  });
  const exportUrl = URL.createObjectURL(file);
  const element = document.createElement("a");
  element.setAttribute("href", exportUrl);
  element.setAttribute("download", file.name);

  element.style.display = "none";
  document.body.appendChild(element);

  element.click();
  URL.revokeObjectURL(exportUrl);

  document.body.removeChild(element);
};

const upload = async (db: Database | undefined, files: FileList | null) => {
  if (!db || !files) {
    return;
  }
  const data = await files.item(0)?.text();
  if (!data) {
    console.error("empty data");
    return;
  }
  await db.importJSON(JSON.parse(data));
};
