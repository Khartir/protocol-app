import { Outlet } from "react-router-dom";
import { Menu } from "./Menu";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { theme } from "./styling/theme";

export function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Outlet />
      <Menu />
    </ThemeProvider>
  );
}
