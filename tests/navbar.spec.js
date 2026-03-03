// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Navbar (logged-out state)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('displays the StudyBudd brand name', async ({ page }) => {
    await expect(page.getByText('StudyBudd')).toBeVisible();
    await expect(page.getByText('AI Study Companion')).toBeVisible();
  });

  test('shows navigation links for logged-out users', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Features' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Pricing' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Quizzes' }).first()).toBeVisible();
  });

  test('shows Log in and Sign up buttons when logged out', async ({ page }) => {
    await expect(page.getByRole('link', { name: /log in/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible();
  });

  test('Log in link navigates to /login', async ({ page }) => {
    await page.getByRole('link', { name: /log in/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('Sign up link navigates to /signup', async ({ page }) => {
    await page.getByRole('link', { name: /sign up/i }).click();
    await expect(page).toHaveURL(/\/signup/);
  });

  test('Features link navigates to /features', async ({ page }) => {
    await page.getByRole('link', { name: 'Features' }).first().click();
    await expect(page).toHaveURL(/\/features/);
  });

  test('logo links back to home', async ({ page }) => {
    await page.goto('/features');
    await page.getByRole('link', { name: /studybudd/i }).click();
    await expect(page).toHaveURL('/');
  });
});
