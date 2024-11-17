import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  FormHelperText,
} from "@mui/material";
import { useFormikContext } from "formik";
import { Category, requriesValue, useGetCategory } from "./category/category";
import { Event } from "./category/event";
import { Target } from "./category/target";

import convert, { Unit } from "convert";

const measures = {
  volume: "Volumen",
  time: "Zeit",
  mass: "Masse",
};

const units = {
  volume: ["ml", "l"],
  time: ["s", "min", "h"],
  mass: ["g", "kg"],
};

const defaults = {
  volume: "ml",
  time: "s",
  mass: "g",
};

export const MeasureSelect = () => {
  const formik = useFormikContext<Category>();
  if (!requriesValue(formik.values.type)) {
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

export const UnitSelect = () => {
  const formik = useFormikContext<
    (Event | Target) & {
      unit: string;
    }
  >();
  const category = useGetCategory(formik.values.category);

  return (
    <FormControl fullWidth>
      <InputLabel id="category-label-unit">Einheit</InputLabel>

      <Select
        fullWidth
        labelId="category-label-unit"
        name="unit"
        label="Einheit"
        value={formik.values.unit}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.unit && Boolean(formik.errors.unit)}
      >
        {units[category?.config]?.map((value) => (
          <MenuItem key={value} value={value}>
            {value}
          </MenuItem>
        ))}
      </Select>
      {formik.touched.unit && formik.errors.unit && (
        <FormHelperText error>{formik.errors.unit}</FormHelperText>
      )}
    </FormControl>
  );
};

export const toDefault = (measure: string, unit: Unit, value: string) => {
  return Math.floor(
    convert(Number.parseInt(value), unit).to(getDefaultUnit(measure))
  );
};

export const getDefaultUnit = (measure: string) => defaults[measure];
