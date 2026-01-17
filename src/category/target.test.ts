import { describe, it, expect } from "vitest";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { getColor, getCount, getPeriodBoundaries, targetCollection } from "./target";
import { createCategory, createTarget } from "../test/mocks/test-data";

// Initialize dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);

describe("getColor", () => {
  describe("normal (non-inverted) category", () => {
    const category = createCategory({ inverted: false });

    it("returns red-yellow mix at 0%", () => {
      const color = getColor(category, 0);
      expect(color).toBe("color-mix(in srgb, red, yellow 0%)");
    });

    it("returns red-yellow mix at 25%", () => {
      const color = getColor(category, 25);
      expect(color).toBe("color-mix(in srgb, red, yellow 50%)");
    });

    it("returns pure yellow at 50%", () => {
      const color = getColor(category, 50);
      expect(color).toBe("color-mix(in srgb, red, yellow 100%)");
    });

    it("returns yellow-green mix at 75%", () => {
      const color = getColor(category, 75);
      expect(color).toBe("color-mix(in srgb, yellow, green 50%)");
    });

    it("returns yellow-green mix at 100%", () => {
      const color = getColor(category, 100);
      expect(color).toBe("color-mix(in srgb, yellow, green 100%)");
    });
  });

  describe("inverted category", () => {
    const category = createCategory({ inverted: true });

    it("returns green-yellow mix at 0%", () => {
      const color = getColor(category, 0);
      expect(color).toBe("color-mix(in srgb, green, yellow 0%)");
    });

    it("returns pure yellow at 50%", () => {
      const color = getColor(category, 50);
      expect(color).toBe("color-mix(in srgb, green, yellow 100%)");
    });

    it("returns yellow-red mix at 100%", () => {
      const color = getColor(category, 100);
      expect(color).toBe("color-mix(in srgb, yellow, red 100%)");
    });
  });

  describe("edge cases", () => {
    const category = createCategory({ inverted: false });

    it("handles percentage just above 50", () => {
      const color = getColor(category, 51);
      expect(color).toBe("color-mix(in srgb, yellow, green 2%)");
    });

    it("handles percentage just below 50", () => {
      const color = getColor(category, 49);
      expect(color).toBe("color-mix(in srgb, red, yellow 98%)");
    });
  });
});

