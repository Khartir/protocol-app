import { RRule } from "rrule";
import {
  ExtractDocumentTypeFromTypedRxJsonSchema,
  toTypedRxJsonSchema,
} from "rxdb";
import { useRxCollection, useRxData } from "rxdb-hooks";
import { useGetEventsForDateAndCategory } from "./event";
import { useAtomValue } from "jotai";
import dayjs from "dayjs";
import { selectedDate } from "../home/Home";
import { Category, useGetCategory } from "./category";
import { toBest } from "../MeasureSelect";

/**
 * RxDB schema for the targets collection.
 * Targets define recurring goals with RRule schedules.
 */
export const targetSchema = {
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
    category: {
      type: "string",
    },
    schedule: {
      type: "string",
    },
    config: {
      type: "string",
    },
  },
  required: ["id", "category", "schedule", "config"],
} as const;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const schemaTyped = toTypedRxJsonSchema(targetSchema);

export type Target = ExtractDocumentTypeFromTypedRxJsonSchema<
  typeof schemaTyped
>;

/**
 * Returns all targets from the database.
 * @returns Reactive array of Target documents
 */
export const useGetAllTargets = () => {
  return useRxData<Target>("targets", (collection) => collection.find());
};

/**
 * Returns the targets RxDB collection for direct mutations.
 * @returns RxCollection for insert/patch/remove operations
 */
export const useGetTargetsCollection = () => useRxCollection<Target>("targets");

/**
 * Returns targets that have at least one scheduled occurrence in the date range.
 * Uses RRule evaluation to determine if a target applies to specific dates.
 * @param from - Start timestamp (inclusive, local time milliseconds)
 * @param to - End timestamp (exclusive, local time milliseconds)
 * @returns Array of Target documents scheduled for the range
 */
export const useGetTargetsForDate = (from: number, to: number) => {
  const targets = useGetAllTargets();

  return targets.result
    .map((target) => (getCount(target, from, to) >= 1 ? target : null))
    .filter((target) => target !== null);
};

/**
 * Calculates the completion status of a target for the selected date.
 * Uses the global selectedDate atom and queries related events.
 *
 * @param target - Target to calculate status for
 * @returns Status object with value, percentage, expected, and color
 *
 * @example
 * const status = useGetTargetStatus(target);
 * // status = { value: "500 ml", percentage: 50, expected: "1 l", color: "color-mix(...)" }
 */
export const useGetTargetStatus = (
  target: Target
): {
  value: string | number;
  percentage: number;
  expected: string | number;
  color: string;
} => {
  const from = useAtomValue(selectedDate);
  const to = dayjs(from).add(1, "day").valueOf();
  const category = useGetCategory(target.category);
  const events = useGetEventsForDateAndCategory(from, to, category);
  let expected: number = 0;

  switch (category?.type) {
    case "todo":
    case "value":
      expected = getCount(target, from, to);
    // eslint-disable-next-line no-fallthrough
    case "protocol":
      // eslint-disable-next-line no-case-declarations
      const percentage = Math.min((events.length / expected) * 100, 100);
      return {
        value: events.length,
        percentage,
        expected,
        color: getColor(category, percentage),
      };
    case "valueAccumulative": {
      const sum = events.reduce(
        (result, event) => result + Number(event.data),
        0
      );
      let percentage = Math.min(100, (sum / Number(target.config)) * 100);
      const color = getColor(category, percentage);

      if (category.inverted && percentage < 100) {
        percentage = 100 - percentage;
      }

      return {
        value: toBest(category, sum).replace(".", ","),
        percentage,
        expected: toBest(category, target.config).replace(".", ","),
        color,
      };
    }
    default:
      return {
        value: "",
        percentage: 0,
        expected: "0",
        color: "pink",
      };
  }
};

const getCount = (target: Target, from: number, to: number) => {
  const rule = RRule.fromString(target.schedule);
  // sub 1 second, because the from date is not inclusive
  // convert to utc because rrule requires utc and we work in local time
  const fromDate = dayjs(from).tz("utc", true).subtract(1, "s");
  const toDate = dayjs(to).tz("utc", true);
  return rule.between(fromDate.toDate(), toDate.toDate()).length;
};

function getColor(category: Category, percentage: number) {
  let colors = ["red", "yellow", "green"];
  if (category.inverted) {
    colors = colors.reverse();
  }

  let colorPercentage = percentage;
  if (colorPercentage > 50) {
    colorPercentage -= 50;
    colors.shift();
  }

  colorPercentage *= 2;

  const color = `color-mix(in srgb, ${colors[0]}, ${colors[1]} ${colorPercentage}%)`;
  return color;
}
