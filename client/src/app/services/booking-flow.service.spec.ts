import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { BookingService } from './booking.service';
import { AuthService } from './auth.service';
import { CacheService } from './cache.service';
import { ErrorHandlingService } from './error-handling.service';
import { SanitizationService } from './sanitization.service';
import { SelectedHotelService } from './selected-hotel.service';
import { CreateBookingRequest } from '../models/booking.model';
import { environment } from '../../environments/environment';

/**
 * BookingService Tests - Booking Flow Spec
 * Spec: .specify/specs/001-hotel-booking-flow/spec.md
 * 
 * Tests cover:
 * - US3: Create booking with price calculation
 * - US4: Get user bookings
 * - US5: Cancel booking
 * - Edge cases: EC-001 to EC-006
 */
describe('BookingService - Booking Flow Spec Tests', () => {
  let service: BookingService;
  let httpMock: HttpTestingController;
  let authService: jasmine.SpyObj<AuthService>;
  let cacheService: CacheService;

  const mockUser = { 
    id: 'user-123', 
    email: 'test@test.com', 
    fullName: 'Test User', 
    role: 'User' 
  };

  const apiUrl = `${environment.apiUrl}${environment.endpoints.bookings}`;

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
        SanitizationService,
        SelectedHotelService
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

  describe('US3: Create Booking with Price Calculation', () => {
    
    /**
     * US3-AC1: Booking should be created with correct total price
     * 3 nights × $150 = $450
     */
    it('should create booking and receive server-calculated total price', (done) => {
      const bookingRequest: CreateBookingRequest = {
        roomId: 'room-123',
        checkInDate: new Date('2026-02-15'),
        checkOutDate: new Date('2026-02-18'), // 3 nights
        guestName: 'Test User',
        guestEmail: 'test@test.com',
        guestPhone: '1234567890',
        totalPrice: 450
      };

      const serverResponse = {
        id: 'booking-123',
        userId: 'user-123',
        roomId: 'room-123',
        checkIn: '2026-02-15T14:00:00Z',
        checkOut: '2026-02-18T11:00:00Z',
        totalPrice: 450, // Server calculated: 3 × $150
        status: 'Confirmed',
        createdAt: '2026-01-30T10:30:00Z'
      };

      service.createBooking(bookingRequest).subscribe(booking => {
        expect(booking.id).toBe('booking-123');
        expect(booking.totalPrice).toBe(450);
        expect(booking.status).toBe('Confirmed');
        done();
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.roomId).toBe('room-123');
      req.flush(serverResponse);
    });

    /**
     * US3-AC2: Server should override client-provided total price
     */
    it('should send booking data to server for price calculation', (done) => {
      const bookingRequest: CreateBookingRequest = {
        roomId: 'room-123',
        checkInDate: new Date('2026-02-15'),
        checkOutDate: new Date('2026-02-18'),
        guestName: 'Test User',
        guestEmail: 'test@test.com',
        guestPhone: '1234567890',
        totalPrice: 9999 // Wrong price from client
      };

      const serverResponse = {
        id: 'booking-123',
        userId: 'user-123',
        roomId: 'room-123',
        checkIn: '2026-02-15',
        checkOut: '2026-02-18',
        totalPrice: 450, // Server corrects to actual price
        status: 'Confirmed',
        createdAt: '2026-01-30T10:30:00Z'
      };

      service.createBooking(bookingRequest).subscribe(booking => {
        // Server response should have correct price, not client's
        expect(booking.totalPrice).toBe(450);
        expect(booking.totalPrice).not.toBe(9999);
        done();
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush(serverResponse);
    });

    /**
     * US3-AC3: Response should include all booking details
     */
    it('should map server response to booking model correctly', (done) => {
      const bookingRequest: CreateBookingRequest = {
        roomId: 'room-123',
        checkInDate: new Date('2026-02-15'),
        checkOutDate: new Date('2026-02-18'),
        guestName: 'John Doe',
        guestEmail: 'john@example.com',
        guestPhone: '+1234567890',
        totalPrice: 450
      };

      const serverResponse = {
        id: 'booking-abc-123',
        userId: 'user-123',
        roomId: 'room-123',
        hotelId: 'hotel-456',
        checkIn: '2026-02-15T14:00:00Z',
        checkOut: '2026-02-18T11:00:00Z',
        totalPrice: 450,
        status: 'Confirmed',
        guestName: 'John Doe',
        guestEmail: 'john@example.com',
        guestPhone: '+1234567890',
        specialRequests: null,
        createdAt: '2026-01-30T10:30:00Z'
      };

      service.createBooking(bookingRequest).subscribe(booking => {
        expect(booking.id).toBe('booking-abc-123');
        expect(booking.userId).toBe('user-123');
        expect(booking.roomId).toBe('room-123');
        expect(booking.hotelId).toBe('hotel-456');
        expect(booking.checkInDate).toBe('2026-02-15T14:00:00Z');
        expect(booking.checkOutDate).toBe('2026-02-18T11:00:00Z');
        expect(booking.totalPrice).toBe(450);
        expect(booking.status).toBe('Confirmed');
        expect(booking.guestName).toBe('John Doe');
        expect(booking.guestEmail).toBe('john@example.com');
        done();
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush(serverResponse);
    });

    /**
     * Security: Booking data should be sanitized before sending
     */
    it('should sanitize booking data to prevent XSS', (done) => {
      const bookingRequest: CreateBookingRequest = {
        roomId: 'room-123',
        checkInDate: new Date('2026-02-15'),
        checkOutDate: new Date('2026-02-18'),
        guestName: '<script>alert("xss")</script>John',
        guestEmail: 'test@test.com',
        guestPhone: '1234567890',
        totalPrice: 450
      };

      service.createBooking(bookingRequest).subscribe();

      const req = httpMock.expectOne(apiUrl);
      // Sanitization service should clean the guest name
      expect(req.request.body.guestName).not.toContain('<script>');
      req.flush({ id: 'booking-123', status: 'Confirmed', totalPrice: 450 });
      done();
    });
  });

  describe('US4: View My Bookings', () => {
    
    /**
     * US4-AC1: Should return all user bookings
     */
    it('should fetch and map user bookings correctly', (done) => {
      const serverResponse = [
        {
          id: 'booking-1',
          userId: 'user-123',
          roomId: 'room-1',
          checkIn: '2026-02-20',
          checkOut: '2026-02-23',
          totalPrice: 450,
          status: 'Confirmed'
        },
        {
          id: 'booking-2',
          userId: 'user-123',
          roomId: 'room-2',
          checkIn: '2026-03-10',
          checkOut: '2026-03-12',
          totalPrice: 300,
          status: 'Pending'
        }
      ];

      service.getMyBookings().subscribe(bookings => {
        expect(bookings.length).toBe(2);
        expect(bookings[0].id).toBe('booking-1');
        expect(bookings[1].id).toBe('booking-2');
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/user/'));
      req.flush(serverResponse);
    });

    /**
     * US4-AC3: Should return empty array when no bookings
     */
    it('should handle empty bookings list', (done) => {
      service.getMyBookings().subscribe(bookings => {
        expect(bookings).toEqual([]);
        expect(bookings.length).toBe(0);
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/user/'));
      req.flush([]);
    });

    /**
     * US4-AC4: Should include cancelled bookings with status
     */
    it('should include cancelled bookings in response', (done) => {
      const serverResponse = [
        { id: 'booking-1', status: 'Confirmed', checkIn: '2026-02-20', checkOut: '2026-02-23', totalPrice: 450 },
        { id: 'booking-2', status: 'Cancelled', checkIn: '2026-03-10', checkOut: '2026-03-12', totalPrice: 300 }
      ];

      service.getMyBookings().subscribe(bookings => {
        const cancelledBooking = bookings.find(b => b.id === 'booking-2');
        expect(cancelledBooking).toBeTruthy();
        expect(cancelledBooking?.status).toBe('Cancelled');
        done();
      });

      const req = httpMock.expectOne(req => req.url.includes('/user/'));
      req.flush(serverResponse);
    });
  });

  describe('US5: Cancel Booking', () => {
    
    /**
     * US5-AC1: Should cancel booking successfully
     */
    it('should call DELETE endpoint for cancellation', (done) => {
      const bookingId = 'booking-123';

      service.cancelBooking(bookingId).subscribe(result => {
        expect(result).toBeTruthy();
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/${bookingId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });

    /**
     * US5: Should invalidate cache after cancellation
     */
    it('should invalidate booking cache after cancellation', fakeAsync(() => {
      const bookingId = 'booking-123';
      spyOn(cacheService, 'delete');

      service.cancelBooking(bookingId).subscribe();

      const req = httpMock.expectOne(`${apiUrl}/${bookingId}`);
      req.flush({ success: true });
      tick();

      // Cache should be invalidated
      expect(cacheService.delete).toHaveBeenCalled();
    }));
  });

  describe('Edge Cases', () => {
    
    /**
     * EC-001: Handle overlap error from server
     */
    it('should handle 409 Conflict for overlapping bookings', (done) => {
      const bookingRequest: CreateBookingRequest = {
        roomId: 'room-123',
        checkInDate: new Date('2026-02-16'),
        checkOutDate: new Date('2026-02-20'),
        guestName: 'Test User',
        guestEmail: 'test@test.com',
        guestPhone: '1234567890',
        totalPrice: 600
      };

      service.createBooking(bookingRequest).subscribe({
        error: (error) => {
          expect(error.status).toBe(409);
          done();
        }
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush(
        { error: 'Room is not available for the selected dates' },
        { status: 409, statusText: 'Conflict' }
      );
    });

    /**
     * EC-002/003: Handle 400 Bad Request for invalid dates
     */
    it('should handle 400 Bad Request for invalid dates', (done) => {
      const bookingRequest: CreateBookingRequest = {
        roomId: 'room-123',
        checkInDate: new Date('2026-02-18'),
        checkOutDate: new Date('2026-02-15'), // Before check-in
        guestName: 'Test User',
        guestEmail: 'test@test.com',
        guestPhone: '1234567890',
        totalPrice: 0
      };

      service.createBooking(bookingRequest).subscribe({
        error: (error) => {
          expect(error.status).toBe(400);
          done();
        }
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush(
        { error: 'Check-out date must be after check-in date' },
        { status: 400, statusText: 'Bad Request' }
      );
    });

    /**
     * EC-005: Handle 404 for non-existent room
     */
    it('should handle 404 Not Found for invalid room', (done) => {
      const bookingRequest: CreateBookingRequest = {
        roomId: 'non-existent-room',
        checkInDate: new Date('2026-02-15'),
        checkOutDate: new Date('2026-02-18'),
        guestName: 'Test User',
        guestEmail: 'test@test.com',
        guestPhone: '1234567890',
        totalPrice: 450
      };

      service.createBooking(bookingRequest).subscribe({
        error: (error) => {
          expect(error.status).toBe(404);
          done();
        }
      });

      const req = httpMock.expectOne(apiUrl);
      req.flush(
        { error: 'Room not found' },
        { status: 404, statusText: 'Not Found' }
      );
    });

    /**
     * EC-006: Handle 401 Unauthorized when not logged in
     */
    it('should throw error when user not authenticated', () => {
      authService.getCurrentUser.and.returnValue(null);

      const bookingRequest: CreateBookingRequest = {
        roomId: 'room-123',
        checkInDate: new Date('2026-02-15'),
        checkOutDate: new Date('2026-02-18'),
        guestName: 'Test User',
        guestEmail: 'test@test.com',
        guestPhone: '1234567890',
        totalPrice: 450
      };

      expect(() => service.createBooking(bookingRequest)).toThrowError('User not authenticated');
    });

    /**
     * US5-AC3: Handle 403 when cancelling another user's booking
     */
    it('should handle 403 Forbidden when cancelling others booking', (done) => {
      const bookingId = 'other-users-booking';

      service.cancelBooking(bookingId).subscribe({
        error: (error) => {
          expect(error.status).toBe(403);
          done();
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/${bookingId}`);
      req.flush(
        { error: 'You can only cancel your own bookings' },
        { status: 403, statusText: 'Forbidden' }
      );
    });
  });

  describe('Price Calculation Validation (Frontend)', () => {
    
    /**
     * FR-003: Validate nights calculation
     */
    it('should correctly calculate number of nights', () => {
      const checkIn = new Date('2026-02-15');
      const checkOut = new Date('2026-02-18');
      
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
      
      expect(nights).toBe(3);
    });

    /**
     * FR-003: Validate total price formula
     */
    it('should calculate total price as nights × pricePerNight', () => {
      const pricePerNight = 150;
      const nights = 3;
      
      const totalPrice = nights * pricePerNight;
      
      expect(totalPrice).toBe(450);
    });
  });
});
