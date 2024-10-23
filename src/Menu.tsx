import { Home, Settings } from "@mui/icons-material";
import { BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";
import { Link, useLocation } from "react-router-dom";

export function Menu() {
  return (
    <Paper
      sx={{ position: "fixed", bottom: 0, left: 0, right: 0 }}
      elevation={3}
    >
      <BottomNavigation value={useLocation().pathname}>
        <BottomNavigationAction
          label="Home"
          to="/"
          component={Link}
          value="/"
          icon={<Home />}
        />
        <BottomNavigationAction
          label="Einstellungen"
          to="/settings"
          value="/settings"
          component={Link}
          icon={<Settings />}
        />
      </BottomNavigation>
    </Paper>
  );
}
