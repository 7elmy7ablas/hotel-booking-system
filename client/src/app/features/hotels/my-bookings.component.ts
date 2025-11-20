import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { BookingService } from '../../services/booking.service';
import { Booking } from '../../models/booking.model';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatChipsModule
  ],
  templateUrl: './my-bookings.component.html',
  styles: [`
    .my-bookings-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    h1 {
      margin-bottom: 24px;
      color: #333;
    }

    .loading {
      display: flex;
      justify-content: center;
      padding: 48px;
    }

    .no-bookings {
      text-align: center;
      padding: 48px;
    }

    .no-bookings h2 {
      color: #666;
      margin-bottom: 16px;
    }

    .bookings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 24px;
    }

    .booking-card {
      position: relative;
    }

    .booking-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .label {
      font-weight: 500;
      color: #666;
    }

    .value {
      color: #333;
    }

    .price {
      font-size: 24px;
      font-weight: bold;
      color: #4caf50;
    }

    .status-chip {
      margin-top: 8px;
    }

    .status-pending {
      background-color: #ff9800;
      color: white;
    }

    .status-confirmed {
      background-color: #4caf50;
      color: white;
    }

    .status-cancelled {
      background-color: #f44336;
      color: white;
    }
  `]
})
export class MyBookingsComponent implements OnInit {
  private bookingService = inject(BookingService);
  private router = inject(Router);

  bookings = signal<Booking[]>([]);
  loading = signal(false);

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.loading.set(true);
    this.bookingService.getMyBookings().subscribe({
      next: (bookings) => {
        this.bookings.set(bookings);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load bookings:', error);
        this.loading.set(false);
      }
    });
  }

  navigateToHotels(): void {
    this.router.navigate(['/hotels']);
  }

  getStatusClass(status: string): string {
    return `status-${status.toLowerCase()}`;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }
}
