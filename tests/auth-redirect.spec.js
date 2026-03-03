// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Auth Redirects (unauthenticated)', () => {
  test('visiting /dashboard redirects to /login when not logged in', async ({ page }) => {
    await page.goto('/dashboard');

    // Middleware should redirect unauthenticated users to login
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('visiting /dashboard/chat redirects to /login when not logged in', async ({ page }) => {
    await page.goto('/dashboard/chat');
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('visiting /dashboard/files redirects to /login when not logged in', async ({ page }) => {
    await page.goto('/dashboard/files');
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('visiting /dashboard/quizzes redirects to /login when not logged in', async ({ page }) => {
    await page.goto('/dashboard/quizzes');
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('visiting /dashboard/flashcards redirects to /login when not logged in', async ({ page }) => {
    await page.goto('/dashboard/flashcards');
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('visiting /account redirects to /login when not logged in', async ({ page }) => {
    await page.goto('/account');
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });
});