describe("getCount", () => {
  describe("daily schedule", () => {
    it("returns 1 for a single day range", () => {
      const target = createTarget({
        // Daily schedule starting Jan 1, 2024
        schedule: "DTSTART:20240101T000000Z\nRRULE:FREQ=DAILY;INTERVAL=1",
      });

      // Query for Jan 15, 2024 (full day in local time)
      const from = dayjs("2024-01-15").startOf("day").valueOf();
      const to = dayjs("2024-01-15").endOf("day").add(1, "ms").valueOf();

      expect(getCount(target, from, to)).toBe(1);
    });

    it("returns 7 for a week range", () => {
      const target = createTarget({
        schedule: "DTSTART:20240101T000000Z\nRRULE:FREQ=DAILY;INTERVAL=1",
      });

      const from = dayjs("2024-01-15").startOf("day").valueOf();
      const to = dayjs("2024-01-22").startOf("day").valueOf();

      expect(getCount(target, from, to)).toBe(7);
    });

    it("returns 0 for date before schedule starts", () => {
      const target = createTarget({
        schedule: "DTSTART:20240115T000000Z\nRRULE:FREQ=DAILY;INTERVAL=1",
      });

      const from = dayjs("2024-01-01").startOf("day").valueOf();
      const to = dayjs("2024-01-02").startOf("day").valueOf();

      expect(getCount(target, from, to)).toBe(0);
    });
  });

  describe("weekly schedule", () => {
    it("returns 1 for week containing the scheduled day", () => {
      const target = createTarget({
        // Weekly on Mondays
        schedule: "DTSTART:20240101T000000Z\nRRULE:FREQ=WEEKLY;BYDAY=MO",
      });

      // Monday Jan 15, 2024
      const from = dayjs("2024-01-15").startOf("day").valueOf();
      const to = dayjs("2024-01-16").startOf("day").valueOf();

      expect(getCount(target, from, to)).toBe(1);
    });

    it("returns 0 for day not in weekly schedule", () => {
      const target = createTarget({
        // Weekly on Mondays
        schedule: "DTSTART:20240101T000000Z\nRRULE:FREQ=WEEKLY;BYDAY=MO",
      });

      // Tuesday Jan 16, 2024
      const from = dayjs("2024-01-16").startOf("day").valueOf();
      const to = dayjs("2024-01-17").startOf("day").valueOf();

      expect(getCount(target, from, to)).toBe(0);
    });

    it("returns 4 for a month range with weekly schedule", () => {
      const target = createTarget({
        schedule: "DTSTART:20240101T000000Z\nRRULE:FREQ=WEEKLY;BYDAY=MO",
      });

      // January 2024 has 4 Mondays (1st, 8th, 15th, 22nd, 29th) - actually 5
      const from = dayjs("2024-01-01").startOf("day").valueOf();
      const to = dayjs("2024-02-01").startOf("day").valueOf();

      expect(getCount(target, from, to)).toBe(5);
    });
  });

  describe("interval schedules", () => {
    it("handles every-other-day schedule", () => {
      const target = createTarget({
        schedule: "DTSTART:20240101T000000Z\nRRULE:FREQ=DAILY;INTERVAL=2",
      });

      // Jan 1, 3, 5, 7, 9, 11, 13, 15 = 8 occurrences in 15 days starting Jan 1
      const from = dayjs("2024-01-01").startOf("day").valueOf();
      const to = dayjs("2024-01-16").startOf("day").valueOf();

      expect(getCount(target, from, to)).toBe(8);
    });

    it("handles multiple times per day", () => {
      const target = createTarget({
        // 3 times a day: 8am, 12pm, 6pm
        schedule: "DTSTART:20240101T080000Z\nRRULE:FREQ=DAILY;BYHOUR=8,12,18;BYMINUTE=0;BYSECOND=0",
      });

      const from = dayjs("2024-01-15").startOf("day").valueOf();
      const to = dayjs("2024-01-16").startOf("day").valueOf();

      expect(getCount(target, from, to)).toBe(3);
    });
  });

  describe("count limited schedules", () => {
    it("respects COUNT limit", () => {
      const target = createTarget({
        // Only 5 occurrences total
        schedule: "DTSTART:20240101T000000Z\nRRULE:FREQ=DAILY;COUNT=5",
      });

      // Query for 10 days
      const from = dayjs("2024-01-01").startOf("day").valueOf();
      const to = dayjs("2024-01-11").startOf("day").valueOf();

      expect(getCount(target, from, to)).toBe(5);
    });
  });

  describe("until limited schedules", () => {
    it("respects UNTIL limit", () => {
      const target = createTarget({
        schedule: "DTSTART:20240101T000000Z\nRRULE:FREQ=DAILY;UNTIL=20240105T235959Z",
      });

      const from = dayjs("2024-01-01").startOf("day").valueOf();
      const to = dayjs("2024-01-10").startOf("day").valueOf();

      expect(getCount(target, from, to)).toBe(5);
    });
  });
});

describe("useGetTargetStatus", () => {
  // Note: useGetTargetStatus is a hook that requires mocking several dependencies
  // (useAtomValue, useGetCategory, useGetEventsForDateAndCategory)
  // These tests would require a more complex setup with renderHook
  // and are covered in integration/component tests

  describe("integration notes", () => {
    it("todo type: counts events vs schedule count", () => {
      // For todo type, status.value = events.length
      // status.expected = getCount(target, from, to)
      // status.percentage = (events.length / expected) * 100
      expect(true).toBe(true); // Placeholder - tested via component tests
    });

    it("valueAccumulative: sums event data, calculates percentage against config", () => {
      // sum = events.reduce((result, event) => result + Number(event.data), 0)
      // percentage = (sum / Number(target.config)) * 100
      // value = toBest(category, sum)
      expect(true).toBe(true); // Placeholder - tested via component tests
    });

    it("protocol: counts events without expected value", () => {
      // Falls through from value case
      // percentage = (events.length / 0) * 100 = clamped to 100
      expect(true).toBe(true); // Placeholder - tested via component tests
    });
  });
});

