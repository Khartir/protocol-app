import { RRule } from "rrule";
import {
  ExtractDocumentTypeFromTypedRxJsonSchema,
  toTypedRxJsonSchema,
} from "rxdb";
import { useRxCollection, useRxData } from "rxdb-hooks";
import { useGetEventsForDateAndCategory } from "./event";
import { useAtomValue } from "jotai";
import dayjs from "dayjs";
import { selectedDate } from "../Home";
import { useGetCategory } from "./category";

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
  const events = useGetEventsForDateAndCategory(from, to, target.category);
  const category = useGetCategory(target.category);
  switch (category?.type) {
    case "todo":
    case "protocol":
      return Math.min(
        (events.result.length / getCount(target, from, to)) * 100,
        100
      );
    case "value":
      return Math.min(
        (events.result.length / getCount(target, from, to)) * 100,
        100
      );
    case "valueAccumulative":
      const sum = events.result.reduce(
        (result, event) => result + Number(event.data),
        0
      );
      return Math.min(100, (sum / Number(target.config)) * 100);
  }
};

const getCount = (target: Target, from: number, to: number) => {
  const rule = RRule.fromString(target.schedule);
  return rule.between(new Date(from), new Date(to)).length;
};
