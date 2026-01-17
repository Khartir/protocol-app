import { render, RenderOptions } from "@testing-library/react";
import { ReactElement, ReactNode } from "react";
import { Provider as JotaiProvider } from "jotai";
import { ThemeProvider } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { theme } from "../../styling/theme";
import "dayjs/locale/de";

/**
 * All providers that wrap the test component.
 */
// eslint-disable-next-line react-refresh/only-export-components
function AllProviders({ children }: { children: ReactNode }) {
  return (
    <JotaiProvider>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="de">
          {children}
        </LocalizationProvider>
      </ThemeProvider>
    </JotaiProvider>
  );
}

/**
 * Custom render function that wraps components with all necessary providers.
 * Use this instead of @testing-library/react's render for component tests.
 *
 * @example
 * ```typescript
 * import { renderWithProviders, screen } from "../test/utils/render-with-providers";
 *
 * test("renders component", () => {
 *   renderWithProviders(<MyComponent />);
 *   expect(screen.getByText("Hello")).toBeInTheDocument();
 * });
 * ```
 */
export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything from testing-library for convenience
// eslint-disable-next-line react-refresh/only-export-components
export * from "@testing-library/react";
export { renderWithProviders as render };