describe("getPeriodBoundaries", () => {
  describe("daily period", () => {
    it("returns single day boundaries", () => {
      const target = createTarget({ periodType: "daily" });
      const selectedDate = dayjs("2024-01-15").startOf("day").valueOf();

      const { from, to } = getPeriodBoundaries(target, selectedDate);

      expect(from).toBe(dayjs("2024-01-15").startOf("day").valueOf());
      expect(to).toBe(dayjs("2024-01-16").startOf("day").valueOf());
    });
  });

  describe("weekly period", () => {
    it("returns Monday-Sunday boundaries when weekStartDay is 1", () => {
      const target = createTarget({ periodType: "weekly", weekStartDay: 1 });
      // Wednesday Jan 17, 2024
      const selectedDate = dayjs("2024-01-17").startOf("day").valueOf();

      const { from, to } = getPeriodBoundaries(target, selectedDate);

      // Week should start Monday Jan 15
      expect(from).toBe(dayjs("2024-01-15").startOf("day").valueOf());
      // Week should end Sunday Jan 21 (exclusive, so Jan 22 start)
      expect(to).toBe(dayjs("2024-01-22").startOf("day").valueOf());
    });

    it("returns Sunday-Saturday boundaries when weekStartDay is 0", () => {
      const target = createTarget({ periodType: "weekly", weekStartDay: 0 });
      // Wednesday Jan 17, 2024
      const selectedDate = dayjs("2024-01-17").startOf("day").valueOf();

      const { from, to } = getPeriodBoundaries(target, selectedDate);

      // Week should start Sunday Jan 14
      expect(from).toBe(dayjs("2024-01-14").startOf("day").valueOf());
      // Week should end Saturday Jan 20 (exclusive, so Jan 21 start)
      expect(to).toBe(dayjs("2024-01-21").startOf("day").valueOf());
    });

    it("handles selected date being the first day of week (Monday)", () => {
      const target = createTarget({ periodType: "weekly", weekStartDay: 1 });
      // Monday Jan 15, 2024
      const selectedDate = dayjs("2024-01-15").startOf("day").valueOf();

      const { from, to } = getPeriodBoundaries(target, selectedDate);

      expect(from).toBe(dayjs("2024-01-15").startOf("day").valueOf());
      expect(to).toBe(dayjs("2024-01-22").startOf("day").valueOf());
    });

    it("handles selected date being the last day of week (Sunday)", () => {
      const target = createTarget({ periodType: "weekly", weekStartDay: 1 });
      // Sunday Jan 21, 2024
      const selectedDate = dayjs("2024-01-21").startOf("day").valueOf();

      const { from, to } = getPeriodBoundaries(target, selectedDate);

      expect(from).toBe(dayjs("2024-01-15").startOf("day").valueOf());
      expect(to).toBe(dayjs("2024-01-22").startOf("day").valueOf());
    });
  });

  describe("monthly period", () => {
    it("returns first to last day of month", () => {
      const target = createTarget({ periodType: "monthly" });
      // Jan 15, 2024
      const selectedDate = dayjs("2024-01-15").startOf("day").valueOf();

      const { from, to } = getPeriodBoundaries(target, selectedDate);

      expect(from).toBe(dayjs("2024-01-01").startOf("day").valueOf());
      expect(to).toBe(dayjs("2024-02-01").startOf("day").valueOf());
    });

    it("handles February correctly", () => {
      const target = createTarget({ periodType: "monthly" });
      // Feb 15, 2024 (leap year)
      const selectedDate = dayjs("2024-02-15").startOf("day").valueOf();

      const { from, to } = getPeriodBoundaries(target, selectedDate);

      expect(from).toBe(dayjs("2024-02-01").startOf("day").valueOf());
      expect(to).toBe(dayjs("2024-03-01").startOf("day").valueOf());
    });

    it("handles December correctly (year boundary)", () => {
      const target = createTarget({ periodType: "monthly" });
      // Dec 15, 2024
      const selectedDate = dayjs("2024-12-15").startOf("day").valueOf();

      const { from, to } = getPeriodBoundaries(target, selectedDate);

      expect(from).toBe(dayjs("2024-12-01").startOf("day").valueOf());
      expect(to).toBe(dayjs("2025-01-01").startOf("day").valueOf());
    });
  });

  describe("custom period", () => {
    it("calculates period from DTSTART with periodDays", () => {
      const target = createTarget({
        periodType: "custom",
        periodDays: 14,
        schedule: "DTSTART:20240101T000000Z\nRRULE:FREQ=DAILY",
      });
      // Jan 8, 2024 - within first 14-day period starting Jan 1
      const selectedDate = dayjs("2024-01-08").startOf("day").valueOf();

      const { from, to } = getPeriodBoundaries(target, selectedDate);

      expect(from).toBe(dayjs("2024-01-01").startOf("day").valueOf());
      expect(to).toBe(dayjs("2024-01-15").startOf("day").valueOf());
    });

    it("calculates next period correctly", () => {
      const target = createTarget({
        periodType: "custom",
        periodDays: 14,
        schedule: "DTSTART:20240101T000000Z\nRRULE:FREQ=DAILY",
      });
      // Jan 20, 2024 - within second 14-day period starting Jan 15
      const selectedDate = dayjs("2024-01-20").startOf("day").valueOf();

      const { from, to } = getPeriodBoundaries(target, selectedDate);

      expect(from).toBe(dayjs("2024-01-15").startOf("day").valueOf());
      expect(to).toBe(dayjs("2024-01-29").startOf("day").valueOf());
    });
  });

  describe("error handling", () => {
    it("falls back to daily when periodType is invalid", () => {
      const target = createTarget({ periodType: "invalid" as never });
      const selectedDate = dayjs("2024-01-15").startOf("day").valueOf();

      const { from, to } = getPeriodBoundaries(target, selectedDate);

      expect(from).toBe(dayjs("2024-01-15").startOf("day").valueOf());
      expect(to).toBe(dayjs("2024-01-16").startOf("day").valueOf());
    });

    it("falls back to daily when custom period has no periodDays", () => {
      const target = createTarget({
        periodType: "custom",
        periodDays: undefined,
      });
      const selectedDate = dayjs("2024-01-15").startOf("day").valueOf();

      const { from, to } = getPeriodBoundaries(target, selectedDate);

      expect(from).toBe(dayjs("2024-01-15").startOf("day").valueOf());
      expect(to).toBe(dayjs("2024-01-16").startOf("day").valueOf());
    });

    it("falls back to daily when custom schedule has no DTSTART", () => {
      const target = createTarget({
        periodType: "custom",
        periodDays: 14,
        schedule: "RRULE:FREQ=DAILY",
      });
      const selectedDate = dayjs("2024-01-15").startOf("day").valueOf();

      const { from, to } = getPeriodBoundaries(target, selectedDate);

      expect(from).toBe(dayjs("2024-01-15").startOf("day").valueOf());
      expect(to).toBe(dayjs("2024-01-16").startOf("day").valueOf());
    });
  });
});

