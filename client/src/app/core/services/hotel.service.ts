import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Hotel } from '../models/hotel.model';
import { Room } from '../models/room.model';

@Injectable({
  providedIn: 'root'
})
export class HotelService {
  private apiService = inject(ApiService);

  getHotels(): Observable<Hotel[]> {
    return this.apiService.get<Hotel[]>('hotels');
  }

  getHotel(id: string): Observable<Hotel> {
    return this.apiService.get<Hotel>(`hotels/${id}`);
  }

  createHotel(hotel: Partial<Hotel>): Observable<Hotel> {
    return this.apiService.post<Hotel>('hotels', hotel);
  }

  updateHotel(id: string, hotel: Partial<Hotel>): Observable<Hotel> {
    return this.apiService.put<Hotel>(`hotels/${id}`, hotel);
  }

  deleteHotel(id: string): Observable<void> {
    return this.apiService.delete<void>(`hotels/${id}`);
  }

  getHotelRooms(hotelId: string): Observable<Room[]> {
    return this.apiService.get<Room[]>(`hotels/${hotelId}/rooms`);
  }

  searchHotels(city?: string, country?: string): Observable<Hotel[]> {
    let endpoint = 'hotels';
    const params: string[] = [];
    
    if (city) params.push(`city=${encodeURIComponent(city)}`);
    if (country) params.push(`country=${encodeURIComponent(country)}`);
    
    if (params.length > 0) {
      endpoint += `?${params.join('&')}`;
    }
    
    return this.apiService.get<Hotel[]>(endpoint);
  }
}
