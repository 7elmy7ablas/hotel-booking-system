# Sprint 4 Planning Document: Backend-Frontend Integration & Real-time Features

## Sprint Overview
- **Sprint Number:** 4
- **Duration:** 2 weeks (10 working days)
- **Start Date:** January 1, 2026
- **End Date:** January 14, 2026
- **Team Capacity:** 40 hours
- **Sprint Goal:** Integrate frontend with backend APIs and add SignalR for real-time updates

## Sprint Backlog

### User Story US-15: API Integration (8 Story Points)

**Description:**
As a frontend developer, I need to connect all Angular services to backend APIs so that the application can communicate with the server and provide a seamless user experience with proper error handling and loading states.

**Acceptance Criteria:**
- [ ] All Angular services are connected to corresponding backend API endpoints
- [ ] HTTP interceptors are implemented for authentication token management
- [ ] HTTP interceptors handle global error responses and display appropriate messages
- [ ] Loading states are displayed during API calls across all components
- [ ] Error messages are user-friendly and provide actionable feedback

**Task Breakdown:**
- Setup HTTP interceptors for authentication (4 hours)
- Implement error handling interceptor (3 hours)
- Connect hotel search service to API (4 hours)
- Connect booking service to API (4 hours)
- Connect user management service to API (3 hours)
- Implement loading states in components (4 hours)
- Add error message components (2 hours)
- Testing and bug fixes (8 hours)

**AI Prompt for GitHub Copilot:**
Create a comprehensive SignalR implementation for real-time room availability updates.

Backend Implementation (.NET 10):

```csharp
// Hubs/AvailabilityHub.cs
using Microsoft.AspNetCore.SignalR;

public class AvailabilityHub : Hub
{
    public async Task SendAvailabilityUpdate(int hotelId, int roomTypeId, int availableRooms)
    {
        await Clients.All.SendAsync("AvailabilityUpdated", new
        {
            HotelId = hotelId,
            RoomTypeId = roomTypeId,
            AvailableRooms = availableRooms,
            Timestamp = DateTime.UtcNow
        });
    }

    public async Task JoinHotelGroup(int hotelId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"Hotel_{hotelId}");
    }

    public async Task LeaveHotelGroup(int hotelId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Hotel_{hotelId}");
    }
}

// Program.cs configuration
builder.Services.AddSignalR();
builder.Services.AddCors(options =>
{
    options.AddPolicy("SignalRCorsPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

app.UseCors("SignalRCorsPolicy");
app.MapHub<AvailabilityHub>("/availabilityHub");

// Services/BookingService.cs - Broadcasting updates
private readonly IHubContext<AvailabilityHub> _hubContext;

public async Task<BookingResult> CreateBookingAsync(CreateBookingRequest request)
{
    // Booking creation logic...
    
    // Broadcast availability update
    await _hubContext.Clients.Group($"Hotel_{request.HotelId}")
        .SendAsync("AvailabilityUpdated", new
        {
            HotelId = request.HotelId,
            RoomTypeId = request.RoomTypeId,
            AvailableRooms = updatedAvailability,
            Timestamp = DateTime.UtcNow
        });
}
Frontend Implementation (Angular 19):

```typescript
// interceptors/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  if (token) {
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(authReq);
  }

  return next(req);
};

// interceptors/error.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationService } from '../services/notification.service';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const notificationService = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unexpected error occurred';

      switch (error.status) {
        case 401:
          errorMessage = 'Authentication required. Please log in.';
          router.navigate(['/login']);
          break;
        case 403:
          errorMessage = 'Access denied. You do not have permission.';
          break;
        case 404:
          errorMessage = 'The requested resource was not found.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        default:
          if (error.error?.message) {
            errorMessage = error.error.message;
          }
      }

      notificationService.showError(errorMessage);
      return throwError(() => error);
    })
  );
};

// interceptors/loading.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LoadingService } from '../services/loading.service';
import { finalize } from 'rxjs';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);
  
  loadingService.show();

  return next(req).pipe(
    finalize(() => loadingService.hide())
  );
};

// services/hotel.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Hotel {
  id: number;
  name: string;
  location: string;
  rating: number;
  pricePerNight: number;
  amenities: string[];
  imageUrl: string;
}

export interface SearchCriteria {
  location: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  rooms: number;
}

