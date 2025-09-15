import {
  ExtractDocumentTypeFromTypedRxJsonSchema,
  toTypedRxJsonSchema,
} from "rxdb";
import { useRxCollection, useRxData } from "rxdb-hooks";

export const graphTypes = {
  bar: "Balken-Diagramm",
  line: "linien-Diagramm",
} as const;

const graphSchema = {
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
    type: {
      type: "string",
      enum: Object.keys(graphTypes),
    },
    category: {
      type: "string",
    },
    range: {
      type: "string",
    },
    config: {
      type: "object",
    },
  },
  required: ["id", "name", "type", "category", "range", "config"],
} as const;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const schemaTyped = toTypedRxJsonSchema(graphSchema);

export type Graph = ExtractDocumentTypeFromTypedRxJsonSchema<
  typeof schemaTyped
>;

export const graphCollection = {
  schema: graphSchema,
  migrationStrategies: {},
};

export const useGetAllGraphs = () =>
  useRxData<Graph>("graphs", (collection) => collection.find());

export const useGetGraphsCollection = () => useRxCollection<Graph>("graphs");

export const useGetGraph = (id: string) => {
  const { result: categories } = useRxData<Graph>("graphs", (collection) =>
    collection.findOne({ selector: { id: { $eq: id } } })
  );
  return categories[0];
};
