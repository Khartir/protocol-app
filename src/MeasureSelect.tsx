import { FormControl, InputLabel, MenuItem, Select, FormHelperText } from "@mui/material";
import { useFormikContext } from "formik";
import { Category, requiresMeasure } from "./category/category";

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

/**
 * Converts a value from a specified unit to the category's default storage unit.
 * @param category - Category with config specifying measure type
 * @param unit - Source unit (e.g., "l", "min", "kg")
 * @param value - Numeric value to convert
 * @returns Integer value in default unit (ml, s, or g)
 *
 * @example
 * toDefault(volumeCategory, "l", "2.5")  // → 2500 (ml)
 * toDefault(timeCategory, "min", "5")    // → 300 (seconds)
 */
export const toDefault = (category: Category, unit: Unit, value: string | Number) => {
  return Math.floor(convert(Number.parseInt(value.toString()), unit).to(getDefaultUnit(category)));
};

/**
 * Converts a stored value to the most readable unit for display.
 * Uses German decimal format (comma instead of period).
 * For time values, recursively decomposes into human-readable format (e.g., "1h 30min").
 *
 * @param category - Category with config specifying measure type
 * @param value - Value in default storage unit
 * @returns Formatted string with best unit (e.g., "2,5 l", "1h 30min")
 *
 * @example
 * toBest(volumeCategory, 2500)  // → "2.5 l" (or "2,5 l" in German)
 * toBest(timeCategory, 3661)    // → "1h 1min 1s"
 */
export const toBest = (category: Category, value: string | Number): string => {
  const intValue = Number.parseInt(value.toString());
  if (!category.config || isNaN(intValue)) {
    return "";
  }

  const unit = getDefaultUnit(category);

  const result = convert(intValue, unit).to("best");

  if ("s" !== unit) {
    // Round to avoid floating point errors, build string manually
    const rounded = Math.round(result.quantity * 1000) / 1000;
    return `${rounded} ${result.unit}`;
  }

  const whole = Math.floor(result.quantity);

  if (whole === result.quantity) {
    return result.toString().replace(".", ",");
  }

  result.quantity = whole;

  const remainder = intValue - toDefault(category, result.unit, whole);

  return whole + result.unit + " " + toBest(category, remainder);
};

/**
 * Returns the default storage unit for a category based on its config.
 * @param category - Category with config field
 * @returns Unit string: "ml" for volume, "s" for time, "g" for mass
 */
export const getDefaultUnit = (category: Category) => defaults[category.config];
