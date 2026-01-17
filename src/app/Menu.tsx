import { Add, Analytics, Flag, Home, Settings } from "@mui/icons-material";
import { BottomNavigation, BottomNavigationAction, Fab, Paper } from "@mui/material";
import { useSetAtom } from "jotai";
import { Link, useLocation } from "react-router-dom";
import { addState } from "./atoms";

export function Menu() {
  const setAdd = useSetAtom(addState);
  const style = { width: "calc(25vw - 1rem)", px: 1, minWidth: 3 };
  return (
    <Paper sx={{ position: "fixed", bottom: 0, left: 0, right: 0 }} elevation={3}>
      <Fab
        sx={{
          position: "absolute",
          left: "50%",
          top: "-50%",
          transform: "translate(-50%)",
        }}
        size="medium"
        color="primary"
        onClick={() => setAdd(true)}
      >
        <Add />
      </Fab>
      <BottomNavigation sx={{ width: "100vw" }} value={useLocation().pathname}>
        <BottomNavigationAction
          label="Home"
          sx={style}
          to="/"
          component={Link}
          value="/"
          icon={<Home />}
        />
        <BottomNavigationAction
          label="Ziele"
          sx={style}
          to="/target"
          component={Link}
          value="/target"
          icon={<Flag />}
        />
        <BottomNavigationAction
          label="Kategorien"
          sx={style}
          to="/settings"
          value="/settings"
          component={Link}
          icon={<Settings />}
        />
        <BottomNavigationAction
          label="Auswertung"
          sx={style}
          to="/analytics"
          value="/analytics"
          component={Link}
          icon={<Analytics />}
        />
      </BottomNavigation>
    </Paper>
  );
}
