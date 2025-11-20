import { TestBed } from '@angular/core/testing';
import { SanitizationService } from './sanitization.service';
import { DomSanitizer } from '@angular/platform-browser';

describe('SanitizationService - Security Tests', () => {
  let service: SanitizationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SanitizationService]
    });
    service = TestBed.inject(SanitizationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('XSS Prevention', () => {
    it('should remove script tags from HTML', () => {
      const maliciousHtml = '<p>Hello</p><script>alert("XSS")</script>';
      const sanitized = service.sanitizeHtml(maliciousHtml);
      
      expect(sanitized.toString()).not.toContain('<script>');
      expect(sanitized.toString()).not.toContain('alert');
    });

    it('should remove event handlers from HTML', () => {
      const maliciousHtml = '<img src="x" onerror="alert(\'XSS\')">';
      const sanitized = service.sanitizeHtml(maliciousHtml);
      
      expect(sanitized.toString()).not.toContain('onerror');
      expect(sanitized.toString()).not.toContain('alert');
    });

    it('should remove iframe tags', () => {
      const maliciousHtml = '<iframe src="http://evil.com"></iframe>';
      const sanitized = service.sanitizeHtml(maliciousHtml);
      
      expect(sanitized.toString()).not.toContain('<iframe');
    });

    it('should allow safe HTML tags', () => {
      const safeHtml = '<p>Hello <b>World</b></p>';
      const sanitized = service.sanitizeHtml(safeHtml);
      
      expect(sanitized.toString()).toContain('Hello');
      expect(sanitized.toString()).toContain('World');
    });

    it('should sanitize text input by removing HTML', () => {
      const input = '<script>alert("XSS")</script>Hello';
      const sanitized = service.sanitizeText(input);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('Hello');
    });

    it('should encode special characters in text', () => {
      const input = '<>&"\'';
      const sanitized = service.sanitizeText(input);
      
      expect(sanitized).toContain('&lt;');
      expect(sanitized).toContain('&gt;');
      expect(sanitized).toContain('&amp;');
    });
  });

  describe('Email Sanitization', () => {
    it('should validate and sanitize valid email', () => {
      const email = 'test@example.com';
      const sanitized = service.sanitizeEmail(email);
      
      expect(sanitized).toBe('test@example.com');
    });

    it('should reject invalid email format', () => {
      const invalidEmails = [
        'invalid-email',
        'test@',
        '@example.com',
        'test@example',
        ''
      ];

      invalidEmails.forEach(email => {
        const sanitized = service.sanitizeEmail(email);
        expect(sanitized).toBe('');
      });
    });

    it('should convert email to lowercase', () => {
      const email = 'Test@Example.COM';
      const sanitized = service.sanitizeEmail(email);
      
      expect(sanitized).toBe('test@example.com');
    });
  });

  describe('Search Query Sanitization', () => {
    it('should remove SQL injection attempts', () => {
      const maliciousQuery = "'; DROP TABLE Users; --";
      const sanitized = service.sanitizeSearchQuery(maliciousQuery);
      
      expect(sanitized).not.toContain("'");
      expect(sanitized).not.toContain(';');
      expect(sanitized).not.toContain('--');
    });

    it('should remove script tags from search', () => {
      const maliciousQuery = '<script>alert("XSS")</script>hotel';
      const sanitized = service.sanitizeSearchQuery(maliciousQuery);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('hotel');
    });

    it('should limit search query length', () => {
      const longQuery = 'a'.repeat(300);
      const sanitized = service.sanitizeSearchQuery(longQuery);
      
      expect(sanitized.length).toBeLessThanOrEqual(200);
    });
  });

  describe('Description Sanitization', () => {
    it('should remove dangerous tags from description', () => {
      const maliciousDesc = '<p>Good hotel</p><script>alert("XSS")</script>';
      const sanitized = service.sanitizeDescription(maliciousDesc);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('Good hotel');
    });

    it('should remove event handlers from description', () => {
      const maliciousDesc = '<p onclick="alert(\'XSS\')">Click me</p>';
      const sanitized = service.sanitizeDescription(maliciousDesc);
      
      expect(sanitized).not.toContain('onclick');
    });

    it('should limit description length', () => {
      const longDesc = 'a'.repeat(6000);
      const sanitized = service.sanitizeDescription(longDesc);
      
      expect(sanitized.length).toBeLessThanOrEqual(5000);
    });
  });

  describe('Phone Number Sanitization', () => {
    it('should keep valid phone number characters', () => {
      const phone = '555-123-4567';
      const sanitized = service.sanitizePhoneNumber(phone);
      
      expect(sanitized).toBe('555-123-4567');
    });

    it('should remove invalid characters from phone', () => {
      const phone = '555-123-4567<script>alert("XSS")</script>';
      const sanitized = service.sanitizePhoneNumber(phone);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('555-123-4567');
    });
  });

  describe('Booking Data Sanitization', () => {
    it('should sanitize all booking fields', () => {
      const bookingData = {
        roomId: '123e4567-e89b-12d3-a456-426614174000',
        checkInDate: '2024-01-01',
        checkOutDate: '2024-01-05',
        guestName: '<script>alert("XSS")</script>John Doe',
        guestEmail: 'test@example.com',
        guestPhone: '555-123-4567',
        specialRequests: '<script>alert("XSS")</script>No smoking'
      };

      const sanitized = service.sanitizeBookingData(bookingData);

      expect(sanitized.guestName).not.toContain('<script>');
      expect(sanitized.guestName).toContain('John Doe');
      expect(sanitized.specialRequests).not.toContain('<script>');
      expect(sanitized.specialRequests).toContain('No smoking');
    });
  });

  describe('User Data Sanitization', () => {
    it('should sanitize user registration data', () => {
      const userData = {
        email: 'Test@Example.COM',
        fullName: '<script>alert("XSS")</script>John Doe',
        phoneNumber: '555-123-4567<script>',
        password: 'Password123!'
      };

      const sanitized = service.sanitizeUserData(userData);

      expect(sanitized.email).toBe('test@example.com');
      expect(sanitized.fullName).not.toContain('<script>');
      expect(sanitized.phoneNumber).not.toContain('<script>');
      expect(sanitized.password).toBe('Password123!'); // Password not sanitized
    });
  });

  describe('Number Sanitization', () => {
    it('should parse valid numbers', () => {
      expect(service.sanitizeNumber('123')).toBe(123);
      expect(service.sanitizeNumber('123.45')).toBe(123.45);
      expect(service.sanitizeNumber(456)).toBe(456);
    });

    it('should return null for invalid numbers', () => {
      expect(service.sanitizeNumber('abc')).toBeNull();
      expect(service.sanitizeNumber('123abc')).toBeNull();
      expect(service.sanitizeNumber(NaN)).toBeNull();
    });
  });

  describe('Date Sanitization', () => {
    it('should validate and sanitize valid dates', () => {
      const date = '2024-01-01';
      const sanitized = service.sanitizeDate(date);
      
      expect(sanitized).not.toBeNull();
      expect(sanitized).toContain('2024');
    });

    it('should return null for invalid dates', () => {
      const invalidDates = ['invalid-date', '2024-13-01', '', null];

      invalidDates.forEach(date => {
        const sanitized = service.sanitizeDate(date);
        expect(sanitized).toBeNull();
      });
    });
  });

  describe('Object Sanitization', () => {
    it('should recursively sanitize object properties', () => {
      const obj = {
        name: '<script>alert("XSS")</script>Hotel',
        description: '<p onclick="alert(\'XSS\')">Description</p>',
        nested: {
          field: '<script>alert("XSS")</script>Value'
        }
      };

      const sanitized = service.sanitizeObject(obj);

      expect(sanitized.name).not.toContain('<script>');
      expect(sanitized.description).not.toContain('onclick');
      expect(sanitized.nested.field).not.toContain('<script>');
    });
  });
});
