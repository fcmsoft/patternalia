import { test, expect } from '@playwright/test';

test.describe('patterns library (signed in)', () => {
  test('shows the app shell instead of redirecting to login', async ({ page }) => {
    await page.goto('/patterns');

    await expect(page).toHaveURL(/\/patterns/);
    await expect(page.getByRole('link', { name: 'Patternalia home' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
  });
});
