import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HotelService } from '../../services/hotel.service';
import { BookingService } from '../../services/booking.service';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stats-container">
      <h2>Statistics Dashboard</h2>
      
      <div class="stats-grid">
        <div class="stat-card">
          <h3>Total Hotels</h3>
          <p class="stat-value">{{ stats.totalHotels }}</p>
        </div>
        <div class="stat-card">
          <h3>Total Bookings</h3>
          <p class="stat-value">{{ stats.totalBookings }}</p>
        </div>
        <div class="stat-card">
          <h3>Total Revenue</h3>
          <p class="stat-value">\${{ stats.totalRevenue }}</p>
        </div>
        <div class="stat-card">
          <h3>Active Users</h3>
          <p class="stat-value">{{ stats.totalUsers }}</p>
        </div>
      </div>

      <div class="chart-placeholder">
        <p>Charts and analytics coming soon...</p>
      </div>
    </div>
  `,
  styles: [`
    .stats-container { padding: 24px; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-bottom: 32px; }
    .stat-card { background: white; padding: 24px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .stat-value { font-size: 36px; font-weight: bold; color: #6366F1; margin: 8px 0 0 0; }
    .chart-placeholder { background: white; padding: 64px; border-radius: 12px; text-align: center; }
    @media (max-width: 768px) {
      .stats-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class StatsComponent implements OnInit {
  private hotelService = inject(HotelService);
  private bookingService = inject(BookingService);

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
    this.hotelService.getHotels().subscribe({
      next: (hotels) => {
        this.stats.totalHotels = hotels.length;
      }
    });

    this.bookingService.getBookings().subscribe({
      next: (bookings) => {
        this.stats.totalBookings = bookings.length;
        this.stats.totalRevenue = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
      }
    });

    this.stats.totalUsers = 150;
  }
}
