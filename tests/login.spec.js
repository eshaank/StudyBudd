// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('renders the login page heading and description', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    await expect(page.getByText(/log in to continue to/i)).toBeVisible();
    await expect(page.getByText('StudyBudd', { exact: true }).first()).toBeVisible();
  });

  test('shows the StudyBudd Auth badge', async ({ page }) => {
    await expect(page.getByText(/studybudd.*auth/i)).toBeVisible();
  });

  test('has email and password input fields', async ({ page }) => {
    const emailInput = page.getByPlaceholder('you@school.edu');
    const passwordInput = page.getByPlaceholder('••••••••');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('has a Log in button that starts disabled', async ({ page }) => {
    const loginBtn = page.getByRole('button', { name: /log in/i });
    await expect(loginBtn).toBeVisible();
    await expect(loginBtn).toBeDisabled();
  });

  test('Log in button becomes enabled with valid email and password', async ({ page }) => {
    await page.getByPlaceholder('you@school.edu').fill('test@example.com');
    await page.getByPlaceholder('••••••••').fill('password123');

    const loginBtn = page.getByRole('button', { name: /log in/i });
    await expect(loginBtn).toBeEnabled();
  });

  test('shows email validation error on blur with invalid email', async ({ page }) => {
    const emailInput = page.getByPlaceholder('you@school.edu');
    await emailInput.fill('not-an-email');
    await emailInput.blur();

    await expect(page.getByText('Enter a valid email.')).toBeVisible();
  });

  test('shows email required error on blur with empty email', async ({ page }) => {
    const emailInput = page.getByPlaceholder('you@school.edu');
    await emailInput.click();
    await emailInput.blur();

    await expect(page.getByText('Email is required.')).toBeVisible();
  });

  test('shows password validation error when too short', async ({ page }) => {
    const pwInput = page.getByPlaceholder('••••••••');
    await pwInput.fill('abc');
    await pwInput.blur();

    await expect(page.getByText('Password must be at least 6 characters.')).toBeVisible();
  });

  test('shows password required error on blur with empty password', async ({ page }) => {
    const pwInput = page.getByPlaceholder('••••••••');
    await pwInput.click();
    await pwInput.blur();

    await expect(page.getByText('Password is required.')).toBeVisible();
  });

  test('Show/Hide password toggle works', async ({ page }) => {
    const pwInput = page.getByPlaceholder('••••••••');
    const showBtn = page.getByRole('button', { name: 'Show' });

    // Initially password type
    await expect(pwInput).toHaveAttribute('type', 'password');

    // Click Show
    await showBtn.click();
    await expect(pwInput).toHaveAttribute('type', 'text');
    await expect(page.getByRole('button', { name: 'Hide' })).toBeVisible();

    // Click Hide
    await page.getByRole('button', { name: 'Hide' }).click();
    await expect(pwInput).toHaveAttribute('type', 'password');
  });

  test('has a "Continue with Google" button', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /continue with google/i })
    ).toBeVisible();
  });

  test('has a "Forgot password?" link', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: /forgot password/i })
    ).toBeVisible();
  });

  test('has a link to signup page', async ({ page }) => {
    const signupLink = page.getByRole('link', { name: /sign up/i });
    await expect(signupLink).toBeVisible();
    await signupLink.click();
    await expect(page).toHaveURL(/\/signup/);
  });

  test('displays the right-side visual panel on desktop', async ({ page }) => {
    // Only visible on md+ screens
    await expect(
      page.getByRole('heading', { name: /your ai study companion/i })
    ).toBeVisible();

    await expect(page.getByText('Personalized learning paths')).toBeVisible();
    await expect(page.getByText('AI-generated notes & quizzes')).toBeVisible();
    await expect(page.getByText('Progress & streak tracking')).toBeVisible();
    await expect(page.getByText('Chat with AI study agents')).toBeVisible();
  });

  test('OR divider is visible between form and Google button', async ({ page }) => {
    await expect(page.getByText('OR')).toBeVisible();
  });
});
