// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Contact Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact');
  });

  test('renders the contact page heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /get in touch/i })
    ).toBeVisible();
    await expect(
      page.getByText(/have a question or feedback/i)
    ).toBeVisible();
  });

  test('has a "Back to home" link', async ({ page }) => {
    const backLink = page.getByRole('link', { name: /back to home/i });
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute('href', '/');
  });

  test('displays the contact form with all fields', async ({ page }) => {
    await expect(page.getByLabel(/your name/i)).toBeVisible();
    await expect(page.getByLabel(/email address/i)).toBeVisible();
    await expect(page.getByLabel(/message/i)).toBeVisible();
  });

  test('has correct placeholder text', async ({ page }) => {
    await expect(page.getByPlaceholder('John Doe')).toBeVisible();
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
    await expect(page.getByPlaceholder('How can we help you?')).toBeVisible();
  });

  test('has a Send Message submit button', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /send message/i })
    ).toBeVisible();
  });

  test('all fields are required', async ({ page }) => {
    await expect(page.getByLabel(/your name/i)).toHaveAttribute('required', '');
    await expect(page.getByLabel(/email address/i)).toHaveAttribute('required', '');
    await expect(page.getByLabel(/message/i)).toHaveAttribute('required', '');
  });

  test('form can be filled out', async ({ page }) => {
    await page.getByLabel(/your name/i).fill('John Doe');
    await page.getByLabel(/email address/i).fill('john@example.com');
    await page.getByLabel(/message/i).fill('This is a test message.');

    // Verify values are set
    await expect(page.getByLabel(/your name/i)).toHaveValue('John Doe');
    await expect(page.getByLabel(/email address/i)).toHaveValue('john@example.com');
    await expect(page.getByLabel(/message/i)).toHaveValue('This is a test message.');
  });

  test('submitting form shows success message', async ({ page }) => {
    await page.getByLabel(/your name/i).fill('John Doe');
    await page.getByLabel(/email address/i).fill('john@example.com');
    await page.getByLabel(/message/i).fill('Hello, this is a test.');

    await page.getByRole('button', { name: /send message/i }).click();

    await expect(page.getByText('Message Sent!')).toBeVisible();
    await expect(
      page.getByText(/we'll get back to you/i)
    ).toBeVisible();
  });

  test('success state shows "Back to Home" link', async ({ page }) => {
    await page.getByLabel(/your name/i).fill('Test');
    await page.getByLabel(/email address/i).fill('test@test.com');
    await page.getByLabel(/message/i).fill('Test message');

    await page.getByRole('button', { name: /send message/i }).click();

    const backLink = page.getByRole('link', { name: /back to home/i });
    await expect(backLink).toBeVisible();
    await expect(backLink).toHaveAttribute('href', '/');
  });
});
