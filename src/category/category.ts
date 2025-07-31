import {
  ExtractDocumentTypeFromTypedRxJsonSchema,
  MangoQuerySelector,
  toTypedRxJsonSchema,
} from "rxdb";
import { useRxCollection, useRxData } from "rxdb-hooks";

export const categoryTypes = {
  // add count
  todo: "Aufgabe",
  value: "Mit einfachem Messwert",
  // add description/type
  valueAccumulative: "Mit summiertem Messwert",
  protocol: "Protokoll",
} as const;

const categorySchema = {
  version: 2,
  primaryKey: "id",
  type: "object",
  properties: {
    id: {
      type: "string",
      maxLength: 100,
    },
    name: {
      type: "string",
    },
    icon: {
      type: "string",
    },
    type: {
      type: "string",
      enum: ["todo", "value", "valueAccumulative", "protocol"],
    },
    config: {
      type: "string",
    },
    children: {
      type: "array",
      uniqueItems: true,
      items: { type: "string" },
    },
    inverted: {
      type: "boolean",
      default: false,
    },
  },
  required: ["id", "name", "type", "config"],
} as const;

const schemaTyped = toTypedRxJsonSchema(categorySchema);

export type Category = ExtractDocumentTypeFromTypedRxJsonSchema<
  typeof schemaTyped
>;

export const categoryCollection = {
  schema: categorySchema,
  migrationStrategies: {
    1: (old: Category) => old,
    2: (old: Category) => old,
  },
};

export const useGetAllCategories = () =>
  useRxData<Category>("categories", (collection) => collection.find());

export const useGetCategoriesCollection = () =>
  useRxCollection<Category>("categories");

export const useGetCategory = (id: string) => {
  const { result: categories } = useRxData<Category>(
    "categories",
    (collection) => collection.findOne({ selector: { id: { $eq: id } } })
  );
  return categories[0];
};

export const useGetCategories = (ids: string[]) => {
  const { result: categories } = useRxData<Category>(
    "categories",
    (collection) => collection.find({ selector: { id: { $in: ids } } })
  );
  return categories;
};

export const useGetPossibleChildren = (
  type: string,
  config: string,
  id: string | null
) => {
  const selector: MangoQuerySelector<Category> = {
    type: { $eq: type },
    config: { $eq: config },
  };
  if (id) {
    selector.id = { $ne: id };
  }
  const { result: categories } = useRxData<Category>(
    "categories",
    (collection) =>
      collection.find({
        selector,
      })
  );
  return categories;
};

export const requriesInput = (type: string) => !["todo"].includes(type);
export const requriesMeasure = (type: string) =>
  !["todo", "protocol"].includes(type);
