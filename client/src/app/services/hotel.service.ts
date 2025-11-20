import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { Hotel, Room, SearchCriteria } from '../models/hotel.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HotelService {
  private apiUrl = `${environment.apiUrl}${environment.endpoints.hotels}`;

  constructor(private http: HttpClient) { }

  getHotels(): Observable<Hotel[]> {
    console.log('🌐 HotelService: Fetching hotels from:', this.apiUrl);
    
    return this.http.get<any>(this.apiUrl).pipe(
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
          items = response.items || response.Items;
        }
        
        if (!Array.isArray(items)) {
          console.error('❌ HotelService: Items is not an array');
          return [];
        }
        
        return items.map((hotel: any) => ({
          id: hotel.id || hotel.Id,
          name: hotel.name || hotel.Name,
          description: hotel.description || hotel.Description,
          address: hotel.location || hotel.Location,
          city: hotel.city || hotel.City,
          country: hotel.country || hotel.Country,
          rating: hotel.rating || hotel.Rating,
          amenities: hotel.amenities || hotel.Amenities || [],
          imageUrl: hotel.imageUrl || hotel.ImageUrl,
          createdAt: hotel.createdAt || hotel.CreatedAt
        }));
      }),
      tap(hotels => {
        console.log('✅ HotelService: Transformed hotels:', hotels);
        console.log('✅ Number of hotels:', hotels.length);
      })
    );
  }

  getHotelById(id: number): Observable<Hotel> {
    console.log('🌐 HotelService: Fetching hotel by ID:', id);
    
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      tap(response => {
        console.log('📦 HotelService: Raw hotel response:', response);
      }),
      map((hotel: any) => ({
        id: hotel.id || hotel.Id,
        name: hotel.name || hotel.Name,
        description: hotel.description || hotel.Description,
        address: hotel.location || hotel.Location,
        city: hotel.city || hotel.City,
        country: hotel.country || hotel.Country,
        rating: hotel.rating || hotel.Rating,
        amenities: hotel.amenities || hotel.Amenities || [],
        imageUrl: hotel.imageUrl || hotel.ImageUrl,
        createdAt: hotel.createdAt || hotel.CreatedAt
      })),
      tap(hotel => {
        console.log('✅ HotelService: Transformed hotel:', hotel);
      })
    );
  }

  searchHotels(criteria: SearchCriteria): Observable<Hotel[]> {
    let params = new HttpParams();
    
    if (criteria.city) {
      params = params.set('city', criteria.city);
    }
    if (criteria.checkInDate) {
      params = params.set('checkInDate', criteria.checkInDate.toISOString());
    }
    if (criteria.checkOutDate) {
      params = params.set('checkOutDate', criteria.checkOutDate.toISOString());
    }
    if (criteria.guests) {
      params = params.set('guests', criteria.guests.toString());
    }
    if (criteria.minPrice) {
      params = params.set('minPrice', criteria.minPrice.toString());
    }
    if (criteria.maxPrice) {
      params = params.set('maxPrice', criteria.maxPrice.toString());
    }

    return this.http.get<Hotel[]>(`${this.apiUrl}/search`, { params });
  }

  getRoomsByHotelId(hotelId: number): Observable<Room[]> {
    return this.http.get<Room[]>(`${this.apiUrl}/${hotelId}/rooms`);
  }

  getAvailableRooms(hotelId: number, checkIn: Date, checkOut: Date): Observable<Room[]> {
    const params = new HttpParams()
      .set('checkInDate', checkIn.toISOString())
      .set('checkOutDate', checkOut.toISOString());
    
    return this.http.get<Room[]>(`${this.apiUrl}/${hotelId}/rooms/available`, { params });
  }
}
