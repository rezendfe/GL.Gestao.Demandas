import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./playwright",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "retain-on-failure",
    screenshot: "on",
  },
  projects: [
    { name: "celular", use: { viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true } },
    { name: "computador", use: { viewport: { width: 1440, height: 900 } } },
  ],
});
