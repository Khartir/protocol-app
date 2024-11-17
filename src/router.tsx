import { App } from "./App";
import { createBrowserRouter } from "react-router-dom";
import { Settings } from "./Settings";
import { Home } from "./Home";

import { Targets } from "./Targets";
import { Analytics } from "./Analytics";

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
