import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { SanitizationService } from './sanitization.service';

describe('SanitizationService - XSS Prevention', () => {
  let service: SanitizationService;
  let sanitizer: DomSanitizer;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SanitizationService]
    });
    service = TestBed.inject(SanitizationService);
    sanitizer = TestBed.inject(DomSanitizer);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('XSS Attack Prevention', () => {
    it('should remove script tags from HTML', () => {
      const malicious = '<script>alert("XSS")</script><p>Safe content</p>';
      const result = service.sanitizeHtml(malicious);
      
      expect(result.toString()).not.toContain('<script>');
      expect(result.toString()).not.toContain('alert');
    });

    it('should remove event handlers from HTML', () => {
      const malicious = '<img src="x" onerror="alert(\'XSS\')">';
      const result = service.sanitizeHtml(malicious);
      
      expect(result.toString()).not.toContain('onerror');
      expect(result.toString()).not.toContain('alert');
    });

    it('should remove iframe tags', () => {
      const malicious = '<iframe src="javascript:alert(\'XSS\')"></iframe>';
      const result = service.sanitizeHtml(malicious);
      
      expect(result.toString()).not.toContain('<iframe');
      expect(result.toString()).not.toContain('javascript:');
    });

    it('should remove javascript: URLs', () => {
      const malicious = '<a href="javascript:alert(\'XSS\')">Click</a>';
      const result = service.sanitizeHtml(malicious);
      
      expect(result.toString()).not.toContain('javascript:');
    });

    it('should allow safe HTML tags', () => {
      const safe = '<p>Hello <b>World</b></p>';
      const result = service.sanitizeHtml(safe);
      
      expect(result.toString()).toContain('Hello');
      expect(result.toString()).toContain('World');
    });

    it('should handle multiple XSS vectors', () => {
      const malicious = `
        <script>alert('XSS1')</script>
        <img src=x onerror=alert('XSS2')>
        <svg onload=alert('XSS3')>
        <iframe src="javascript:alert('XSS4')"></iframe>
      `;
      const result = service.sanitizeHtml(malicious);
      
      expect(result.toString()).not.toContain('alert');
      expect(result.toString()).not.toContain('onerror');
      expect(result.toString()).not.toContain('onload');
      expect(result.toString()).not.toContain('javascript:');
    });
  });

  describe('Text Sanitization', () => {
    it('should remove HTML tags from text', () => {
      const input = '<script>alert("XSS")</script>Hello';
      const result = service.sanitizeText(input);
      
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('</script>');
      expect(result).toContain('Hello');
    });

    it('should encode special characters', () => {
      const input = '<>&"\'/';
      const result = service.sanitizeText(input);
      
      expect(result).toContain('&lt;');
      expect(result).toContain('&gt;');
      expect(result).toContain('&amp;');
      expect(result).toContain('&quot;');
      expect(result).toContain('&#x27;');
      expect(result).toContain('&#x2F;');
    });

    it('should handle empty input', () => {
      const result = service.sanitizeText('');
      expect(result).toBe('');
    });

    it('should handle null input', () => {
      const result = service.sanitizeText(null as any);
      expect(result).toBe('');
    });
  });

  describe('Email Sanitization', () => {
    it('should validate correct email format', () => {
      const email = 'test@example.com';
      const result = service.sanitizeEmail(email);
      
      expect(result).toBe('test@example.com');
    });

    it('should reject invalid email format', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test@example',
        '<script>@example.com'
      ];

      invalidEmails.forEach(email => {
        const result = service.sanitizeEmail(email);
        expect(result).toBe('');
      });
    });

    it('should convert email to lowercase', () => {
      const email = 'Test@Example.COM';
      const result = service.sanitizeEmail(email);
      
      expect(result).toBe('test@example.com');
    });

    it('should trim whitespace', () => {
      const email = '  test@example.com  ';
      const result = service.sanitizeEmail(email);
      
      expect(result).toBe('test@example.com');
    });
  });

  describe('Search Query Sanitization', () => {
    it('should remove SQL injection attempts', () => {
      const malicious = "'; DROP TABLE Users; --";
      const result = service.sanitizeSearchQuery(malicious);
      
      expect(result).not.toContain("'");
      expect(result).not.toContain(';');
      expect(result).not.toContain('--');
    });

    it('should remove script tags from search', () => {
      const malicious = '<script>alert("XSS")</script>hotel';
      const result = service.sanitizeSearchQuery(malicious);
      
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
    });

    it('should limit search query length', () => {
      const longQuery = 'a'.repeat(300);
      const result = service.sanitizeSearchQuery(longQuery);
      
      expect(result.length).toBeLessThanOrEqual(200);
    });

    it('should allow normal search queries', () => {
      const query = 'Hotel California';
      const result = service.sanitizeSearchQuery(query);
      
      expect(result).toBe('Hotel California');
    });
  });

  describe('Name Sanitization', () => {
    it('should allow alphanumeric and common punctuation', () => {
      const name = "John O'Brien-Smith";
      const result = service.sanitizeName(name);
      
      expect(result).toBe("John O'Brien-Smith");
    });

    it('should remove special characters', () => {
      const name = 'John<script>alert("XSS")</script>Doe';
      const result = service.sanitizeName(name);
      
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).not.toContain('script');
    });

    it('should trim whitespace', () => {
      const name = '  John Doe  ';
      const result = service.sanitizeName(name);
      
      expect(result).toBe('John Doe');
    });
  });

  describe('Description Sanitization', () => {
    it('should allow safe formatting tags', () => {
      const description = '<p>This is a <b>great</b> hotel!</p>';
      const result = service.sanitizeDescription(description);
      
      expect(result).toContain('great');
      expect(result).toContain('hotel');
    });

    it('should remove dangerous tags', () => {
      const description = '<script>alert("XSS")</script><p>Hotel description</p>';
      const result = service.sanitizeDescription(description);
      
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
      expect(result).toContain('Hotel description');
    });

    it('should limit description length', () => {
      const longDescription = 'a'.repeat(6000);
      const result = service.sanitizeDescription(longDescription);
      
      expect(result.length).toBeLessThanOrEqual(5000);
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
      expect(service.sanitizeNumber('12abc')).toBeNull();
      expect(service.sanitizeNumber(NaN)).toBeNull();
    });
  });

  describe('Date Sanitization', () => {
    it('should parse valid dates', () => {
      const date = '2024-12-25';
      const result = service.sanitizeDate(date);
      
      expect(result).not.toBeNull();
      expect(result).toContain('2024');
    });

    it('should return null for invalid dates', () => {
      expect(service.sanitizeDate('invalid-date')).toBeNull();
      expect(service.sanitizeDate('2024-13-45')).toBeNull();
      expect(service.sanitizeDate(null)).toBeNull();
    });

    it('should return ISO string format', () => {
      const date = new Date('2024-12-25');
      const result = service.sanitizeDate(date);
      
      expect(result).toContain('T');
      expect(result).toContain('Z');
    });
  });

  describe('Object Sanitization', () => {
    it('should sanitize all string properties', () => {
      const obj = {
        name: '<script>alert("XSS")</script>John',
        email: 'test@example.com',
        age: 30
      };

      const result = service.sanitizeObject(obj);
      
      expect(result.name).not.toContain('<script>');
      expect(result.email).toBe('test@example.com');
      expect(result.age).toBe(30);
    });

    it('should handle nested objects', () => {
      const obj = {
        user: {
          name: '<b>John</b>',
          profile: {
            bio: '<script>alert("XSS")</script>'
          }
        }
      };

      const result = service.sanitizeObject(obj);
      
      expect(result.user.name).not.toContain('<b>');
      expect(result.user.profile.bio).not.toContain('<script>');
    });
  });

  describe('Booking Data Sanitization', () => {
    it('should sanitize all booking fields', () => {
      const bookingData = {
        roomId: '123e4567-e89b-12d3-a456-426614174000',
        checkInDate: '2024-12-25',
        checkOutDate: '2024-12-27',
        guestName: '<script>alert("XSS")</script>John Doe',
        guestEmail: 'TEST@EXAMPLE.COM',
        guestPhone: '555-123-4567',
        specialRequests: '<script>alert("XSS")</script>Late check-in'
      };

      const result = service.sanitizeBookingData(bookingData);
      
      expect(result.guestName).not.toContain('<script>');
      expect(result.guestEmail).toBe('test@example.com');
      expect(result.guestPhone).toBe('555-123-4567');
      expect(result.specialRequests).not.toContain('<script>');
    });
  });

  describe('User Data Sanitization', () => {
    it('should sanitize user registration data', () => {
      const userData = {
        email: 'TEST@EXAMPLE.COM',
        fullName: '<script>alert("XSS")</script>John Doe',
        phoneNumber: '555-123-4567',
        password: 'SecurePass123!'
      };

      const result = service.sanitizeUserData(userData);
      
      expect(result.email).toBe('test@example.com');
      expect(result.fullName).not.toContain('<script>');
      expect(result.phoneNumber).toBe('555-123-4567');
      expect(result.password).toBe('SecurePass123!'); // Password not sanitized
    });
  });

  describe('Search Criteria Sanitization', () => {
    it('should sanitize search criteria', () => {
      const criteria = {
        city: '<script>alert("XSS")</script>New York',
        checkInDate: '2024-12-25',
        checkOutDate: '2024-12-27',
        guests: '2',
        minPrice: '100',
        maxPrice: '500'
      };

      const result = service.sanitizeSearchCriteria(criteria);
      
      expect(result.city).not.toContain('<script>');
      expect(result.guests).toBe(2);
      expect(result.minPrice).toBe(100);
      expect(result.maxPrice).toBe(500);
    });
  });

  describe('Phone Number Sanitization', () => {
    it('should keep valid phone characters', () => {
      const phone = '555-123-4567';
      const result = service.sanitizePhoneNumber(phone);
      
      expect(result).toBe('555-123-4567');
    });

    it('should remove invalid characters', () => {
      const phone = '555<script>123</script>4567';
      const result = service.sanitizePhoneNumber(phone);
      
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
      expect(result).not.toContain('script');
    });
  });
});
