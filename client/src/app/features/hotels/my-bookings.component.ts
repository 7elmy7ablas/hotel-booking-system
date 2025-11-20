import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { BookingService } from '../../services/booking.service';
import { Booking } from '../../models/booking.model';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [CommonModule, RouterLink, ScrollingModule],
  templateUrl: './my-bookings.component.html',
  styleUrls: ['./my-bookings.component.scss']
})
export class MyBookingsComponent implements OnInit {
  private bookingService = inject(BookingService);
  private router = inject(Router);

  bookings: Booking[] = [];
  filteredBookings: Booking[] = [];
  isLoading = false;
  errorMessage = '';
  selectedFilter = 'All';
  cancellingBookingId: string | null = null;

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    // PERFORMANCE: Using cached booking service
    this.bookingService.getMyBookings().subscribe({
      next: (bookings) => {
        this.bookings = bookings;
        this.filteredBookings = bookings;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load bookings:', error);
        this.errorMessage = 'Failed to load bookings. Please try again.';
        this.isLoading = false;
      }
    });
  }

  filterBookings(status: string): void {
    this.selectedFilter = status;
    
    if (status === 'All') {
      this.filteredBookings = this.bookings;
    } else {
      this.filteredBookings = this.bookings.filter(b => b.status === status);
    }
  }

  cancelBooking(bookingId: string): void {
    if (!confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    this.cancellingBookingId = bookingId;
    
    this.bookingService.cancelBooking(bookingId).subscribe({
      next: () => {
        this.cancellingBookingId = null;
        this.loadBookings();
      },
      error: (error) => {
        console.error('Failed to cancel booking:', error);
        this.errorMessage = 'Failed to cancel booking. Please try again.';
        this.cancellingBookingId = null;
      }
    });
  }

  viewBookingDetails(bookingId: string): void {
    this.router.navigate(['/bookings', bookingId]);
  }

  navigateToHotels(): void {
    this.router.navigate(['/hotels']);
  }

  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'Pending': 'badge-warning',
      'Confirmed': 'badge-success',
      'Cancelled': 'badge-error',
      'Completed': 'badge-primary'
    };
    return statusMap[status] || 'badge-primary';
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
