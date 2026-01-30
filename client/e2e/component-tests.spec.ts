import { test as base, expect } from '@playwright/test';

/**
 * Custom fixtures for component testing
 */
export const test = base.extend({
  // Add custom fixtures here if needed
});

test.describe('Hotel Card Component', () => {
  
  test('should render hotel information correctly', async ({ page }) => {
    // Mock hotel data
    await page.route('**/api/hotels*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            name: 'Grand Hotel',
            city: 'Cairo',
            description: 'Luxury hotel in the heart of Cairo',
            rating: 4.5,
            imageUrl: '/assets/hotels/grand-hotel.jpg'
          }
        ])
      });
    });

    await page.goto('/');
    await page.waitForSelector('.hotel-card');

    // Check hotel name
    const hotelName = await page.textContent('.hotel-name');
    expect(hotelName).toBe('Grand Hotel');

    // Check city
    const hotelCity = await page.textContent('.hotel-city');
    expect(hotelCity).toContain('Cairo');

    // Check rating
    const rating = await page.textContent('.hotel-rating');
    expect(rating).toContain('4.5');
  });

  test('should handle missing image gracefully', async ({ page }) => {
    await page.route('**/api/hotels*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            name: 'Test Hotel',
            city: 'Cairo',
            imageUrl: null
          }
        ])
      });
    });

    await page.goto('/');
    await page.waitForSelector('.hotel-card');

    // Check if fallback image is used
    const image = page.locator('.hotel-image');
    const src = await image.getAttribute('src');
    expect(src).toContain('default');
  });
});

test.describe('Search Component', () => {
  
  test('should update search results on input change', async ({ page }) => {
    await page.goto('/');

    // Type in search box
    const searchInput = page.locator('input[name="search"]');
    await searchInput.fill('Cairo');

    // Wait for debounce
    await page.waitForTimeout(500);

    // Check if API was called with correct parameter
    await page.waitForRequest(request => 
      request.url().includes('search=Cairo')
    );
  });

  test('should clear search results', async ({ page }) => {
    await page.goto('/');

    const searchInput = page.locator('input[name="search"]');
    await searchInput.fill('Cairo');
    await page.waitForTimeout(500);

    // Click clear button
    await page.click('button.clear-search');

    // Check if search input is empty
    const value = await searchInput.inputValue();
    expect(value).toBe('');
  });
});

test.describe('Date Picker Component', () => {
  
  test('should not allow past dates for check-in', async ({ page }) => {
    await page.goto('/hotels/1');

    const checkInInput = page.locator('input[name="checkIn"]');
    
    // Try to set a past date
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const pastDate = yesterday.toISOString().split('T')[0];
    
    await checkInInput.fill(pastDate);
    
    // Check for validation error
    const errorMessage = page.locator('.date-error');
    await expect(errorMessage).toBeVisible();
  });

  test('should ensure check-out is after check-in', async ({ page }) => {
    await page.goto('/hotels/1');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const checkInDate = tomorrow.toISOString().split('T')[0];

    await page.fill('input[name="checkIn"]', checkInDate);
    await page.fill('input[name="checkOut"]', checkInDate); // Same date

    // Check for validation error
    const errorMessage = page.locator('.date-error');
    await expect(errorMessage).toContainText(/after|later/i);
  });
});

export { expect };
