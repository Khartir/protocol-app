import { describe, it, expect, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import dayjs from "dayjs";
import { renderWithProviders } from "../test/utils/render-with-providers";
import { DateSelect } from "./Home";

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

describe("DateSelect", () => {
  it("updates the displayed date when a new date is selected via calendar", async () => {
    const user = userEvent.setup();

    renderWithProviders(<DateSelect />);

    const today = dayjs().startOf("day");
    const yesterday = today.subtract(1, "day");

    // Get the hidden input that holds the displayed value
    const hiddenInput = document.querySelector(
      "input.MuiPickersInputBase-input",
    ) as HTMLInputElement;
    expect(hiddenInput).not.toBeNull();
    const currentValue = hiddenInput.value;

    // Open the calendar popup - find the open picker button (calendar icon)
    const openButton = screen.getByRole("button", {
      name: /datum auswählen/i,
    });
    await user.click(openButton);

    // Find the calendar popup
    const dialog = await screen.findByRole("dialog");

    // Find and click yesterday's date in the calendar
    const yesterdayButton = within(dialog).getByRole("gridcell", {
      name: yesterday.date().toString(),
    });
    await user.click(yesterdayButton);

    // The displayed value should have changed to yesterday's date
    expect(hiddenInput.value).not.toBe(currentValue);
  });
});
