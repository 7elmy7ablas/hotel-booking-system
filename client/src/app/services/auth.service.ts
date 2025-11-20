import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { LoginRequest, RegisterRequest, AuthResponse } from '../models/user.model';
import { environment } from '../../environments/environment';
import { TokenService } from './token.service';
import { ErrorHandlingService } from './error-handling.service';
import { SanitizationService } from './sanitization.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private tokenService = inject(TokenService);
  private errorService = inject(ErrorHandlingService);
  private sanitizationService = inject(SanitizationService);
  
  private apiUrl = `${environment.apiUrl}${environment.endpoints.auth}`;
  
  // Signals for reactive state (Angular 19)
  private tokenSignal = signal<string | null>(null);
  private userSignal = signal<any>(null);

  constructor() {
    // SECURITY: Removed console.log statements to prevent sensitive data leakage
    
    // Safely load token and user from localStorage
    try {
      const savedToken = this.tokenService.getToken(); // Use TokenService for validation
      const savedUser = localStorage.getItem('user');
      
      if (savedToken) {
        this.tokenSignal.set(savedToken);
      }
      
      if (savedUser && savedUser !== 'null' && savedUser !== 'undefined') {
        try {
          const parsedUser = JSON.parse(savedUser);
          this.userSignal.set(parsedUser);
        } catch (parseError) {
          this.errorService.logError(parseError, 'AuthService - Parse User');
          localStorage.removeItem('user');
        }
      }
    } catch (error) {
      this.errorService.logError(error, 'AuthService - Constructor');
      this.tokenService.clearToken();
    }
    
    // Subscribe to token expiry events
    this.tokenService.tokenExpired$.subscribe(expired => {
      if (expired) {
        // SECURITY: Token expired - clearing auth state (no logging in production)
        this.tokenSignal.set(null);
        this.userSignal.set(null);
      }
    });
  }

  // Getters for signals
  get token(): string | null {
    return this.tokenService.getToken(); // Always get fresh token with expiry check
  }

  get user(): any {
    return this.userSignal();
  }

  get isAuthenticated(): boolean {
    return !!this.token && !this.tokenService.isTokenExpired();
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    // SECURITY: Removed all console.log statements to prevent credential/token leakage
    
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: any) => {
        // ResponseTransformer ensures camelCase
        const token = response?.token;
        const user = response?.user;
        const expiresAt = response?.expiresAt;
        
        if (token) {
          // Store token with expiry using TokenService
          this.tokenService.setToken(token, expiresAt);
          localStorage.setItem('user', JSON.stringify(user));
          
          // Update signals
          this.tokenSignal.set(token);
          this.userSignal.set(user);
        } else {
          this.errorService.logError(new Error('No token in login response'), 'AuthService - Login');
        }
      })
    );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    // SECURITY: Removed console.log statements to prevent user data/token leakage
    
    // SECURITY: Sanitize user data before sending to API
    const sanitizedData = this.sanitizationService.sanitizeUserData(userData);
    
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, {
      ...sanitizedData,
      password: userData.password // Password not sanitized - validated on backend
    }).pipe(
      tap(response => {
        if (response.token) {
          // Store token with expiry using TokenService
          this.tokenService.setToken(response.token, response.expiresAt);
          localStorage.setItem('user', JSON.stringify(response.user));
          
          // Update signals
          this.tokenSignal.set(response.token);
          this.userSignal.set(response.user);
        }
      })
    );
  }

  logout(): void {
    // SECURITY: Removed console.log statements
    
    // Clear token using TokenService
    this.tokenService.clearToken();
    
    // Clear signals
    this.tokenSignal.set(null);
    this.userSignal.set(null);
    
    // Navigate to login
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.tokenService.getToken();
  }

  getCurrentUser(): any {
    return this.user;
  }

  // Legacy method for compatibility
  isAuthenticatedLegacy(): boolean {
    return this.isAuthenticated;
  }
  
  /**
   * Get time until token expires (in minutes)
   */
  getTokenExpiryMinutes(): number {
    const ms = this.tokenService.getTimeUntilExpiry();
    return Math.floor(ms / 60000);
  }
}
