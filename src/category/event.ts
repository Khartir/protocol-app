import {
  ExtractDocumentTypeFromTypedRxJsonSchema,
  MangoQuerySelector,
  toTypedRxJsonSchema,
} from "rxdb";
import { useRxCollection, useRxData } from "rxdb-hooks";
import { Category } from "./category";
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  category: Category | undefined
) => {
  const selector: MangoQuerySelector<Event> = {
    timestamp: {
      $gte: from,
      $lt: to,
    },
  };
  if (0 === (category?.children ?? []).length) {
    selector.category = {
      $eq: category?.id,
    };
  } else {
    selector.category = {
      $in: category?.children,
    };
  }
  const { result: events } = useRxData<Event>("events", (collection) =>
    collection.find({
      selector,
      sort: [{ timestamp: "asc" }],
    })
  );

  return events;
};

export const useGetEventsCollection = () => useRxCollection<Event>("events");
