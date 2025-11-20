import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BookingService } from './booking.service';
import { AuthService } from './auth.service';
import { CacheService } from './cache.service';
import { ErrorHandlingService } from './error-handling.service';
import { SanitizationService } from './sanitization.service';
import { Booking, CreateBookingRequest } from '../models/booking.model';
import { environment } from '../../environments/environment';

describe('BookingService', () => {
  let service: BookingService;
  let httpMock: HttpTestingController;
  let authService: jasmine.SpyObj<AuthService>;
  let cacheService: CacheService;

  const mockUser = { id: 'user1', email: 'test@test.com', fullName: 'Test User', role: 'User' };
  
  const mockBooking: Booking = {
    id: '1',
    userId: 'user1',
    roomId: 'room1',
    hotelId: 'hotel1',
    checkInDate: new Date('2025-01-01'),
    checkOutDate: new Date('2025-01-05'),
    totalPrice: 400,
    status: 'Pending',
    guestName: 'Test User',
    guestEmail: 'test@test.com',
    guestPhone: '1234567890'
  };

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser']);
    authServiceSpy.getCurrentUser.and.returnValue(mockUser);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        BookingService,
        { provide: AuthService, useValue: authServiceSpy },
        CacheService,
        ErrorHandlingService,
        SanitizationService
      ]
    });

    service = TestBed.inject(BookingService);
    httpMock = TestBed.inject(HttpTestingController);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    cacheService = TestBed.inject(CacheService);
  });

  afterEach(() => {
    httpMock.verify();
    cacheService.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createBooking', () => {
    it('should create a booking', (done) => {
      const bookingRequest: CreateBookingRequest = {
        roomId: 'room1',
        checkInDate: new Date('2025-01-01'),
        checkOutDate: new Date('2025-01-05'),
        guestName: 'Test User',
        guestEmail: 'test@test.com',
        guestPhone: '1234567890'
      };

      service.createBooking(bookingRequest).subscribe(booking => {
        expect(booking).toEqual(mockBooking);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.endpoints.bookings}`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.userId).toBe('user1');
      req.flush(mockBooking);
    });

    it('should sanitize booking data', (done) => {
      const bookingRequest: CreateBookingRequest = {
        roomId: 'room1',
        checkInDate: new Date('2025-01-01'),
        checkOutDate: new Date('2025-01-05'),
        guestName: '<script>alert("xss")</script>Test',
        guestEmail: 'test@test.com',
        guestPhone: '1234567890'
      };

      service.createBooking(bookingRequest).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.endpoints.bookings}`);
      expect(req.request.body.guestName).not.toContain('<script>');
      req.flush(mockBooking);
    });

    it('should throw error if user not authenticated', () => {
      authService.getCurrentUser.and.returnValue(null);

      expect(() => {
        service.createBooking({} as CreateBookingRequest);
      }).toThrow();
    });

    it('should invalidate cache after creating booking', (done) => {
      spyOn(service, 'invalidateBookingCaches');

      const bookingRequest: CreateBookingRequest = {
        roomId: 'room1',
        checkInDate: new Date('2025-01-01'),
        checkOutDate: new Date('2025-01-05'),
        guestName: 'Test User',
        guestEmail: 'test@test.com',
        guestPhone: '1234567890'
      };

      service.createBooking(bookingRequest).subscribe(() => {
        expect(service.invalidateBookingCaches).toHaveBeenCalledWith('user1');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.endpoints.bookings}`);
      req.flush(mockBooking);
    });
  });

  describe('getMyBookings', () => {
    it('should fetch user bookings', (done) => {
      service.getMyBookings().subscribe(bookings => {
        expect(bookings).toEqual([mockBooking]);
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.endpoints.bookings}/my-bookings`);
      expect(req.request.method).toBe('GET');
      req.flush([mockBooking]);
    });

    it('should cache bookings response', (done) => {
      service.getMyBookings().subscribe(() => {
        service.getMyBookings().subscribe(bookings => {
          expect(bookings).toEqual([mockBooking]);
          done();
        });
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.endpoints.bookings}/my-bookings`);
      req.flush([mockBooking]);
    });
  });

  describe('cancelBooking', () => {
    it('should cancel a booking', (done) => {
      const bookingId = '1';

      service.cancelBooking(bookingId).subscribe(() => {
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.endpoints.bookings}/${bookingId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });

    it('should invalidate cache after canceling', (done) => {
      spyOn(service, 'invalidateBookingCaches');
      const bookingId = '1';

      service.cancelBooking(bookingId).subscribe(() => {
        expect(service.invalidateBookingCaches).toHaveBeenCalledWith('user1');
        done();
      });

      const req = httpMock.expectOne(`${environment.apiUrl}${environment.endpoints.bookings}/${bookingId}`);
      req.flush(null);
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate booking caches for user', () => {
      spyOn(cacheService, 'invalidate');
      
      service.invalidateBookingCaches('user1');
      
      expect(cacheService.invalidate).toHaveBeenCalledWith('bookings:user:user1');
    });

    it('should invalidate all booking caches with pattern', () => {
      spyOn(cacheService, 'invalidatePattern');
      
      service.invalidateBookingCaches();
      
      expect(cacheService.invalidatePattern).toHaveBeenCalledWith('bookings:');
    });
  });
});
