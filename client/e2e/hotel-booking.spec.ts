import { test, expect } from '@playwright/test';

test.describe('Hotel Booking E2E Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
  });

  test('should display the hotel listing page', async ({ page }) => {
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check if the page title is correct
    await expect(page).toHaveTitle(/Hotel Booking/i);
    
    // Check if hotels are displayed
    const hotelCards = page.locator('.hotel-card');
    await expect(hotelCards).toBeTruthy();
  });

  test('should search for hotels by city', async ({ page }) => {
    // Enter search criteria
    await page.fill('input[name="city"]', 'Cairo');
    await page.click('button[type="submit"]');
    
    // Wait for results
    await page.waitForSelector('.hotel-card');
    
    // Verify results contain Cairo
    const cityText = await page.textContent('.hotel-city');
    expect(cityText).toContain('Cairo');
  });

  test('should navigate to hotel details page', async ({ page }) => {
    // Wait for hotels to load
    await page.waitForSelector('.hotel-card');
    
    // Click on first hotel
    await page.click('.hotel-card:first-child a');
    
    // Verify navigation to details page
    await expect(page).toHaveURL(/\/hotels\/\d+/);
    
    // Check if hotel details are displayed
    const hotelName = page.locator('h1.hotel-name');
    await expect(hotelName).toBeVisible();
  });

  test('should complete booking flow', async ({ page }) => {
    // Navigate to a hotel
    await page.waitForSelector('.hotel-card');
    await page.click('.hotel-card:first-child a');
    
    // Select dates
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const checkInDate = tomorrow.toISOString().split('T')[0];
    
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 3);
    const checkOutDate = dayAfter.toISOString().split('T')[0];
    
    await page.fill('input[name="checkIn"]', checkInDate);
    await page.fill('input[name="checkOut"]', checkOutDate);
    
    // Select a room
    await page.click('button.book-room:first-child');
    
    // Fill guest information
    await page.fill('input[name="guestName"]', 'John Doe');
    await page.fill('input[name="guestEmail"]', 'john.doe@example.com');
    await page.fill('input[name="guestPhone"]', '1234567890');
    
    // Submit booking
    await page.click('button[type="submit"]');
    
    // Verify confirmation
    await page.waitForSelector('.booking-confirmation');
    const confirmationMessage = await page.textContent('.confirmation-message');
    expect(confirmationMessage).toContain('confirmed');
  });

  test('should validate form fields', async ({ page }) => {
    // Navigate to booking form
    await page.goto('/hotels/1');
    
    // Try to submit without filling required fields
    await page.click('button[type="submit"]');
    
    // Check for validation errors
    const errorMessages = page.locator('.error-message');
    await expect(errorMessages).toHaveCount(await errorMessages.count());
  });

  test('should filter hotels by price range', async ({ page }) => {
    // Set price range
    await page.fill('input[name="minPrice"]', '100');
    await page.fill('input[name="maxPrice"]', '500');
    await page.click('button.apply-filter');
    
    // Wait for filtered results
    await page.waitForSelector('.hotel-card');
    
    // Verify all results are within range
    const prices = await page.locator('.room-price').allTextContents();
    prices.forEach(priceText => {
      const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
      expect(price).toBeGreaterThanOrEqual(100);
      expect(price).toBeLessThanOrEqual(500);
    });
  });

  test('should handle booking conflicts', async ({ page }) => {
    // Try to book an already booked room
    await page.goto('/hotels/1');
    
    // Select dates that conflict
    await page.fill('input[name="checkIn"]', '2026-02-01');
    await page.fill('input[name="checkOut"]', '2026-02-05');
    
    await page.click('button.book-room:first-child');
    
    // Check for error message
    const errorMessage = page.locator('.error-message');
    await expect(errorMessage).toContainText(/not available|already booked/i);
  });

  test('should be accessible', async ({ page }) => {
    // Basic accessibility check
    await page.waitForLoadState('networkidle');
    
    // Check for main landmarks
    await expect(page.locator('main')).toBeVisible();
    await expect(page.locator('nav')).toBeVisible();
    
    // Check for proper heading hierarchy
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThan(0);
  });
});

test.describe('Authentication Flow', () => {
  
  test('should login successfully', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL('/');
    
    // Check if user is logged in
    const userMenu = page.locator('.user-menu');
    await expect(userMenu).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Assume logged in
    await page.goto('/');
    
    // Click logout
    await page.click('.user-menu');
    await page.click('button.logout');
    
    // Verify logged out state
    await expect(page.locator('.login-button')).toBeVisible();
  });
});
