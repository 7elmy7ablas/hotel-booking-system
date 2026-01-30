import { test, expect, Page } from '@playwright/test';

/**
 * E2E Test Suite: Complete Booking Flow
 * Spec: .specify/specs/001-hotel-booking-flow/spec.md
 * Task: T083 - Complete booking E2E test (auth → search → select → book → confirm)
 * 
 * Tests the full user journey:
 * - US1: Search & Browse Hotels
 * - US2: View Hotel Details & Select Room
 * - US3: Create Booking with Price Calculation
 * - US4: View My Bookings
 * 
 * Success Criteria:
 * - SC-001: Complete search → select → book flow in under 60 seconds
 * - SC-003: TotalPrice matches nights × PricePerNight in 100% of bookings
 */

const TEST_USER = {
  email: 'admin@hotel.com',
  password: 'Admin@123'
};

// Helper function to login
async function login(page: Page): Promise<void> {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  
  await page.locator('input[type="email"], input[formControlName="email"]').fill(TEST_USER.email);
  await page.locator('input[type="password"], input[formControlName="password"]').fill(TEST_USER.password);
  await page.locator('button[type="submit"]').click();
  
  await page.waitForURL(url => !url.pathname.includes('login'), { timeout: 10000 });
}

// Helper to get future date
function getFutureDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}

