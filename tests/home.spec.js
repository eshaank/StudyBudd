// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Home / Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders the StudyBudd logo', async ({ page }) => {
    const logo = page.getByAltText('StudyBudd logo');
    await expect(logo).toBeVisible();
  });

  test('displays the typing hero text', async ({ page }) => {
    await expect(
      page.getByText('Improve your learning skills', { exact: false })
    ).toBeVisible();

    await expect(
      page.getByText('Create effective cheat sheets', { exact: false })
    ).toBeVisible();
  });

  test('has "ENROLL NOW!!" button linking to /signup', async ({ page }) => {
    const enrollBtn = page.getByRole('link', { name: /enroll now/i });
    await expect(enrollBtn).toBeVisible();
    await expect(enrollBtn).toHaveAttribute('href', '/signup');
  });

  test('has "Go to Dashboard" button', async ({ page }) => {
    const dashBtn = page.getByRole('link', { name: /go to dashboard/i });
    await expect(dashBtn).toBeVisible();
    await expect(dashBtn).toHaveAttribute('href', '/dashboard');
  });

  test('displays the AI-Powered Features section', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /ai-powered features/i })
    ).toBeVisible();
  });

  test('shows feature cards in the carousel', async ({ page }) => {
    await expect(page.getByText('Study Prep Sheets')).toBeVisible();
    await expect(page.getByText('Learning Paths')).toBeVisible();
    await expect(page.getByText('Smart Quizzes')).toBeVisible();
    await expect(page.getByText('Analytics Dashboard')).toBeVisible();
  });

  test('ENROLL NOW button navigates to signup page', async ({ page }) => {
    await page.getByRole('link', { name: /enroll now/i }).click();
    await expect(page).toHaveURL(/\/signup/);
  });
});
