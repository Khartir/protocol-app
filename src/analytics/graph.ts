import { ExtractDocumentTypeFromTypedRxJsonSchema, toTypedRxJsonSchema } from "rxdb";
import { useRxCollection, useRxData } from "rxdb-hooks";

/**
 * Graph type labels in German.
 * - bar: Bar chart visualization (placeholder)
 * - line: Line chart with time axis
 * - table: Tabular data display
 */
export const graphTypes = {
  bar: "Balken-Diagramm",
  line: "Linien-Diagramm",
  table: "Tabelle",
} as const;

/**
 * Aggregation mode labels in German.
 * - daily: Aggregate by day (default)
 * - weekly: Aggregate by week
 * - monthly: Aggregate by month
 * - custom: Aggregate by custom number of days
 */
export const aggregationModes = {
  daily: "Täglich",
  weekly: "Wöchentlich",
  monthly: "Monatlich",
  custom: "Benutzerdefiniert",
} as const;

const graphSchema = {
  version: 3,
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
      properties: {
        upperLimit: { type: "string" },
        lowerLimit: { type: "string" },
        aggregationMode: { type: "string" },
        aggregationDays: { type: "number" },
        weekStartDay: { type: "number" },
      },
    },
    order: {
      type: "number",
    },
  },
  required: ["id", "name", "type", "category", "range", "config", "order"],
} as const;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const schemaTyped = toTypedRxJsonSchema(graphSchema);

export type Graph = ExtractDocumentTypeFromTypedRxJsonSchema<typeof schemaTyped>;

/**
 * RxDB collection configuration for graphs.
 * Includes schema and migration strategies for version upgrades.
 */
export const graphCollection = {
  schema: graphSchema,
  migrationStrategies: {
    1: (oldDoc: Graph) => oldDoc,
    2: (oldDoc: Graph) => ({ ...oldDoc, order: oldDoc.order ?? 0 }),
    3: (oldDoc: Graph) => ({
      ...oldDoc,
      config: {
        ...oldDoc.config,
        aggregationMode: "daily",
        weekStartDay: 1,
      },
    }),
  },
};

/**
 * Returns all graphs from the database, sorted by order field.
 * @returns Reactive array of Graph documents
 */
export const useGetAllGraphs = () =>
  useRxData<Graph>("graphs", (collection) => collection.find().sort({ order: "asc" }));

/**
 * Returns the graphs RxDB collection for direct mutations.
 * @returns RxCollection for insert/patch/remove operations
 */
export const useGetGraphsCollection = () => useRxCollection<Graph>("graphs");

/**
 * Returns a single graph by ID.
 * @param id - Graph UUID
 * @returns Graph document or undefined
 */
export const useGetGraph = (id: string) => {
  const { result: categories } = useRxData<Graph>("graphs", (collection) =>
    collection.findOne({ selector: { id: { $eq: id } } })
  );
  return categories[0];
};
