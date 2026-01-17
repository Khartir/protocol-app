import { describe, it, expect } from "vitest";
import dayjs from "dayjs";
import { createCategory, createEvent } from "../test/mocks/test-data";
import { prepareTableData } from "./TableGraph";

/**
 * Helper to create a simple "value" category (e.g., blood pressure, weight)
 * These should NOT be summed when multiple values fall in same period
 */
function createSimpleValueCategory(overrides: Partial<ReturnType<typeof createCategory>> = {}) {
  return createCategory({
    type: "value",
    config: "pressure", // e.g., blood pressure in mmHg
    ...overrides,
  });
}

describe("TableGraph", () => {
  describe("prepareTableData", () => {
    describe("simple value categories (no children)", () => {
      it("returns individual events when multiple events exist in same period", () => {
        const category = createSimpleValueCategory({ id: "bp-category" });
        const events = [
          createEvent({
            id: "event-1",
            category: "bp-category",
            timestamp: dayjs("2024-01-15 09:00").valueOf(),
            data: "120 mmHg",
          }),
          createEvent({
            id: "event-2",
            category: "bp-category",
            timestamp: dayjs("2024-01-15 18:00").valueOf(),
            data: "130 mmHg",
          }),
        ];

        const result = prepareTableData({
          events,
          category,
          childCategories: [],
          periods: [
            {
              from: dayjs("2024-01-15").startOf("day").valueOf(),
              to: dayjs("2024-01-16").startOf("day").valueOf(),
              key: String(dayjs("2024-01-15").startOf("day").valueOf()),
              label: "15.01.",
            },
          ],
          aggregationMode: "daily",
          weekStartDay: 1,
          aggregationDays: undefined,
        });

        // Should return individual events, NOT summed value
        expect(result.type).toBe("simpleValueMultiple");
        expect(result.periods).toHaveLength(1);

        const periodData = result.periods[0];
        expect(periodData.events).toHaveLength(2);
        expect(periodData.events[0].time).toBe("09:00");
        expect(periodData.events[0].displayValue).toContain("120");
        expect(periodData.events[1].time).toBe("18:00");
        expect(periodData.events[1].displayValue).toContain("130");
      });

      it("returns simple format when only one event in period", () => {
        const category = createSimpleValueCategory({ id: "bp-category" });
        const events = [
          createEvent({
            id: "event-1",
            category: "bp-category",
            timestamp: dayjs("2024-01-15 09:00").valueOf(),
            data: "120 mmHg",
          }),
        ];

        const result = prepareTableData({
          events,
          category,
          childCategories: [],
          periods: [
            {
              from: dayjs("2024-01-15").startOf("day").valueOf(),
              to: dayjs("2024-01-16").startOf("day").valueOf(),
              key: String(dayjs("2024-01-15").startOf("day").valueOf()),
              label: "15.01.",
            },
          ],
          aggregationMode: "daily",
          weekStartDay: 1,
          aggregationDays: undefined,
        });

        // Single event should use simple format
        expect(result.type).toBe("simpleValueSingle");
      });
    });

    describe("accumulated value categories", () => {
      it("sums values in same period correctly", () => {
        const category = createCategory({
          id: "water-category",
          type: "valueAccumulative",
          config: "volume",
        });
        const events = [
          createEvent({
            id: "event-1",
            category: "water-category",
            timestamp: dayjs("2024-01-15 09:00").valueOf(),
            data: "500", // 500ml
          }),
          createEvent({
            id: "event-2",
            category: "water-category",
            timestamp: dayjs("2024-01-15 18:00").valueOf(),
            data: "700", // 700ml
          }),
        ];

        const result = prepareTableData({
          events,
          category,
          childCategories: [],
          periods: [
            {
              from: dayjs("2024-01-15").startOf("day").valueOf(),
              to: dayjs("2024-01-16").startOf("day").valueOf(),
              key: String(dayjs("2024-01-15").startOf("day").valueOf()),
              label: "15.01.",
            },
          ],
          aggregationMode: "daily",
          weekStartDay: 1,
          aggregationDays: undefined,
        });

        // Accumulated values SHOULD be summed
        expect(result.type).toBe("accumulated");
        expect(result.periods[0].sum).toBe(1200); // 500 + 700
      });
    });
  });
});
