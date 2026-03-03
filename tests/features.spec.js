// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Features Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/features');
  });

  test('renders the hero section', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /study budd features/i })
    ).toBeVisible();
    await expect(
      page.getByText(/enhance your learning experience/i)
    ).toBeVisible();
  });

  test('shows the three feature tabs', async ({ page }) => {
    await expect(page.getByRole('button', { name: /smart search/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /pomodoro timer/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /quiz generator/i })).toBeVisible();
  });

  test('Smart Search tab is active by default and shows content', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /reduced search & research/i })
    ).toBeVisible();
    await expect(page.getByText('Smart keyword extraction')).toBeVisible();
    await expect(page.getByText('Academic source prioritization')).toBeVisible();
    await expect(page.getByText('Auto-generated summaries')).toBeVisible();
  });

  test('clicking Pomodoro Timer tab shows pomodoro content', async ({ page }) => {
    await page.getByRole('button', { name: /pomodoro timer/i }).click();

    await expect(
      page.getByRole('heading', { name: /try our pomodoro feature/i })
    ).toBeVisible();
    await expect(page.getByText(/boost your productivity/i)).toBeVisible();
    await expect(page.getByText('Study Effectively')).toBeVisible();
  });

  test('clicking Quiz Generator tab shows quiz content', async ({ page }) => {
    await page.getByRole('button', { name: /quiz generator/i }).click();

    await expect(
      page.getByRole('heading', { name: /generate better quizzes/i })
    ).toBeVisible();
    await expect(page.getByText('Multiple Choice')).toBeVisible();
    await expect(page.getByText('Fill in the Blanks')).toBeVisible();
    await expect(page.getByText('Flashcards')).toBeVisible();
  });

  test('shows More Study Tools section', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /more study tools/i })
    ).toBeVisible();
    await expect(page.getByText(/smart note-taking/i)).toBeVisible();
    await expect(page.getByText(/ai flashcard generator/i)).toBeVisible();
  });

  test('shows Swipe Feature Coming Soon section', async ({ page }) => {
    await expect(
      page.getByText(/swipe feature coming soon/i)
    ).toBeVisible();
  });

  test('shows CTA section with "Ready to Study Smarter?"', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /ready to study smarter/i })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /get started free/i })
    ).toBeVisible();
  });

  test('switching tabs hides previous content', async ({ page }) => {
    // Start on Smart Search
    await expect(
      page.getByRole('heading', { name: /reduced search & research/i })
    ).toBeVisible();

    // Switch to Quiz Generator
    await page.getByRole('button', { name: /quiz generator/i }).click();

    // Smart Search content should be hidden
    await expect(
      page.getByRole('heading', { name: /reduced search & research/i })
    ).toBeHidden();

    // Quiz content visible
    await expect(
      page.getByRole('heading', { name: /generate better quizzes/i })
    ).toBeVisible();
  });
});