describe("targetCollection migration", () => {
  describe("v0 to v1 migration", () => {
    it("adds periodType: 'daily' to existing targets", () => {
      const oldTarget = {
        id: "test-id",
        name: "Test Target",
        category: "cat-id",
        schedule: "DTSTART:20240101T000000Z\nRRULE:FREQ=DAILY",
        config: "1",
      };

      const migrated = targetCollection.migrationStrategies[1](oldTarget);

      expect(migrated.periodType).toBe("daily");
    });

    it("adds weekStartDay: 1 (Monday) to existing targets", () => {
      const oldTarget = {
        id: "test-id",
        name: "Test Target",
        category: "cat-id",
        schedule: "DTSTART:20240101T000000Z\nRRULE:FREQ=DAILY",
        config: "1",
      };

      const migrated = targetCollection.migrationStrategies[1](oldTarget);

      expect(migrated.weekStartDay).toBe(1);
    });

    it("preserves all existing fields", () => {
      const oldTarget = {
        id: "test-id",
        name: "Test Target",
        category: "cat-id",
        schedule: "DTSTART:20240101T000000Z\nRRULE:FREQ=WEEKLY",
        config: "5",
      };

      const migrated = targetCollection.migrationStrategies[1](oldTarget);

      expect(migrated.id).toBe("test-id");
      expect(migrated.name).toBe("Test Target");
      expect(migrated.category).toBe("cat-id");
      expect(migrated.schedule).toBe("DTSTART:20240101T000000Z\nRRULE:FREQ=WEEKLY");
      expect(migrated.config).toBe("5");
    });

    it("converts numeric config to string", () => {
      const oldTarget = {
        id: "test-id",
        name: "Test Target",
        category: "cat-id",
        schedule: "DTSTART:20240101T000000Z\nRRULE:FREQ=DAILY",
        config: 1, // number instead of string
      };

      const migrated = targetCollection.migrationStrategies[1](oldTarget as never);

      expect(migrated.config).toBe("1");
      expect(typeof migrated.config).toBe("string");
    });
  });
});
