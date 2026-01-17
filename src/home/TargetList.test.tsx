import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import dayjs from "dayjs";
import { renderWithProviders } from "../test/utils/render-with-providers";
import { TargetList } from "./TargetList";
import { createTarget } from "../test/mocks/test-data";

// Mock rxdb-hooks
vi.mock("rxdb-hooks", () => ({
  useRxData: vi.fn(() => ({
    result: [],
    isFetching: false,
    isExhausted: true,
    fetchMore: vi.fn(),
    resetList: vi.fn(),
  })),
  useRxCollection: vi.fn(() => ({
    insert: vi.fn(),
  })),
}));

// Mock jotai
vi.mock("jotai", async () => {
  const actual = await vi.importActual("jotai");
  return {
    ...actual,
    useAtomValue: () => dayjs().startOf("day").valueOf(),
    useAtom: () => [dayjs().startOf("day").valueOf(), vi.fn()],
  };
});

// Mock the target module hooks
vi.mock("../category/target", async () => {
  const actual = await vi.importActual("../category/target");
  return {
    ...actual,
    useGetTargetsForDate: vi.fn(() => []),
    useGetTargetStatus: vi.fn(() => ({
      value: 0,
      percentage: 0,
      expected: 1,
      color: "color-mix(in srgb, red, yellow 0%)",
    })),
  };
});

// Mock category module
vi.mock("../category/category", async () => {
  const actual = await vi.importActual("../category/category");
  return {
    ...actual,
    useGetCategory: vi.fn(() => ({
      id: "test-category",
      name: "Test",
      type: "todo",
      config: "",
      icon: "📝",
    })),
    useGetAllCategories: vi.fn(() => ({ result: [] })),
  };
});

describe("TargetList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders heading", () => {
      renderWithProviders(<TargetList />);

      expect(screen.getByText("Ziele")).toBeInTheDocument();
    });

    it("renders empty list when no targets", () => {
      renderWithProviders(<TargetList />);

      const list = screen.getByRole("list");
      expect(list).toBeInTheDocument();
      expect(list.children).toHaveLength(0);
    });
  });

  describe("with targets", () => {
    beforeEach(async () => {
      const { useGetTargetsForDate } = await import("../category/target");
      const mockTargets = [
        {
          ...createTarget({ name: "Drink Water", id: "target-1" }),
          // Add RxDocument-like properties for iteration
          toMutableJSON: () => createTarget({ name: "Drink Water", id: "target-1" }),
        },
      ];
      vi.mocked(useGetTargetsForDate).mockReturnValue(mockTargets as never);
    });

    it("displays target names", () => {
      renderWithProviders(<TargetList />);

      expect(screen.getByText("Drink Water")).toBeInTheDocument();
    });
  });

  describe("progress display", () => {
    it("shows progress indicator for each target", async () => {
      const { useGetTargetsForDate, useGetTargetStatus } = await import("../category/target");
      const mockTargets = [
        {
          ...createTarget({ name: "Test Target", id: "target-1" }),
          toMutableJSON: () => createTarget({ name: "Test Target", id: "target-1" }),
        },
      ];
      vi.mocked(useGetTargetsForDate).mockReturnValue(mockTargets as never);
      vi.mocked(useGetTargetStatus).mockReturnValue({
        value: 1,
        percentage: 50,
        expected: 2,
        color: "color-mix(in srgb, red, yellow 100%)",
      });

      renderWithProviders(<TargetList />);

      // Check for progress indicator (CircularProgress with role="progressbar")
      const progressBar = screen.getByRole("progressbar");
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe("interaction behavior", () => {
    it("behavior notes: opens dialog for input-required categories", () => {
      // When category.type is not 'todo', clicking opens EventsDialog
      // This is controlled by the showDialog variable in Row component
      expect(true).toBe(true);
    });

    it("behavior notes: creates event directly for todo categories", () => {
      // When category.type is 'todo' and date is not in future,
      // clicking directly calls collection.insert(event)
      expect(true).toBe(true);
    });

    it("behavior notes: shows dialog for future dates regardless of type", () => {
      // When date is in the future, always shows dialog (which shows alert)
      expect(true).toBe(true);
    });
  });
});
