import {
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  FormHelperText,
} from "@mui/material";
import { useFormikContext } from "formik";
import { Category, useGetAllCategories } from "./category";

export function AllCategorySelect() {
  const { result: categories } = useGetAllCategories();
  return <CategorySelect categories={categories} name="category" />;
}

export function CategorySelect({
  categories,
  name,
  multiple,
}: {
  categories: Category[];
  name: string;
  multiple?: boolean;
}) {
  const formik = useFormikContext<{ [name: string]: string }>();
  const fallback = multiple ? [] : "";

  return (
    <FormControl fullWidth>
      <InputLabel id="category-label-type">Kategorie</InputLabel>
      <Select
        fullWidth
        labelId="category-label-type"
        name={name}
        label="Kategorie"
        value={formik.values[name] ?? fallback}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        error={formik.touched.category && Boolean(formik.errors.category)}
        multiple={multiple ?? false}
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
