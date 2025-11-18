import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import { User, LoginRequest, RegisterRequest, AuthResponse } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiService = inject(ApiService);
  private router = inject(Router);
  
  currentUser = signal<User | null>(null);
  isAuthenticated = signal<boolean>(false);

  constructor() {
    this.checkAuth();
  }

  private checkAuth(): void {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUser.set(user);
        this.isAuthenticated.set(true);
      } catch (e) {
        this.logout();
      }
    }
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('auth/login', credentials).pipe(
      tap(response => {
        localStorage.setItem('token', response.Token);
        localStorage.setItem('user', JSON.stringify(response.User));
        this.currentUser.set(response.User);
        this.isAuthenticated.set(true);
      })
    );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.apiService.post<AuthResponse>('auth/register', data).pipe(
      tap(response => {
        localStorage.setItem('token', response.Token);
        localStorage.setItem('user', JSON.stringify(response.User));
        this.currentUser.set(response.User);
        this.isAuthenticated.set(true);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
}
