import { Outlet } from "react-router-dom";
import { Menu } from "./Menu";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { theme } from "./styling/theme";
import { useDatabase } from "./database/setup";
import { Provider } from "rxdb-hooks";

export function App() {
  const db = useDatabase();
  return (
    <Provider db={db}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Outlet />
        <Menu />
      </ThemeProvider>
    </Provider>
  );
}
