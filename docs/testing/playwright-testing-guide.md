# Playwright E2E Testing Guide

A practical guide for anyone on the team who needs to set up Playwright, understand the existing tests, and write their own. This covers everything from first-time installation to writing tests for new pages and features.

---

## Prerequisites

Before you start, make sure you have:

- **Node.js** (v18 or later). Check with `node --version`. If you need to install it: https://nodejs.org/
- **Git** with access to our GitLab repo.
- The **web app** able to run locally (`npm run dev` inside `apps/web` should start the dev server on `http://localhost:3000`).

---

## Initial setup after git pull

When you pull the repo for the first time (or pull a branch that adds the Playwright config), you need to do two things: install the npm dependencies and install the browser binaries that Playwright uses.

### Step 1 -- Install npm dependencies

From the **project root** (not `apps/web`):

```bash
npm install
```

This installs `@playwright/test` and `@types/node` listed in the root `package.json`. You only need to do this once, or again if `package.json` changes.

### Step 2 -- Install Playwright browsers

```bash
npx playwright install --with-deps
```

This downloads Chromium, Firefox, and WebKit binaries that Playwright controls. The `--with-deps` flag also installs OS-level dependencies (fonts, libraries) that the browsers need. On Ubuntu/WSL this matters a lot -- without it you will get missing library errors.

This step can take a few minutes the first time. The binaries are cached in your home directory (`~/.cache/ms-playwright/`) so subsequent runs are fast.

### Step 3 -- Verify it works

Start the dev server in one terminal:

```bash
cd apps/web
npm run dev
```

Then in another terminal, from the project root:

```bash
npx playwright test --project=chromium
```

If everything is set up right, you should see test results printed in the terminal. If you want to watch the tests run in a visible browser window:

```bash
npx playwright test --project=chromium --headed
```

---

## Project structure -- where things live

```
study-budd/
  package.json              <-- root-level, has @playwright/test as devDependency
  playwright.config.js      <-- Playwright configuration
  tests/                    <-- all test files go here
    home.spec.js
    navbar.spec.js
    login.spec.js
    signup.spec.js
    features.spec.js
    pricing.spec.js
    contact.spec.js
    auth-redirect.spec.js
    example.spec.js         <-- placeholder, replaced by the above files
  apps/
    web/                    <-- the Next.js app being tested
```

The config, the test directory, and the root `package.json` all sit at the repo root, not inside `apps/web`. This is intentional -- Playwright tests live outside the app they are testing.

---

## Understanding playwright.config.js

Here is what our config does and why:

```js
export default defineConfig({
  testDir: './tests',           // where Playwright looks for *.spec.js files
  fullyParallel: true,          // run tests in parallel for speed
  forbidOnly: !!process.env.CI, // fail the CI run if someone left a .only() in a test
  retries: process.env.CI ? 2 : 0,  // retry flaky tests on CI, not locally
  workers: process.env.CI ? 1 : undefined, // single worker on CI for stability
  reporter: 'html',            // generates an HTML report you can open in a browser

  use: {
    baseURL: 'http://localhost:3000',  // page.goto('/login') resolves to this
    trace: 'on-first-retry',          // captures a trace file on first retry (for debugging)
    screenshot: 'only-on-failure',    // takes a screenshot when a test fails
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit',   use: { ...devices['Desktop Safari'] } },
  ],

  webServer: {
    command: 'npm run dev',       // Playwright starts this if the server isn't running
    cwd: './apps/web',            // run it from the web app directory
    url: 'http://localhost:3000', // wait for this URL to respond before running tests
    reuseExistingServer: true,    // if localhost:3000 is already up, skip starting it
    timeout: 120000,              // wait up to 2 minutes for the server to start
  },
});
```

Key takeaway: you do not need to manually start the dev server. If it is already running, Playwright reuses it. If not, Playwright starts it for you and waits until it is ready.

---

## How to run tests

