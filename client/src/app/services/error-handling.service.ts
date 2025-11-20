import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';

export interface ErrorDetails {
  message: string;
  technicalMessage?: string;
  statusCode?: number;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlingService {
  
  /**
   * Get user-friendly error message from HTTP error
   */
  getUserFriendlyMessage(error: any): ErrorDetails {
    const timestamp = new Date();
    
    if (error instanceof HttpErrorResponse) {
      return {
        message: this.getHttpErrorMessage(error),
        technicalMessage: error.message,
        statusCode: error.status,
        timestamp
      };
    }
    
    if (error instanceof Error) {
      return {
        message: 'An unexpected error occurred. Please try again.',
        technicalMessage: error.message,
        timestamp
      };
    }
    
    return {
      message: 'An unknown error occurred. Please try again.',
      technicalMessage: String(error),
      timestamp
    };
  }

  /**
   * Get user-friendly message for HTTP errors
   */
  private getHttpErrorMessage(error: HttpErrorResponse): string {
    // Check for backend error message first
    if (error.error?.message) {
      return error.error.message;
    }

    // Status code based messages
    switch (error.status) {
      case 0:
        return 'Unable to connect to the server. Please check your internet connection.';
      
      case 400:
        return 'Invalid request. Please check your input and try again.';
      
      case 401:
        return 'Your session has expired. Please log in again.';
      
      case 403:
        return 'You do not have permission to perform this action.';
      
      case 404:
        return 'The requested resource was not found.';
      
      case 409:
        return 'This action conflicts with existing data. Please refresh and try again.';
      
      case 422:
        return 'The data you provided is invalid. Please check and try again.';
      
      case 429:
        return 'Too many requests. Please wait a moment and try again.';
      
      case 500:
        return 'A server error occurred. Our team has been notified. Please try again later.';
      
      case 502:
      case 503:
        return 'The service is temporarily unavailable. Please try again in a few moments.';
      
      case 504:
        return 'The request took too long to complete. Please try again.';
      
      default:
        return `An error occurred (${error.status}). Please try again.`;
    }
  }

  /**
   * Get user-friendly message for booking errors
   */
  getBookingErrorMessage(error: any): string {
    const errorDetails = this.getUserFriendlyMessage(error);
    
    // Check for specific booking error patterns
    if (errorDetails.technicalMessage?.toLowerCase().includes('overlap') || 
        errorDetails.technicalMessage?.toLowerCase().includes('already booked')) {
      return 'This room is not available for the selected dates. Please choose different dates or another room.';
    }
    
    if (errorDetails.technicalMessage?.toLowerCase().includes('checkout') || 
        errorDetails.technicalMessage?.toLowerCase().includes('checkin') ||
        errorDetails.message?.toLowerCase().includes('date')) {
      return 'Invalid booking dates. Check-out date must be after check-in date, and dates cannot be in the past.';
    }
    
    if (errorDetails.technicalMessage?.toLowerCase().includes('duration') ||
        errorDetails.technicalMessage?.toLowerCase().includes('30 days')) {
      return 'Booking duration cannot exceed 30 days. Please select a shorter stay.';
    }
    
    if (errorDetails.technicalMessage?.toLowerCase().includes('room') && 
        errorDetails.technicalMessage?.toLowerCase().includes('not found')) {
      return 'The selected room is no longer available. Please choose another room.';
    }
    
    return errorDetails.message;
  }

  /**
   * Get user-friendly message for payment errors
   */
  getPaymentErrorMessage(error: any): string {
    const errorDetails = this.getUserFriendlyMessage(error);
    
    if (errorDetails.statusCode === 402) {
      return 'Payment required. Please complete your payment to proceed.';
    }
    
    if (errorDetails.technicalMessage?.toLowerCase().includes('card') ||
        errorDetails.technicalMessage?.toLowerCase().includes('payment')) {
      return 'Payment processing failed. Please check your payment details and try again.';
    }
    
    return errorDetails.message;
  }

  /**
   * Get user-friendly message for validation errors
   */
  getValidationErrorMessage(error: any): string {
    const errorDetails = this.getUserFriendlyMessage(error);
    
    if (error?.error?.errors) {
      // ASP.NET Core validation errors
      const validationErrors = Object.values(error.error.errors).flat();
      return validationErrors.join(' ');
    }
    
    if (errorDetails.statusCode === 400 || errorDetails.statusCode === 422) {
      return errorDetails.message || 'Please check your input and try again.';
    }
    
    return errorDetails.message;
  }

  /**
   * Get user-friendly message for authentication errors
   */
  getAuthErrorMessage(error: any): string {
    const errorDetails = this.getUserFriendlyMessage(error);
    
    if (errorDetails.statusCode === 401) {
      return 'Invalid email or password. Please try again.';
    }
    
    if (errorDetails.technicalMessage?.includes('email already exists')) {
      return 'An account with this email already exists. Please log in instead.';
    }
    
    if (errorDetails.technicalMessage?.includes('password')) {
      return 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.';
    }
    
    return errorDetails.message;
  }

  /**
   * Log error for debugging (can be extended to send to logging service)
   * SECURITY: Sanitizes sensitive data before logging
   */
  logError(error: any, context?: string): void {
    const errorDetails = this.getUserFriendlyMessage(error);
    
    // SECURITY: Only log in development mode
    if (!this.isProduction()) {
      // Sanitize error before logging
      const sanitizedError = this.sanitizeErrorForLogging(error);
      console.error(`[ErrorHandlingService${context ? ` - ${context}` : ''}]`, {
        message: errorDetails.message,
        technical: this.sanitizeMessage(errorDetails.technicalMessage),
        statusCode: errorDetails.statusCode,
        timestamp: errorDetails.timestamp,
        error: sanitizedError
      });
    }
  }

  /**
   * Check if running in production mode
   */
  private isProduction(): boolean {
    // Check if environment is production
    return typeof window !== 'undefined' && 
           (window as any).__env?.production === true;
  }

  /**
   * Sanitize error object for logging (remove sensitive data)
   * SECURITY: Prevents passwords, tokens, and PII from being logged
   */
  private sanitizeErrorForLogging(error: any): any {
    if (!error) return null;

    const sanitized: any = {
      name: error.name,
      message: this.sanitizeMessage(error.message),
      status: error.status
    };

    // Don't include full error object, stack trace, or headers in logs
    return sanitized;
  }

  /**
   * Sanitize message to remove sensitive data
   * SECURITY: Removes passwords, tokens, emails, phone numbers
   */
  private sanitizeMessage(message?: string): string {
    if (!message) return '';

    let sanitized = message;

    // Remove passwords
    sanitized = sanitized.replace(/password["\s:=]+[^"\s,}]+/gi, 'password: [REDACTED]');
    
    // Remove tokens
    sanitized = sanitized.replace(/token["\s:=]+[^"\s,}]+/gi, 'token: [REDACTED]');
    sanitized = sanitized.replace(/bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, 'bearer [REDACTED]');
    
    // Mask email addresses
    sanitized = sanitized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, (email) => {
      const parts = email.split('@');
      return parts[0][0] + '***@' + parts[1];
    });
    
    // Mask phone numbers
    sanitized = sanitized.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE-REDACTED]');
    
    // Remove credit card numbers
    sanitized = sanitized.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD-REDACTED]');

    return sanitized;
  }
}
