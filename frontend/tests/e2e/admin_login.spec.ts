import { test, expect } from '@playwright/test';

test('Admin Login Flow', async ({ page }) => {
  await page.goto('/');
  
  // 1. Click login button on the landing page
  await page.getByRole('button', { name: '로그인', exact: true }).first().click();
  
  // 2. Fill credentials for Admin
  await page.locator('input[type="email"]').fill('admin@hyend.ac.kr');
  await page.locator('input[type="password"]').fill('Admin1234!');
  
  // Take screenshot of login modal filled
  await page.screenshot({ path: 'tests/e2e/screenshots/admin_login_modal.png' });
  
  // 3. Click submit
  await page.getByRole('button', { name: '로그인', exact: true }).last().click();
  
  // 4. Wait for redirection to /home
  await page.waitForURL('**/home');
  await page.waitForTimeout(300);
  
  // Take screenshot of admin homepage
  await page.screenshot({ path: 'tests/e2e/screenshots/admin_home_page.png' });
  
  // 5. Verify admin role tag is visible
  const roleTag = page.getByText('ADMIN', { exact: true });
  await expect(roleTag).toBeVisible();
});
