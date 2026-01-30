import { test, expect } from '@playwright/test';

/**
 * E2E Test Suite: Complete User Flow
 * Tests the entire user journey: Login → Search → Book → View My Bookings
 */

test.describe('Complete User Booking Flow', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'Test123!@#',
    name: 'Test User'
  };

  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
  });

  test('Complete flow: Login → Search → Book → My Bookings', async ({ page }) => {
    // ============================================
    // STEP 1: Login
    // ============================================
    await test.step('User logs in', async () => {
      await page.click('button:has-text("Login")');
      await page.waitForURL('**/login');

      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button[type="submit"]');

      // Wait for redirect to home
      await page.waitForURL('/');

      // Verify logged in state
      await expect(page.locator('.user-menu')).toBeVisible();
      await expect(page.locator('text=Welcome')).toBeVisible();
    });

    // ============================================
    // STEP 2: Search for Hotels
    // ============================================
    await test.step('User searches for hotels in Cairo', async () => {
      // Fill search form
      await page.fill('input[name="city"]', 'Cairo');
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 7);
      const checkInDate = tomorrow.toISOString().split('T')[0];

      const checkoutDate = new Date(tomorrow);
      checkoutDate.setDate(checkoutDate.getDate() + 3);
      const checkOutDate = checkoutDate.toISOString().split('T')[0];

      await page.fill('input[name="checkIn"]', checkInDate);
      await page.fill('input[name="checkOut"]', checkOutDate);

      // Submit search
      await page.click('button[type="submit"]:has-text("Search")');

      // Wait for results
      await page.waitForSelector('.hotel-card', { timeout: 10000 });

      // Verify search results
      const hotelCards = page.locator('.hotel-card');
      await expect(hotelCards).not.toHaveCount(0);

      // Verify all results are in Cairo
      const cities = await page.locator('.hotel-city').allTextContents();
      cities.forEach(city => {
        expect(city).toContain('Cairo');
      });
    });

    // ============================================
    // STEP 3: View Hotel Details and Select Room
    // ============================================
    await test.step('User views hotel details and selects a room', async () => {
      // Click on first hotel
      await page.click('.hotel-card:first-child .view-details-button');

      // Wait for hotel details page
      await page.waitForURL('**/hotels/**');

      // Verify hotel details are displayed
      await expect(page.locator('h1.hotel-name')).toBeVisible();
      await expect(page.locator('.hotel-description')).toBeVisible();
      await expect(page.locator('.hotel-amenities')).toBeVisible();

      // Wait for rooms to load
      await page.waitForSelector('.room-card');

      // Verify rooms are displayed
      const roomCards = page.locator('.room-card');
      await expect(roomCards).not.toHaveCount(0);

      // Select first available room
      await page.click('.room-card:first-child .book-button');
    });

    // ============================================
    // STEP 4: Fill Booking Details
    // ============================================
    await test.step('User fills booking details', async () => {
      // Wait for booking form
      await page.waitForSelector('form.booking-form');

      // Verify pre-filled information
      const guestEmail = await page.inputValue('input[name="guestEmail"]');
      expect(guestEmail).toBe(testUser.email);

      // Fill additional details
      await page.fill('input[name="guestName"]', testUser.name);
      await page.fill('input[name="guestPhone"]', '1234567890');

      // Verify price calculation
      const totalPrice = await page.textContent('.total-price');
      expect(parseFloat(totalPrice!.replace(/[^0-9.]/g, ''))).toBeGreaterThan(0);
    });

    // ============================================
    // STEP 5: Confirm Booking
    // ============================================
    await test.step('User confirms booking', async () => {
      // Accept terms and conditions
      await page.check('input[name="acceptTerms"]');

      // Submit booking
      await page.click('button[type="submit"]:has-text("Confirm Booking")');

      // Wait for confirmation page
      await page.waitForSelector('.booking-confirmation', { timeout: 15000 });

      // Verify confirmation details
      await expect(page.locator('.confirmation-message')).toContainText('confirmed');
      await expect(page.locator('.confirmation-number')).toBeVisible();

      // Store confirmation number for later verification
      const confirmationNumber = await page.textContent('.confirmation-number');
      expect(confirmationNumber).toMatch(/BK-\d+/);

      // Verify success message
      await expect(page.locator('.success-alert')).toContainText('successfully');
    });

    // ============================================
    // STEP 6: Navigate to My Bookings
    // ============================================
    await test.step('User views their bookings', async () => {
      // Click on "My Bookings" link
      await page.click('a:has-text("My Bookings")');

      // Wait for my bookings page
      await page.waitForURL('**/my-bookings');

      // Verify the new booking appears in the list
      await page.waitForSelector('.booking-item');

      const bookings = page.locator('.booking-item');
      await expect(bookings).not.toHaveCount(0);

      // Verify booking details
      const firstBooking = bookings.first();
      await expect(firstBooking.locator('.booking-status')).toContainText('Confirmed');
      await expect(firstBooking.locator('.hotel-name')).toBeVisible();
      await expect(firstBooking.locator('.check-in-date')).toBeVisible();
      await expect(firstBooking.locator('.check-out-date')).toBeVisible();
      await expect(firstBooking.locator('.total-price')).toBeVisible();
    });

    // ============================================
    // STEP 7: View Booking Details
    // ============================================
    await test.step('User views detailed booking information', async () => {
      // Click on first booking to view details
      await page.click('.booking-item:first-child .view-details-button');

      // Wait for booking details page
      await page.waitForSelector('.booking-details-page');

      // Verify all booking information is displayed
      await expect(page.locator('.confirmation-number')).toBeVisible();
      await expect(page.locator('.hotel-information')).toBeVisible();
      await expect(page.locator('.room-information')).toBeVisible();
      await expect(page.locator('.guest-information')).toBeVisible();
      await expect(page.locator('.price-breakdown')).toBeVisible();

      // Verify guest name matches
      const guestName = await page.textContent('.guest-name');
      expect(guestName).toContain(testUser.name);
    });

    // ============================================
    // STEP 8: Logout
    // ============================================
    await test.step('User logs out', async () => {
      // Open user menu
      await page.click('.user-menu');

      // Click logout
      await page.click('button:has-text("Logout")');

      // Verify logged out state
      await expect(page.locator('button:has-text("Login")')).toBeVisible();
      await expect(page.locator('.user-menu')).not.toBeVisible();
    });
  });

  test('Search with filters: City, Price Range, Rating', async ({ page }) => {
    await test.step('Apply multiple search filters', async () => {
      // Fill search form with filters
      await page.fill('input[name="city"]', 'Cairo');
      await page.fill('input[name="minPrice"]', '100');
      await page.fill('input[name="maxPrice"]', '500');
      await page.selectOption('select[name="minRating"]', '4');

      // Submit search
      await page.click('button[type="submit"]:has-text("Search")');

      // Wait for results
      await page.waitForSelector('.hotel-card');

      // Verify filtered results
      const prices = await page.locator('.room-price').allTextContents();
      prices.forEach(priceText => {
        const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
        expect(price).toBeGreaterThanOrEqual(100);
        expect(price).toBeLessThanOrEqual(500);
      });

      const ratings = await page.locator('.hotel-rating').allTextContents();
      ratings.forEach(ratingText => {
        const rating = parseFloat(ratingText.replace(/[^0-9.]/g, ''));
        expect(rating).toBeGreaterThanOrEqual(4.0);
      });
    });
  });

  test('Handle booking validation errors', async ({ page }) => {
    await test.step('Login', async () => {
      await page.click('button:has-text("Login")');
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/');
    });

    await test.step('Try to book with invalid dates', async () => {
      // Go to a hotel
      await page.goto('/hotels/1');

      // Try to set check-out before check-in
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date();
      dayAfter.setDate(dayAfter.getDate() + 5);

      await page.fill('input[name="checkIn"]', dayAfter.toISOString().split('T')[0]);
      await page.fill('input[name="checkOut"]', tomorrow.toISOString().split('T')[0]);

      await page.click('.book-button:first-child');

      // Verify error message
      await expect(page.locator('.error-message')).toContainText(/after|later|invalid/i);
    });
  });

  test('Cancel a booking', async ({ page }) => {
    await test.step('Login and navigate to my bookings', async () => {
      await page.click('button:has-text("Login")');
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/');

      await page.click('a:has-text("My Bookings")');
      await page.waitForURL('**/my-bookings');
    });

    await test.step('Cancel the first confirmed booking', async () => {
      // Find first confirmed booking
      const confirmedBooking = page.locator('.booking-item:has(.booking-status:has-text("Confirmed"))').first();
      
      if (await confirmedBooking.count() > 0) {
        // Click cancel button
        await confirmedBooking.locator('.cancel-button').click();

        // Confirm cancellation in dialog
        await page.click('button:has-text("Yes, Cancel Booking")');

        // Wait for status update
        await page.waitForTimeout(1000);

        // Verify status changed to cancelled
        await expect(confirmedBooking.locator('.booking-status')).toContainText('Cancelled');

        // Verify cancellation notification
        await expect(page.locator('.notification.success')).toContainText('cancelled successfully');
      }
    });
  });

  test('Accessibility: Keyboard navigation through booking flow', async ({ page }) => {
    await test.step('Navigate using keyboard only', async () => {
      // Tab to login button and press Enter
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');

      await page.waitForURL('**/login');

      // Fill form using keyboard
      await page.keyboard.press('Tab');
      await page.keyboard.type(testUser.email);
      await page.keyboard.press('Tab');
      await page.keyboard.type(testUser.password);
      await page.keyboard.press('Enter');

      // Verify login successful
      await page.waitForURL('/');
      await expect(page.locator('.user-menu')).toBeVisible();
    });
  });

  test('Responsive design: Mobile booking flow', async ({ page, viewport }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await test.step('Complete booking on mobile device', async () => {
      // Open mobile menu
      await page.click('.mobile-menu-button');

      // Click login
      await page.click('.mobile-menu a:has-text("Login")');

      // Login
      await page.fill('input[name="email"]', testUser.email);
      await page.fill('input[name="password"]', testUser.password);
      await page.click('button[type="submit"]');

      // Search
      await page.fill('input[name="city"]', 'Cairo');
      await page.click('button:has-text("Search")');

      // Verify mobile layout
      await page.waitForSelector('.hotel-card');
      const cards = page.locator('.hotel-card');
      
      // Verify cards are stacked vertically (mobile layout)
      const firstCard = cards.first();
      const secondCard = cards.nth(1);
      
      const firstBox = await firstCard.boundingBox();
      const secondBox = await secondCard.boundingBox();
      
      if (firstBox && secondBox) {
        expect(secondBox.y).toBeGreaterThan(firstBox.y + firstBox.height - 10);
      }
    });
  });
});