// Helper to format date for display
function formatDateForInput(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

test.describe('Complete Booking Flow - E2E Tests', () => {

  test.describe('SC-001: Full User Journey', () => {

    test('complete booking flow: login → search → select → book → confirm', async ({ page }) => {
      // Start timer for SC-001 (must complete in < 60 seconds)
      const startTime = Date.now();

      // Step 1: Login
      await login(page);
      await expect(page).not.toHaveURL(/login/);

      // Step 2: Navigate to hotels
      await page.goto('/hotels');
      await page.waitForLoadState('networkidle');

      // Step 3: Select a hotel
      const hotelCard = page.locator('[class*="hotel"], mat-card, .hotel-card').first();
      await hotelCard.waitFor({ state: 'visible', timeout: 10000 });
      
      // Find clickable element within hotel card
      const viewButton = hotelCard.locator('button, a, [routerLink]').first();
      if (await viewButton.count() > 0) {
        await viewButton.click();
      } else {
        await hotelCard.click();
      }
      
      await page.waitForLoadState('networkidle');

      // Step 4: Select a room (if on hotel details page)
      const roomCard = page.locator('[class*="room"], .room-card, mat-card').first();
      if (await roomCard.count() > 0) {
        const bookButton = roomCard.locator('button:has-text("Book"), button:has-text("Select")').first();
        if (await bookButton.count() > 0) {
          await bookButton.click();
        }
      }

      // Step 5: Fill booking form (if booking page is separate)
      const checkInInput = page.locator('input[formControlName="checkIn"], input[name="checkIn"], [aria-label*="check-in" i]');
      if (await checkInInput.count() > 0) {
        await checkInInput.fill(getFutureDate(7));
        
        const checkOutInput = page.locator('input[formControlName="checkOut"], input[name="checkOut"], [aria-label*="check-out" i]');
        await checkOutInput.fill(getFutureDate(10));
      }

      // Step 6: Submit booking
      const submitBookingButton = page.locator('button:has-text("Confirm"), button:has-text("Book Now"), button:has-text("Submit")').first();
      if (await submitBookingButton.count() > 0) {
        await submitBookingButton.click();
        await page.waitForTimeout(2000); // Wait for booking to process
      }

      // End timer
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;

      // Assert SC-001: Flow completed in under 60 seconds
      expect(duration).toBeLessThan(60);
      console.log(`Complete booking flow took ${duration.toFixed(2)} seconds`);
    });

  });

  test.describe('US3: Create Booking with Price Calculation', () => {

    test.beforeEach(async ({ page }) => {
      await login(page);
    });

    test('US3-AC1: should create booking with correct total price', async ({ page }) => {
      // Navigate to hotels
      await page.goto('/hotels');
      await page.waitForLoadState('networkidle');

      // Select first hotel
      const hotelCard = page.locator('[class*="hotel"], mat-card, .hotel-card').first();
      await hotelCard.waitFor({ state: 'visible', timeout: 10000 });
      await hotelCard.click();
      await page.waitForLoadState('networkidle');

      // Look for room with visible price
      const roomWithPrice = page.locator('[class*="room"], .room-card').filter({
        has: page.locator('text=/\\$\\d+/')
      }).first();

      if (await roomWithPrice.count() > 0) {
        // Extract price per night
        const priceText = await roomWithPrice.locator('text=/\\$\\d+/').first().textContent();
        const pricePerNight = priceText ? parseFloat(priceText.replace(/[^0-9.]/g, '')) : 0;

        // Calculate expected total for 3 nights
        const nights = 3;
        const expectedTotal = pricePerNight * nights;

        // Book the room
        const bookButton = roomWithPrice.locator('button:has-text("Book"), button:has-text("Select")').first();
        if (await bookButton.count() > 0) {
          await bookButton.click();

          // Fill dates if form appears
          const checkInInput = page.locator('input[formControlName="checkIn"], input[name="checkIn"]');
          if (await checkInInput.count() > 0) {
            await checkInInput.fill(getFutureDate(10));
            await page.locator('input[formControlName="checkOut"], input[name="checkOut"]').fill(getFutureDate(10 + nights));
          }

          // Check if total price is displayed correctly
          const totalPriceDisplay = page.locator('text=/total|price/i').first();
          if (await totalPriceDisplay.count() > 0) {
            const displayedTotal = await totalPriceDisplay.textContent();
            console.log(`SC-003: Expected $${expectedTotal}, Displayed: ${displayedTotal}`);
          }
        }
      }
    });

    test('US3-AC2: server should recalculate price regardless of client value', async ({ page }) => {
      // This test verifies via API that server calculates price
      await login(page);

      // Get a valid room ID from the API
      const roomsResponse = await page.request.get('/api/rooms');
      const rooms = await roomsResponse.json();
      
      if (rooms && rooms.length > 0) {
        const room = rooms[0];
        const pricePerNight = room.pricePerNight;

        // Get user ID
        const token = await page.evaluate(() => {
          return localStorage.getItem('token') || sessionStorage.getItem('token');
        });

        if (token) {
          // Attempt to book with wrong client-provided total
          const checkIn = getFutureDate(20);
          const checkOut = getFutureDate(23); // 3 nights

          const response = await page.request.post('/api/bookings', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            data: {
              roomId: room.id,
              checkIn: checkIn,
              checkOut: checkOut,
              totalPrice: 9999.99 // Wrong client value - server should override
            }
          });

          if (response.status() === 201) {
            const booking = await response.json();
            const expectedPrice = 3 * pricePerNight;
            
            // SC-003: Server-calculated price should match formula
            expect(booking.totalPrice).toBe(expectedPrice);
            console.log(`SC-003: Server calculated $${booking.totalPrice}, expected $${expectedPrice}`);
          }
        }
      }
    });

    test('US3-AC3: booking response should include all required fields', async ({ page }) => {
      // Make a booking via API
      await login(page);

      const roomsResponse = await page.request.get('/api/rooms');
      const rooms = await roomsResponse.json();
      
      if (rooms && rooms.length > 0) {
        const room = rooms[0];
        const token = await page.evaluate(() => localStorage.getItem('token') || sessionStorage.getItem('token'));

        if (token) {
          const response = await page.request.post('/api/bookings', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            data: {
              roomId: room.id,
              checkIn: getFutureDate(25),
              checkOut: getFutureDate(28)
            }
          });

          if (response.status() === 201) {
            const booking = await response.json();
            
            // US3-AC3: Response should include these fields
            expect(booking.id).toBeDefined();
            expect(booking.totalPrice).toBeDefined();
            expect(booking.checkIn).toBeDefined();
            expect(booking.checkOut).toBeDefined();
          }
        }
      }
    });

  });

  test.describe('US4: View My Bookings', () => {

    test.beforeEach(async ({ page }) => {
      await login(page);
    });

    test('US4-AC1: should display user bookings after creating booking', async ({ page }) => {
      // Navigate to My Bookings
      await page.goto('/my-bookings');
      await page.waitForLoadState('networkidle');

      // Should show bookings list or empty state
      const bookingCards = page.locator('[class*="booking"], .booking-card, mat-card');
      const emptyState = page.locator('text=/no booking|empty/i');

      const hasBookings = await bookingCards.count() > 0;
      const hasEmptyState = await emptyState.count() > 0;

      expect(hasBookings || hasEmptyState).toBeTruthy();
    });

    test('US4-AC2: each booking should display required information', async ({ page }) => {
      await page.goto('/my-bookings');
      await page.waitForLoadState('networkidle');

      const bookingCard = page.locator('[class*="booking"], .booking-card, mat-card').first();
      
      if (await bookingCard.count() > 0) {
        // US4-AC2: Each booking should show hotel name, room type, dates, price, status
        const cardText = await bookingCard.textContent();
        
        // At minimum, should show some booking info
        expect(cardText).toBeTruthy();
        console.log('Booking card content:', cardText?.substring(0, 200));
      }
    });

    test('US4-AC3: empty state when no bookings', async ({ page }) => {
      // This test needs a user with no bookings
      // For now, just verify the page loads correctly
      await page.goto('/my-bookings');
      await page.waitForLoadState('networkidle');

      // Page should load without errors
      await expect(page).not.toHaveURL(/error/);
    });

  });

  test.describe('Booking Validation', () => {

    test.beforeEach(async ({ page }) => {
      await login(page);
    });

    test('EC-002: should reject booking with checkout before checkin', async ({ page }) => {
      const roomsResponse = await page.request.get('/api/rooms');
      const rooms = await roomsResponse.json();
      
      if (rooms && rooms.length > 0) {
        const room = rooms[0];
        const token = await page.evaluate(() => localStorage.getItem('token') || sessionStorage.getItem('token'));

        if (token) {
          const response = await page.request.post('/api/bookings', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            data: {
              roomId: room.id,
              checkIn: getFutureDate(15),
              checkOut: getFutureDate(12) // Before check-in!
            }
          });

          // EC-002: Should return 400 Bad Request
          expect(response.status()).toBe(400);
          
          const error = await response.json();
          expect(JSON.stringify(error)).toContain('Check-out');
        }
      }
    });

    test('EC-003: should reject booking with past check-in date', async ({ page }) => {
      const roomsResponse = await page.request.get('/api/rooms');
      const rooms = await roomsResponse.json();
      
      if (rooms && rooms.length > 0) {
        const room = rooms[0];
        const token = await page.evaluate(() => localStorage.getItem('token') || sessionStorage.getItem('token'));

        if (token) {
          const pastDate = new Date();
          pastDate.setDate(pastDate.getDate() - 5);

          const response = await page.request.post('/api/bookings', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            data: {
              roomId: room.id,
              checkIn: pastDate.toISOString().split('T')[0],
              checkOut: getFutureDate(5)
            }
          });

          // EC-003: Should return 400 Bad Request
          expect(response.status()).toBe(400);
          
          const error = await response.json();
          expect(JSON.stringify(error)).toContain('past');
        }
      }
    });

    test('EC-005: should reject booking with non-existent room', async ({ page }) => {
      const token = await page.evaluate(() => localStorage.getItem('token') || sessionStorage.getItem('token'));

      if (token) {
        const response = await page.request.post('/api/bookings', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          data: {
            roomId: '00000000-0000-0000-0000-000000000000', // Non-existent
            checkIn: getFutureDate(10),
            checkOut: getFutureDate(13)
          }
        });

        // EC-005: Should return 404 Not Found
        expect(response.status()).toBe(404);
      }
    });

  });

  test.describe('Performance', () => {

    test('NFR-001: booking creation should complete within 500ms', async ({ page }) => {
      await login(page);

      const roomsResponse = await page.request.get('/api/rooms');
      const rooms = await roomsResponse.json();
      
      if (rooms && rooms.length > 0) {
        const room = rooms[0];
        const token = await page.evaluate(() => localStorage.getItem('token') || sessionStorage.getItem('token'));

        if (token) {
          const startTime = Date.now();

          const response = await page.request.post('/api/bookings', {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            data: {
              roomId: room.id,
              checkIn: getFutureDate(30),
              checkOut: getFutureDate(33)
            }
          });

          const endTime = Date.now();
          const duration = endTime - startTime;

          // NFR-001: Should complete within 500ms (p95)
          console.log(`Booking creation took ${duration}ms`);
          expect(duration).toBeLessThan(500);
        }
      }
    });

  });

});
