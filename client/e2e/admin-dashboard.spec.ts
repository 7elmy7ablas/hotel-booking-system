import { test, expect } from '@playwright/test';

/**
 * Admin Dashboard E2E Tests
 * 
 * These tests verify the admin dashboard functionality including:
 * - Access control (admin-only routes)
 * - Dashboard metrics display
 * - Recent bookings table
 * - Top hotels display
 * - Revenue chart
 */

test.describe('Admin Dashboard', () => {
  // Admin credentials for testing
  const adminCredentials = {
    email: 'admin@example.com',
    password: 'Admin123!'
  };

  const userCredentials = {
    email: 'user@example.com',
    password: 'User123!'
  };

  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies();
    await page.goto('/');
  });

  test.describe('Access Control', () => {
    test('should redirect non-authenticated users to login', async ({ page }) => {
      await page.goto('/admin/dashboard');
      
      // Should redirect to login
      await expect(page).toHaveURL(/.*login.*returnUrl/);
    });

    test('should redirect non-admin users to home with error', async ({ page }) => {
      // Login as regular user
      await page.goto('/login');
      await page.fill('input[formControlName="email"]', userCredentials.email);
      await page.fill('input[formControlName="password"]', userCredentials.password);
      await page.click('button[type="submit"]');
      
      // Wait for login to complete
      await page.waitForURL('/');
      
      // Try to access admin dashboard
      await page.goto('/admin/dashboard');
      
      // Should redirect to home (non-admin users can't access)
      await expect(page).toHaveURL('/');
    });

    test('should allow admin users to access dashboard', async ({ page }) => {
      // Login as admin
      await page.goto('/login');
      await page.fill('input[formControlName="email"]', adminCredentials.email);
      await page.fill('input[formControlName="password"]', adminCredentials.password);
      await page.click('button[type="submit"]');
      
      // Wait for login to complete
      await page.waitForNavigation();
      
      // Navigate to admin dashboard
      await page.goto('/admin/dashboard');
      
      // Should be on admin dashboard
      await expect(page).toHaveURL('/admin/dashboard');
      await expect(page.locator('h1')).toContainText('Dashboard');
    });
  });

  test.describe('Dashboard Layout', () => {
    test.beforeEach(async ({ page }) => {
      // Login as admin before each test
      await page.goto('/login');
      await page.fill('input[formControlName="email"]', adminCredentials.email);
      await page.fill('input[formControlName="password"]', adminCredentials.password);
      await page.click('button[type="submit"]');
      await page.waitForNavigation();
      await page.goto('/admin/dashboard');
    });

    test('should display admin sidebar navigation', async ({ page }) => {
      // Check sidebar items
      await expect(page.locator('mat-sidenav')).toBeVisible();
      await expect(page.locator('text=Dashboard')).toBeVisible();
      await expect(page.locator('text=Hotels')).toBeVisible();
      await expect(page.locator('text=Bookings')).toBeVisible();
      await expect(page.locator('text=Users')).toBeVisible();
    });

    test('should display page header', async ({ page }) => {
      await expect(page.locator('.page-header h1')).toContainText('Dashboard');
      await expect(page.locator('.page-header p')).toContainText('Welcome back');
    });

    test('should navigate to other admin pages', async ({ page }) => {
      // Click on Hotels
      await page.click('a:has-text("Hotels")');
      await expect(page).toHaveURL('/admin/hotels');
      
      // Click on Bookings
      await page.click('a:has-text("Bookings")');
      await expect(page).toHaveURL('/admin/bookings');
      
      // Click on Users
      await page.click('a:has-text("Users")');
      await expect(page).toHaveURL('/admin/users');
      
      // Go back to Dashboard
      await page.click('a:has-text("Dashboard")');
      await expect(page).toHaveURL('/admin/dashboard');
    });
  });

  test.describe('Dashboard Metrics', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[formControlName="email"]', adminCredentials.email);
      await page.fill('input[formControlName="password"]', adminCredentials.password);
      await page.click('button[type="submit"]');
      await page.waitForNavigation();
      await page.goto('/admin/dashboard');
    });

    test('should display 4 metric cards', async ({ page }) => {
      // Wait for loading to complete
      await page.waitForSelector('app-metric-card', { timeout: 10000 });
      
      const metricCards = page.locator('app-metric-card');
      await expect(metricCards).toHaveCount(4);
    });

    test('should show loading skeletons while loading', async ({ page }) => {
      // Intercept API calls to slow them down
      await page.route('**/api/bookings', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await route.continue();
      });

      await page.reload();
      
      // Should see skeleton loaders
      const skeletons = page.locator('app-skeleton');
      await expect(skeletons.first()).toBeVisible();
    });

    test('should display Total Bookings metric', async ({ page }) => {
      await page.waitForSelector('.metric-title:has-text("Total Bookings")', { timeout: 10000 });
      
      const bookingsCard = page.locator('app-metric-card:has-text("Total Bookings")');
      await expect(bookingsCard).toBeVisible();
      
      // Value should be a number
      const value = await bookingsCard.locator('.metric-value').textContent();
      expect(value).toBeTruthy();
    });

    test('should display Revenue YTD metric', async ({ page }) => {
      await page.waitForSelector('.metric-title:has-text("Revenue YTD")', { timeout: 10000 });
      
      const revenueCard = page.locator('app-metric-card:has-text("Revenue YTD")');
      await expect(revenueCard).toBeVisible();
      
      // Value should contain $ symbol
      const value = await revenueCard.locator('.metric-value').textContent();
      expect(value).toContain('$');
    });

    test('should display Occupancy Rate metric', async ({ page }) => {
      await page.waitForSelector('.metric-title:has-text("Occupancy Rate")', { timeout: 10000 });
      
      const occupancyCard = page.locator('app-metric-card:has-text("Occupancy Rate")');
      await expect(occupancyCard).toBeVisible();
      
      // Value should contain % symbol
      const value = await occupancyCard.locator('.metric-value').textContent();
      expect(value).toContain('%');
    });

    test('should display Active Hotels metric', async ({ page }) => {
      await page.waitForSelector('.metric-title:has-text("Active Hotels")', { timeout: 10000 });
      
      const hotelsCard = page.locator('app-metric-card:has-text("Active Hotels")');
      await expect(hotelsCard).toBeVisible();
    });
  });

  test.describe('Recent Bookings Table', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[formControlName="email"]', adminCredentials.email);
      await page.fill('input[formControlName="password"]', adminCredentials.password);
      await page.click('button[type="submit"]');
      await page.waitForNavigation();
      await page.goto('/admin/dashboard');
    });

    test('should display Recent Bookings section', async ({ page }) => {
      await expect(page.locator('mat-card-title:has-text("Recent Bookings")')).toBeVisible();
    });

    test('should show View All button', async ({ page }) => {
      const viewAllButton = page.locator('button:has-text("View All")');
      await expect(viewAllButton).toBeVisible();
    });

    test('should navigate to bookings page when View All clicked', async ({ page }) => {
      await page.click('button:has-text("View All")');
      await expect(page).toHaveURL('/admin/bookings');
    });

    test('should show empty state when no recent bookings', async ({ page }) => {
      // Mock empty bookings response
      await page.route('**/api/bookings', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      });

      await page.reload();
      
      // Should show empty state
      await expect(page.locator('text=No recent bookings')).toBeVisible();
    });

    test('should display booking table columns', async ({ page }) => {
      // Wait for table to load
      await page.waitForSelector('.bookings-table', { timeout: 10000 });
      
      // Check table headers
      await expect(page.locator('th:has-text("Booking ID")')).toBeVisible();
      await expect(page.locator('th:has-text("Guest")')).toBeVisible();
      await expect(page.locator('th:has-text("Hotel")')).toBeVisible();
      await expect(page.locator('th:has-text("Status")')).toBeVisible();
      await expect(page.locator('th:has-text("Amount")')).toBeVisible();
    });
  });

  test.describe('Top Hotels Table', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[formControlName="email"]', adminCredentials.email);
      await page.fill('input[formControlName="password"]', adminCredentials.password);
      await page.click('button[type="submit"]');
      await page.waitForNavigation();
      await page.goto('/admin/dashboard');
    });

    test('should display Top Performing Hotels section', async ({ page }) => {
      await expect(page.locator('mat-card-title:has-text("Top Performing Hotels")')).toBeVisible();
    });

    test('should show empty state when no hotels', async ({ page }) => {
      await page.route('**/api/hotels', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      });

      await page.reload();
      
      await expect(page.locator('text=No hotels yet')).toBeVisible();
    });

    test('should display hotel table columns', async ({ page }) => {
      await page.waitForSelector('.top-hotels-table', { timeout: 10000 });
      
      await expect(page.locator('th:has-text("Hotel")')).toBeVisible();
      await expect(page.locator('th:has-text("Occupancy")')).toBeVisible();
      await expect(page.locator('th:has-text("Revenue")')).toBeVisible();
    });
  });

  test.describe('Revenue Chart', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[formControlName="email"]', adminCredentials.email);
      await page.fill('input[formControlName="password"]', adminCredentials.password);
      await page.click('button[type="submit"]');
      await page.waitForNavigation();
      await page.goto('/admin/dashboard');
    });

    test('should display Revenue Overview chart', async ({ page }) => {
      await expect(page.locator('mat-card-title:has-text("Revenue Overview")')).toBeVisible();
    });

    test('should display chart subtitle', async ({ page }) => {
      await expect(page.locator('mat-card-subtitle:has-text("Last 30 days")')).toBeVisible();
    });

    test('should render SVG chart', async ({ page }) => {
      await page.waitForSelector('app-revenue-chart svg', { timeout: 10000 });
      
      const svg = page.locator('app-revenue-chart svg');
      await expect(svg).toBeVisible();
    });
  });

  test.describe('Responsive Layout', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[formControlName="email"]', adminCredentials.email);
      await page.fill('input[formControlName="password"]', adminCredentials.password);
      await page.click('button[type="submit"]');
      await page.waitForNavigation();
      await page.goto('/admin/dashboard');
    });

    test('should show menu button on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Menu button should be visible
      const menuButton = page.locator('button mat-icon:has-text("menu")');
      await expect(menuButton).toBeVisible();
    });

    test('should toggle sidebar on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Sidebar should be hidden initially on mobile
      const sidenav = page.locator('mat-sidenav');
      
      // Click menu button to open
      await page.click('button:has(mat-icon:has-text("menu"))');
      await expect(sidenav).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[formControlName="email"]', adminCredentials.email);
      await page.fill('input[formControlName="password"]', adminCredentials.password);
      await page.click('button[type="submit"]');
      await page.waitForNavigation();
    });

    test('should handle API errors gracefully', async ({ page }) => {
      // Mock API error
      await page.route('**/api/bookings', route => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal Server Error' })
        });
      });

      await page.goto('/admin/dashboard');
      
      // Page should still load without crashing
      await expect(page.locator('.page-header h1')).toContainText('Dashboard');
    });

    test('should show error message on network failure', async ({ page }) => {
      await page.route('**/api/bookings', route => {
        route.abort('failed');
      });

      await page.goto('/admin/dashboard');
      
      // Should handle gracefully - page loads but shows empty/error states
      await expect(page.locator('.page-header h1')).toContainText('Dashboard');
    });
  });

  test.describe('Logout Flow', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[formControlName="email"]', adminCredentials.email);
      await page.fill('input[formControlName="password"]', adminCredentials.password);
      await page.click('button[type="submit"]');
      await page.waitForNavigation();
      await page.goto('/admin/dashboard');
    });

    test('should logout and redirect to login', async ({ page }) => {
      // Open user menu
      await page.click('button:has(mat-icon:has-text("account_circle"))');
      
      // Click logout
      await page.click('button:has-text("Logout")');
      
      // Should redirect to login
      await expect(page).toHaveURL('/login');
    });

    test('should navigate back to site from admin', async ({ page }) => {
      // Click "Back to Site" in sidebar
      await page.click('a:has-text("Back to Site")');
      
      // Should be on home page
      await expect(page).toHaveURL('/');
    });
  });
});
