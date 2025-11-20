/**
 * End-to-End Tests for Hotel Booking Application
 * 
 * Tests major user flows:
 * 1. Guest browsing hotels
 * 2. User registration and booking
 * 3. Admin dashboard operations
 * 
 * Note: These tests require Playwright or Cypress to be installed
 * This is a template that can be adapted to your E2E framework
 */

describe('Hotel Booking E2E Tests', () => {
  const baseUrl = 'http://localhost:4200';
  const apiUrl = 'http://localhost:5000/api';

  beforeEach(() => {
    // Visit home page before each test
    cy.visit(baseUrl);
  });

  describe('Guest User Flow - Browse Hotels', () => {
    it('should display home page with featured hotels', () => {
      cy.get('h1').should('contain', 'Find Your Perfect Stay');
      cy.get('.hotel-card').should('have.length.greaterThan', 0);
    });

    it('should search for hotels by city', () => {
      cy.get('input[placeholder*="Search"]').type('New York');
      cy.get('button').contains('Search').click();
      
      cy.url().should('include', '/hotels');
      cy.get('.hotel-card').should('exist');
    });

    it('should navigate to hotel details', () => {
      cy.get('.hotel-card').first().click();
      
      cy.url().should('include', '/hotel-details');
      cy.get('h1').should('exist');
      cy.get('.room-card').should('exist');
    });

    it('should filter hotels by city', () => {
      cy.visit(`${baseUrl}/hotels`);
      
      cy.get('mat-select[formControlName="city"]').click();
      cy.get('mat-option').contains('New York').click();
      
      cy.get('.hotel-card').each(($card) => {
        cy.wrap($card).should('contain', 'New York');
      });
    });

    it('should show hotel amenities', () => {
      cy.get('.hotel-card').first().click();
      
      cy.get('.amenities-grid').should('exist');
      cy.get('.amenity-item').should('have.length.greaterThan', 0);
    });

    it('should display hotel rating', () => {
      cy.get('.hotel-card').first().within(() => {
        cy.get('.hotel-rating').should('exist');
        cy.get('.rating-value').should('match', /[0-5]\.\d/);
      });
    });
  });

  describe('User Registration and Booking Flow', () => {
    it('should register a new user', () => {
      cy.get('button').contains('Register').click();
      
      cy.url().should('include', '/register');
      
      const timestamp = Date.now();
      cy.get('input[formControlName="fullName"]').type('Test User');
      cy.get('input[formControlName="email"]').type(`test${timestamp}@example.com`);
      cy.get('input[formControlName="password"]').type('Test123!');
      cy.get('input[formControlName="confirmPassword"]').type('Test123!');
      
      cy.get('button[type="submit"]').click();
      
      cy.url().should('include', '/login');
      cy.get('.success-message').should('contain', 'Registration successful');
    });

    it('should login with valid credentials', () => {
      cy.get('button').contains('Login').click();
      
      cy.get('input[formControlName="email"]').type('test@example.com');
      cy.get('input[formControlName="password"]').type('Test123!');
      
      cy.get('button[type="submit"]').click();
      
      cy.url().should('eq', `${baseUrl}/`);
      cy.get('.user-menu-button').should('exist');
    });

    it('should complete full booking flow', () => {
      // Login first
      cy.login('test@example.com', 'Test123!');
      
      // Browse hotels
      cy.visit(`${baseUrl}/hotels`);
      cy.get('.hotel-card').first().click();
      
      // Select room
      cy.get('.room-card').first().within(() => {
        cy.get('button').contains('Book').click();
      });
      
      // Fill booking form
      cy.get('input[formControlName="checkInDate"]').type('2025-02-01');
      cy.get('input[formControlName="checkOutDate"]').type('2025-02-05');
      cy.get('input[formControlName="guestName"]').type('John Doe');
      cy.get('input[formControlName="guestEmail"]').type('john@example.com');
      cy.get('input[formControlName="guestPhone"]').type('1234567890');
      
      // Submit booking
      cy.get('button[type="submit"]').contains('Confirm').click();
      
      // Verify success
      cy.get('.success-message').should('contain', 'Booking confirmed');
      cy.url().should('include', '/my-bookings');
    });

    it('should view booking history', () => {
      cy.login('test@example.com', 'Test123!');
      
      cy.get('a').contains('My Bookings').click();
      
      cy.url().should('include', '/my-bookings');
      cy.get('.booking-card').should('exist');
    });

    it('should cancel a booking', () => {
      cy.login('test@example.com', 'Test123!');
      
      cy.visit(`${baseUrl}/my-bookings`);
      
      cy.get('.booking-card').first().within(() => {
        cy.get('button').contains('Cancel').click();
      });
      
      cy.get('.confirm-dialog').within(() => {
        cy.get('button').contains('Confirm').click();
      });
      
      cy.get('.success-message').should('contain', 'Booking cancelled');
    });

    it('should update user profile', () => {
      cy.login('test@example.com', 'Test123!');
      
      cy.get('.user-menu-button').click();
      cy.get('button').contains('Profile').click();
      
      cy.get('input[formControlName="fullName"]').clear().type('Updated Name');
      cy.get('input[formControlName="phoneNumber"]').type('9876543210');
      
      cy.get('button[type="submit"]').click();
      
      cy.get('.success-message').should('contain', 'Profile updated');
    });
  });

  describe('Admin Dashboard Flow', () => {
    beforeEach(() => {
      cy.login('admin@example.com', 'Admin123!');
    });

    it('should access admin dashboard', () => {
      cy.visit(`${baseUrl}/admin`);
      
      cy.url().should('include', '/admin');
      cy.get('h1').should('contain', 'Admin Dashboard');
    });

    it('should view all bookings', () => {
      cy.visit(`${baseUrl}/admin/bookings`);
      
      cy.get('.bookings-table').should('exist');
      cy.get('tr').should('have.length.greaterThan', 1);
    });

    it('should create a new hotel', () => {
      cy.visit(`${baseUrl}/admin/hotels`);
      
      cy.get('button').contains('Add Hotel').click();
      
      cy.get('input[formControlName="name"]').type('New Test Hotel');
      cy.get('textarea[formControlName="description"]').type('A beautiful test hotel');
      cy.get('input[formControlName="location"]').type('123 Test St');
      cy.get('input[formControlName="city"]').type('Test City');
      cy.get('input[formControlName="country"]').type('Test Country');
      cy.get('input[formControlName="rating"]').type('4.5');
      
      cy.get('button[type="submit"]').click();
      
      cy.get('.success-message').should('contain', 'Hotel created');
    });

    it('should update hotel information', () => {
      cy.visit(`${baseUrl}/admin/hotels`);
      
      cy.get('.hotel-row').first().within(() => {
        cy.get('button').contains('Edit').click();
      });
      
      cy.get('input[formControlName="name"]').clear().type('Updated Hotel Name');
      cy.get('button[type="submit"]').click();
      
      cy.get('.success-message').should('contain', 'Hotel updated');
    });

    it('should delete a hotel', () => {
      cy.visit(`${baseUrl}/admin/hotels`);
      
      cy.get('.hotel-row').last().within(() => {
        cy.get('button').contains('Delete').click();
      });
      
      cy.get('.confirm-dialog').within(() => {
        cy.get('button').contains('Confirm').click();
      });
      
      cy.get('.success-message').should('contain', 'Hotel deleted');
    });

    it('should view booking statistics', () => {
      cy.visit(`${baseUrl}/admin`);
      
      cy.get('.stats-card').should('have.length', 4);
      cy.get('.stats-card').first().should('contain', 'Total Bookings');
    });

    it('should filter bookings by status', () => {
      cy.visit(`${baseUrl}/admin/bookings`);
      
      cy.get('mat-select[formControlName="status"]').click();
      cy.get('mat-option').contains('Confirmed').click();
      
      cy.get('.booking-row').each(($row) => {
        cy.wrap($row).should('contain', 'Confirmed');
      });
    });
  });

  describe('Accessibility Tests', () => {
    it('should have proper ARIA labels', () => {
      cy.get('[aria-label]').should('have.length.greaterThan', 0);
    });

    it('should be keyboard navigable', () => {
      cy.get('body').tab();
      cy.focused().should('have.attr', 'tabindex');
    });

    it('should have proper heading hierarchy', () => {
      cy.get('h1').should('have.length', 1);
      cy.get('h2').should('exist');
    });

    it('should have alt text for images', () => {
      cy.get('img').each(($img) => {
        cy.wrap($img).should('have.attr', 'alt');
      });
    });

    it('should pass axe accessibility audit', () => {
      cy.injectAxe();
      cy.checkA11y();
    });
  });

  describe('Performance Tests', () => {
    it('should load home page within 3 seconds', () => {
      const start = Date.now();
      cy.visit(baseUrl);
      cy.get('.hotel-card').should('exist');
      const duration = Date.now() - start;
      
      expect(duration).to.be.lessThan(3000);
    });

    it('should lazy load images', () => {
      cy.visit(`${baseUrl}/hotels`);
      
      cy.get('img[loading="lazy"]').should('exist');
    });

    it('should use virtual scrolling for long lists', () => {
      cy.visit(`${baseUrl}/hotels`);
      
      // Check if virtual scroll viewport exists
      cy.get('cdk-virtual-scroll-viewport').should('exist');
    });
  });

  describe('Security Tests', () => {
    it('should prevent XSS in search input', () => {
      cy.visit(`${baseUrl}/hotels`);
      
      cy.get('input[placeholder*="Search"]').type('<script>alert("xss")</script>');
      cy.get('button').contains('Search').click();
      
      // Should not execute script
      cy.on('window:alert', () => {
        throw new Error('XSS vulnerability detected!');
      });
    });

    it('should require authentication for booking', () => {
      cy.visit(`${baseUrl}/hotels`);
      cy.get('.hotel-card').first().click();
      cy.get('.room-card').first().within(() => {
        cy.get('button').contains('Book').click();
      });
      
      cy.url().should('include', '/login');
    });

    it('should protect admin routes', () => {
      cy.visit(`${baseUrl}/admin`);
      
      cy.url().should('include', '/login');
    });
  });
});

// Custom Cypress commands
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit(`${baseUrl}/login`);
  cy.get('input[formControlName="email"]').type(email);
  cy.get('input[formControlName="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should('not.include', '/login');
});

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
    }
  }
}
