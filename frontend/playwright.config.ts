import { defineConfig, devices } from "@playwright/test";

/**
 * Real-browser journeys against a running backend. The backend is not started
 * here: run it locally against a disposable database first (see README.md,
 * "End-to-end tests"). Never point these tests at a shared or production API.
 */
const API_BASE_URL = process.env.E2E_API_BASE_URL ?? "http://localhost:8080";
/** Port for the frontend this config builds and starts; change it if 3000 is taken. */
const FRONTEND_PORT = process.env.E2E_FRONTEND_PORT ?? "3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  reporter: "list",
  use: {
    baseURL: `http://localhost:${FRONTEND_PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run build && npm run start -- --port ${FRONTEND_PORT}`,
    url: `http://localhost:${FRONTEND_PORT}/sign-in`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { NEXT_PUBLIC_API_BASE_URL: API_BASE_URL },
  },
});
