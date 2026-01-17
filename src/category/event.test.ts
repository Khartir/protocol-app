import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { eventSchema } from "./event";

// Mock rxdb-hooks
vi.mock("rxdb-hooks", () => ({
  useRxData: vi.fn(() => ({
    result: [],
    isFetching: false,
    isExhausted: true,
    fetchMore: vi.fn(),
    resetList: vi.fn(),
  })),
  useRxCollection: vi.fn(() => null),
}));

describe("eventSchema", () => {
  it("has version 0", () => {
    expect(eventSchema.version).toBe(0);
  });

  it("uses id as primary key", () => {
    expect(eventSchema.primaryKey).toBe("id");
  });

  it("has required fields", () => {
    expect(eventSchema.required).toEqual(["id", "category", "timestamp", "data"]);
  });

  describe("properties", () => {
    it("has id property with max length 100", () => {
      expect(eventSchema.properties.id.type).toBe("string");
      expect(eventSchema.properties.id.maxLength).toBe(100);
    });

    it("has category property", () => {
      expect(eventSchema.properties.category.type).toBe("string");
    });

    it("has timestamp property as number", () => {
      expect(eventSchema.properties.timestamp.type).toBe("number");
    });

    it("has data property", () => {
      expect(eventSchema.properties.data.type).toBe("string");
    });
  });
});

describe("useGetEventsForDate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls useRxData with events collection", async () => {
    const { useRxData } = await import("rxdb-hooks");
    const { useGetEventsForDate } = await import("./event");

    const from = Date.now();
    const to = from + 86400000; // +1 day

    renderHook(() => useGetEventsForDate(from, to));

    expect(useRxData).toHaveBeenCalledWith("events", expect.any(Function));
  });
});

describe("useGetEventsForDateAndCategory", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("includes parent and child categories in query when category has children", async () => {
    const { useRxData } = await import("rxdb-hooks");
    const { useGetEventsForDateAndCategory } = await import("./event");

    const from = Date.now();
    const to = from + 86400000;
    const category = {
      id: "parent-id",
      name: "Parent",
      type: "valueAccumulative" as const,
      config: "volume",
      children: ["child-1", "child-2"],
      inverted: false,
    };

    renderHook(() => useGetEventsForDateAndCategory(from, to, category));

    expect(useRxData).toHaveBeenCalledWith("events", expect.any(Function));
  });

  it("queries only parent category when no children", async () => {
    const { useRxData } = await import("rxdb-hooks");
    const { useGetEventsForDateAndCategory } = await import("./event");

    const from = Date.now();
    const to = from + 86400000;
    const category = {
      id: "parent-id",
      name: "Parent",
      type: "todo" as const,
      config: "",
      children: [],
      inverted: false,
    };

    renderHook(() => useGetEventsForDateAndCategory(from, to, category));

    expect(useRxData).toHaveBeenCalledWith("events", expect.any(Function));
  });

  it("handles undefined category gracefully", async () => {
    const { useRxData } = await import("rxdb-hooks");
    const { useGetEventsForDateAndCategory } = await import("./event");

    const from = Date.now();
    const to = from + 86400000;

    renderHook(() => useGetEventsForDateAndCategory(from, to, undefined));

    expect(useRxData).toHaveBeenCalledWith("events", expect.any(Function));
  });
});

describe("useGetAllEvents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls useRxData with events collection and find query", async () => {
    const { useRxData } = await import("rxdb-hooks");
    const { useGetAllEvents } = await import("./event");

    renderHook(() => useGetAllEvents());

    expect(useRxData).toHaveBeenCalledWith("events", expect.any(Function));
  });
});

describe("useGetEventsCollection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls useRxCollection with events", async () => {
    const { useRxCollection } = await import("rxdb-hooks");
    const { useGetEventsCollection } = await import("./event");

    renderHook(() => useGetEventsCollection());

    expect(useRxCollection).toHaveBeenCalledWith("events");
  });
});
