import { test, expect, type Page } from '@playwright/test';

test.describe('Smoke @smoke', () => {
  test('homepage loads and displays topbar', async ({ page, baseURL }: { page: Page; baseURL?: string }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/VPN Enterprise/i);
    // Check key UI element
    const topBar = page.locator('header');
    await expect(topBar).toBeVisible();
  });
});
