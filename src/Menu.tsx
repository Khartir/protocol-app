import { Add, Analytics, Flag, Home, Settings } from "@mui/icons-material";
import {
  BottomNavigation,
  BottomNavigationAction,
  Fab,
  Paper,
} from "@mui/material";
import { atom, useSetAtom } from "jotai";
import { Link, useLocation } from "react-router-dom";

export const addState = atom(false);

export function Menu() {
  const setAdd = useSetAtom(addState);
  return (
    <Paper
      sx={{ position: "fixed", bottom: 0, left: 0, right: 0 }}
      elevation={3}
    >
      <Fab
        sx={{ position: "absolute", left: "50%", top: "-50%" }}
        color="primary"
        onClick={() => setAdd(true)}
      >
        <Add />
      </Fab>
      <BottomNavigation value={useLocation().pathname}>
        <BottomNavigationAction
          label="Home"
          to="/"
          component={Link}
          value="/"
          icon={<Home />}
        />
        <BottomNavigationAction
          label="Ziele"
          to="/target"
          component={Link}
          value="/target"
          icon={<Flag />}
        />
        <BottomNavigationAction />
        <BottomNavigationAction
          label="Kategorien"
          to="/settings"
          value="/settings"
          component={Link}
          icon={<Settings />}
        />
        <BottomNavigationAction
          label="Auswertung"
          to="/analytics"
          value="/analytics"
          component={Link}
          icon={<Analytics />}
        />
      </BottomNavigation>
    </Paper>
  );
}
