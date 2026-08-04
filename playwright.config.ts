import { defineConfig, devices } from '@playwright/test';

/**
 * E2E tests run against the dev server (started automatically below).
 *
 * Tests under e2e/authenticated/ need a real Cognito test user. Provide it via
 * environment variables before running:
 *
 *   $env:E2E_EMAIL = 'test-user@example.com'
 *   $env:E2E_PASSWORD = '...'
 *
 * Without credentials, only the guest tests run.
 */
const hasCredentials = !!process.env.E2E_EMAIL && !!process.env.E2E_PASSWORD;

const AUTH_STATE = 'e2e/.auth/user.json';

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm start',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'guest',
      testIgnore: ['**/authenticated/**'],
      use: { ...devices['Desktop Chrome'] },
    },
    ...(hasCredentials
      ? [
          {
            name: 'setup',
            testMatch: /auth\.setup\.ts/,
            use: { ...devices['Desktop Chrome'] },
          },
          {
            name: 'authenticated',
            testMatch: ['authenticated/**/*.spec.ts'],
            dependencies: ['setup'],
            use: { ...devices['Desktop Chrome'], storageState: AUTH_STATE },
          },
        ]
      : []),
  ],
});

export { AUTH_STATE };
