import { test, expect } from '@playwright/test';

test.describe('login page', () => {
  test('redirects unauthenticated visitors to login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/auth\/login/);
    await expect(page.getByRole('heading', { name: /Patternalia/ })).toBeVisible();
  });

  test('renders the sign-in form with submit disabled until valid', async ({ page }) => {
    await page.goto('/auth/login');

    const email = page.getByLabel('Email');
    const password = page.getByLabel('Password', { exact: true });
    const submit = page.getByRole('button', { name: 'Sign in' });

    await expect(email).toBeVisible();
    await expect(password).toBeVisible();
    await expect(submit).toBeDisabled();

    await email.fill('someone@example.com');
    await password.fill('a-password');
    await expect(submit).toBeEnabled();
  });

  test('shows a validation message for an invalid email', async ({ page }) => {
    await page.goto('/auth/login');

    const email = page.getByLabel('Email');
    await email.fill('not-an-email');
    await email.blur();

    await expect(page.getByText('A valid email is required.')).toBeVisible();
  });

  test('links to registration and password recovery', async ({ page }) => {
    await page.goto('/auth/login');

    await page.getByRole('link', { name: 'Create account' }).click();
    await expect(page).toHaveURL(/\/auth\/register/);

    await page.goBack();
    await page.getByRole('link', { name: 'Forgot password?' }).click();
    await expect(page).toHaveURL(/\/auth\/forgot-password/);
  });
});
