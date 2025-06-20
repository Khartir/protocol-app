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
import { useGetCategory } from "./category";
import { toBest } from "../MeasureSelect";

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

const schemaTyped = toTypedRxJsonSchema(targetSchema);

export type Target = ExtractDocumentTypeFromTypedRxJsonSchema<
  typeof schemaTyped
>;

export const useGetAllTargets = () => {
  return useRxData<Target>("targets", (collection) => collection.find());
};

export const useGetTargetsCollection = () => useRxCollection<Target>("targets");

export const useGetTargetsForDate = (from: number, to: number) => {
  const targets = useGetAllTargets();

  return targets.result
    .map((target) => (getCount(target, from, to) >= 1 ? target : null))
    .filter((target) => target !== null);
};

export const useGetTargetStatus = (target: Target) => {
  const from = useAtomValue(selectedDate);
  const to = dayjs(from).add(1, "day").valueOf();
  const category = useGetCategory(target.category);
  const events = useGetEventsForDateAndCategory(from, to, category);
  let expected: number;

  switch (category?.type) {
    case "todo":
    case "protocol":
    case "value":
      expected = getCount(target, from, to);
      return {
        value: events.length,
        percentage: Math.min((events.length / expected) * 100, 100),
        expected,
      };
    case "valueAccumulative":
      const sum = events.reduce(
        (result, event) => result + Number(event.data),
        0
      );
      return {
        value: toBest(category, sum).replace(".", ","),
        percentage: Math.min(100, (sum / Number(target.config)) * 100),
        expected: toBest(category, target.config).replace(".", ","),
      };
    default:
      return { value: "", percentage: 0, target: "" };
  }
};

const getCount = (target: Target, from: number, to: number) => {
  const rule = RRule.fromString(target.schedule);
  return rule.between(new Date(from), new Date(to)).length;
};
