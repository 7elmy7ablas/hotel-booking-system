import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { of, throwError, Subject, BehaviorSubject } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { MyBookingsComponent } from './my-bookings.component';
import { BookingService } from '../../services/booking.service';
import { Booking, BookingStatus } from '../../models/booking.model';

/**
 * MyBookingsComponent Tests - Booking Flow Spec
 * Spec: .specify/specs/001-hotel-booking-flow/spec.md
 * 
 * User Story 4: View My Bookings
 */
describe('MyBookingsComponent - Booking Flow Spec Tests', () => {
  let component: MyBookingsComponent;
  let fixture: ComponentFixture<MyBookingsComponent>;
  let bookingServiceSpy: jasmine.SpyObj<BookingService>;
  let routerSpy: jasmine.SpyObj<Router>;

  // Mock bookings matching the spec scenarios
  const mockBookings: Partial<Booking>[] = [
    { 
      id: 'booking-1', 
      hotelId: 'hotel-1',
      roomId: 'room-1',
      status: 'Confirmed' as BookingStatus, 
      checkInDate: '2026-02-20', 
      checkOutDate: '2026-02-23', 
      totalPrice: 450,
      guestName: 'John Doe'
    },
    { 
      id: 'booking-2', 
      hotelId: 'hotel-2',
      roomId: 'room-2',
      status: 'Pending' as BookingStatus, 
      checkInDate: '2026-03-10', 
      checkOutDate: '2026-03-12', 
      totalPrice: 300,
      guestName: 'John Doe'
    },
    { 
      id: 'booking-3', 
      hotelId: 'hotel-1',
      roomId: 'room-3',
      status: 'Cancelled' as BookingStatus, 
      checkInDate: '2026-01-15', 
      checkOutDate: '2026-01-18', 
      totalPrice: 375,
      guestName: 'John Doe'
    },
    { 
      id: 'booking-4', 
      hotelId: 'hotel-3',
      roomId: 'room-4',
      status: 'Completed' as BookingStatus, 
      checkInDate: '2025-12-01', 
      checkOutDate: '2025-12-05', 
      totalPrice: 600,
      guestName: 'John Doe'
    }
  ];

  beforeEach(async () => {
    bookingServiceSpy = jasmine.createSpyObj('BookingService', ['getMyBookings', 'cancelBooking']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    bookingServiceSpy.getMyBookings.and.returnValue(of(mockBookings as Booking[]));

    await TestBed.configureTestingModule({
      imports: [
        MyBookingsComponent,
        HttpClientTestingModule,
        RouterTestingModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: BookingService, useValue: bookingServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MyBookingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('US4-AC1: Display All User Bookings', () => {
    
    it('should load bookings on component initialization', () => {
      expect(bookingServiceSpy.getMyBookings).toHaveBeenCalled();
    });

    it('should display all user bookings', fakeAsync(() => {
      tick();
      expect(component.bookings.length).toBe(4);
    }));

    it('should populate filteredBookings with all bookings initially', fakeAsync(() => {
      tick();
      expect(component.filteredBookings.length).toBe(4);
    }));
  });

  describe('US4-AC2: Display Booking Details', () => {
    
    it('should include totalPrice in each booking', fakeAsync(() => {
      tick();
      const booking = component.bookings.find(b => b.id === 'booking-1');
      expect(booking?.totalPrice).toBe(450);
    }));

    it('should include status in each booking', fakeAsync(() => {
      tick();
      const statuses = component.bookings.map(b => b.status);
      expect(statuses).toContain('Confirmed');
      expect(statuses).toContain('Pending');
      expect(statuses).toContain('Cancelled');
      expect(statuses).toContain('Completed');
    }));

    it('should include check-in and check-out dates', fakeAsync(() => {
      tick();
      const booking = component.bookings.find(b => b.id === 'booking-1');
      expect(booking?.checkInDate).toBe('2026-02-20');
      expect(booking?.checkOutDate).toBe('2026-02-23');
    }));
  });

  describe('US4-AC3: Empty State', () => {
    
    it('should handle empty bookings list gracefully', fakeAsync(() => {
      bookingServiceSpy.getMyBookings.and.returnValue(of([]));
      component.loadBookings();
      tick();

      expect(component.bookings.length).toBe(0);
      expect(component.filteredBookings.length).toBe(0);
      expect(component.isLoading).toBeFalse();
    }));

    it('should not show error when no bookings exist', fakeAsync(() => {
      bookingServiceSpy.getMyBookings.and.returnValue(of([]));
      component.loadBookings();
      tick();

      expect(component.errorMessage).toBe('');
    }));
  });

  describe('US4-AC4: Cancelled Bookings Visibility', () => {
    
    it('should include cancelled bookings in the list', fakeAsync(() => {
      tick();
      const cancelledBooking = component.bookings.find(b => b.status === 'Cancelled');
      expect(cancelledBooking).toBeTruthy();
      expect(cancelledBooking?.id).toBe('booking-3');
    }));

    it('should filter to show only cancelled bookings', fakeAsync(() => {
      tick();
      component.filterBookings('Cancelled');
      
      expect(component.selectedFilter).toBe('Cancelled');
      expect(component.filteredBookings.length).toBe(1);
      expect(component.filteredBookings[0].status).toBe('Cancelled');
    }));
  });

  describe('Filtering Functionality', () => {
    
    it('should have "All" as default filter', () => {
      expect(component.selectedFilter).toBe('All');
    });

    it('should filter bookings by Confirmed status', fakeAsync(() => {
      tick();
      component.filterBookings('Confirmed');
      
      expect(component.filteredBookings.every(b => b.status === 'Confirmed')).toBeTrue();
    }));

    it('should filter bookings by Pending status', fakeAsync(() => {
      tick();
      component.filterBookings('Pending');
      
      expect(component.filteredBookings.length).toBe(1);
      expect(component.filteredBookings[0].status).toBe('Pending');
    }));

    it('should show all bookings when filter is "All"', fakeAsync(() => {
      tick();
      component.filterBookings('Confirmed');
      component.filterBookings('All');
      
      expect(component.filteredBookings.length).toBe(4);
    }));
  });

  describe('US5: Cancel Booking', () => {
    
    beforeEach(() => {
      bookingServiceSpy.cancelBooking.and.returnValue(of(void 0));
      spyOn(window, 'confirm').and.returnValue(true);
    });

    it('should call cancelBooking service method', fakeAsync(() => {
      component.cancelBooking('booking-1');
      tick();
      
      expect(bookingServiceSpy.cancelBooking).toHaveBeenCalledWith('booking-1');
    }));

    it('should reload bookings after successful cancellation', fakeAsync(() => {
      const loadSpy = spyOn(component, 'loadBookings').and.callThrough();
      
      component.cancelBooking('booking-1');
      tick();
      
      expect(loadSpy).toHaveBeenCalled();
    }));

    it('should set cancellingBookingId during cancellation', fakeAsync(() => {
      const cancelSubject = new Subject<void>();
      bookingServiceSpy.cancelBooking.and.returnValue(cancelSubject.asObservable());
      
      component.cancelBooking('booking-1');
      expect(component.cancellingBookingId).toBe('booking-1');
      
      cancelSubject.next();
      cancelSubject.complete();
      tick();
      
      expect(component.cancellingBookingId).toBeNull();
    }));

    it('should not cancel if user declines confirmation', () => {
      (window.confirm as jasmine.Spy).and.returnValue(false);
      
      component.cancelBooking('booking-1');
      
      expect(bookingServiceSpy.cancelBooking).not.toHaveBeenCalled();
    });

    it('should show error message on cancellation failure', fakeAsync(() => {
      bookingServiceSpy.cancelBooking.and.returnValue(
        throwError(() => ({ status: 500, message: 'Server error' }))
      );
      
      component.cancelBooking('booking-1');
      tick();
      
      expect(component.errorMessage).toContain('Failed to cancel booking');
      expect(component.cancellingBookingId).toBeNull();
    }));
  });

  describe('Loading State', () => {
    
    it('should set isLoading to true when loading starts', fakeAsync(() => {
      const bookingsSubject = new Subject<Booking[]>();
      bookingServiceSpy.getMyBookings.and.returnValue(bookingsSubject.asObservable());
      
      component.loadBookings();
      
      expect(component.isLoading).toBeTrue();
      
      bookingsSubject.next(mockBookings as Booking[]);
      bookingsSubject.complete();
      tick();
    }));

    it('should set isLoading to false after loading completes', fakeAsync(() => {
      tick();
      expect(component.isLoading).toBeFalse();
    }));

    it('should set isLoading to false on error', fakeAsync(() => {
      bookingServiceSpy.getMyBookings.and.returnValue(
        throwError(() => ({ status: 500 }))
      );
      
      component.loadBookings();
      tick();
      
      expect(component.isLoading).toBeFalse();
    }));
  });

  describe('Error Handling', () => {
    
    it('should display error message on load failure', fakeAsync(() => {
      bookingServiceSpy.getMyBookings.and.returnValue(
        throwError(() => ({ status: 500, message: 'Server error' }))
      );
      
      component.loadBookings();
      tick();
      
      expect(component.errorMessage).toContain('Failed to load bookings');
    }));

    it('should clear error message on successful load', fakeAsync(() => {
      component.errorMessage = 'Previous error';
      component.loadBookings();
      tick();
      
      expect(component.errorMessage).toBe('');
    }));
  });

  describe('Navigation', () => {
    
    it('should navigate to booking details', () => {
      component.viewBookingDetails('booking-1');
      
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/bookings', 'booking-1']);
    });

    it('should navigate to hotels page', () => {
      component.navigateToHotels();
      
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/hotels']);
    });
  });

  describe('Status Badge Styling', () => {
    
    it('should return correct class for Pending status', () => {
      expect(component.getStatusClass('Pending')).toBe('badge-warning');
    });

    it('should return correct class for Confirmed status', () => {
      expect(component.getStatusClass('Confirmed')).toBe('badge-success');
    });

    it('should return correct class for Cancelled status', () => {
      expect(component.getStatusClass('Cancelled')).toBe('badge-error');
    });

    it('should return correct class for Completed status', () => {
      expect(component.getStatusClass('Completed')).toBe('badge-primary');
    });

    it('should return default class for unknown status', () => {
      expect(component.getStatusClass('Unknown')).toBe('badge-primary');
    });
  });

  describe('Date Formatting', () => {
    
    it('should format date correctly', () => {
      const formatted = component.formatDate('2026-02-20');
      expect(formatted).toContain('2026');
      expect(formatted).toContain('Feb');
      expect(formatted).toContain('20');
    });

    it('should handle Date objects', () => {
      const formatted = component.formatDate(new Date('2026-02-20'));
      expect(formatted).toBeTruthy();
    });
  });
});
