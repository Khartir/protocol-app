import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
    deps: {
      optimizer: {
        web: {
          enabled: true,
          include: [
            "@mui/material",
            "@mui/icons-material",
            "@mui/x-charts",
            "@mui/x-date-pickers",
            "@emotion/react",
            "@emotion/styled",
            "rxdb",
            "rxdb-hooks",
            "recharts",
            "formik",
            "yup",
            "dayjs",
          ],
        },
      },
    },
  },
});
