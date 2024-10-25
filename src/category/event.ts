import {
  ExtractDocumentTypeFromTypedRxJsonSchema,
  toTypedRxJsonSchema,
} from "rxdb";
import { useRxCollection, useRxData } from "rxdb-hooks";
export const eventSchema = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: {
      type: "string",
      maxLength: 100,
    },
    category: {
      type: "string",
    },
    timestamp: {
      type: "number",
    },
  },
  required: ["id", "category", "timestamp"],
} as const;

const schemaTyped = toTypedRxJsonSchema(eventSchema);

export type Event = ExtractDocumentTypeFromTypedRxJsonSchema<
  typeof schemaTyped
>;

export const useGetAllEvents = () => {
  return useRxData<Event>("events", (collection) => collection.find());
};

export const useGetEventsForDate = (date: number) => {
  return useRxData<Event>("events", (collection) =>
    collection.find({
      selector: {
        timestamp: {
          $gte: date,
        },
      },
      sort: [{ timestamp: "asc" }],
    })
  );
};

export const useGetEventsCollection = () => useRxCollection<Event>("events");
