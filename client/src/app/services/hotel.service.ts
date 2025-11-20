import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { tap, map, catchError, shareReplay } from 'rxjs/operators';
import { Hotel, Room, SearchCriteria } from '../models/hotel.model';
import { environment } from '../../environments/environment';
import { ErrorHandlingService } from './error-handling.service';
import { SanitizationService } from './sanitization.service';
import { CacheService } from './cache.service';

@Injectable({
  providedIn: 'root'
})
export class HotelService {
  private http = inject(HttpClient);
  private errorService = inject(ErrorHandlingService);
  private sanitizationService = inject(SanitizationService);
  private cacheService = inject(CacheService);
  
  private apiUrl = `${environment.apiUrl}${environment.endpoints.hotels}`;
  
  // Cache TTL configurations (in milliseconds)
  private readonly HOTELS_LIST_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly HOTEL_DETAIL_TTL = 10 * 60 * 1000; // 10 minutes
  private readonly ROOMS_TTL = 3 * 60 * 1000; // 3 minutes

  getHotels(): Observable<Hotel[]> {
    console.log('🌐 HotelService: Fetching hotels from:', this.apiUrl);
    
    const cacheKey = 'hotels:all';
    
    const request$ = this.http.get<any>(this.apiUrl).pipe(
      tap(response => {
        console.log('📦 HotelService: Raw response:', response);
        console.log('📦 Response type:', typeof response);
      }),
      map((response: any) => {
        if (!response) {
          console.error('❌ HotelService: Response is null or undefined');
          return [];
        }
        
        let items = response;
        if (response.items) {
          items = response.items;
        }
        
        if (!Array.isArray(items)) {
          console.error('❌ HotelService: Items is not an array');
          return [];
        }
        
        return items.map((hotel: any) => ({
          id: hotel.id,
          name: hotel.name,
          description: hotel.description,
          address: hotel.location,
          city: hotel.city,
          country: hotel.country,
          rating: hotel.rating,
          amenities: hotel.amenities || [],
          imageUrl: hotel.imageUrl,
          createdAt: hotel.createdAt
        }));
      }),
      tap(hotels => {
        console.log('✅ HotelService: Transformed hotels:', hotels);
        console.log('✅ Number of hotels:', hotels.length);
      }),
      catchError(error => {
        this.errorService.logError(error, 'HotelService - getHotels');
        return throwError(() => error);
      })
    );
    
    // Use cache with 5-minute TTL
    return this.cacheService.get(cacheKey, request$, this.HOTELS_LIST_TTL);
  }

  getHotelById(id: string): Observable<Hotel> {
    console.log('🌐 HotelService: Fetching hotel by ID:', id);
    
    const cacheKey = `hotel:${id}`;
    
    const request$ = this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      tap(response => {
        console.log('📦 HotelService: Raw hotel response:', response);
      }),
      map((hotel: any) => ({
        id: hotel.id,
        name: hotel.name,
        description: hotel.description,
        address: hotel.location,
        city: hotel.city,
        country: hotel.country,
        rating: hotel.rating,
        amenities: hotel.amenities || [],
        imageUrl: hotel.imageUrl,
        createdAt: hotel.createdAt
      })),
      tap(hotel => {
        console.log('✅ HotelService: Transformed hotel:', hotel);
      }),
      catchError(error => {
        this.errorService.logError(error, 'HotelService - getHotelById');
        return throwError(() => error);
      })
    );
    
    // Use cache with 10-minute TTL
    return this.cacheService.get(cacheKey, request$, this.HOTEL_DETAIL_TTL);
  }

  searchHotels(criteria: SearchCriteria): Observable<Hotel[]> {
    // SECURITY: Sanitize search criteria before sending to API
    const sanitized = this.sanitizationService.sanitizeSearchCriteria(criteria);
    
    let params = new HttpParams();
    
    if (sanitized.city) {
      params = params.set('city', sanitized.city);
    }
    if (sanitized.checkInDate) {
      params = params.set('checkInDate', sanitized.checkInDate);
    }
    if (sanitized.checkOutDate) {
      params = params.set('checkOutDate', sanitized.checkOutDate);
    }
    if (sanitized.guests !== null) {
      params = params.set('guests', sanitized.guests.toString());
    }
    if (sanitized.minPrice !== null) {
      params = params.set('minPrice', sanitized.minPrice.toString());
    }
    if (sanitized.maxPrice !== null) {
      params = params.set('maxPrice', sanitized.maxPrice.toString());
    }

    return this.http.get<Hotel[]>(`${this.apiUrl}/search`, { params }).pipe(
      catchError(error => {
        this.errorService.logError(error, 'HotelService - searchHotels');
        return throwError(() => error);
      })
    );
  }

  getRoomsByHotelId(hotelId: string): Observable<Room[]> {
    const cacheKey = `rooms:hotel:${hotelId}`;
    
    const request$ = this.http.get<Room[]>(`${this.apiUrl}/${hotelId}/rooms`).pipe(
      catchError(error => {
        this.errorService.logError(error, 'HotelService - getRoomsByHotelId');
        return throwError(() => error);
      })
    );
    
    // Use cache with 3-minute TTL
    return this.cacheService.get(cacheKey, request$, this.ROOMS_TTL);
  }
  
  /**
   * Invalidate hotel-related caches
   * Call this after creating/updating/deleting hotels
   */
  invalidateHotelCaches(hotelId?: string): void {
    if (hotelId) {
      this.cacheService.invalidate(`hotel:${hotelId}`);
      this.cacheService.invalidate(`rooms:hotel:${hotelId}`);
    }
    this.cacheService.invalidate('hotels:all');
  }

  getAvailableRooms(hotelId: string, checkIn: Date, checkOut: Date): Observable<Room[]> {
    const params = new HttpParams()
      .set('checkInDate', checkIn.toISOString())
      .set('checkOutDate', checkOut.toISOString());
    
    return this.http.get<Room[]>(`${this.apiUrl}/${hotelId}/rooms/available`, { params }).pipe(
      catchError(error => {
        this.errorService.logError(error, 'HotelService - getAvailableRooms');
        return throwError(() => error);
      })
    );
  }
}
