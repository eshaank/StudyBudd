// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Signup Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signup');
  });

  test('renders the signup page heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /create your account/i })
    ).toBeVisible();
    await expect(page.getByText(/sign up to start using/i)).toBeVisible();
  });

  test('has email, password, and confirm password fields', async ({ page }) => {
    await expect(page.getByPlaceholder('you@school.edu')).toBeVisible();

    // Two password fields (password + confirm)
    const passwordFields = page.getByPlaceholder('••••••••');
    await expect(passwordFields).toHaveCount(2);
  });

  test('Sign up button is disabled when fields are empty', async ({ page }) => {
    const signupBtn = page.getByRole('button', { name: /sign up/i });
    await expect(signupBtn).toBeDisabled();
  });

  test('Sign up button becomes enabled with valid inputs', async ({ page }) => {
    await page.getByPlaceholder('you@school.edu').fill('test@example.com');

    const pwFields = page.getByPlaceholder('••••••••');
    await pwFields.nth(0).fill('password123');
    await pwFields.nth(1).fill('password123');

    const signupBtn = page.getByRole('button', { name: /sign up/i });
    await expect(signupBtn).toBeEnabled();
  });

  test('shows email validation error for invalid email', async ({ page }) => {
    const emailInput = page.getByPlaceholder('you@school.edu');
    await emailInput.fill('bad-email');
    await emailInput.blur();

    await expect(page.getByText('Enter a valid email.')).toBeVisible();
  });

  test('shows password too short error', async ({ page }) => {
    const pwFields = page.getByPlaceholder('••••••••');
    await pwFields.nth(0).fill('abc');
    await pwFields.nth(0).blur();

    await expect(page.getByText('Password must be at least 6 characters.')).toBeVisible();
  });

  test('shows password mismatch error', async ({ page }) => {
    const pwFields = page.getByPlaceholder('••••••••');
    await pwFields.nth(0).fill('password123');
    await pwFields.nth(1).fill('differentpw');
    await pwFields.nth(1).blur();

    await expect(page.getByText('Passwords do not match.')).toBeVisible();
  });

  test('shows confirm password required error', async ({ page }) => {
    const pwFields = page.getByPlaceholder('••••••••');
    await pwFields.nth(1).click();
    await pwFields.nth(1).blur();

    await expect(page.getByText('Please confirm your password.')).toBeVisible();
  });

  test('password show/hide toggle works for both fields', async ({ page }) => {
    const showBtns = page.getByRole('button', { name: 'Show' });
    const pwFields = page.getByPlaceholder('••••••••');

    // Both start as password type
    await expect(pwFields.nth(0)).toHaveAttribute('type', 'password');
    await expect(pwFields.nth(1)).toHaveAttribute('type', 'password');

    // Toggle first password field
    await showBtns.nth(0).click();
    await expect(pwFields.nth(0)).toHaveAttribute('type', 'text');
  });

  test('has "Continue with Google" button', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /continue with google/i })
    ).toBeVisible();
  });

  test('has a link to login page', async ({ page }) => {
    const loginLink = page.getByRole('link', { name: /log in/i });
    await expect(loginLink).toBeVisible();
    await loginLink.click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('displays the right-side visual panel on desktop', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /build better study habits/i })
    ).toBeVisible();

    await expect(page.getByText('Create goals & streaks')).toBeVisible();
    await expect(page.getByText('AI notes & flashcards')).toBeVisible();
    await expect(page.getByText('Smart quizzes')).toBeVisible();
    await expect(page.getByText('Study agents')).toBeVisible();
  });
});
