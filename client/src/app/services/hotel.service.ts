import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Hotel, Room, SearchCriteria } from '../models/hotel.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HotelService {
  private apiUrl = `${environment.apiUrl}${environment.endpoints.hotels}`;

  constructor(private http: HttpClient) { }

  getHotels(): Observable<Hotel[]> {
    return this.http.get<Hotel[]>(this.apiUrl);
  }

  getHotelById(id: number): Observable<Hotel> {
    return this.http.get<Hotel>(`${this.apiUrl}/${id}`);
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
