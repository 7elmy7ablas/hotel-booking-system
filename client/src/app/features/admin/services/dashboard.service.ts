import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, catchError, of, interval, switchMap, startWith, shareReplay } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface DashboardMetrics {
  totalBookings: number;
  revenueYTD: number;
  occupancyRate: number;
  activeHotels: number;
}

export interface RecentBooking {
  id: string;
  guestName: string;
  hotelName: string;
  checkInDate: string;
  status: string;
  totalPrice: number;
  createdAt: string;
}

export interface RevenueDataPoint {
  date: string;
  value: number;
}

export interface TopHotel {
  id: string;
  name: string;
  occupancyRate: number;
  revenue: number;
  bookingsCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminDashboardService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Cache for auto-refresh (30 seconds)
  private metricsCache$?: Observable<DashboardMetrics>;
  private readonly REFRESH_INTERVAL = 30000;

  /**
   * Get dashboard metrics with auto-refresh
   */
  getMetrics(): Observable<DashboardMetrics> {
    if (!this.metricsCache$) {
      this.metricsCache$ = interval(this.REFRESH_INTERVAL).pipe(
        startWith(0),
        switchMap(() => this.fetchMetrics()),
        shareReplay(1)
      );
    }
    return this.metricsCache$;
  }

  /**
   * Fetch fresh metrics from the server
   */
  private fetchMetrics(): Observable<DashboardMetrics> {
    // Since we're building the MVP without new backend endpoints,
    // we'll calculate metrics from existing data
    return forkJoin({
      bookings: this.http.get<any[]>(`${this.apiUrl}/bookings`).pipe(catchError(() => of([]))),
      hotels: this.http.get<any[]>(`${this.apiUrl}/hotels`).pipe(catchError(() => of([])))
    }).pipe(
      map(({ bookings, hotels }) => {
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        // Calculate total bookings
        const totalBookings = bookings.length;

        // Calculate YTD revenue (sum of completed/confirmed bookings this year)
        const revenueYTD = bookings
          .filter(b => {
            const createdAt = new Date(b.createdAt);
            return createdAt >= startOfYear && 
                   (b.status === 'Confirmed' || b.status === 'Completed' || b.status === 'CheckedOut');
          })
          .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

        // Calculate occupancy rate (simplified: confirmed bookings / total rooms * 100)
        const totalRooms = hotels.reduce((sum, h) => sum + (h.rooms?.length || 0), 0);
        const activeBookings = bookings.filter(b => 
          b.status === 'Confirmed' || b.status === 'CheckedIn'
        ).length;
        const occupancyRate = totalRooms > 0 
          ? Math.round((activeBookings / totalRooms) * 100) 
          : 0;

        // Count active hotels
        const activeHotels = hotels.filter(h => !h.isDeleted).length;

        return {
          totalBookings,
          revenueYTD,
          occupancyRate: Math.min(occupancyRate, 100),
          activeHotels
        };
      })
    );
  }

  /**
   * Get recent bookings (last 24 hours)
   */
  getRecentBookings(): Observable<RecentBooking[]> {
    return this.http.get<any[]>(`${this.apiUrl}/bookings`).pipe(
      map(bookings => {
        const now = new Date();
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        return bookings
          .filter(b => new Date(b.createdAt) >= yesterday)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 10)
          .map(b => ({
            id: b.id,
            guestName: b.guestName || b.user?.fullName || 'Guest',
            hotelName: b.room?.hotel?.name || 'Unknown Hotel',
            checkInDate: b.checkIn,
            status: b.status,
            totalPrice: b.totalPrice,
            createdAt: b.createdAt
          }));
      }),
      catchError(() => of([]))
    );
  }

  /**
   * Get revenue chart data (last 30 days)
   */
  getRevenueChartData(): Observable<RevenueDataPoint[]> {
    return this.http.get<any[]>(`${this.apiUrl}/bookings`).pipe(
      map(bookings => {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        // Group bookings by date
        const revenueByDate = new Map<string, number>();
        
        // Initialize all 30 days with 0
        for (let i = 0; i < 30; i++) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          const dateStr = date.toISOString().split('T')[0];
          revenueByDate.set(dateStr, 0);
        }

        // Add actual revenue
        bookings
          .filter(b => {
            const createdAt = new Date(b.createdAt);
            return createdAt >= thirtyDaysAgo && 
                   (b.status === 'Confirmed' || b.status === 'Completed' || b.status === 'CheckedOut');
          })
          .forEach(b => {
            const dateStr = new Date(b.createdAt).toISOString().split('T')[0];
            if (revenueByDate.has(dateStr)) {
              revenueByDate.set(dateStr, revenueByDate.get(dateStr)! + (b.totalPrice || 0));
            }
          });

        // Convert to array and sort by date
        return Array.from(revenueByDate.entries())
          .map(([date, value]) => ({ date, value }))
          .sort((a, b) => a.date.localeCompare(b.date));
      }),
      catchError(() => of([]))
    );
  }

  /**
   * Get top 5 hotels by performance
   */
  getTopHotels(): Observable<TopHotel[]> {
    return forkJoin({
      bookings: this.http.get<any[]>(`${this.apiUrl}/bookings`).pipe(catchError(() => of([]))),
      hotels: this.http.get<any[]>(`${this.apiUrl}/hotels`).pipe(catchError(() => of([])))
    }).pipe(
      map(({ bookings, hotels }) => {
        // Calculate metrics per hotel
        const hotelMetrics = hotels.map(hotel => {
          const hotelBookings = bookings.filter(b => 
            b.room?.hotel?.id === hotel.id || b.room?.hotelId === hotel.id
          );
          
          const revenue = hotelBookings
            .filter(b => b.status === 'Confirmed' || b.status === 'Completed' || b.status === 'CheckedOut')
            .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

          const totalRooms = hotel.rooms?.length || 1;
          const activeBookings = hotelBookings.filter(b => 
            b.status === 'Confirmed' || b.status === 'CheckedIn'
          ).length;
          const occupancyRate = Math.min(Math.round((activeBookings / totalRooms) * 100), 100);

          return {
            id: hotel.id,
            name: hotel.name,
            occupancyRate,
            revenue,
            bookingsCount: hotelBookings.length
          };
        });

        // Sort by revenue + occupancy (weighted score)
        return hotelMetrics
          .sort((a, b) => (b.revenue + b.occupancyRate * 100) - (a.revenue + a.occupancyRate * 100))
          .slice(0, 5);
      })
    );
  }

  /**
   * Force refresh cached data
   */
  refreshMetrics(): void {
    this.metricsCache$ = undefined;
  }
}
