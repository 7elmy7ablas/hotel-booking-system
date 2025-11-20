import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, map, catchError, shareReplay } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Booking, CreateBookingRequest } from '../models/booking.model';
import { SelectedHotelService } from './selected-hotel.service';
import { AuthService } from './auth.service';
import { ErrorHandlingService } from './error-handling.service';
import { SanitizationService } from './sanitization.service';
import { CacheService } from './cache.service';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private http = inject(HttpClient);
  private selectedHotelService = inject(SelectedHotelService);
  private authService = inject(AuthService);
  private errorService = inject(ErrorHandlingService);
  private sanitizationService = inject(SanitizationService);
  private cacheService = inject(CacheService);
  
  private apiUrl = `${environment.apiUrl}${environment.endpoints.bookings}`;
  
  // Cache TTL configurations
  private readonly BOOKINGS_TTL = 2 * 60 * 1000; // 2 minutes

  createBooking(bookingData: CreateBookingRequest): Observable<Booking> {
    const user = this.authService.getCurrentUser();
    
    if (!user || !user.id) {
      throw new Error('User not authenticated');
    }
    
    // SECURITY: Sanitize all user input before sending to API
    const sanitizedData = this.sanitizationService.sanitizeBookingData(bookingData);
    
    const payload = {
      userId: user.id,
      roomId: sanitizedData.roomId,
      checkIn: sanitizedData.checkInDate,
      checkOut: sanitizedData.checkOutDate,
      guestName: sanitizedData.guestName,
      guestEmail: sanitizedData.guestEmail,
      guestPhone: sanitizedData.guestPhone,
      specialRequests: sanitizedData.specialRequests,
      status: 'Pending'
    };
    
    console.log('📤 Creating booking:', payload);
    
    return this.http.post<Booking>(this.apiUrl, payload).pipe(
      map((response: any) => ({
        id: response.id,
        userId: response.userId,
        roomId: response.roomId,
        hotelId: response.hotelId,
        checkInDate: response.checkIn,
        checkOutDate: response.checkOut,
        totalPrice: response.totalPrice,
        status: response.status,
        guestName: response.guestName || '',
        guestEmail: response.guestEmail || '',
        guestPhone: response.guestPhone || '',
        specialRequests: response.specialRequests,
        createdAt: response.createdAt
      })),
      tap(booking => {
        console.log('✅ Booking created:', booking);
        // Invalidate booking caches after creation
        this.invalidateBookingCaches(user.id);
      }),
      catchError(error => {
        this.errorService.logError(error, 'BookingService - createBooking');
        return throwError(() => error);
      })
    );
  }

  getBookings(): Observable<Booking[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map((bookings: any[]) => bookings.map(b => ({
        id: b.id,
        userId: b.userId,
        roomId: b.roomId,
        hotelId: b.hotelId,
        checkInDate: b.checkIn,
        checkOutDate: b.checkOut,
        totalPrice: b.totalPrice,
        status: b.status,
        guestName: b.guestName || '',
        guestEmail: b.guestEmail || '',
        guestPhone: b.guestPhone || '',
        specialRequests: b.specialRequests,
        createdAt: b.createdAt
      }))),
      catchError(error => {
        this.errorService.logError(error, 'BookingService - getBookings');
        return throwError(() => error);
      })
    );
  }

  getBookingById(id: string): Observable<Booking> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map((b: any) => ({
        id: b.id,
        userId: b.userId,
        roomId: b.roomId,
        hotelId: b.hotelId,
        checkInDate: b.checkIn,
        checkOutDate: b.checkOut,
        totalPrice: b.totalPrice,
        status: b.status,
        guestName: b.guestName || '',
        guestEmail: b.guestEmail || '',
        guestPhone: b.guestPhone || '',
        specialRequests: b.specialRequests,
        createdAt: b.createdAt
      })),
      catchError(error => {
        this.errorService.logError(error, 'BookingService - getBookingById');
        return throwError(() => error);
      })
    );
  }

  getMyBookings(): Observable<Booking[]> {
    const user = this.authService.getCurrentUser();
    const cacheKey = `bookings:user:${user?.id || 'anonymous'}`;
    
    const request$ = this.http.get<any[]>(`${this.apiUrl}/my-bookings`).pipe(
      map((bookings: any[]) => bookings.map(b => ({
        id: b.id,
        userId: b.userId,
        roomId: b.roomId,
        hotelId: b.hotelId,
        checkInDate: b.checkIn,
        checkOutDate: b.checkOut,
        totalPrice: b.totalPrice,
        status: b.status,
        guestName: b.guestName || '',
        guestEmail: b.guestEmail || '',
        guestPhone: b.guestPhone || '',
        specialRequests: b.specialRequests,
        createdAt: b.createdAt,
        hotelName: b.hotelName,
        roomType: b.roomType
      } as any))),
      catchError(error => {
        this.errorService.logError(error, 'BookingService - getMyBookings');
        return throwError(() => error);
      })
    );
    
    // Use cache with 2-minute TTL
    return this.cacheService.get(cacheKey, request$, this.BOOKINGS_TTL);
  }
  
  /**
   * Invalidate booking caches
   * Call this after creating/updating/canceling bookings
   */
  invalidateBookingCaches(userId?: string): void {
    if (userId) {
      this.cacheService.invalidate(`bookings:user:${userId}`);
    }
    this.cacheService.invalidatePattern('bookings:');
  }

  cancelBooking(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => {
        // Invalidate booking caches after cancellation
        const user = this.authService.getCurrentUser();
        this.invalidateBookingCaches(user?.id);
      }),
      catchError(error => {
        this.errorService.logError(error, 'BookingService - cancelBooking');
        return throwError(() => error);
      })
    );
  }
}
