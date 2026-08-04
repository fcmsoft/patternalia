import { test as setup, expect } from '@playwright/test';
import { AUTH_STATE } from '../playwright.config';

/**
 * Logs in once through the real form and saves the browser storage state
 * (Cognito tokens live in localStorage). All tests in the "authenticated"
 * project reuse this state instead of logging in themselves.
 */
setup('authenticate', async ({ page }) => {
  await page.goto('/auth/login');

  await page.getByLabel('Email').fill(process.env.E2E_EMAIL!);
  await page.getByLabel('Password', { exact: true }).fill(process.env.E2E_PASSWORD!);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/\/patterns/, { timeout: 15_000 });

  await page.context().storageState({ path: AUTH_STATE });
});
