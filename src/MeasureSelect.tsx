import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  FormHelperText,
} from "@mui/material";
import { useFormikContext } from "formik";
import { Category, requriesMeasure } from "./category/category";

import convert, { Unit } from "convert";

const measures = {
  volume: "Volumen",
  time: "Zeit",
  mass: "Masse",
};

const defaults = {
  volume: "ml",
  time: "s",
  mass: "g",
};

export const MeasureSelect = () => {
  const formik = useFormikContext<Category>();
  if (!requriesMeasure(formik.values.type)) {
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

export const toDefault = (
  category: Category,
  unit: Unit,
  value: string | Number
) => {
  return Math.floor(
    convert(Number.parseInt(value.toString()), unit).to(
      getDefaultUnit(category)
    )
  );
};

export const toBest = (category: Category, value: string | Number): string => {
  const intValue = Number.parseInt(value.toString());
  if (!category.config || isNaN(intValue)) {
    return "";
  }

  const unit = getDefaultUnit(category);

  const result = convert(intValue, unit).to("best");

  if ("s" !== unit) {
    return result.toString();
  }

  const whole = Math.floor(result.quantity);

  if (whole === result.quantity) {
    return result.toString().replace(".", ",");
  }

  result.quantity = whole;

  const remainder = intValue - toDefault(category, result.unit, whole);

  return whole + result.unit + " " + toBest(category, remainder);
};

export const getDefaultUnit = (category: Category) => defaults[category.config];
