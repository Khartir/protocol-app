import { v7 as uuid } from "uuid";
import { Category } from "../../category/category";
import { Event } from "../../category/event";
import { Target } from "../../category/target";

/**
 * Creates a mock Category object with sensible defaults.
 * @param overrides - Partial Category to override defaults
 * @returns Complete Category object
 */
export function createCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: uuid(),
    name: "Test Category",
    icon: "🔵",
    type: "todo",
    config: "",
    children: [],
    inverted: false,
    ...overrides,
  };
}

/**
 * Creates a mock Event object with sensible defaults.
 * @param overrides - Partial Event to override defaults
 * @returns Complete Event object
 */
export function createEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: uuid(),
    category: "test-category-id",
    timestamp: Date.now(),
    data: "",
    ...overrides,
  };
}

/**
 * Creates a mock Target object with sensible defaults.
 * Uses a daily RRule schedule by default.
 * @param overrides - Partial Target to override defaults
 * @returns Complete Target object
 */
export function createTarget(overrides: Partial<Target> = {}): Target {
  return {
    id: uuid(),
    name: "Test Target",
    category: "test-category-id",
    // Daily schedule at midnight UTC
    schedule: "DTSTART:20240101T000000Z\nRRULE:FREQ=DAILY;INTERVAL=1",
    config: "1",
    periodType: "daily",
    weekStartDay: 1,
    ...overrides,
  };
}

/**
 * Creates a mock volume-type Category for accumulative measurements.
 */
export function createVolumeCategory(overrides: Partial<Category> = {}): Category {
  return createCategory({
    type: "valueAccumulative",
    config: "volume",
    ...overrides,
  });
}

/**
 * Creates a mock time-type Category for accumulative measurements.
 */
export function createTimeCategory(overrides: Partial<Category> = {}): Category {
  return createCategory({
    type: "valueAccumulative",
    config: "time",
    ...overrides,
  });
}

/**
 * Creates a mock mass-type Category for accumulative measurements.
 */
export function createMassCategory(overrides: Partial<Category> = {}): Category {
  return createCategory({
    type: "valueAccumulative",
    config: "mass",
    ...overrides,
  });
}
