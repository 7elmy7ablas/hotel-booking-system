import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, interval, Subscription } from 'rxjs';

export interface TokenInfo {
  token: string;
  expiresAt: Date;
  isExpired: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private router = inject(Router);
  private tokenCheckSubscription?: Subscription;
  private tokenExpirySubject = new BehaviorSubject<boolean>(false);
  
  public tokenExpired$ = this.tokenExpirySubject.asObservable();

  constructor() {
    // Start monitoring token expiry on service initialization
    this.startTokenExpiryCheck();
  }

  /**
   * Store JWT token with expiry information
   */
  setToken(token: string, expiresAt: string | Date): void {
    localStorage.setItem('token', token);
    
    const expiryDate = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
    localStorage.setItem('tokenExpiry', expiryDate.toISOString());
    
    console.log('✅ Token stored. Expires at:', expiryDate.toLocaleString());
    
    // Reset expiry flag
    this.tokenExpirySubject.next(false);
    
    // Restart token expiry check
    this.startTokenExpiryCheck();
  }

  /**
   * Get current token
   */
  getToken(): string | null {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return null;
    }
    
    // Check if token is expired
    if (this.isTokenExpired()) {
      console.warn('⚠️ Token is expired');
      this.handleExpiredToken();
      return null;
    }
    
    return token;
  }

  /**
   * Get token information including expiry status
   */
  getTokenInfo(): TokenInfo | null {
    const token = localStorage.getItem('token');
    const expiryStr = localStorage.getItem('tokenExpiry');
    
    if (!token || !expiryStr) {
      return null;
    }
    
    const expiresAt = new Date(expiryStr);
    const isExpired = expiresAt <= new Date();
    
    return {
      token,
      expiresAt,
      isExpired
    };
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(): boolean {
    const expiryStr = localStorage.getItem('tokenExpiry');
    
    if (!expiryStr) {
      return true;
    }
    
    const expiryDate = new Date(expiryStr);
    const now = new Date();
    
    return expiryDate <= now;
  }

  /**
   * Get time until token expires (in milliseconds)
   */
  getTimeUntilExpiry(): number {
    const expiryStr = localStorage.getItem('tokenExpiry');
    
    if (!expiryStr) {
      return 0;
    }
    
    const expiryDate = new Date(expiryStr);
    const now = new Date();
    
    return Math.max(0, expiryDate.getTime() - now.getTime());
  }

  /**
   * Clear token and user data
   */
  clearToken(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiry');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
    
    this.tokenExpirySubject.next(false);
    this.stopTokenExpiryCheck();
    
    console.log('🗑️ Token cleared');
  }

  /**
   * Handle expired token - clear data and redirect to login
   */
  private handleExpiredToken(): void {
    console.warn('🚨 Token expired - logging out user');
    
    this.clearToken();
    this.tokenExpirySubject.next(true);
    
    // Redirect to login with return URL
    const currentUrl = this.router.url;
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: currentUrl, reason: 'session-expired' }
    });
  }

  /**
   * Start periodic token expiry check (every 30 seconds)
   */
  private startTokenExpiryCheck(): void {
    // Stop existing check if any
    this.stopTokenExpiryCheck();
    
    // Check immediately
    this.checkTokenExpiry();
    
    // Check every 30 seconds
    this.tokenCheckSubscription = interval(30000).subscribe(() => {
      this.checkTokenExpiry();
    });
    
    console.log('🔄 Token expiry check started');
  }

  /**
   * Stop token expiry check
   */
  private stopTokenExpiryCheck(): void {
    if (this.tokenCheckSubscription) {
      this.tokenCheckSubscription.unsubscribe();
      this.tokenCheckSubscription = undefined;
      console.log('⏹️ Token expiry check stopped');
    }
  }

  /**
   * Check if token is expired and handle accordingly
   */
  private checkTokenExpiry(): void {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return;
    }
    
    if (this.isTokenExpired()) {
      this.handleExpiredToken();
    } else {
      const timeUntilExpiry = this.getTimeUntilExpiry();
      const minutesUntilExpiry = Math.floor(timeUntilExpiry / 60000);
      
      // Warn if token expires in less than 5 minutes
      if (minutesUntilExpiry <= 5 && minutesUntilExpiry > 0) {
        console.warn(`⏰ Token expires in ${minutesUntilExpiry} minute(s)`);
      }
    }
  }

  /**
   * Validate token format (basic JWT structure check)
   */
  isValidTokenFormat(token: string): boolean {
    if (!token) {
      return false;
    }
    
    // JWT should have 3 parts separated by dots
    const parts = token.split('.');
    return parts.length === 3;
  }
}