All commands are run from the **project root**.

### Run everything

```bash
npx playwright test
```

This runs all `*.spec.js` files in `tests/` across all three browsers (Chromium, Firefox, WebKit).

### Run a single test file

```bash
npx playwright test tests/login.spec.js
```

### Run tests in one browser only

```bash
npx playwright test --project=chromium
```

### Watch the browser while tests run

```bash
npx playwright test --headed
```

### Interactive UI mode (best for development)

```bash
npx playwright test --ui
```

Opens a visual interface where you can pick individual tests, watch them execute, see screenshots at each step, and re-run on changes. This is the most useful mode when you are writing new tests.

### Debug mode (step through one action at a time)

```bash
npx playwright test --debug
```

Opens the Playwright Inspector, which lets you pause, step forward, and inspect the page at each point.

### View the HTML report after a run

```bash
npx playwright show-report
```

Opens the generated report in your browser with pass/fail details, screenshots on failure, and trace files.

---

## Existing test coverage

Here is what is already tested so you know what not to duplicate:

| File | What it covers |
|------|---------------|
| `home.spec.js` | Landing page: logo, hero text, "Enroll Now" button, feature cards carousel, navigation to signup |
| `navbar.spec.js` | Logged-out navbar: brand name, nav links (Features, Pricing, Quizzes), Login/Signup buttons, link navigation, logo home link |
| `login.spec.js` | Login page: heading, form fields, disabled submit button, email/password validation errors, show/hide toggle, Google button, forgot password, signup link, right-side panel |
| `signup.spec.js` | Signup page: heading, form fields (email, password, confirm), disabled submit, validation errors (email, password length, mismatch, confirm required), show/hide toggle, Google button, login link, right-side panel |
| `features.spec.js` | Features page: hero section, tab switching (Smart Search, Pomodoro, Quiz Generator), tab content visibility, More Study Tools section, CTA |
| `pricing.spec.js` | Pricing page: heading, three plans with prices, "Most Popular" badge, feature lists per plan, CTA buttons, free trial note |
| `contact.spec.js` | Contact page: heading, form fields with placeholders, required attributes, form fill, submit shows success message, back-to-home link |
| `auth-redirect.spec.js` | Auth guards: unauthenticated visits to /dashboard, /dashboard/chat, /dashboard/files, /dashboard/quizzes, /dashboard/flashcards, and /account all redirect to /login |

---

## Writing your own tests

### File naming

Create a new file in the `tests/` directory. Name it after the page or feature you are testing:

```
tests/your-page.spec.js
```

The `.spec.js` extension is required -- that is how Playwright finds test files.

### Basic test structure

Every test file follows the same pattern:

```js
// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Page or Feature Name', () => {

  // Runs before every test in this block.
  // Navigate to the page you are testing.
  test.beforeEach(async ({ page }) => {
    await page.goto('/your-page');
  });

  test('what the test checks in plain english', async ({ page }) => {
    // Find something on the page and assert something about it.
    await expect(page.getByRole('heading', { name: /your heading/i })).toBeVisible();
  });
});
```

The `// @ts-check` at the top enables type checking in your editor so you get autocomplete and inline errors. It is not required but it helps.

### Finding elements on the page

Playwright gives you several ways to locate elements. Here are the ones we use in this project, from most preferred to least:

**By role (best option when it works)**

```js
page.getByRole('button', { name: /submit/i })
page.getByRole('link', { name: /sign up/i })
page.getByRole('heading', { name: /welcome/i })
```

Using roles makes tests resilient to CSS and layout changes. The `/i` flag makes matching case-insensitive.

**By text content**

```js
page.getByText('Smart Quizzes')
page.getByText(/some partial text/i)
```

Good for verifying that content is visible. Use `{ exact: true }` if you need an exact match.

**By placeholder text (for inputs)**

```js
page.getByPlaceholder('you@school.edu')
page.getByPlaceholder('••••••••')
```

