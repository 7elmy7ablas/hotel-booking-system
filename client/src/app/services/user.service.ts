import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';
import { CacheService } from './cache.service';

export interface UpdateProfileRequest {
  fullName: string;
  phoneNumber?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private cacheService = inject(CacheService);
  private apiUrl = `${environment.apiUrl}${environment.endpoints.users}`;
  
  // Cache TTL configurations
  private readonly PROFILE_TTL = 5 * 60 * 1000; // 5 minutes

  getProfile(): Observable<User> {
    const cacheKey = 'user:profile';
    
    const request$ = this.http.get<User>(`${this.apiUrl}/profile`);
    
    // Use cache with 5-minute TTL
    return this.cacheService.get(cacheKey, request$, this.PROFILE_TTL);
  }

  updateProfile(userData: UpdateProfileRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/profile`, userData).pipe(
      tap(() => {
        // Invalidate profile cache after update
        this.cacheService.invalidate('user:profile');
      })
    );
  }

  getUserProfile(): Observable<any> {
    return this.getProfile();
  }

  updateUserProfile(userData: any): Observable<any> {
    return this.updateProfile(userData);
  }
}
