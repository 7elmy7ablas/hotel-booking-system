import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { of, throwError } from 'rxjs';

import { DashboardComponent } from './dashboard.component';
import { AdminDashboardService } from '../../services/dashboard.service';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let dashboardServiceSpy: jasmine.SpyObj<AdminDashboardService>;

  const mockMetrics = {
    totalBookings: 150,
    revenueYTD: 75000,
    occupancyRate: 68,
    activeHotels: 12
  };

  const mockRecentBookings = [
    {
      id: 'booking1',
      guestName: 'John Doe',
      hotelName: 'Grand Hotel',
      checkInDate: '2026-02-01',
      status: 'Confirmed',
      totalPrice: 250,
      createdAt: new Date().toISOString()
    },
    {
      id: 'booking2',
      guestName: 'Jane Smith',
      hotelName: 'Beach Resort',
      checkInDate: '2026-02-03',
      status: 'Pending',
      totalPrice: 180,
      createdAt: new Date().toISOString()
    }
  ];

  const mockTopHotels = [
    { id: 'hotel1', name: 'Grand Hotel', occupancyRate: 85, revenue: 25000, bookingsCount: 50 },
    { id: 'hotel2', name: 'Beach Resort', occupancyRate: 72, revenue: 18000, bookingsCount: 35 },
    { id: 'hotel3', name: 'Mountain Lodge', occupancyRate: 65, revenue: 12000, bookingsCount: 28 }
  ];

  const mockRevenueData = Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    value: Math.floor(Math.random() * 5000) + 1000
  })).reverse();

  beforeEach(async () => {
    dashboardServiceSpy = jasmine.createSpyObj('AdminDashboardService', [
      'getMetrics',
      'getRecentBookings',
      'getTopHotels',
      'getRevenueChartData'
    ]);

    dashboardServiceSpy.getMetrics.and.returnValue(of(mockMetrics));
    dashboardServiceSpy.getRecentBookings.and.returnValue(of(mockRecentBookings));
    dashboardServiceSpy.getTopHotels.and.returnValue(of(mockTopHotels));
    dashboardServiceSpy.getRevenueChartData.and.returnValue(of(mockRevenueData));

    await TestBed.configureTestingModule({
      imports: [
        DashboardComponent,
        NoopAnimationsModule,
        RouterTestingModule,
        MatSnackBarModule
      ],
      providers: [
        { provide: AdminDashboardService, useValue: dashboardServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should load all dashboard data on init', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(dashboardServiceSpy.getMetrics).toHaveBeenCalled();
      expect(dashboardServiceSpy.getRecentBookings).toHaveBeenCalled();
      expect(dashboardServiceSpy.getTopHotels).toHaveBeenCalled();
      expect(dashboardServiceSpy.getRevenueChartData).toHaveBeenCalled();
    }));

    it('should set loading states to true initially', () => {
      expect(component.loadingMetrics()).toBe(true);
      expect(component.loadingChart()).toBe(true);
      expect(component.loadingTopHotels()).toBe(true);
      expect(component.loadingBookings()).toBe(true);
    });

    it('should set loading states to false after data loads', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.loadingMetrics()).toBe(false);
      expect(component.loadingChart()).toBe(false);
      expect(component.loadingTopHotels()).toBe(false);
      expect(component.loadingBookings()).toBe(false);
    }));
  });

  describe('Metrics Display', () => {
    it('should display 4 metric cards after loading', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.metricCards().length).toBe(4);
    }));

    it('should format metric values correctly', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const cards = component.metricCards();
      
      // Total Bookings
      const bookingsCard = cards.find(c => c.title === 'Total Bookings');
      expect(bookingsCard?.value).toBe('150');

      // Revenue YTD
      const revenueCard = cards.find(c => c.title === 'Revenue YTD');
      expect(revenueCard?.value).toBe('$75.0K');

      // Occupancy Rate
      const occupancyCard = cards.find(c => c.title === 'Occupancy Rate');
      expect(occupancyCard?.value).toBe('68%');

      // Active Hotels
      const hotelsCard = cards.find(c => c.title === 'Active Hotels');
      expect(hotelsCard?.value).toBe('12');
    }));

    it('should format large revenue values correctly', fakeAsync(() => {
      dashboardServiceSpy.getMetrics.and.returnValue(of({
        ...mockMetrics,
        revenueYTD: 1500000
      }));

      fixture.detectChanges();
      tick();

      const cards = component.metricCards();
      const revenueCard = cards.find(c => c.title === 'Revenue YTD');
      expect(revenueCard?.value).toBe('$1.5M');
    }));
  });

  describe('Recent Bookings', () => {
    it('should display recent bookings after loading', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.recentBookings().length).toBe(2);
    }));

    it('should have correct table columns defined', () => {
      expect(component.bookingsColumns).toEqual([
        'id', 'guestName', 'hotelName', 'checkInDate', 'status', 'totalPrice'
      ]);
    });
  });

  describe('Top Hotels', () => {
    it('should display top hotels after loading', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.topHotels().length).toBe(3);
    }));

    it('should have correct table columns defined', () => {
      expect(component.topHotelsColumns).toEqual(['rank', 'name', 'occupancy', 'revenue']);
    });
  });

  describe('Revenue Chart', () => {
    it('should display revenue chart data after loading', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect(component.revenueData().length).toBe(30);
    }));
  });

  describe('Error Handling', () => {
    it('should handle metrics API error gracefully', fakeAsync(() => {
      dashboardServiceSpy.getMetrics.and.returnValue(throwError(() => new Error('API Error')));
      
      fixture.detectChanges();
      tick();

      expect(component.loadingMetrics()).toBe(false);
    }));

    it('should handle bookings API error gracefully', fakeAsync(() => {
      dashboardServiceSpy.getRecentBookings.and.returnValue(throwError(() => new Error('API Error')));
      
      fixture.detectChanges();
      tick();

      expect(component.loadingBookings()).toBe(false);
      expect(component.recentBookings().length).toBe(0);
    }));
  });

  describe('Navigation', () => {
    it('should navigate to booking details when row clicked', () => {
      const routerSpy = spyOn(component['router'], 'navigate');
      
      component.navigateToBooking('test-booking-id');
      
      expect(routerSpy).toHaveBeenCalledWith(['/bookings', 'test-booking-id']);
    });
  });

  describe('Cleanup', () => {
    it('should complete destroy subject on component destroy', () => {
      const destroySpy = spyOn(component['destroy$'], 'next');
      const completeSpy = spyOn(component['destroy$'], 'complete');
      
      component.ngOnDestroy();
      
      expect(destroySpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });
  });
});
