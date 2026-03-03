// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Pricing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pricing');
  });

  test('renders the pricing page heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /choose your plan/i })
    ).toBeVisible();
    await expect(
      page.getByText(/select the perfect plan/i)
    ).toBeVisible();
  });

  test('displays all three pricing plans', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Basic Plan' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Premium Plan' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pro Plan' })).toBeVisible();
  });

  test('shows correct prices for each plan', async ({ page }) => {
    await expect(page.getByText('$12.99')).toBeVisible();
    await expect(page.getByText('$29.99')).toBeVisible();
    await expect(page.getByText('$49.99')).toBeVisible();
  });

  test('Premium plan has "Most Popular" badge', async ({ page }) => {
    await expect(page.getByText('Most Popular')).toBeVisible();
  });

  test('Basic plan lists its features', async ({ page }) => {
    await expect(page.getByText('Basic pricing models')).toBeVisible();
    await expect(page.getByText('24/7 Support')).toBeVisible();
    await expect(page.getByText('Basic Analytics')).toBeVisible();
  });

  test('Premium plan lists its features', async ({ page }) => {
    await expect(page.getByText('Everything in Basic')).toBeVisible();
    await expect(page.getByText('Advanced Analytics')).toBeVisible();
    await expect(page.getByText('Priority Support')).toBeVisible();
    await expect(page.getByText('Custom Integrations')).toBeVisible();
  });

  test('Pro plan lists its features', async ({ page }) => {
    await expect(page.getByText('Everything in Premium')).toBeVisible();
    await expect(page.getByText('White-label Solution')).toBeVisible();
    await expect(page.getByText('Dedicated Account Manager')).toBeVisible();
    await expect(page.getByText('SLA Guarantee')).toBeVisible();
  });

  test('shows CTA buttons for each plan', async ({ page }) => {
    const getStartedBtns = page.getByRole('button', { name: /get started/i });
    await expect(getStartedBtns).toHaveCount(2);

    await expect(
      page.getByRole('button', { name: /contact sales/i })
    ).toBeVisible();
  });

  test('shows 14-day free trial note', async ({ page }) => {
    await expect(
      page.getByText(/14-day free trial/i)
    ).toBeVisible();
    await expect(
      page.getByText(/no credit card required/i)
    ).toBeVisible();
  });

  test('plan descriptions match expected text', async ({ page }) => {
    await expect(page.getByText('Perfect for getting started')).toBeVisible();
    await expect(page.getByText('Best for growing businesses')).toBeVisible();
    await expect(page.getByText('For enterprise solutions')).toBeVisible();
  });
});
