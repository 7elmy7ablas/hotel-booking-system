import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { BookingService } from '../../../services/booking.service';
import { Booking, BookingStatus } from '../../../models/booking.model';

@Component({
  selector: 'app-booking-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTabsModule
  ],
  templateUrl: './booking-list.component.html',
  styleUrl: './booking-list.component.scss'
})
export class BookingListComponent implements OnInit {
  allBookings: Booking[] = [];
  pendingBookings: Booking[] = [];
  confirmedBookings: Booking[] = [];
  cancelledBookings: Booking[] = [];
  completedBookings: Booking[] = [];

  isLoading = true;
  selectedTab = 0;

  constructor(
    private bookingService: BookingService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.isLoading = true;
    this.bookingService.getBookings().subscribe({
      next: (bookings) => {
        this.allBookings = bookings;
        this.filterBookings();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading bookings:', error);
        this.isLoading = false;
        this.snackBar.open('Failed to load bookings', 'Close', { duration: 3000 });
      }
    });
  }

  filterBookings(): void {
    this.pendingBookings = this.allBookings.filter(b => b.status === BookingStatus.Pending);
    this.confirmedBookings = this.allBookings.filter(b => b.status === BookingStatus.Confirmed);
    this.cancelledBookings = this.allBookings.filter(b => b.status === BookingStatus.Cancelled);
    this.completedBookings = this.allBookings.filter(b => b.status === BookingStatus.Completed);
  }

  viewBookingDetails(bookingId: number): void {
    this.router.navigate(['/bookings', bookingId]);
  }

  cancelBooking(booking: Booking): void {
    if (confirm(`Are you sure you want to cancel booking #${booking.id}?`)) {
      this.bookingService.cancelBooking(booking.id).subscribe({
        next: () => {
          this.snackBar.open('Booking cancelled successfully', 'Close', { duration: 3000 });
          this.loadBookings();
        },
        error: (error) => {
          console.error('Error cancelling booking:', error);
          this.snackBar.open('Failed to cancel booking', 'Close', { duration: 3000 });
        }
      });
    }
  }

  getStatusColor(status: BookingStatus): string {
    switch (status) {
      case BookingStatus.Pending:
        return 'warn';
      case BookingStatus.Confirmed:
        return 'primary';
      case BookingStatus.Cancelled:
        return 'accent';
      case BookingStatus.Completed:
        return '';
      default:
        return '';
    }
  }

  getStatusIcon(status: BookingStatus): string {
    switch (status) {
      case BookingStatus.Pending:
        return 'schedule';
      case BookingStatus.Confirmed:
        return 'check_circle';
      case BookingStatus.Cancelled:
        return 'cancel';
      case BookingStatus.Completed:
        return 'done_all';
      default:
        return 'info';
    }
  }

  canCancelBooking(booking: Booking): boolean {
    return booking.status === BookingStatus.Pending || booking.status === BookingStatus.Confirmed;
  }

  calculateNights(checkIn: Date, checkOut: Date): number {
    const timeDiff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  }
}
