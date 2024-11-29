import { Analytics } from "../Analytics";
import { Home } from "../home/Home";
import { Settings } from "../Settings";
import { Targets } from "../Targets";
import { App } from "./App";
import { createBrowserRouter } from "react-router-dom";

export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <App />,
      children: [
        {
          index: true,
          element: <Home />,
        },
        {
          path: "/settings",
          element: <Settings />,
        },
        {
          path: "/target",
          element: <Targets />,
        },
        {
          path: "/analytics",
          element: <Analytics />,
        },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL }
);