@Injectable({
  providedIn: 'root'
})
export class HotelService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/hotels`;

  searchHotels(criteria: SearchCriteria): Observable<Hotel[]> {
    let params = new HttpParams()
      .set('location', criteria.location)
      .set('checkIn', criteria.checkIn.toISOString())
      .set('checkOut', criteria.checkOut.toISOString())
      .set('guests', criteria.guests.toString())
      .set('rooms', criteria.rooms.toString());

    return this.http.get<Hotel[]>(`${this.apiUrl}/search`, { params });
  }

  getHotelById(id: number): Observable<Hotel> {
    return this.http.get<Hotel>(`${this.apiUrl}/${id}`);
  }

  getHotelAvailability(hotelId: number, checkIn: Date, checkOut: Date): Observable<any> {
    let params = new HttpParams()
      .set('checkIn', checkIn.toISOString())
      .set('checkOut', checkOut.toISOString());

    return this.http.get(`${this.apiUrl}/${hotelId}/availability`, { params });
  }
}

// services/booking.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CreateBookingRequest {
  hotelId: number;
  roomTypeId: number;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  totalAmount: number;
  guestDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

export interface Booking {
  id: number;
  hotelId: number;
  roomTypeId: number;
  checkIn: Date;
  checkOut: Date;
  status: string;
  totalAmount: number;
  confirmationNumber: string;
}

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/bookings`;

  createBooking(request: CreateBookingRequest): Observable<Booking> {
    return this.http.post<Booking>(this.apiUrl, request);
  }

  getUserBookings(): Observable<Booking[]> {
    return this.http.get<Booking[]>(`${this.apiUrl}/user`);
  }

  getBookingById(id: number): Observable<Booking> {
    return this.http.get<Booking>(`${this.apiUrl}/${id}`);
  }

  cancelBooking(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}

// services/signalr.service.ts
import { Injectable, inject } from '@angular/core';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface AvailabilityUpdate {
  hotelId: number;
  roomTypeId: number;
  availableRooms: number;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private readonly authService = inject(AuthService);
  private hubConnection: HubConnection | null = null;
  private availabilityUpdates$ = new BehaviorSubject<AvailabilityUpdate | null>(null);

  get availabilityUpdates(): Observable<AvailabilityUpdate | null> {
    return this.availabilityUpdates$.asObservable();
  }

  async startConnection(): Promise<void> {
    if (this.hubConnection?.state === 'Connected') {
      return;
    }

    this.hubConnection = new HubConnectionBuilder()
      .withUrl(`${environment.apiUrl}/availabilityHub`, {
        accessTokenFactory: () => this.authService.getToken() || ''
      })
      .build();

    this.hubConnection.on('AvailabilityUpdated', (update: AvailabilityUpdate) => {
      this.availabilityUpdates$.next(update);
    });

    try {
      await this.hubConnection.start();
      console.log('SignalR connection established');
    } catch (error) {
      console.error('Error starting SignalR connection:', error);
    }
  }

  async stopConnection(): Promise<void> {
    if (this.hubConnection) {
      await this.hubConnection.stop();
      this.hubConnection = null;
    }
  }

  async joinHotelGroup(hotelId: number): Promise<void> {
    if (this.hubConnection?.state === 'Connected') {
      await this.hubConnection.invoke('JoinHotelGroup', hotelId);
    }
  }

  async leaveHotelGroup(hotelId: number): Promise<void> {
    if (this.hubConnection?.state === 'Connected') {
      await this.hubConnection.invoke('LeaveHotelGroup', hotelId);
    }
  }
}

// app.config.ts
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { errorInterceptor } from './interceptors/error.interceptor';
import { loadingInterceptor } from './interceptors/loading.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor, loadingInterceptor])
    )
  ]
};
// services/loading.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  show(): void {
    this.loadingSubject.next(true);
  }

  hide(): void {
    this.loadingSubject.next(false);
  }
}

// services/notification.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Notification {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  id: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  showError(message: string): void {
    this.addNotification('error', message);
  }

  showSuccess(message: string): void {
    this.addNotification('success', message);
  }

  showWarning(message: string): void {
    this.addNotification('warning', message);
  }

  showInfo(message: string): void {
    this.addNotification('info', message);
  }

  private addNotification(type: Notification['type'], message: string): void {
    const notification: Notification = {
      type,
      message,
      id: Date.now().toString()
    };

    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next([...currentNotifications, notification]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      this.removeNotification(notification.id);
    }, 5000);
  }

  removeNotification(id: string): void {
    const currentNotifications = this.notificationsSubject.value;
    const filteredNotifications = currentNotifications.filter(n => n.id !== id);
    this.notificationsSubject.next(filteredNotifications);
  }
}
// interceptors/loading.interceptor.ts (Updated with Signals)
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { LoadingService } from '../services/loading.service';
import { finalize } from 'rxjs';