**By label (for form fields)**

```js
page.getByLabel(/your name/i)
page.getByLabel(/email address/i)
```

**By alt text (for images)**

```js
page.getByAltText('StudyBudd logo')
```

**By test ID (last resort)**

```js
page.getByTestId('quiz-score')
```

This requires adding `data-testid="quiz-score"` to the HTML element. Use this only when none of the above work. We have not needed it so far.

### Common assertions

```js
// Check something is visible on the page
await expect(element).toBeVisible();

// Check something is hidden
await expect(element).toBeHidden();

// Check a link has the right href
await expect(link).toHaveAttribute('href', '/signup');

// Check a button is disabled
await expect(button).toBeDisabled();

// Check a button is enabled
await expect(button).toBeEnabled();

// Check an input has a specific value
await expect(input).toHaveValue('test@example.com');

// Check the current URL
await expect(page).toHaveURL(/\/login/);

// Check how many matching elements exist
await expect(page.getByPlaceholder('••••••••')).toHaveCount(2);

// Check an input's type attribute (password vs text)
await expect(input).toHaveAttribute('type', 'password');
```

### Interacting with the page

```js
// Click a button or link
await page.getByRole('button', { name: /submit/i }).click();

// Type into an input
await page.getByPlaceholder('you@school.edu').fill('test@example.com');

// Blur an input (trigger validation)
await page.getByPlaceholder('you@school.edu').blur();

// Navigate to a URL
await page.goto('/features');

// Select a specific element when there are multiple matches
await page.getByRole('link', { name: 'Features' }).first().click();
// or by index:
await page.getByPlaceholder('••••••••').nth(0).fill('password123');
```

### Testing page navigation

```js
test('clicking Login goes to /login', async ({ page }) => {
  await page.getByRole('link', { name: /log in/i }).click();
  await expect(page).toHaveURL(/\/login/);
});
```

### Testing form validation

This pattern shows up a lot in our tests. Fill a field with bad data, blur it (move focus away), and check for the error message:

```js
test('shows error for invalid email', async ({ page }) => {
  const emailInput = page.getByPlaceholder('you@school.edu');
  await emailInput.fill('not-an-email');
  await emailInput.blur();

  await expect(page.getByText('Enter a valid email.')).toBeVisible();
});
```

### Testing tab switching or content toggling

```js
test('clicking Pomodoro tab shows pomodoro content', async ({ page }) => {
  await page.getByRole('button', { name: /pomodoro timer/i }).click();

  // New content visible
  await expect(
    page.getByRole('heading', { name: /try our pomodoro feature/i })
  ).toBeVisible();
});

test('switching tabs hides previous content', async ({ page }) => {
  // Default tab content visible
  await expect(page.getByRole('heading', { name: /smart search/i })).toBeVisible();

  // Switch tab
  await page.getByRole('button', { name: /quiz generator/i }).click();

  // Old content hidden
  await expect(page.getByRole('heading', { name: /smart search/i })).toBeHidden();

  // New content visible
  await expect(page.getByRole('heading', { name: /generate better quizzes/i })).toBeVisible();
});
```

### Testing auth-protected routes

If a page requires login, an unauthenticated user gets redirected. Test this with a longer timeout since the redirect goes through middleware:

```js
test('visiting /dashboard redirects to /login', async ({ page }) => {
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
});
```

---

## A full example: writing a test for a new page

Say someone adds a `/resources` page. Here is how you would test it end to end.

Create `tests/resources.spec.js`:

