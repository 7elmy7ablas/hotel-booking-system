import { Injectable } from '@angular/core';
import { DomSanitizer, SafeHtml, SafeUrl, SafeResourceUrl } from '@angular/platform-browser';
import DOMPurify from 'dompurify';

/**
 * Sanitization Service - Prevents XSS attacks
 * 
 * This service provides methods to sanitize user input and prevent
 * Cross-Site Scripting (XSS) attacks throughout the application.
 * 
 * SECURITY ENHANCEMENTS:
 * - Uses DOMPurify for robust HTML sanitization
 * - Uses Angular's built-in DomSanitizer as secondary layer
 * - Implements strict input validation and encoding
 */
@Injectable({
  providedIn: 'root'
})
export class SanitizationService {
  
  constructor(private sanitizer: DomSanitizer) {
    // Configure DOMPurify for strict sanitization
    DOMPurify.setConfig({
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true,
      RETURN_DOM: false,
      RETURN_DOM_FRAGMENT: false,
      FORCE_BODY: true
    });
  }

  /**
   * Sanitize HTML content to prevent XSS
   * SECURITY: Uses DOMPurify + Angular sanitizer (double layer protection)
   * Removes dangerous scripts, event handlers, and malicious tags
   */
  sanitizeHtml(html: string): SafeHtml {
    if (!html) return '';
    
    // First pass: DOMPurify (most robust)
    const purified = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true
    });
    
    // Second pass: Angular sanitizer
    return this.sanitizer.sanitize(1, purified) || ''; // SecurityContext.HTML = 1
  }

  /**
   * Sanitize URL to prevent javascript: and data: URLs
   */
  sanitizeUrl(url: string): SafeUrl {
    return this.sanitizer.sanitize(4, url) || ''; // SecurityContext.URL = 4
  }

  /**
   * Sanitize resource URL (for iframes, etc.)
   */
  sanitizeResourceUrl(url: string): SafeResourceUrl {
    return this.sanitizer.sanitize(5, url) || ''; // SecurityContext.RESOURCE_URL = 5
  }

  /**
   * Sanitize plain text input
   * Removes HTML tags and dangerous characters
   */
  sanitizeText(text: string): string {
    if (!text) return '';
    
    // Remove HTML tags
    let sanitized = text.replace(/<[^>]*>/g, '');
    
    // Encode special characters
    sanitized = sanitized
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
    
    return sanitized;
  }

  /**
   * Sanitize email address
   * Validates format and removes dangerous characters
   */
  sanitizeEmail(email: string): string {
    if (!email) return '';
    
    // Remove whitespace
    let sanitized = email.trim().toLowerCase();
    
    // Basic email validation pattern
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!emailPattern.test(sanitized)) {
      return '';
    }
    
    return sanitized;
  }

  /**
   * Sanitize phone number
   * Removes non-numeric characters except + and -
   */
  sanitizePhoneNumber(phone: string): string {
    if (!phone) return '';
    
    // Keep only digits, +, -, (, ), and spaces
    return phone.replace(/[^\d+\-() ]/g, '');
  }

  /**
   * Sanitize user input for search queries
   * Prevents SQL injection and XSS in search
   */
  sanitizeSearchQuery(query: string): string {
    if (!query) return '';
    
    // Remove dangerous characters
    let sanitized = query.trim();
    
    // Remove SQL injection attempts
    sanitized = sanitized.replace(/['";\\]/g, '');
    
    // Remove script tags
    sanitized = sanitized.replace(/<script[^>]*>.*?<\/script>/gi, '');
    
    // Limit length
    if (sanitized.length > 200) {
      sanitized = sanitized.substring(0, 200);
    }
    
    return sanitized;
  }

  /**
   * Sanitize hotel/room name
   * Allows alphanumeric, spaces, and common punctuation
   */
  sanitizeName(name: string): string {
    if (!name) return '';
    
    // Allow letters, numbers, spaces, hyphens, apostrophes
    return name.replace(/[^a-zA-Z0-9\s\-']/g, '').trim();
  }

  /**
   * Sanitize description/comments
   * SECURITY: Uses DOMPurify to remove dangerous HTML while preserving safe formatting
   */
  sanitizeDescription(description: string): string {
    if (!description) return '';
    
    // Use DOMPurify for robust sanitization
    let sanitized = DOMPurify.sanitize(description, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true
    });
    
    // Limit length
    if (sanitized.length > 5000) {
      sanitized = sanitized.substring(0, 5000);
    }
    
    return sanitized.trim();
  }

  /**
   * Sanitize numeric input
   * Ensures only valid numbers
   */
  sanitizeNumber(value: any): number | null {
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  }

  /**
   * Sanitize date input
   * Validates and returns ISO string or null
   */
  sanitizeDate(date: any): string | null {
    if (!date) return null;
    
    const dateObj = new Date(date);
    
    if (isNaN(dateObj.getTime())) {
      return null;
    }
    
    return dateObj.toISOString();
  }

  /**
   * Sanitize object for API submission
   * Recursively sanitizes all string properties
   */
  sanitizeObject<T extends Record<string, any>>(obj: T): T {
    const sanitized = { ...obj };
    
    for (const key in sanitized) {
      if (typeof sanitized[key] === 'string') {
        sanitized[key] = this.sanitizeText(sanitized[key]) as any;
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeObject(sanitized[key]);
      }
    }
    
    return sanitized;
  }

  /**
   * Validate and sanitize booking data
   */
  sanitizeBookingData(data: any): any {
    return {
      roomId: data.roomId, // GUID - no sanitization needed
      checkInDate: this.sanitizeDate(data.checkInDate),
      checkOutDate: this.sanitizeDate(data.checkOutDate),
      guestName: this.sanitizeName(data.guestName),
      guestEmail: this.sanitizeEmail(data.guestEmail),
      guestPhone: this.sanitizePhoneNumber(data.guestPhone),
      specialRequests: this.sanitizeDescription(data.specialRequests || '')
    };
  }

  /**
   * Validate and sanitize user registration data
   */
  sanitizeUserData(data: any): any {
    return {
      email: this.sanitizeEmail(data.email),
      fullName: this.sanitizeName(data.fullName),
      phoneNumber: this.sanitizePhoneNumber(data.phoneNumber || ''),
      password: data.password // Don't sanitize password - validate separately
    };
  }

  /**
   * Validate and sanitize hotel search criteria
   */
  sanitizeSearchCriteria(criteria: any): any {
    return {
      city: this.sanitizeSearchQuery(criteria.city || ''),
      checkInDate: this.sanitizeDate(criteria.checkInDate),
      checkOutDate: this.sanitizeDate(criteria.checkOutDate),
      guests: this.sanitizeNumber(criteria.guests),
      minPrice: this.sanitizeNumber(criteria.minPrice),
      maxPrice: this.sanitizeNumber(criteria.maxPrice)
    };
  }
}