let activeRequests = 0;

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);
  
  activeRequests++;
  loadingService.setLoading(true);

  return next(req).pipe(
    finalize(() => {
      activeRequests--;
      if (activeRequests === 0) {
        loadingService.setLoading(false);
      }
    })
  );
};

// services/loading.service.ts (Updated with Signals)
import { Injectable, signal, computed } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoadingService {
  private readonly _isLoading = signal<boolean>(false);
  
  public readonly isLoading = this._isLoading.asReadonly();
  
  public readonly loadingMessage = computed(() => 
    this._isLoading() ? 'Loading...' : ''
  );

  setLoading(loading: boolean): void {
    this._isLoading.set(loading);
  }

  show(): void {
    this.setLoading(true);
  }

  hide(): void {
    this.setLoading(false);
  }
}

// components/loading-spinner/loading-spinner.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'app-loading-spinner',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (loadingService.isLoading()) {
      <div class="loading-overlay">
        <div class="loading-spinner">
          <div class="spinner"></div>
          <p>{{ loadingService.loadingMessage() }}</p>
        </div>
      </div>
    }
  `,
  styles: [`
    .loading-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    }

    .loading-spinner {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }
  `]
})
export class LoadingSpinnerComponent {
  protected readonly loadingService = inject(LoadingService);
}


// components/hotel-search/hotel-search.component.ts
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HotelService, SearchCriteria, Hotel } from '../../services/hotel.service';
import { SignalRService } from '../../services/signalr.service';
import { LoadingService } from '../../services/loading.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-hotel-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="hotel-search-container">
      <div class="search-form">
        <h2>Find Your Perfect Hotel</h2>
        <form (ngSubmit)="searchHotels()" #searchForm="ngForm">
          <div class="form-row">
            <div class="form-group">
              <label for="location">Location</label>
              <input 
                type="text" 
                id="location" 
                name="location"
                [(ngModel)]="searchCriteria().location"
                required
                placeholder="Enter city or hotel name"
                class="form-control">
            </div>
            
            <div class="form-group">
              <label for="checkIn">Check-in Date</label>
              <input 
                type="date" 
                id="checkIn" 
                name="checkIn"
                [value]="formatDate(searchCriteria().checkIn)"
                (change)="updateCheckIn($event)"
                required
                class="form-control">
            </div>
            
            <div class="form-group">
              <label for="checkOut">Check-out Date</label>
              <input 
                type="date" 
                id="checkOut" 
                name="checkOut"
                [value]="formatDate(searchCriteria().checkOut)"
                (change)="updateCheckOut($event)"
                required
                class="form-control">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="guests">Guests</label>
              <select 
                id="guests" 
                name="guests"
                [(ngModel)]="searchCriteria().guests"
                class="form-control">
                <option value="1">1 Guest</option>
                <option value="2">2 Guests</option>
                <option value="3">3 Guests</option>
                <option value="4">4 Guests</option>
                <option value="5">5+ Guests</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="rooms">Rooms</label>
              <select 
                id="rooms" 
                name="rooms"
                [(ngModel)]="searchCriteria().rooms"
                class="form-control">
                <option value="1">1 Room</option>
                <option value="2">2 Rooms</option>
                <option value="3">3 Rooms</option>
                <option value="4">4+ Rooms</option>
              </select>
            </div>
            
            <div class="form-group">
              <button 
                type="submit" 
                class="btn btn-primary search-btn"
                [disabled]="!searchForm.valid || loadingService.isLoading()">
                @if (loadingService.isLoading()) {
                  <span class="spinner-small"></span>
                  Searching...
                } @else {
                  Search Hotels
                }
              </button>
            </div>
          </div>
        </form>
      </div>

      @if (searchResults().length > 0) {
        <div class="search-results">
          <h3>Available Hotels ({{ searchResults().length }} found)</h3>
          <div class="hotels-grid">
            @for (hotel of searchResults(); track hotel.id) {
              <div class="hotel-card" (click)="selectHotel(hotel)">
                <div class="hotel-image">
                  <img [src]="hotel.imageUrl" [alt]="hotel.name" />
                  @if (hasAvailabilityUpdate(hotel.id)) {
                    <div class="availability-badge">
                      <span class="pulse-dot"></span>
                      Updated
                    </div>
                  }
                </div>
                
                <div class="hotel-info">
                  <h4>{{ hotel.name }}</h4>
                  <p class="location">{{ hotel.location }}</p>
                  
                  <div class="rating">
                    @for (star of getStarArray(hotel.rating); track $index) {
                      <span class="star filled">★</span>
                    }
                    @for (star of getEmptyStarArray(hotel.rating); track $index) {
                      <span class="star">☆</span>
                    }
                    <span class="rating-text">({{ hotel.rating }}/5)</span>
                  </div>
                  
                  <div class="amenities">
                    @for (amenity of hotel.amenities.slice(0, 3); track amenity) {
                      <span class="amenity-tag">{{ amenity }}</span>
                    }
                    @if (hotel.amenities.length > 3) {
                      <span class="amenity-tag more">+{{ hotel.amenities.length - 3 }} more</span>
                    }
                  </div>
                  
                  <div class="price">
                    <span class="price-amount">${{ hotel.pricePerNight }}</span>
                    <span class="price-period">per night</span>
                  </div>
                </div>
              </div>
            }
          </div>
        </div>
      }

      @if (hasSearched() && searchResults().length === 0 && !loadingService.isLoading()) {
        <div class="no-results">
          <h3>No hotels found</h3>
          <p>Try adjusting your search criteria or selecting a different location.</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .hotel-search-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .search-form {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      margin-bottom: 2rem;
    }

    .search-form h2 {
      margin-bottom: 1.5rem;
      color: #333;
      text-align: center;
    }

    .form-row {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }

    .form-group {
      flex: 1;
      min-width: 200px;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #555;
    }

    .form-control {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #e1e5e9;
      border-radius: 6px;
      font-size: 1rem;
      transition: border-color 0.3s ease;
    }

    .form-control:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    }

    .search-btn {
      background: #007bff;
      color: white;
      border: none;
      padding: 0.75rem 2rem;
      border-radius: 6px;
      font-size: 1rem;
      cursor: pointer;
      transition: background-color 0.3s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      min-height: 48px;
    }

    .search-btn:hover:not(:disabled) {
      background: #0056b3;
    }

    .search-btn:disabled {
      background: #6c757d;
      cursor: not-allowed;
    }

    .spinner-small {
      width: 16px;
      height: 16px;
      border: 2px solid transparent;
      border-top: 2px solid white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .search-results h3 {
      margin-bottom: 1.5rem;
      color: #333;
    }

    .hotels-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
    }

    .hotel-card {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      cursor: pointer;
      position: relative;
    }

    .hotel-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }

    .hotel-image {
      position: relative;
      height: 200px;
      overflow: hidden;
    }

    .hotel-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .availability-badge {
      position: absolute;
      top: 10px;
      right: 10px;
      background: #28a745;
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .pulse-dot {
      width: 6px;
      height: 6px;
      background: white;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .hotel-info {
      padding: 1.5rem;
    }

    .hotel-info h4 {
      margin: 0 0 0.5rem 0;
      color: #333;
      font-size: 1.25rem;
    }

    .location {
      color: #666;
      margin: 0 0 1rem 0;
      font-size: 0.9rem;
    }

    .rating {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      margin-bottom: 1rem;
    }

    .star {
      color: #ffc107;
      font-size: 1.1rem;
    }

    .star:not(.filled) {
      color: #e9ecef;
    }

    .rating-text {
      margin-left: 0.5rem;
      color: #666;
      font-size: 0.9rem;
    }

    .amenities {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .amenity-tag {
      background: #f8f9fa;
      color: #495057;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-size: 0.8rem;
      border: 1px solid #e9ecef;
    }

    .amenity-tag.more {
      background: #e9ecef;
      color: #6c757d;
    }

    .price {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
    }

    .price-amount {
      font-size: 1.5rem;
      font-weight: bold;
      color: #007bff;
    }

    .price-period {
      color: #666;
      font-size: 0.9rem;
    }

    .no-results {
      text-align: center;
      padding: 3rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .no-results h3 {
      color: #666;
      margin-bottom: 1rem;
    }

    .no-results p {
      color: #888;
    }

    @media (max-width: 768px) {
      .hotel-search-container {
        padding: 1rem;
      }

      .form-row {
        flex-direction: column;
      }

      .form-group {
        min-width: unset;
      }

      .hotels-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class HotelSearchComponent {
  private readonly hotelService = inject(HotelService);
  private readonly signalRService = inject(SignalRService);
  private readonly loadingService = inject(LoadingService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  // Signals for reactive state management
  private readonly _searchCriteria = signal<SearchCriteria>({
    location: '',
    checkIn: new Date(),
    checkOut: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    guests: 2,
    rooms: 1
  });

  private readonly _searchResults = signal<Hotel[]>([]);
  private readonly _hasSearched = signal<boolean>(false);
  private readonly _availabilityUpdates = signal<Set<number>>(new Set());

  // Computed properties
  public readonly searchCriteria = this._searchCriteria.asReadonly();
  public readonly searchResults = this._searchResults.asReadonly();
  public readonly hasSearched = this._hasSearched.asReadonly();

  constructor() {
    // Initialize SignalR connection
    this.signalRService.startConnection();

    // Subscribe to availability updates
    this.signalRService.availabilityUpdates.subscribe(update => {
      if (update) {
        const currentUpdates = this._availabilityUpdates();
        currentUpdates.add(update.hotelId);
        this._availabilityUpdates.set(new Set(currentUpdates));

        // Remove the update indicator after 5 seconds
        setTimeout(() => {
          const updates = this._availabilityUpdates();
          updates.delete(update.hotelId);
          this._availabilityUpdates.set(new Set(updates));
        }, 5000);

        this.notificationService.showInfo(
          `Room availability updated for hotel ID ${update.hotelId}`
        );
      }
    });
  }

  async searchHotels(): Promise<void> {
    if (!this.validateSearchCriteria()) {
      return;
    }

    try {
      this._hasSearched.set(true);
      const results = await this.hotelService.searchHotels(this.searchCriteria()).toPromise();
      this._searchResults.set(results || []);

      if (results && results.length > 0) {
        this.notificationService.showSuccess(`Found ${results.length} hotels`);
        
        // Join SignalR groups for real-time updates
        for (const hotel of results) {
          await this.signalRService.joinHotelGroup(hotel.id);
        }
      } else {
        this.notificationService.showInfo('No hotels found for your search criteria');
      }
    } catch (error) {
      console.error('Error searching hotels:', error);
      this._searchResults.set([]);
    }
  }

  selectHotel(hotel: Hotel): void {
    // Navigate to hotel details with search criteria
    this.router.navigate(['/hotels', hotel.id], {
      queryParams: {
        checkIn: this.searchCriteria().checkIn.toISOString(),
        checkOut: this.searchCriteria().checkOut.toISOString(),
        guests: this.searchCriteria().guests,
        rooms: this.searchCriteria().rooms
      }
    });
  }

  updateCheckIn(event: Event): void {
    const target = event.target as HTMLInputElement;
    const newDate = new Date(target.value);
    
    this._searchCriteria.update(criteria => ({
      ...criteria,
      checkIn: newDate
    }));

    // Ensure check-out is after check-in
    if (newDate >= this.searchCriteria().checkOut) {
      const nextDay = new Date(newDate);
      nextDay.setDate(nextDay.getDate() + 1);
      this._searchCriteria.update(criteria => ({
        ...criteria,
        checkOut: nextDay
      }));
    }
  }

  updateCheckOut(event: Event): void {
    const target = event.target as HTMLInputElement;
    const newDate = new Date(target.value);
    
    this._searchCriteria.update(criteria => ({
      ...criteria,
      checkOut: newDate
    }));
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  hasAvailabilityUpdate(hotelId: number): boolean {
    return this._availabilityUpdates().has(hotelId);
  }

  getStarArray(rating: number): number[] {
    return Array(Math.floor(rating)).fill(0);
  }

  getEmptyStarArray(rating: number): number[] {
    return Array(5 - Math.floor(rating)).fill(0);
  }

  private validateSearchCriteria(): boolean {
    const criteria = this.searchCriteria();
    
    if (!criteria.location.trim()) {
      this.notificationService.showError('Please enter a location');
      return false;
    }

    if (criteria.checkIn >= criteria.checkOut) {
      this.notificationService.showError('Check-out date must be after check-in date');
      return false;
    }

    if (criteria.checkIn < new Date(Date.now() - 24 * 60 * 60 * 1000)) {
      this.notificationService.showError('Check-in date cannot be in the past');
      return false;
    }

    return true;
  }
}
