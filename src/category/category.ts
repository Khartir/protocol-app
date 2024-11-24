import {
  ExtractDocumentTypeFromTypedRxJsonSchema,
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

export const categorySchema = {
  version: 0,
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
  },
  required: ["id", "name", "type", "config"],
} as const;

const schemaTyped = toTypedRxJsonSchema(categorySchema);

export type Category = ExtractDocumentTypeFromTypedRxJsonSchema<
  typeof schemaTyped
>;

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

export const requriesInput = (type: string) => !["todo"].includes(type);
export const requriesMeasure = (type: string) =>
  !["todo", "protocol"].includes(type);
