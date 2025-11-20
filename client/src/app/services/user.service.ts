import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';

export interface UpdateProfileRequest {
  fullName: string;
  phoneNumber?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}${environment.endpoints.users}`;

  getProfile(): Observable<User> {
    return this.http.get<any>(`${this.apiUrl}/profile`).pipe(
      map((response: any) => ({
        id: response.id || response.Id,
        email: response.email || response.Email,
        fullName: response.fullName || response.FullName,
        phoneNumber: response.phoneNumber || response.PhoneNumber,
        role: response.role || response.Role,
        createdAt: response.createdAt || response.CreatedAt,
        updatedAt: response.updatedAt || response.UpdatedAt,
        isDeleted: response.isDeleted || response.IsDeleted
      }))
    );
  }

  updateProfile(userData: UpdateProfileRequest): Observable<User> {
    return this.http.put<any>(`${this.apiUrl}/profile`, userData).pipe(
      map((response: any) => ({
        id: response.id || response.Id,
        email: response.email || response.Email,
        fullName: response.fullName || response.FullName,
        phoneNumber: response.phoneNumber || response.PhoneNumber,
        role: response.role || response.Role,
        createdAt: response.createdAt || response.CreatedAt,
        updatedAt: response.updatedAt || response.UpdatedAt,
        isDeleted: response.isDeleted || response.IsDeleted
      }))
    );
  }

  getUserProfile(): Observable<any> {
    return this.getProfile();
  }

  updateUserProfile(userData: any): Observable<any> {
    return this.updateProfile(userData);
  }
}
