import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private apiUrl = `${environment.apiUrl}${environment.endpoints.bookings}`;

  constructor(private http: HttpClient) { }

  createBooking(bookingData: any): Observable<any> {
    // TODO: Implement create booking
    return this.http.post(this.apiUrl, bookingData);
  }

  getBookings(): Observable<any> {
    // TODO: Implement get bookings
    return this.http.get(this.apiUrl);
  }

  getBookingById(id: number): Observable<any> {
    // TODO: Implement get booking by id
    return this.http.get(`${this.apiUrl}/${id}`);
  }

  cancelBooking(id: number): Observable<any> {
    // TODO: Implement cancel booking
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
