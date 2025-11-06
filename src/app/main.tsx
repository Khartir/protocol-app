import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/roboto/300.css";
import "@fontsource/roboto/400.css";
import "@fontsource/roboto/500.css";
import "@fontsource/roboto/700.css";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import utc from "dayjs/plugin/utc";

import timezone from "dayjs/plugin/timezone"; // ES 2015
import dayjs from "dayjs";

dayjs.extend(utc);
dayjs.extend(timezone);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
