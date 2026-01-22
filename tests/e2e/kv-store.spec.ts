import { test, expect } from '@playwright/test';

// Type declaration for Node.js process.env (available in Playwright test environment)
declare const process: {
  env: {
    [key: string]: string | undefined;
  };
};

const NODE_URL = process.env.NODE_URL || 'http://localhost:2428';

// Configurable timeouts (in milliseconds)
// Can be overridden via environment variables for CI/slower environments
// Base timeout - multiply by 3 for longer waits
const TIMEOUT = parseInt(process.env.E2E_TIMEOUT || '5000', 10);
const WAIT = parseInt(process.env.E2E_WAIT || '500', 10);

// Derived timeouts (3x base for longer operations)
const TIMEOUT_SHORT = TIMEOUT;
const TIMEOUT_MEDIUM = TIMEOUT * 2;
const TIMEOUT_LONG = TIMEOUT * 3;
const WAIT_SHORT = WAIT;
const WAIT_MEDIUM = WAIT * 2;
const WAIT_LONG = WAIT * 3;

test.describe('KV Store E2E Tests', () => {
  test('should complete full authentication and KV store flow', async ({
    page,
  }) => {
    // Navigate to the app
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Step 1: Click "Connect" button
    const connectButton = page.locator('button:has-text("Connect")').first();
    await expect(connectButton).toBeVisible({ timeout: TIMEOUT_MEDIUM });
    await connectButton.click();

    // Step 2: Wait for the modal to appear
    const modal = page
      .locator(
        'div:has-text("Calimero Connect"), div:has-text("Select your Calimero node type")',
      )
      .first();
    await expect(modal).toBeVisible({ timeout: TIMEOUT_SHORT });

    // Step 3: Click "Remote" radio button
    const remoteLabel = page.locator('label:has-text("Remote")').first();
    await expect(remoteLabel).toBeVisible({ timeout: TIMEOUT_SHORT });
    await remoteLabel.click();
    await page.waitForTimeout(WAIT_SHORT); // Wait for input to appear

    // Step 4: Enter node URL
    const nodeUrlInput = page
      .locator(
        'input[placeholder*="your-node-url"], input[placeholder*="calimero.network"]',
      )
      .first();
    await expect(nodeUrlInput).toBeVisible({ timeout: TIMEOUT_SHORT });
    await nodeUrlInput.fill(NODE_URL);

    // Step 5: Click "Connect" button in modal
    const modalConnectButton = page
      .locator('button.connect-button:has-text("Connect")')
      .first();
    await expect(modalConnectButton).toBeVisible({ timeout: TIMEOUT_SHORT });
    await modalConnectButton.click();

    // Step 6: Wait for redirect to auth and select "Username/Password" authentication method
    await page.waitForURL(/.*\/auth\/.*/, { timeout: TIMEOUT_MEDIUM });
    // Wait for "Choose an authentication method" text to appear
    await page.waitForSelector('text=Choose an authentication method', {
      timeout: TIMEOUT_MEDIUM,
    });
    // Click on any element containing "Username/Password" text (it's clickable)
    // eslint-disable-next-line testing-library/prefer-screen-queries -- This is Playwright, not React Testing Library
    const usernamePasswordOption = page.getByText('Username/Password').first();
    await expect(usernamePasswordOption).toBeVisible({
      timeout: TIMEOUT_MEDIUM,
    });
    await usernamePasswordOption.click();
    await page.waitForTimeout(WAIT_MEDIUM); // Wait for form to appear

    // Step 7: Enter username
    const usernameInput = page
      .locator('input#username, input[name="username"]')
      .first();
    await expect(usernameInput).toBeVisible({ timeout: TIMEOUT_MEDIUM });
    await usernameInput.fill('dev');

    // Step 8: Enter password
    const passwordInput = page
      .locator('input#password, input[name="password"]')
      .first();
    await expect(passwordInput).toBeVisible({ timeout: TIMEOUT_SHORT });
    await passwordInput.fill('dev');

    // Step 9: Click "Sign In"
    const signInButton = page
      .locator(
        'button[type="submit"]:has-text("Sign In"), button:has-text("Sign In")',
      )
      .first();
    await expect(signInButton).toBeVisible({ timeout: TIMEOUT_SHORT });
    await signInButton.click();
    await page.waitForTimeout(WAIT_LONG); // Wait for redirect/processing

    // Step 10: Click "Install & Continue" (app installation from registry)
    const installButton = page
      .locator('button:has-text("Install & Continue")')
      .first();
    await expect(installButton).toBeVisible({ timeout: TIMEOUT_LONG });
    await installButton.click();
    await page.waitForTimeout(WAIT_LONG); // Wait for installation to complete

    // Step 11: Click "Approve Permissions"
    const approveButton = page
      .locator('button:has-text("Approve Permissions")')
      .first();
    await expect(approveButton).toBeVisible({ timeout: TIMEOUT_LONG });
    await approveButton.click();
    await page.waitForTimeout(WAIT_LONG); // Wait for redirect

    // Step 12: Click "Create new context"
    const createContextButton = page
      .locator('button:has-text("Create new context")')
      .first();
    await expect(createContextButton).toBeVisible({ timeout: TIMEOUT_MEDIUM });
    await createContextButton.click();
    await page.waitForTimeout(WAIT_MEDIUM);

    // Step 13: Select "NEAR" provider
    const nearButton = page.locator('button:has-text("NEAR")').first();
    await expect(nearButton).toBeVisible({ timeout: TIMEOUT_SHORT });
    await nearButton.click();
    await page.waitForTimeout(WAIT_SHORT);

    // Step 14: Click "Create context"
    const createButton = page
      .locator('button:has-text("Create context")')
      .first();
    await expect(createButton).toBeVisible({ timeout: TIMEOUT_SHORT });
    await createButton.click();

    // Wait for context creation to complete - this can take time in CI
    await page.waitForLoadState('networkidle', { timeout: TIMEOUT_LONG });
    await page.waitForTimeout(WAIT_LONG);

    // Step 15: Wait for "Generate Token" button to appear and click it
    // After context creation, the page may need to reload or update
    // Try waiting for the button with a longer timeout
    const generateTokenButton = page
      .locator('button:has-text("Generate Token")')
      .first();
    await expect(generateTokenButton).toBeVisible({
      timeout: TIMEOUT_LONG * 2,
    }); // Double timeout for CI
    await generateTokenButton.click();
    await page.waitForTimeout(WAIT_LONG); // Wait for redirect back to app

    // Step 16: Wait for KV store form to be visible (Key input field)
    const keyInput = page.locator('input[placeholder="Key"]').first();
    await expect(keyInput).toBeVisible({ timeout: TIMEOUT_LONG });

    // Step 17: Enter key
    await keyInput.fill('3');

    // Step 18: Enter value
    const valueInput = page.locator('input[placeholder="Value"]').first();
    await expect(valueInput).toBeVisible({ timeout: TIMEOUT_SHORT });
    await valueInput.fill('3');

    // Step 19: Click "Set Entry"
    const setEntryButton = page
      .locator(
        'button[type="submit"]:has-text("Set Entry"), button:has-text("Set Entry")',
      )
      .first();
    await expect(setEntryButton).toBeVisible({ timeout: TIMEOUT_SHORT });
    await setEntryButton.click();

    // Step 20: Verify entry appears in the Key-Value Entries table
    // Wait for the entries table/div to show the new entry
    const entriesContainer = page
      .locator(
        'div:has-text("Key-Value Entries"), div:has-text("Key"), div:has-text("Value")',
      )
      .first();
    await expect(entriesContainer).toBeVisible({ timeout: TIMEOUT_MEDIUM });

    // Verify the entry "3" appears in the table
    // The entry should show both key "3" and value "3"
    const entryKey = page.locator('text=3').first();
    await expect(entryKey).toBeVisible({ timeout: TIMEOUT_SHORT });

    // Additional verification: Check that the entries container has content
    const entriesContent = await entriesContainer.textContent();
    expect(entriesContent).toContain('3');
  });
});
