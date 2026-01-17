import { describe, it, expect } from "vitest";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { aggregateEventsByPeriod, getAggregationBoundaries } from "./analytics/aggregation";
import { createEvent, createVolumeCategory } from "./test/mocks/test-data";

// Initialize dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

describe("getAggregationBoundaries", () => {
  describe("daily aggregation", () => {
    it("returns single day boundaries", () => {
      const date = dayjs("2024-01-15").startOf("day").valueOf();

      const { from, to } = getAggregationBoundaries("daily", 1, undefined, date);

      expect(from).toBe(dayjs("2024-01-15").startOf("day").valueOf());
      expect(to).toBe(dayjs("2024-01-16").startOf("day").valueOf());
    });
  });

  describe("weekly aggregation", () => {
    it("returns Monday-Sunday boundaries when weekStartDay is 1", () => {
      // Wednesday Jan 17, 2024
      const date = dayjs("2024-01-17").startOf("day").valueOf();

      const { from, to } = getAggregationBoundaries("weekly", 1, undefined, date);

      expect(from).toBe(dayjs("2024-01-15").startOf("day").valueOf()); // Monday
      expect(to).toBe(dayjs("2024-01-22").startOf("day").valueOf()); // Next Monday
    });

    it("returns Sunday-Saturday boundaries when weekStartDay is 0", () => {
      // Wednesday Jan 17, 2024
      const date = dayjs("2024-01-17").startOf("day").valueOf();

      const { from, to } = getAggregationBoundaries("weekly", 0, undefined, date);

      expect(from).toBe(dayjs("2024-01-14").startOf("day").valueOf()); // Sunday
      expect(to).toBe(dayjs("2024-01-21").startOf("day").valueOf()); // Next Sunday
    });
  });

  describe("monthly aggregation", () => {
    it("returns first to last day of month", () => {
      const date = dayjs("2024-01-15").startOf("day").valueOf();

      const { from, to } = getAggregationBoundaries("monthly", 1, undefined, date);

      expect(from).toBe(dayjs("2024-01-01").startOf("day").valueOf());
      expect(to).toBe(dayjs("2024-02-01").startOf("day").valueOf());
    });

    it("handles February correctly", () => {
      const date = dayjs("2024-02-15").startOf("day").valueOf();

      const { from, to } = getAggregationBoundaries("monthly", 1, undefined, date);

      expect(from).toBe(dayjs("2024-02-01").startOf("day").valueOf());
      expect(to).toBe(dayjs("2024-03-01").startOf("day").valueOf());
    });
  });

  describe("custom aggregation", () => {
    it("calculates period from start date with aggregationDays", () => {
      // Custom 14-day period starting Jan 1
      const startDate = dayjs("2024-01-01").startOf("day").valueOf();
      const date = dayjs("2024-01-08").startOf("day").valueOf();

      const { from, to } = getAggregationBoundaries("custom", 1, 14, date, startDate);

      expect(from).toBe(dayjs("2024-01-01").startOf("day").valueOf());
      expect(to).toBe(dayjs("2024-01-15").startOf("day").valueOf());
    });

    it("calculates next period correctly", () => {
      // Custom 14-day period starting Jan 1
      const startDate = dayjs("2024-01-01").startOf("day").valueOf();
      const date = dayjs("2024-01-20").startOf("day").valueOf();

      const { from, to } = getAggregationBoundaries("custom", 1, 14, date, startDate);

      expect(from).toBe(dayjs("2024-01-15").startOf("day").valueOf());
      expect(to).toBe(dayjs("2024-01-29").startOf("day").valueOf());
    });

    it("falls back to daily if no aggregationDays", () => {
      const date = dayjs("2024-01-15").startOf("day").valueOf();

      const { from, to } = getAggregationBoundaries("custom", 1, undefined, date);

      expect(from).toBe(dayjs("2024-01-15").startOf("day").valueOf());
      expect(to).toBe(dayjs("2024-01-16").startOf("day").valueOf());
    });

    it("falls back to daily if no startDate for custom", () => {
      const date = dayjs("2024-01-15").startOf("day").valueOf();

      const { from, to } = getAggregationBoundaries("custom", 1, 14, date);

      expect(from).toBe(dayjs("2024-01-15").startOf("day").valueOf());
      expect(to).toBe(dayjs("2024-01-16").startOf("day").valueOf());
    });
  });
});

