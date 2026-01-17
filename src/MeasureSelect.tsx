import { FormControl, InputLabel, MenuItem, Select, FormHelperText } from "@mui/material";
import { useFormikContext } from "formik";
import { Category, requiresMeasure } from "./category/category";

const measures = {
  volume: "Volumen",
  time: "Zeit",
  mass: "Masse",
};

export const MeasureSelect = () => {
  const formik = useFormikContext<Category>();
  if (!requiresMeasure(formik.values.type)) {
    return <></>;
  }

  return (
    <FormControl fullWidth>
      <InputLabel id="category-label-measure">Größe</InputLabel>

      <Select
        fullWidth
        labelId="category-label-measure"
        name="config"
        label="Einheit"
        value={formik.values.config}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.config && Boolean(formik.errors.config)}
      >
        {Object.entries(measures).map(([value, label]) => (
          <MenuItem key={value} value={value}>
            {label}
          </MenuItem>
        ))}
      </Select>
      {formik.touched.config && formik.errors.config && (
        <FormHelperText error>{formik.errors.config}</FormHelperText>
      )}
    </FormControl>
  );
};
