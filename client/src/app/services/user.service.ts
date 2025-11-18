import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}${environment.endpoints.users}`;

  constructor(private http: HttpClient) { }

  getUserProfile(): Observable<any> {
    // TODO: Implement get user profile
    return this.http.get(`${this.apiUrl}/profile`);
  }

  updateUserProfile(userData: any): Observable<any> {
    // TODO: Implement update user profile
    return this.http.put(`${this.apiUrl}/profile`, userData);
  }
}