describe("aggregateEventsByPeriod", () => {
  // Use a simple category without unit conversion for simpler testing
  const simpleCategory = createVolumeCategory({ config: "" });

  describe("weekly aggregation", () => {
    it("groups events by week boundaries", () => {
      const events = [
        createEvent({ timestamp: dayjs("2024-01-15").valueOf(), data: "100" }),
        createEvent({ timestamp: dayjs("2024-01-17").valueOf(), data: "200" }),
        createEvent({ timestamp: dayjs("2024-01-22").valueOf(), data: "150" }),
        createEvent({ timestamp: dayjs("2024-01-24").valueOf(), data: "250" }),
      ];

      const fromDate = dayjs("2024-01-15").startOf("day");
      const toDate = dayjs("2024-01-28").endOf("day");

      const result = aggregateEventsByPeriod(
        events,
        "weekly",
        1,
        undefined,
        fromDate,
        toDate,
        simpleCategory
      );

      expect(result).toHaveLength(2);
      // First week: 100 + 200 = 300
      expect(result[0].y).toBe(300);
      // Second week: 150 + 250 = 400
      expect(result[1].y).toBe(400);
    });
  });

  describe("monthly aggregation", () => {
    it("groups events by month", () => {
      const events = [
        createEvent({ timestamp: dayjs("2024-01-10").valueOf(), data: "500" }),
        createEvent({ timestamp: dayjs("2024-01-20").valueOf(), data: "500" }),
        createEvent({ timestamp: dayjs("2024-02-05").valueOf(), data: "300" }),
      ];

      const fromDate = dayjs("2024-01-01").startOf("day");
      const toDate = dayjs("2024-02-28").endOf("day");

      const result = aggregateEventsByPeriod(
        events,
        "monthly",
        1,
        undefined,
        fromDate,
        toDate,
        simpleCategory
      );

      expect(result).toHaveLength(2);
      // January: 500 + 500 = 1000
      expect(result[0].y).toBe(1000);
      // February: 300
      expect(result[1].y).toBe(300);
    });
  });

  describe("custom aggregation", () => {
    it("groups events by N-day intervals", () => {
      const events = [
        createEvent({ timestamp: dayjs("2024-01-02").valueOf(), data: "100" }),
        createEvent({ timestamp: dayjs("2024-01-10").valueOf(), data: "200" }),
        createEvent({ timestamp: dayjs("2024-01-16").valueOf(), data: "300" }),
      ];

      const fromDate = dayjs("2024-01-01").startOf("day");
      const toDate = dayjs("2024-01-28").endOf("day");
      const startDate = dayjs("2024-01-01").startOf("day").valueOf();

      const result = aggregateEventsByPeriod(
        events,
        "custom",
        1,
        14,
        fromDate,
        toDate,
        simpleCategory,
        startDate
      );

      expect(result).toHaveLength(2);
      // First 14 days (Jan 1-14): 100 + 200 = 300
      expect(result[0].y).toBe(300);
      // Second 14 days (Jan 15-28): 300
      expect(result[1].y).toBe(300);
    });
  });

  describe("empty periods", () => {
    it("shows 0 for periods with no events", () => {
      const events = [
        createEvent({ timestamp: dayjs("2024-01-15").valueOf(), data: "500" }),
        // No events in week 2
        createEvent({ timestamp: dayjs("2024-01-29").valueOf(), data: "300" }),
      ];

      const fromDate = dayjs("2024-01-15").startOf("day");
      const toDate = dayjs("2024-02-04").endOf("day");

      const result = aggregateEventsByPeriod(
        events,
        "weekly",
        1,
        undefined,
        fromDate,
        toDate,
        simpleCategory
      );

      expect(result).toHaveLength(3);
      expect(result[0].y).toBe(500); // Week 1
      expect(result[1].y).toBe(0); // Week 2: empty
      expect(result[2].y).toBe(300); // Week 3
    });
  });

  describe("partial periods at range edges", () => {
    it("includes partial periods", () => {
      const events = [createEvent({ timestamp: dayjs("2024-01-17").valueOf(), data: "500" })];

      // Range starts mid-week (Wednesday)
      const fromDate = dayjs("2024-01-17").startOf("day");
      const toDate = dayjs("2024-01-21").endOf("day");

      const result = aggregateEventsByPeriod(
        events,
        "weekly",
        1,
        undefined,
        fromDate,
        toDate,
        simpleCategory
      );

      // Should still show the week even though we started mid-week
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result[0].y).toBe(500);
    });
  });
});
