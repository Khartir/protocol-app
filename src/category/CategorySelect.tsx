import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  FormHelperText,
} from "@mui/material";
import { useFormikContext } from "formik";
import { useGetAllCategories } from "./category";
export function CategorySelect() {
  const formik = useFormikContext<{ category: string }>();
  const { result: categories } = useGetAllCategories();
  return (
    <FormControl fullWidth>
      <InputLabel id="category-label-type">Typ</InputLabel>
      <Select
        fullWidth
        labelId="category-label-type"
        name="category"
        label="Kategorie"
        value={formik.values.category}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.category && Boolean(formik.errors.category)}
      >
        {categories.map((category) => (
          <MenuItem key={category.id} value={category.id}>
            {category.icon} {category.name}
          </MenuItem>
        ))}
      </Select>
      {formik.touched.category && formik.errors.category && (
        <FormHelperText error>{formik.errors.category}</FormHelperText>
      )}
    </FormControl>
  );
}
