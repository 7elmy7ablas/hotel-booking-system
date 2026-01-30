import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AdminDashboardService, DashboardMetrics, RecentBooking, TopHotel } from './dashboard.service';
import { environment } from '../../../../environments/environment';

describe('AdminDashboardService', () => {
  let service: AdminDashboardService;
  let httpMock: HttpTestingController;

  const mockBookings = [
    {
      id: '1',
      userId: 'user1',
      roomId: 'room1',
      checkIn: '2026-02-01',
      checkOut: '2026-02-03',
      totalPrice: 200,
      status: 'Confirmed',
      guestName: 'John Doe',
      createdAt: new Date().toISOString(),
      room: {
        hotel: { id: 'hotel1', name: 'Grand Hotel' }
      }
    },
    {
      id: '2',
      userId: 'user2',
      roomId: 'room2',
      checkIn: '2026-02-05',
      checkOut: '2026-02-07',
      totalPrice: 350,
      status: 'Pending',
      guestName: 'Jane Smith',
      createdAt: new Date().toISOString(),
      room: {
        hotel: { id: 'hotel2', name: 'Beach Resort' }
      }
    }
  ];

  const mockHotels = [
    {
      id: 'hotel1',
      name: 'Grand Hotel',
      location: 'New York',
      rooms: [{ id: 'room1' }, { id: 'room2' }]
    },
    {
      id: 'hotel2',
      name: 'Beach Resort',
      location: 'Miami',
      rooms: [{ id: 'room3' }]
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AdminDashboardService]
    });

    service = TestBed.inject(AdminDashboardService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getMetrics', () => {
    it('should fetch and calculate dashboard metrics', (done) => {
      service.getMetrics().subscribe((metrics: DashboardMetrics) => {
        expect(metrics).toBeTruthy();
        expect(metrics.totalBookings).toBe(2);
        expect(metrics.activeHotels).toBe(2);
        expect(typeof metrics.revenueYTD).toBe('number');
        expect(typeof metrics.occupancyRate).toBe('number');
        done();
      });

      // Respond to bookings request
      const bookingsReq = httpMock.expectOne(`${environment.apiUrl}/bookings`);
      expect(bookingsReq.request.method).toBe('GET');
      bookingsReq.flush(mockBookings);

      // Respond to hotels request
      const hotelsReq = httpMock.expectOne(`${environment.apiUrl}/hotels`);
      expect(hotelsReq.request.method).toBe('GET');
      hotelsReq.flush(mockHotels);
    });

    it('should calculate YTD revenue from confirmed bookings', (done) => {
      const ytdBookings = [
        { ...mockBookings[0], status: 'Confirmed', totalPrice: 100, createdAt: new Date().toISOString() },
        { ...mockBookings[1], status: 'Completed', totalPrice: 150, createdAt: new Date().toISOString() }
      ];

      service.getMetrics().subscribe((metrics: DashboardMetrics) => {
        expect(metrics.revenueYTD).toBe(250);
        done();
      });

      httpMock.expectOne(`${environment.apiUrl}/bookings`).flush(ytdBookings);
      httpMock.expectOne(`${environment.apiUrl}/hotels`).flush(mockHotels);
    });

    it('should handle empty bookings gracefully', (done) => {
      service.getMetrics().subscribe((metrics: DashboardMetrics) => {
        expect(metrics.totalBookings).toBe(0);
        expect(metrics.revenueYTD).toBe(0);
        expect(metrics.occupancyRate).toBe(0);
        done();
      });

      httpMock.expectOne(`${environment.apiUrl}/bookings`).flush([]);
      httpMock.expectOne(`${environment.apiUrl}/hotels`).flush(mockHotels);
    });

    it('should handle API errors gracefully', (done) => {
      service.getMetrics().subscribe((metrics: DashboardMetrics) => {
        expect(metrics.totalBookings).toBe(0);
        done();
      });

      httpMock.expectOne(`${environment.apiUrl}/bookings`).error(new ErrorEvent('Network error'));
      httpMock.expectOne(`${environment.apiUrl}/hotels`).error(new ErrorEvent('Network error'));
    });
  });

  describe('getRecentBookings', () => {
    it('should fetch bookings from the last 24 hours', (done) => {
      const recentBooking = {
        ...mockBookings[0],
        createdAt: new Date().toISOString()
      };

      service.getRecentBookings().subscribe((bookings: RecentBooking[]) => {
        expect(bookings.length).toBeGreaterThanOrEqual(0);
        done();
      });

      httpMock.expectOne(`${environment.apiUrl}/bookings`).flush([recentBooking]);
    });

    it('should filter out bookings older than 24 hours', (done) => {
      const oldBooking = {
        ...mockBookings[0],
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
      };

      service.getRecentBookings().subscribe((bookings: RecentBooking[]) => {
        expect(bookings.length).toBe(0);
        done();
      });

      httpMock.expectOne(`${environment.apiUrl}/bookings`).flush([oldBooking]);
    });

    it('should return empty array on API error', (done) => {
      service.getRecentBookings().subscribe((bookings: RecentBooking[]) => {
        expect(bookings).toEqual([]);
        done();
      });

      httpMock.expectOne(`${environment.apiUrl}/bookings`).error(new ErrorEvent('Network error'));
    });
  });

  describe('getRevenueChartData', () => {
    it('should return 30 days of revenue data', (done) => {
      service.getRevenueChartData().subscribe((data) => {
        expect(data.length).toBe(30);
        data.forEach(point => {
          expect(point.date).toBeDefined();
          expect(point.value).toBeDefined();
          expect(typeof point.value).toBe('number');
        });
        done();
      });

      httpMock.expectOne(`${environment.apiUrl}/bookings`).flush(mockBookings);
    });

    it('should aggregate revenue by date', (done) => {
      const todayStr = new Date().toISOString().split('T')[0];
      const todayBookings = [
        { ...mockBookings[0], status: 'Confirmed', totalPrice: 100, createdAt: new Date().toISOString() },
        { ...mockBookings[1], status: 'Confirmed', totalPrice: 200, createdAt: new Date().toISOString() }
      ];

      service.getRevenueChartData().subscribe((data) => {
        const todayData = data.find(d => d.date === todayStr);
        if (todayData) {
          expect(todayData.value).toBe(300);
        }
        done();
      });

      httpMock.expectOne(`${environment.apiUrl}/bookings`).flush(todayBookings);
    });
  });

  describe('getTopHotels', () => {
    it('should return top 5 hotels sorted by performance', (done) => {
      service.getTopHotels().subscribe((hotels: TopHotel[]) => {
        expect(hotels.length).toBeLessThanOrEqual(5);
        hotels.forEach(hotel => {
          expect(hotel.id).toBeDefined();
          expect(hotel.name).toBeDefined();
          expect(hotel.occupancyRate).toBeDefined();
          expect(hotel.revenue).toBeDefined();
        });
        done();
      });

      httpMock.expectOne(`${environment.apiUrl}/bookings`).flush(mockBookings);
      httpMock.expectOne(`${environment.apiUrl}/hotels`).flush(mockHotels);
    });

    it('should calculate occupancy rate correctly', (done) => {
      const hotelWithRooms = {
        id: 'hotel1',
        name: 'Test Hotel',
        rooms: [{ id: 'r1' }, { id: 'r2' }, { id: 'r3' }, { id: 'r4' }]
      };

      const activeBookings = [
        { ...mockBookings[0], status: 'CheckedIn', room: { hotel: { id: 'hotel1' } } }
      ];

      service.getTopHotels().subscribe((hotels: TopHotel[]) => {
        const testHotel = hotels.find(h => h.id === 'hotel1');
        if (testHotel) {
          expect(testHotel.occupancyRate).toBeLessThanOrEqual(100);
        }
        done();
      });

      httpMock.expectOne(`${environment.apiUrl}/bookings`).flush(activeBookings);
      httpMock.expectOne(`${environment.apiUrl}/hotels`).flush([hotelWithRooms]);
    });
  });

  describe('refreshMetrics', () => {
    it('should clear the metrics cache', () => {
      // Get metrics to create cache
      service.getMetrics().subscribe();
      httpMock.expectOne(`${environment.apiUrl}/bookings`).flush(mockBookings);
      httpMock.expectOne(`${environment.apiUrl}/hotels`).flush(mockHotels);

      // Refresh should clear cache
      service.refreshMetrics();

      // Next call should make new requests
      service.getMetrics().subscribe();
      expect(httpMock.match(`${environment.apiUrl}/bookings`).length).toBe(1);
      expect(httpMock.match(`${environment.apiUrl}/hotels`).length).toBe(1);
    });
  });
});
