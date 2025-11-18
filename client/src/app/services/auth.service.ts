import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { LoginRequest, RegisterRequest, AuthResponse } from '../models/user.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  private apiUrl = `${environment.apiUrl}${environment.endpoints.auth}`;
  
  // Signals for reactive state (Angular 19)
  private tokenSignal = signal<string | null>(null);
  private userSignal = signal<any>(null);

  constructor() {
    console.log('🎯 AuthService constructor called');
    
    // Safely load token and user from localStorage
    try {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      
      console.log('📦 Saved token exists:', !!savedToken);
      console.log('📦 Saved user exists:', !!savedUser);
      
      if (savedToken && savedToken !== 'null' && savedToken !== 'undefined') {
        this.tokenSignal.set(savedToken);
        console.log('✅ Token loaded from localStorage');
      }
      
      if (savedUser && savedUser !== 'null' && savedUser !== 'undefined') {
        try {
          const parsedUser = JSON.parse(savedUser);
          this.userSignal.set(parsedUser);
          console.log('✅ User loaded from localStorage:', parsedUser.email);
        } catch (parseError) {
          console.error('❌ Failed to parse saved user data:', parseError);
          console.error('❌ Invalid user data:', savedUser);
          // Clear invalid data
          localStorage.removeItem('user');
        }
      }
    } catch (error) {
      console.error('❌ Error loading auth data from localStorage:', error);
      // Clear potentially corrupted data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  // Getters for signals
  get token(): string | null {
    return this.tokenSignal();
  }

  get user(): any {
    return this.userSignal();
  }

  get isAuthenticated(): boolean {
    return !!this.token;
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    console.log('🔐 ========== AuthService.login() CALLED ==========');
    console.log('📧 Email:', credentials.email);
    console.log('🌐 API URL:', `${this.apiUrl}/login`);
    console.log('📦 Full credentials:', credentials);
    
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: any) => {
        console.log('✅ ========== AuthService HTTP Response ==========');
        console.log('📦 Response:', response);
        console.log('📦 Response type:', typeof response);
        console.log('📦 Response keys:', response ? Object.keys(response) : 'null');
        console.log('📦 response.token:', response?.token);
        console.log('📦 response.Token:', response?.Token);
        console.log('📦 response.user:', response?.user);
        console.log('📦 response.User:', response?.User);
        
        // Check for both camelCase and PascalCase
        const token = response?.token || response?.Token;
        const user = response?.user || response?.User;
        
        if (token) {
          console.log('💾 Storing token in localStorage');
          console.log('📝 Token (first 30 chars):', token.substring(0, 30) + '...');
          
          // Store in localStorage
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          
          // Update signals
          this.tokenSignal.set(token);
          this.userSignal.set(user);
          
          console.log('✅ Token and user stored successfully');
          if (user?.email) {
            console.log('✅ User email:', user.email);
          }
        } else {
          console.error('❌ No token in response!');
          console.error('❌ Full response:', JSON.stringify(response, null, 2));
        }
      })
    );
  }

  register(userData: RegisterRequest): Observable<AuthResponse> {
    console.log('📝 AuthService.register() called');
    console.log('🌐 API URL:', `${this.apiUrl}/register`);
    
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, userData).pipe(
      tap(response => {
        console.log('✅ Registration response received:', response);
        
        if (response.token) {
          // Store in localStorage
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          
          // Update signals
          this.tokenSignal.set(response.token);
          this.userSignal.set(response.user);
          
          console.log('✅ Registration successful, user logged in');
        }
      })
    );
  }

  logout(): void {
    console.log('🚪 Logging out user');
    
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
    
    // Clear signals
    this.tokenSignal.set(null);
    this.userSignal.set(null);
    
    console.log('✅ User logged out, redirecting to login');
    
    // Navigate to login
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.token;
  }

  getCurrentUser(): any {
    return this.user;
  }

  // Legacy method for compatibility
  isAuthenticatedLegacy(): boolean {
    const token = localStorage.getItem('token');
    return !!token && token !== 'null' && token !== 'undefined';
  }
}
