/// <reference types="vitest/globals" />
import "@testing-library/jest-dom";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { afterEach, vi } from "vitest";

// Initialize dayjs plugins for date handling tests
dayjs.extend(utc);
dayjs.extend(timezone);

// Cleanup after each test
afterEach(() => {
  vi.restoreAllMocks();
});
