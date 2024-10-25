import { Outlet } from "react-router-dom";
import { Menu } from "./Menu";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { theme } from "./styling/theme";
import { useDatabase } from "./database/setup";
import { Provider } from "rxdb-hooks";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import "dayjs/locale/de";

export function App() {
  const db = useDatabase();
  return (
    <Provider db={db}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="de">
          <CssBaseline />
          <Outlet />
          <Menu />
        </LocalizationProvider>
      </ThemeProvider>
    </Provider>
  );
}
