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
    data: {
      type: "string",
    },
  },
  required: ["id", "category", "timestamp", "data"],
} as const;

const schemaTyped = toTypedRxJsonSchema(eventSchema);

export type Event = ExtractDocumentTypeFromTypedRxJsonSchema<
  typeof schemaTyped
>;

export const useGetAllEvents = () => {
  return useRxData<Event>("events", (collection) => collection.find());
};

export const useGetEventsForDate = (from: number, to: number) => {
  return useRxData<Event>("events", (collection) =>
    collection.find({
      selector: {
        timestamp: {
          $gte: from,
          $lt: to,
        },
      },
      sort: [{ timestamp: "asc" }],
    })
  );
};

export const useGetEventsForDateAndCategory = (
  from: number,
  to: number,
  category: string
) => {
  return useRxData<Event>("events", (collection) =>
    collection.find({
      selector: {
        timestamp: {
          $gte: from,
          $lt: to,
        },
        category: {
          $eq: category,
        },
      },
      sort: [{ timestamp: "asc" }],
    })
  );
};

export const useGetEventsCollection = () => useRxCollection<Event>("events");