```js
// @ts-check
import { test, expect } from '@playwright/test';

test.describe('Resources Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/resources');
  });

  test('renders the page heading', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /resources/i })
    ).toBeVisible();
  });

  test('displays resource cards', async ({ page }) => {
    await expect(page.getByText('Study Guides')).toBeVisible();
    await expect(page.getByText('Practice Problems')).toBeVisible();
  });

  test('search bar filters results', async ({ page }) => {
    await page.getByPlaceholder('Search resources...').fill('algebra');

    // Matching card stays
    await expect(page.getByText('Algebra Basics')).toBeVisible();

    // Non-matching card disappears
    await expect(page.getByText('Biology Notes')).toBeHidden();
  });

  test('clicking a resource card navigates to detail page', async ({ page }) => {
    await page.getByText('Study Guides').click();
    await expect(page).toHaveURL(/\/resources\/study-guides/);
  });
});
```

Run just that file to check:

```bash
npx playwright test tests/resources.spec.js --project=chromium --headed
```

---

## CI pipeline

There is a GitHub Actions workflow at `.github/workflows/playwright.yml` that runs automatically on pushes and pull requests to `main`/`master`. It does the same steps you do locally:

1. Checks out the code.
2. Installs npm dependencies (`npm ci`).
3. Installs Playwright browsers (`npx playwright install --with-deps`).
4. Runs `npx playwright test`.
5. Uploads the HTML report as an artifact (kept for 30 days).

You do not need to configure anything for CI. If your tests pass locally, they should pass in the pipeline. If a test fails in CI, download the `playwright-report` artifact from the pipeline run to see screenshots and traces.

---

## Tips and common problems

### "Browser was not installed"

Run `npx playwright install --with-deps` again. This happens when Playwright gets updated or the cached browsers get cleared.

### Tests are flaky (pass sometimes, fail sometimes)

- Add `await` before every interaction and assertion. Missing awaits is the number one cause of flaky tests.
- If an element takes time to appear (loading state, animation), Playwright's `expect` already waits and retries by default (up to 5 seconds). You usually do not need explicit waits. If you do, increase the timeout:

```js
await expect(page.getByText('Loaded')).toBeVisible({ timeout: 10000 });
```

### "Locator matched multiple elements"

Use `.first()`, `.nth(0)`, or make the locator more specific. For example, if there are two "Sign Up" links on the page:

```js
// Pick the first one
page.getByRole('link', { name: /sign up/i }).first()

// Or be more specific by scoping to a section
page.locator('nav').getByRole('link', { name: /sign up/i })
```

### My page needs login to test

For pages behind auth, you have two options:

1. Test that the redirect works (like `auth-redirect.spec.js` does).
2. Set up an authenticated session. You would create a setup file that logs in once and saves the session cookies, then reuse them in tests. Playwright calls this "global setup" -- see https://playwright.dev/docs/auth for the full walkthrough. We have not set this up yet, but the config already has `/playwright/.auth/` in `.gitignore` for when we do.

### Running only one test while developing

Temporarily add `.only` to focus on a single test:

```js
test.only('my test I am working on', async ({ page }) => {
  // ...
});
```

Remove the `.only` before committing. The CI config has `forbidOnly` set to `true`, so the pipeline will fail if you leave it in. This is there on purpose to prevent accidentally skipping tests.

---

## Quick reference

| What you want to do | Command |
|---------------------|---------|
| Install everything from scratch | `npm install && npx playwright install --with-deps` |
| Run all tests | `npx playwright test` |
| Run one file | `npx playwright test tests/login.spec.js` |
| Run in one browser | `npx playwright test --project=chromium` |
| Watch tests in browser | `npx playwright test --headed` |
| Interactive UI | `npx playwright test --ui` |
| Debug with inspector | `npx playwright test --debug` |
| See the report | `npx playwright show-report` |

---

## Further reading

- Playwright docs (getting started): https://playwright.dev/docs/intro
- Writing tests: https://playwright.dev/docs/writing-tests
- Locators guide (how to find elements): https://playwright.dev/docs/locators
- Assertions reference: https://playwright.dev/docs/test-assertions
- Debugging tests: https://playwright.dev/docs/debug
- Authentication in tests: https://playwright.dev/docs/auth
- CI/CD with Playwright: https://playwright.dev/docs/ci-intro
