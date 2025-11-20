import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HotelService } from '../../services/hotel.service';
import { BookingService } from '../../services/booking.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  private hotelService = inject(HotelService);
  private bookingService = inject(BookingService);
  private router = inject(Router);

  activeSection: 'stats' | 'hotels' | 'rooms' | 'bookings' | 'users' = 'stats';
  isSidebarOpen = true;
  isLoading = false;

  stats = {
    totalHotels: 0,
    totalBookings: 0,
    totalRevenue: 0,
    totalUsers: 0
  };

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.isLoading = true;

    this.hotelService.getHotels().subscribe({
      next: (hotels) => {
        this.stats.totalHotels = hotels.length;
      },
      error: (error) => console.error('Error loading hotels:', error)
    });

    this.bookingService.getBookings().subscribe({
      next: (bookings) => {
        this.stats.totalBookings = bookings.length;
        this.stats.totalRevenue = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading bookings:', error);
        this.isLoading = false;
      }
    });

    this.stats.totalUsers = 150; // Placeholder
  }

  switchSection(section: 'stats' | 'hotels' | 'rooms' | 'bookings' | 'users'): void {
    this.activeSection = section;
  }

  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }
}
