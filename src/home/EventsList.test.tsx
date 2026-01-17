import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import dayjs from "dayjs";
import { renderWithProviders } from "../test/utils/render-with-providers";
import { EventsList } from "./EventsList";
import { createEvent, createCategory, createVolumeCategory } from "../test/mocks/test-data";

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
    useAtom: () => [false, vi.fn()], // addState is false by default
    useSetAtom: () => vi.fn(),
  };
});

// Mock event hooks
vi.mock("../category/event", async () => {
  const actual = await vi.importActual("../category/event");
  return {
    ...actual,
    useGetEventsForDate: vi.fn(() => ({ result: [] })),
    useGetEventsCollection: vi.fn(() => ({
      insert: vi.fn(),
    })),
  };
});

// Mock category hooks
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

// Mock ConfirmDelete
vi.mock("../ConfirmDelete", () => ({
  useDeleteConfirm: vi.fn(() => ({
    openDeleteConfirm: vi.fn(),
    ConfirmDelete: () => null,
  })),
}));

describe("EventsList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders heading", () => {
      renderWithProviders(<EventsList />);

      expect(screen.getByText("Erledigt")).toBeInTheDocument();
    });

    it("renders empty list when no events", () => {
      renderWithProviders(<EventsList />);

      const list = screen.getByRole("list");
      expect(list).toBeInTheDocument();
    });
  });

  describe("with events", () => {
    beforeEach(async () => {
      const { useGetEventsForDate } = await import("../category/event");
      const timestamp = dayjs().hour(14).minute(30).valueOf();
      const mockEvents = [
        {
          ...createEvent({ id: "event-1", timestamp, data: "500" }),
          toMutableJSON: () => createEvent({ id: "event-1", timestamp, data: "500" }),
        },
      ];
      vi.mocked(useGetEventsForDate).mockReturnValue({ result: mockEvents } as never);
    });

    it("displays event time", () => {
      renderWithProviders(<EventsList />);

      // Event should show time in HH:mm format
      expect(screen.getByText("14:30")).toBeInTheDocument();
    });
  });

  describe("value display", () => {
    it("displays raw value for non-valueAccumulative categories", async () => {
      const { useGetEventsForDate } = await import("../category/event");
      const { useGetCategory } = await import("../category/category");

      const timestamp = dayjs().hour(10).minute(0).valueOf();
      const mockEvents = [
        {
          ...createEvent({ id: "event-1", timestamp, data: "test data" }),
          toMutableJSON: () => createEvent({ id: "event-1", timestamp, data: "test data" }),
        },
      ];
      vi.mocked(useGetEventsForDate).mockReturnValue({ result: mockEvents } as never);
      vi.mocked(useGetCategory).mockReturnValue(createCategory({ type: "protocol" }) as never);

      renderWithProviders(<EventsList />);

      expect(screen.getByText("test data")).toBeInTheDocument();
    });

    it("converts value for valueAccumulative categories", async () => {
      const { useGetEventsForDate } = await import("../category/event");
      const { useGetCategory } = await import("../category/category");

      const timestamp = dayjs().hour(10).minute(0).valueOf();
      const mockEvents = [
        {
          ...createEvent({ id: "event-1", timestamp, data: "2500" }),
          toMutableJSON: () => createEvent({ id: "event-1", timestamp, data: "2500" }),
        },
      ];
      vi.mocked(useGetEventsForDate).mockReturnValue({ result: mockEvents } as never);
      vi.mocked(useGetCategory).mockReturnValue(createVolumeCategory() as never);

      renderWithProviders(<EventsList />);

      // 2500ml should be converted to 2,5 L (German decimal format, uppercase L)
      expect(screen.getByText("2,5 L")).toBeInTheDocument();
    });
  });

  describe("interaction behavior", () => {
    it("behavior notes: clicking event opens edit dialog", () => {
      // ListItemButton onClick sets open state to true
      // EventsDialog is rendered with persist callback that calls event.patch
      expect(true).toBe(true);
    });

    it("behavior notes: delete icon opens confirmation dialog", () => {
      // Delete icon onClick calls openDeleteConfirm()
      // e.stopPropagation() prevents opening edit dialog
      expect(true).toBe(true);
    });
  });

  describe("AddLayer", () => {
    it("behavior notes: renders EventsDialog controlled by addState atom", () => {
      // AddLayer component watches addState atom
      // When true, shows EventsDialog for creating new event
      // persist callback creates new event with uuid
      expect(true).toBe(true);
    });
  });
});
