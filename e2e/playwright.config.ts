import { defineConfig, devices } from '@playwright/test'

const port = Number(process.env.PLAYWRIGHT_WEB_PORT ?? '7357')
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 120_000,
  expect: {
    timeout: 20_000,
  },
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1600, height: 1000 },
    launchOptions: {
      args: ['--force-renderer-accessibility'],
    },
  },
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: `powershell -NoProfile -Command "flutter build web --release; npx http-server ../build/web -p ${port} -c-1"`,
        cwd: '..',
        url: baseURL,
        timeout: 420_000,
        reuseExistingServer: true,
      },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
