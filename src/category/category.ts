import {
  ExtractDocumentTypeFromTypedRxJsonSchema,
  MangoQuerySelector,
  toTypedRxJsonSchema,
} from "rxdb";
import { useRxCollection, useRxData } from "rxdb-hooks";

/**
 * Category type labels in German.
 * - todo: Simple task/checkbox tracking
 * - value: Single measurement per entry
 * - valueAccumulative: Values are summed (e.g., daily water intake)
 * - protocol: Event logging, count-based
 */
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const schemaTyped = toTypedRxJsonSchema(categorySchema);

export type Category = ExtractDocumentTypeFromTypedRxJsonSchema<
  typeof schemaTyped
>;

/**
 * RxDB collection configuration for categories.
 * Includes schema and migration strategies for version upgrades.
 */
export const categoryCollection = {
  schema: categorySchema,
  migrationStrategies: {
    1: (old: Category) => old,
    2: (old: Category) => old,
  },
};

/**
 * Returns all categories from the database.
 * @returns Reactive array of Category documents
 */
export const useGetAllCategories = () =>
  useRxData<Category>("categories", (collection) => collection.find());

/**
 * Returns the categories RxDB collection for direct mutations.
 * @returns RxCollection for insert/patch/remove operations
 */
export const useGetCategoriesCollection = () =>
  useRxCollection<Category>("categories");

/**
 * Returns a single category by ID.
 * @param id - Category UUID
 * @returns Category document or undefined
 */
export const useGetCategory = (id: string) => {
  const { result: categories } = useRxData<Category>(
    "categories",
    (collection) => collection.findOne({ selector: { id: { $eq: id } } })
  );
  return categories[0];
};

/**
 * Returns multiple categories by their IDs.
 * @param ids - Array of category UUIDs
 * @returns Array of Category documents
 */
export const useGetCategories = (ids: string[]) => {
  const { result: categories } = useRxData<Category>(
    "categories",
    (collection) => collection.find({ selector: { id: { $in: ids } } })
  );
  return categories;
};

/**
 * Returns categories that can be children of a composite category.
 * Filters by same type and config, excluding the parent category itself.
 * @param type - Category type (e.g., "valueAccumulative")
 * @param config - Unit configuration (e.g., "volume")
 * @param id - Parent category ID to exclude (or null)
 * @returns Array of potential child categories
 */
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

/**
 * Checks if a category type requires user input when creating events.
 * @param type - Category type string
 * @returns true if input is required (all types except "todo")
 */
export const requiresInput = (type: string) => !["todo"].includes(type);

/**
 * Checks if a category type requires unit/measurement configuration.
 * @param type - Category type string
 * @returns true if measurement is required ("value" and "valueAccumulative")
 */
export const requiresMeasure = (type: string) =>
  !["todo", "protocol"].includes(type);
