import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Booking, CreateBookingRequest } from '../models/booking.model';
import { SelectedHotelService } from './selected-hotel.service';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private http = inject(HttpClient);
  private selectedHotelService = inject(SelectedHotelService);
  private authService = inject(AuthService);
  
  private apiUrl = `${environment.apiUrl}${environment.endpoints.bookings}`;

  createBooking(bookingData: CreateBookingRequest): Observable<Booking> {
    const hotel = this.selectedHotelService.getSelectedHotel();
    const user = this.authService.getCurrentUser();
    
    if (!hotel) {
      throw new Error('No hotel selected');
    }
    
    if (!user) {
      throw new Error('User not authenticated');
    }
    
    const payload = {
      hotelId: hotel.id,
      roomId: bookingData.roomId,
      checkInDate: bookingData.checkInDate,
      checkOutDate: bookingData.checkOutDate,
      guestName: bookingData.guestName || user.fullName,
      guestEmail: bookingData.guestEmail || user.email,
      guestPhone: bookingData.guestPhone || user.phoneNumber,
      specialRequests: bookingData.specialRequests
    };
    
    console.log('📤 Creating booking:', payload);
    
    return this.http.post<any>(this.apiUrl, payload).pipe(
      map((response: any) => ({
        id: response.id || response.Id,
        userId: response.userId || response.UserId,
        roomId: response.roomId || response.RoomId,
        hotelId: response.hotelId || response.HotelId,
        checkInDate: response.checkInDate || response.CheckInDate,
        checkOutDate: response.checkOutDate || response.CheckOutDate,
        totalPrice: response.totalPrice || response.TotalPrice,
        status: response.status || response.Status,
        guestName: response.guestName || response.GuestName,
        guestEmail: response.guestEmail || response.GuestEmail,
        guestPhone: response.guestPhone || response.GuestPhone,
        specialRequests: response.specialRequests || response.SpecialRequests,
        createdAt: response.createdAt || response.CreatedAt
      })),
      tap(booking => {
        console.log('✅ Booking created:', booking);
      })
    );
  }

  getBookings(): Observable<Booking[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
      map((bookings: any[]) => bookings.map(b => ({
        id: b.id || b.Id,
        userId: b.userId || b.UserId,
        roomId: b.roomId || b.RoomId,
        hotelId: b.hotelId || b.HotelId,
        checkInDate: b.checkInDate || b.CheckInDate,
        checkOutDate: b.checkOutDate || b.CheckOutDate,
        totalPrice: b.totalPrice || b.TotalPrice,
        status: b.status || b.Status,
        guestName: b.guestName || b.GuestName,
        guestEmail: b.guestEmail || b.GuestEmail,
        guestPhone: b.guestPhone || b.GuestPhone,
        specialRequests: b.specialRequests || b.SpecialRequests,
        createdAt: b.createdAt || b.CreatedAt
      })))
    );
  }

  getBookingById(id: number): Observable<Booking> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map((b: any) => ({
        id: b.id || b.Id,
        userId: b.userId || b.UserId,
        roomId: b.roomId || b.RoomId,
        hotelId: b.hotelId || b.HotelId,
        checkInDate: b.checkInDate || b.CheckInDate,
        checkOutDate: b.checkOutDate || b.CheckOutDate,
        totalPrice: b.totalPrice || b.TotalPrice,
        status: b.status || b.Status,
        guestName: b.guestName || b.GuestName,
        guestEmail: b.guestEmail || b.GuestEmail,
        guestPhone: b.guestPhone || b.GuestPhone,
        specialRequests: b.specialRequests || b.SpecialRequests,
        createdAt: b.createdAt || b.CreatedAt
      }))
    );
  }

  cancelBooking(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
