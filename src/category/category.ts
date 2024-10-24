import {
  ExtractDocumentTypeFromTypedRxJsonSchema,
  toTypedRxJsonSchema,
} from "rxdb";
import { useRxCollection, useRxData } from "rxdb-hooks";

export const categoryTypes = { simple: "Einfach" } as const;

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
      enum: ["simple"],
    },
  },
  required: ["id", "name", "type"],
} as const;

const schemaTyped = toTypedRxJsonSchema(categorySchema);

export type Category = ExtractDocumentTypeFromTypedRxJsonSchema<
  typeof schemaTyped
>;

export const useGetAllCategories = () => {
  return useRxData<Category>("categories", (collection) => collection.find());
};

export const useGetCategoriesCollection = () =>
  useRxCollection<Category>("categories");
