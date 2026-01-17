import {
  useGetCategory,
  useGetAllCategories,
  requiresInput,
  requiresMeasure,
  Category,
  useGetCategories,
} from "../category/category";
import { validateMeasurement } from "../measurementValidation";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import {
  Button,
  Dialog,
  DialogContent,
  Stack,
  Alert,
  TextField,
} from "@mui/material";
import { Event } from "../category/event";
import { Form, Formik, useFormikContext } from "formik";
import { useAtomValue } from "jotai";
import dayjs from "dayjs";
import { AllCategorySelect, CategorySelect } from "../category/CategorySelect";
import { getDefaultUnit, toBest } from "../MeasureSelect";
import { convertMany } from "convert";
import { selectedDate } from "./Home";
import * as Yup from "yup";

const validationSchema = Yup.object().shape({
  category: Yup.string().required("Pflichtfeld"),
});

export function EventsDialog({
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
  const initialValues = {
    ...event,
    timestamp: dayjs(event.timestamp),
    childCategory: "",
  };

  const category = useGetCategory(event.category);

  if (
    dayjs().hour(0).minute(0).second(0).millisecond(0).isBefore(dayjs(date))
  ) {
    return <AlertDialog open={open} handleClose={handleClose}></AlertDialog>;
  }

  if (category?.type === "valueAccumulative") {
    initialValues.data = toBest(category, initialValues.data);
  }

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogContent>
        <Formik
          onSubmit={({ childCategory, ...values }) => {
            const category = categories.filter(
              (category) => category.id === values.category
            )[0];
            // Validierung vor Konvertierung
            if (requiresMeasure(category?.type) && values.data) {
              const result = validateMeasurement(values.data, category.config);
              if (result !== true) {
                return;
              }
            }
            if (category.type === "valueAccumulative") {
              values.data = convertMany(values.data.replace(",", "."))
                .to(getDefaultUnit(category))
                .toString();
            }
            if ((category.children ?? []).length > 0 && "" !== childCategory) {
              values.category = childCategory;
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
                <AllCategorySelect />
                <ChildCategorySelectWrapper />
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

function ValueInput({ name }: { name: string }) {
  const formik = useFormikContext<{ [name: string]: string }>();
  const category = useGetCategory(formik.values.category);
  if (!requiresInput(category?.type)) {
    return <></>;
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    formik.handleBlur(e);

    if (requiresMeasure(category?.type) && formik.values[name]) {
      const result = validateMeasurement(formik.values[name], category?.config);
      if (result !== true) {
        // setTimeout stellt sicher, dass setFieldError nach Formiks interner Validierung läuft
        setTimeout(() => formik.setFieldError(name, result), 0);
      }
    }
  };

  return (
    <TextField
      fullWidth
      multiline
      name={name}
      label="Wert"
      value={formik.values[name]}
      onChange={formik.handleChange}
      onBlur={handleBlur}
      error={formik.touched[name] && Boolean(formik.errors[name])}
      helperText={formik.touched[name] && formik.errors[name]}
    />
  );
}

function ChildCategorySelectWrapper() {
  const { values } = useFormikContext<Event>();
  const category = useGetCategory(values.category);
  if ((category?.children ?? []).length === 0) {
    return "";
  }
  return <ChildCategorySelect category={category} />;
}

function ChildCategorySelect({ category }: { category: Category }) {
  const categories = useGetCategories(category.children ?? []);
  return <CategorySelect categories={categories} name="childCategory" />;
}
