import {
  ExtractDocumentTypeFromTypedRxJsonSchema,
  MangoQuerySelector,
  toTypedRxJsonSchema,
} from "rxdb";
import { useRxCollection, useRxData } from "rxdb-hooks";
import { Category } from "./category";

/**
 * RxDB schema for the events collection.
 * Events are timestamped data entries linked to categories.
 */
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

/**
 * Returns all events from the database.
 * @returns Reactive array of Event documents
 */
export const useGetAllEvents = () => {
  return useRxData<Event>("events", (collection) => collection.find());
};

/**
 * Returns events within a date range, sorted by timestamp ascending.
 * @param from - Start timestamp (inclusive, milliseconds)
 * @param to - End timestamp (exclusive, milliseconds)
 * @returns Reactive array of Event documents
 */
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

/**
 * Returns events within a date range for a specific category.
 * Handles composite categories by including events from child categories.
 * @param from - Start timestamp (inclusive, milliseconds)
 * @param to - End timestamp (exclusive, milliseconds)
 * @param category - Category to filter by (includes children if composite)
 * @returns Array of Event documents sorted by timestamp
 */
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
      $eq: category?.id ?? "",
    };
  } else {
    selector.category = {
      $in: [...(category?.children ?? []), category?.id ?? ""],
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

/**
 * Returns the events RxDB collection for direct mutations.
 * @returns RxCollection for insert/patch/remove operations
 */
export const useGetEventsCollection = () => useRxCollection<Event>("events");
