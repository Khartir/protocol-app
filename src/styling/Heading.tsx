import { ReactNode } from "react";
import { Typography } from "@mui/material";

export function Heading({ children }: { children: ReactNode }) {
  return (
    <Typography variant="h4" align="center">
      {children}
    </Typography>
  );
}
