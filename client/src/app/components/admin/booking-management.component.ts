import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookingService } from '../../services/booking.service';
import { Booking } from '../../models/booking.model';

@Component({
  selector: 'app-booking-management',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="management-container">
      <h2>Booking Management</h2>
      
      <div *ngIf="isLoading" class="loading">Loading bookings...</div>

      <div *ngIf="!isLoading" class="bookings-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>User</th>
              <th>Hotel</th>
              <th>Check-in</th>
              <th>Check-out</th>
              <th>Status</th>
              <th>Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let booking of bookings">
              <td>{{ booking.id }}</td>
              <td>{{ booking.guestName || 'N/A' }}</td>
              <td>{{ booking.hotelName || 'Hotel' }}</td>
              <td>{{ formatDate(booking.checkInDate) }}</td>
              <td>{{ formatDate(booking.checkOutDate) }}</td>
              <td>
                <span class="badge" [ngClass]="'badge-' + booking.status.toLowerCase()">
                  {{ booking.status }}
                </span>
              </td>
              <td>\${{ booking.totalPrice || 0 }}</td>
              <td>
                <button class="btn btn-sm btn-outline">View</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .management-container { padding: 24px; }
    .bookings-table { background: white; padding: 24px; border-radius: 12px; overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; min-width: 800px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    .badge { padding: 4px 12px; border-radius: 12px; font-size: 12px; }
    .badge-pending { background: #fef3c7; color: #92400e; }
    .badge-confirmed { background: #d1fae5; color: #065f46; }
    .badge-cancelled { background: #fee2e2; color: #991b1b; }
  `]
})
export class BookingManagementComponent implements OnInit {
  private bookingService = inject(BookingService);

  bookings: Booking[] = [];
  isLoading = false;

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.isLoading = true;
    this.bookingService.getBookings().subscribe({
      next: (bookings) => {
        this.bookings = bookings;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString();
  }
}
