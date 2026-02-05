import { Outlet } from "react-router-dom";
import { Menu } from "./Menu";
import { Box, CssBaseline, ThemeProvider } from "@mui/material";
import { Provider } from "rxdb-hooks";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { deDE } from "@mui/x-date-pickers/locales";
import "dayjs/locale/de";
import { theme } from "../styling/theme";
import { useDatabase } from "../database/setup";

export function App() {
  const db = useDatabase();
  return (
    <Provider db={db}>
      <ThemeProvider theme={theme}>
        <LocalizationProvider
          dateAdapter={AdapterDayjs}
          adapterLocale="de"
          localeText={deDE.components.MuiLocalizationProvider.defaultProps.localeText}
        >
          <Box sx={{ pb: 7.5 }}>
            <CssBaseline />
            <Outlet />
            <Menu />
          </Box>
        </LocalizationProvider>
      </ThemeProvider>
    </Provider>
  );
}
