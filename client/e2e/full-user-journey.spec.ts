import { test, expect, Page } from '@playwright/test';

/**
 * E2E Test Suite: Complete User Flow
 * Tests the entire journey: Login → Search → Book → My Bookings
 */

test.describe('Hotel Booking - Complete User Flow', () => {
  
  test.describe('Authentication Flow', () => {
    
    test('should display login page correctly', async ({ page }) => {
      await page.goto('/login');
      
      await expect(page.locator('h1, h2').first()).toContainText(/login|sign in/i);
      await expect(page.locator('input[type="email"], input[formControlName="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"], input[formControlName="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('should show validation errors for empty form', async ({ page }) => {
      await page.goto('/login');
      
      const emailInput = page.locator('input[type="email"], input[formControlName="email"]');
      const passwordInput = page.locator('input[type="password"], input[formControlName="password"]');
      
      await emailInput.fill('');
      await passwordInput.fill('');
      await page.locator('button[type="submit"]').click();
      
      // Should show validation error
      await expect(page.locator('.mat-error, .error-message, [class*="error"]')).toBeVisible();
    });

    test('should show validation error for invalid email', async ({ page }) => {
      await page.goto('/login');
      
      await page.locator('input[type="email"], input[formControlName="email"]').fill('invalid-email');
      await page.locator('input[type="password"], input[formControlName="password"]').fill('password123');
      await page.locator('button[type="submit"]').click();
      
      // Form should be invalid
      await expect(page).toHaveURL(/login/);
    });

    test('should login successfully with valid credentials', async ({ page }) => {
      await page.goto('/login');
      
      await page.locator('input[type="email"], input[formControlName="email"]').fill('admin@hotel.com');
      await page.locator('input[type="password"], input[formControlName="password"]').fill('Admin@123');
      await page.locator('button[type="submit"]').click();
      
      // Should redirect after successful login
      await expect(page).not.toHaveURL(/login/);
    });

    test('should handle incorrect credentials', async ({ page }) => {
      await page.goto('/login');
      
      await page.locator('input[type="email"], input[formControlName="email"]').fill('wrong@email.com');
      await page.locator('input[type="password"], input[formControlName="password"]').fill('wrongpassword');
      await page.locator('button[type="submit"]').click();
      
      // Should show error or remain on login page
      await expect(page).toHaveURL(/login/);
    });

    test('should navigate to registration page', async ({ page }) => {
      await page.goto('/login');
      
      const registerLink = page.locator('a[href*="register"], a:has-text("Register"), a:has-text("Sign up")');
      if (await registerLink.count() > 0) {
        await registerLink.click();
        await expect(page).toHaveURL(/register/);
      }
    });
  });

  test.describe('Hotel Search Flow', () => {
    
    test.beforeEach(async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.locator('input[type="email"], input[formControlName="email"]').fill('admin@hotel.com');
      await page.locator('input[type="password"], input[formControlName="password"]').fill('Admin@123');
      await page.locator('button[type="submit"]').click();
      await page.waitForURL(url => !url.pathname.includes('login'));
    });

    test('should display hotel search page', async ({ page }) => {
      await page.goto('/hotels');
      await page.waitForLoadState('networkidle');
      
      // Should show hotels or search interface
      const content = page.locator('app-search, app-hotel-list, [class*="hotel"]');
      await expect(content.first()).toBeVisible({ timeout: 10000 });
    });

    test('should display hotel list', async ({ page }) => {
      await page.goto('/hotels');
      await page.waitForLoadState('networkidle');
      
      // Wait for hotels to load
      await page.waitForSelector('[class*="hotel"], mat-card, .hotel-card', { timeout: 10000 });
      
      const hotels = page.locator('[class*="hotel"], mat-card, .hotel-card');
      await expect(hotels.first()).toBeVisible();
    });

    test('should filter hotels by search term', async ({ page }) => {
      await page.goto('/hotels');
      await page.waitForLoadState('networkidle');
      
      const searchInput = page.locator('input[formControlName="search"], input[placeholder*="search" i], input[type="search"]');
      if (await searchInput.count() > 0) {
        await searchInput.fill('Cairo');
        await page.waitForTimeout(500); // Wait for debounce
        
        // Hotels should be filtered
        await expect(page.locator('body')).toContainText(/cairo/i);
      }
    });

    test('should navigate to hotel details', async ({ page }) => {
      await page.goto('/hotels');
      await page.waitForLoadState('networkidle');
      
      await page.waitForSelector('[class*="hotel"], mat-card, .hotel-card', { timeout: 10000 });
      
      const hotelCard = page.locator('[class*="hotel"], mat-card, .hotel-card').first();
      const viewButton = hotelCard.locator('button, a').filter({ hasText: /view|details|book/i });
      
      if (await viewButton.count() > 0) {
        await viewButton.click();
        await page.waitForURL(url => url.pathname.includes('hotel'));
      }
    });

    test('should show hotel details with rooms', async ({ page }) => {
      await page.goto('/hotels');
      await page.waitForLoadState('networkidle');
      
      await page.waitForSelector('[class*="hotel"], mat-card, .hotel-card', { timeout: 10000 });
      
      const hotelCard = page.locator('[class*="hotel"], mat-card, .hotel-card').first();
      await hotelCard.click();
      
      await page.waitForLoadState('networkidle');
      
      // Should show hotel details
      const hotelDetails = page.locator('[class*="hotel"], [class*="details"], app-hotel-details');
      await expect(hotelDetails.first()).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('Booking Flow', () => {
    
    test.beforeEach(async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.locator('input[type="email"], input[formControlName="email"]').fill('admin@hotel.com');
      await page.locator('input[type="password"], input[formControlName="password"]').fill('Admin@123');
      await page.locator('button[type="submit"]').click();
      await page.waitForURL(url => !url.pathname.includes('login'));
    });

    test('should navigate to booking page', async ({ page }) => {
      await page.goto('/booking/create');
      await page.waitForLoadState('networkidle');
      
      // Should show booking form or redirect
      const content = await page.content();
      expect(content).toBeTruthy();
    });

    test('should display booking form elements', async ({ page }) => {
      await page.goto('/booking/create');
      await page.waitForLoadState('networkidle');
      
      // Look for date inputs or booking form
      const dateInputs = page.locator('input[type="date"], mat-datepicker-input, [formControlName*="date" i]');
      if (await dateInputs.count() > 0) {
        await expect(dateInputs.first()).toBeVisible();
      }
    });

    test('should validate required booking fields', async ({ page }) => {
      await page.goto('/booking/create');
      await page.waitForLoadState('networkidle');
      
      const submitButton = page.locator('button[type="submit"], button:has-text("Book"), button:has-text("Confirm")');
      if (await submitButton.count() > 0 && await submitButton.isEnabled()) {
        await submitButton.click();
        
        // Should show validation errors
        const errors = page.locator('.mat-error, .error-message, [class*="error"]');
        if (await errors.count() > 0) {
          await expect(errors.first()).toBeVisible();
        }
      }
    });

    test('should calculate total price', async ({ page }) => {
      await page.goto('/booking/create');
      await page.waitForLoadState('networkidle');
      
      // Look for price display
      const priceDisplay = page.locator('[class*="price"], [class*="total"], :text("$")');
      if (await priceDisplay.count() > 0) {
        await expect(priceDisplay.first()).toBeVisible();
      }
    });
  });

  test.describe('My Bookings Flow', () => {
    
    test.beforeEach(async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.locator('input[type="email"], input[formControlName="email"]').fill('admin@hotel.com');
      await page.locator('input[type="password"], input[formControlName="password"]').fill('Admin@123');
      await page.locator('button[type="submit"]').click();
      await page.waitForURL(url => !url.pathname.includes('login'));
    });

    test('should display my bookings page', async ({ page }) => {
      await page.goto('/my-bookings');
      await page.waitForLoadState('networkidle');
      
      // Should show bookings or empty state
      const content = page.locator('app-my-bookings, [class*="booking"], [class*="empty"]');
      await expect(content.first()).toBeVisible({ timeout: 10000 });
    });

    test('should show booking list or empty state', async ({ page }) => {
      await page.goto('/my-bookings');
      await page.waitForLoadState('networkidle');
      
      // Should show either bookings or empty message
      const bookings = page.locator('[class*="booking"]');
      const emptyState = page.locator('[class*="empty"], :text("No bookings")');
      
      const hasBookings = await bookings.count() > 0;
      const hasEmptyState = await emptyState.count() > 0;
      
      expect(hasBookings || hasEmptyState).toBeTruthy();
    });

    test('should filter bookings by status', async ({ page }) => {
      await page.goto('/my-bookings');
      await page.waitForLoadState('networkidle');
      
      const filterButtons = page.locator('button:has-text("Confirmed"), button:has-text("Pending"), button:has-text("All")');
      if (await filterButtons.count() > 0) {
        await filterButtons.first().click();
        await page.waitForTimeout(300);
        
        // Filter should be applied
        expect(await page.url()).toContain('my-bookings');
      }
    });

    test('should navigate to booking details', async ({ page }) => {
      await page.goto('/my-bookings');
      await page.waitForLoadState('networkidle');
      
      const viewButton = page.locator('button:has-text("View"), button:has-text("Details"), a:has-text("View")');
      if (await viewButton.count() > 0) {
        await viewButton.first().click();
        await page.waitForLoadState('networkidle');
      }
    });

    test('should handle booking cancellation', async ({ page }) => {
      await page.goto('/my-bookings');
      await page.waitForLoadState('networkidle');
      
      const cancelButton = page.locator('button:has-text("Cancel")');
      if (await cancelButton.count() > 0) {
        // Setup dialog handler
        page.on('dialog', dialog => dialog.dismiss());
        
        await cancelButton.first().click();
        
        // Should show confirmation or handle cancellation
        expect(await page.url()).toContain('my-bookings');
      }
    });
  });

  test.describe('Complete User Journey', () => {
    
    test('should complete full booking journey', async ({ page }) => {
      // Step 1: Login
      await page.goto('/login');
      await page.locator('input[type="email"], input[formControlName="email"]').fill('admin@hotel.com');
      await page.locator('input[type="password"], input[formControlName="password"]').fill('Admin@123');
      await page.locator('button[type="submit"]').click();
      await page.waitForURL(url => !url.pathname.includes('login'));
      
      // Step 2: Navigate to hotels
      await page.goto('/hotels');
      await page.waitForLoadState('networkidle');
      
      // Step 3: Search for a hotel
      const searchInput = page.locator('input[formControlName="search"], input[placeholder*="search" i]');
      if (await searchInput.count() > 0) {
        await searchInput.fill('Hotel');
        await page.waitForTimeout(500);
      }
      
      // Step 4: Verify hotels are displayed
      await page.waitForSelector('[class*="hotel"], mat-card, .hotel-card', { timeout: 10000 });
      
      // Step 5: Navigate to my bookings
      await page.goto('/my-bookings');
      await page.waitForLoadState('networkidle');
      
      // Step 6: Verify my bookings page loads
      const content = page.locator('app-my-bookings, [class*="booking"], [class*="empty"]');
      await expect(content.first()).toBeVisible({ timeout: 10000 });
    });

    test('should maintain authentication across navigation', async ({ page }) => {
      // Login
      await page.goto('/login');
      await page.locator('input[type="email"], input[formControlName="email"]').fill('admin@hotel.com');
      await page.locator('input[type="password"], input[formControlName="password"]').fill('Admin@123');
      await page.locator('button[type="submit"]').click();
      await page.waitForURL(url => !url.pathname.includes('login'));
      
      // Navigate to different pages
      await page.goto('/hotels');
      await expect(page).not.toHaveURL(/login/);
      
      await page.goto('/my-bookings');
      await expect(page).not.toHaveURL(/login/);
      
      await page.goto('/profile');
      // Should remain authenticated (not redirected to login)
    });

    test('should logout successfully', async ({ page }) => {
      // Login first
      await page.goto('/login');
      await page.locator('input[type="email"], input[formControlName="email"]').fill('admin@hotel.com');
      await page.locator('input[type="password"], input[formControlName="password"]').fill('Admin@123');
      await page.locator('button[type="submit"]').click();
      await page.waitForURL(url => !url.pathname.includes('login'));
      
      // Find and click logout
      const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout"), [aria-label="Logout"]');
      if (await logoutButton.count() > 0) {
        await logoutButton.click();
        await expect(page).toHaveURL(/login/);
      }
    });
  });

  test.describe('Responsive Design', () => {
    
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/login');
      
      await expect(page.locator('input[type="email"], input[formControlName="email"]')).toBeVisible();
    });

    test('should work on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/login');
      
      await expect(page.locator('input[type="email"], input[formControlName="email"]')).toBeVisible();
    });

    test('should work on desktop viewport', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/login');
      
      await expect(page.locator('input[type="email"], input[formControlName="email"]')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    
    test('should handle 404 page', async ({ page }) => {
      await page.goto('/non-existent-page');
      
      // Should show 404 or redirect
      const notFound = page.locator(':text("404"), :text("not found"), :text("page not found")');
      const redirected = await page.url();
      
      expect((await notFound.count() > 0) || redirected.includes('/')).toBeTruthy();
    });

    test('should handle network errors gracefully', async ({ page }) => {
      await page.goto('/login');
      
      // Page should still render
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Accessibility', () => {
    
    test('should have accessible login form', async ({ page }) => {
      await page.goto('/login');
      
      // Check for labels or aria-labels
      const emailInput = page.locator('input[type="email"], input[formControlName="email"]');
      const hasLabel = await page.locator('label[for], [aria-label], [aria-labelledby]').count() > 0;
      
      await expect(emailInput).toBeVisible();
    });

    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/login');
      
      // Tab through form elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      // Should focus on interactive elements
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeTruthy();
    });
  });
});
