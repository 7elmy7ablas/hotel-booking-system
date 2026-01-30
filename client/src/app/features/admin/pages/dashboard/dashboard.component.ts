import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil, forkJoin, catchError, of } from 'rxjs';

import { MetricCardComponent, MetricCardData } from '../../components/metric-card/metric-card.component';
import { RevenueChartComponent, ChartDataPoint } from '../../components/revenue-chart/revenue-chart.component';
import { SkeletonComponent } from '../../components/skeleton/skeleton.component';
import { EmptyStateComponent } from '../../components/empty-state/empty-state.component';
import { 
  AdminDashboardService, 
  DashboardMetrics, 
  RecentBooking, 
  TopHotel 
} from '../../services/dashboard.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MetricCardComponent,
    RevenueChartComponent,
    SkeletonComponent,
    EmptyStateComponent
  ],
  template: `
    <div class="dashboard">
      <!-- Page Header -->
      <div class="page-header">
        <h1>Dashboard</h1>
        <p>Welcome back! Here's what's happening with your hotels today.</p>
      </div>

      <!-- Metrics Cards -->
      <div class="metrics-grid">
        @if (loadingMetrics()) {
          @for (i of [1,2,3,4]; track i) {
            <app-skeleton type="card"></app-skeleton>
          }
        } @else {
          @for (metric of metricCards(); track metric.title) {
            <app-metric-card [data]="metric"></app-metric-card>
          }
        }
      </div>

      <!-- Main Content Grid -->
      <div class="content-grid">
        <!-- Revenue Chart -->
        <div class="chart-section">
          <app-revenue-chart
            [data]="revenueData()"
            [loading]="loadingChart()"
            title="Revenue Overview"
            subtitle="Last 30 days">
          </app-revenue-chart>
        </div>

        <!-- Top Hotels -->
        <div class="top-hotels-section">
          <mat-card>
            <mat-card-header>
              <mat-card-title>Top Performing Hotels</mat-card-title>
              <mat-card-subtitle>By revenue and occupancy</mat-card-subtitle>
            </mat-card-header>
            <mat-card-content>
              @if (loadingTopHotels()) {
                @for (i of [1,2,3,4,5]; track i) {
                  <app-skeleton type="table-row"></app-skeleton>
                }
              } @else if (topHotels().length === 0) {
                <app-empty-state
                  icon="hotel"
                  title="No hotels yet"
                  message="Add hotels to see their performance here.">
                </app-empty-state>
              } @else {
                <table mat-table [dataSource]="topHotels()" class="top-hotels-table">
                  <ng-container matColumnDef="rank">
                    <th mat-header-cell *matHeaderCellDef>#</th>
                    <td mat-cell *matCellDef="let hotel; let i = index">
                      <span class="rank-badge" [class]="'rank-' + (i + 1)">{{ i + 1 }}</span>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="name">
                    <th mat-header-cell *matHeaderCellDef>Hotel</th>
                    <td mat-cell *matCellDef="let hotel">{{ hotel.name }}</td>
                  </ng-container>

                  <ng-container matColumnDef="occupancy">
                    <th mat-header-cell *matHeaderCellDef>Occupancy</th>
                    <td mat-cell *matCellDef="let hotel">
                      <div class="occupancy-bar">
                        <div class="occupancy-fill" [style.width.%]="hotel.occupancyRate"></div>
                        <span>{{ hotel.occupancyRate }}%</span>
                      </div>
                    </td>
                  </ng-container>

                  <ng-container matColumnDef="revenue">
                    <th mat-header-cell *matHeaderCellDef>Revenue</th>
                    <td mat-cell *matCellDef="let hotel">{{ hotel.revenue | currency }}</td>
                  </ng-container>

                  <tr mat-header-row *matHeaderRowDef="topHotelsColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: topHotelsColumns;"></tr>
                </table>
              }
            </mat-card-content>
          </mat-card>
        </div>
      </div>

      <!-- Recent Bookings -->
      <div class="recent-bookings-section">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Recent Bookings</mat-card-title>
            <mat-card-subtitle>Last 24 hours</mat-card-subtitle>
            <button mat-button color="primary" routerLink="/admin/bookings" class="view-all-btn">
              View All
              <mat-icon>arrow_forward</mat-icon>
            </button>
          </mat-card-header>
          <mat-card-content>
            @if (loadingBookings()) {
              @for (i of [1,2,3,4,5]; track i) {
                <app-skeleton type="table-row"></app-skeleton>
              }
            } @else if (recentBookings().length === 0) {
              <app-empty-state
                icon="book_online"
                title="No recent bookings"
                message="Bookings from the last 24 hours will appear here.">
              </app-empty-state>
            } @else {
              <table mat-table [dataSource]="recentBookings()" class="bookings-table">
                <ng-container matColumnDef="id">
                  <th mat-header-cell *matHeaderCellDef>Booking ID</th>
                  <td mat-cell *matCellDef="let booking">
                    <span class="booking-id">{{ booking.id | slice:0:8 }}...</span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="guestName">
                  <th mat-header-cell *matHeaderCellDef>Guest</th>
                  <td mat-cell *matCellDef="let booking">{{ booking.guestName }}</td>
                </ng-container>

                <ng-container matColumnDef="hotelName">
                  <th mat-header-cell *matHeaderCellDef>Hotel</th>
                  <td mat-cell *matCellDef="let booking">{{ booking.hotelName }}</td>
                </ng-container>

                <ng-container matColumnDef="checkInDate">
                  <th mat-header-cell *matHeaderCellDef>Check-in</th>
                  <td mat-cell *matCellDef="let booking">{{ booking.checkInDate | date:'mediumDate' }}</td>
                </ng-container>

                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let booking">
                    <span class="status-badge" [class]="'status--' + booking.status.toLowerCase()">
                      {{ booking.status }}
                    </span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="totalPrice">
                  <th mat-header-cell *matHeaderCellDef>Amount</th>
                  <td mat-cell *matCellDef="let booking">{{ booking.totalPrice | currency }}</td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="bookingsColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: bookingsColumns;" 
                    class="clickable-row"
                    (click)="navigateToBooking(row.id)"></tr>
              </table>
            }
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 24px;
    }

    .page-header h1 {
      font-size: 28px;
      font-weight: 600;
      color: #1a237e;
      margin: 0 0 8px;
    }

    .page-header p {
      color: #666;
      margin: 0;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-bottom: 24px;
    }

    @media (max-width: 1200px) {
      .metrics-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 600px) {
      .metrics-grid {
        grid-template-columns: 1fr;
      }
    }

    .content-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 24px;
      margin-bottom: 24px;
    }

    @media (max-width: 1000px) {
      .content-grid {
        grid-template-columns: 1fr;
      }
    }

    .chart-section {
      min-height: 350px;
    }

    .top-hotels-section mat-card,
    .recent-bookings-section mat-card {
      height: 100%;
    }

    mat-card-header {
      position: relative;
    }

    .view-all-btn {
      position: absolute;
      right: 16px;
      top: 50%;
      transform: translateY(-50%);
    }

    .view-all-btn mat-icon {
      margin-left: 4px;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .top-hotels-table,
    .bookings-table {
      width: 100%;
    }

    .rank-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      font-weight: 600;
      font-size: 12px;
    }

    .rank-1 {
      background: linear-gradient(135deg, #ffd700, #ffb300);
      color: #5d4037;
    }

    .rank-2 {
      background: linear-gradient(135deg, #c0c0c0, #9e9e9e);
      color: #424242;
    }

    .rank-3 {
      background: linear-gradient(135deg, #cd7f32, #8d6e63);
      color: white;
    }

    .rank-4, .rank-5 {
      background: #f5f5f5;
      color: #666;
    }

    .occupancy-bar {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .occupancy-bar .occupancy-fill {
      height: 8px;
      background: linear-gradient(90deg, #1a237e, #3949ab);
      border-radius: 4px;
      min-width: 20px;
      max-width: 100px;
    }

    .occupancy-bar span {
      font-size: 12px;
      color: #666;
      min-width: 40px;
    }

    .booking-id {
      font-family: monospace;
      font-size: 12px;
      color: #666;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
      text-transform: capitalize;
    }

    .status--pending {
      background: #fff3e0;
      color: #e65100;
    }

    .status--confirmed {
      background: #e3f2fd;
      color: #1565c0;
    }

    .status--checkedin {
      background: #e8f5e9;
      color: #2e7d32;
    }

    .status--checkedout, .status--completed {
      background: #f3e5f5;
      color: #7b1fa2;
    }

    .status--cancelled {
      background: #ffebee;
      color: #c62828;
    }

    .clickable-row {
      cursor: pointer;
      transition: background-color 150ms ease;
    }

    .clickable-row:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }

    .recent-bookings-section {
      margin-top: 24px;
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  private dashboardService = inject(AdminDashboardService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private destroy$ = new Subject<void>();

  // Loading states
  loadingMetrics = signal(true);
  loadingChart = signal(true);
  loadingTopHotels = signal(true);
  loadingBookings = signal(true);

  // Data
  metricCards = signal<MetricCardData[]>([]);
  revenueData = signal<ChartDataPoint[]>([]);
  topHotels = signal<TopHotel[]>([]);
  recentBookings = signal<RecentBooking[]>([]);

  // Table columns
  topHotelsColumns = ['rank', 'name', 'occupancy', 'revenue'];
  bookingsColumns = ['id', 'guestName', 'hotelName', 'checkInDate', 'status', 'totalPrice'];

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadDashboardData(): void {
    // Load metrics
    this.dashboardService.getMetrics()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (metrics) => {
          this.metricCards.set(this.buildMetricCards(metrics));
          this.loadingMetrics.set(false);
        },
        error: (error) => {
          console.error('Error loading metrics:', error);
          this.loadingMetrics.set(false);
          this.showError('Failed to load dashboard metrics');
        }
      });

    // Load revenue chart
    this.dashboardService.getRevenueChartData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.revenueData.set(data);
          this.loadingChart.set(false);
        },
        error: (error) => {
          console.error('Error loading chart:', error);
          this.loadingChart.set(false);
        }
      });

    // Load top hotels
    this.dashboardService.getTopHotels()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (hotels) => {
          this.topHotels.set(hotels);
          this.loadingTopHotels.set(false);
        },
        error: (error) => {
          console.error('Error loading top hotels:', error);
          this.loadingTopHotels.set(false);
        }
      });

    // Load recent bookings
    this.dashboardService.getRecentBookings()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (bookings) => {
          this.recentBookings.set(bookings);
          this.loadingBookings.set(false);
        },
        error: (error) => {
          console.error('Error loading bookings:', error);
          this.loadingBookings.set(false);
        }
      });
  }

  private buildMetricCards(metrics: DashboardMetrics): MetricCardData[] {
    return [
      {
        title: 'Total Bookings',
        value: metrics.totalBookings.toLocaleString(),
        icon: 'book_online',
        color: 'primary'
      },
      {
        title: 'Revenue YTD',
        value: this.formatCurrency(metrics.revenueYTD),
        icon: 'attach_money',
        color: 'success'
      },
      {
        title: 'Occupancy Rate',
        value: `${metrics.occupancyRate}%`,
        icon: 'bed',
        color: 'accent'
      },
      {
        title: 'Active Hotels',
        value: metrics.activeHotels.toString(),
        icon: 'hotel',
        color: 'warning'
      }
    ];
  }

  private formatCurrency(value: number): string {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(1)}K`;
    }
    return `$${value.toFixed(0)}`;
  }

  navigateToBooking(bookingId: string): void {
    this.router.navigate(['/bookings', bookingId]);
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Dismiss', {
      duration: 5000,
      panelClass: 'error-snackbar'
    });
  }
}
