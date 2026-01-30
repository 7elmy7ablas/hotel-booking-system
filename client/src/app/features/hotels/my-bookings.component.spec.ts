import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';

import { MyBookingsComponent } from './my-bookings.component';
import { BookingService } from '../../services/booking.service';

describe('MyBookingsComponent', () => {
  let component: MyBookingsComponent;
  let fixture: ComponentFixture<MyBookingsComponent>;
  let bookingServiceSpy: jasmine.SpyObj<BookingService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockBookings = [
    { id: '1', hotelName: 'Grand Hotel', status: 'Confirmed', checkInDate: '2024-01-15', checkOutDate: '2024-01-18', totalPrice: 450 },
    { id: '2', hotelName: 'Beach Resort', status: 'Pending', checkInDate: '2024-02-10', checkOutDate: '2024-02-14', totalPrice: 800 },
    { id: '3', hotelName: 'Budget Inn', status: 'Cancelled', checkInDate: '2024-01-20', checkOutDate: '2024-01-22', totalPrice: 200 },
    { id: '4', hotelName: 'Luxury Suite', status: 'Completed', checkInDate: '2023-12-01', checkOutDate: '2023-12-05', totalPrice: 1200 }
  ];

  beforeEach(async () => {
    bookingServiceSpy = jasmine.createSpyObj('BookingService', ['getMyBookings', 'cancelBooking']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    bookingServiceSpy.getMyBookings.and.returnValue(of(mockBookings as any));

    await TestBed.configureTestingModule({
      imports: [
        MyBookingsComponent,
        HttpClientTestingModule,
        RouterTestingModule
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

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should load bookings on init', () => {
      expect(bookingServiceSpy.getMyBookings).toHaveBeenCalled();
    });

    it('should populate bookings array', fakeAsync(() => {
      tick();
      expect(component.bookings.length).toBe(4);
    }));

    it('should populate filteredBookings array', fakeAsync(() => {
      tick();
      expect(component.filteredBookings.length).toBe(4);
    }));

    it('should have All as default filter', () => {
      expect(component.selectedFilter).toBe('All');
    });

    it('should not be loading after init', fakeAsync(() => {
      tick();
      expect(component.isLoading).toBeFalse();
    }));

    it('should have empty error message', () => {
      expect(component.errorMessage).toBe('');
    });

    it('should not have cancelling booking id', () => {
      expect(component.cancellingBookingId).toBeNull();
    });
  });

  describe('Booking Loading', () => {
    it('should set loading to true during load', fakeAsync(() => {
      // Use a Subject to control when observable emits
      const bookingsSubject = new Subject<any[]>();
      bookingServiceSpy.getMyBookings.and.returnValue(bookingsSubject.asObservable());
      
      component.isLoading = false;
      component.loadBookings();
      
      // Before observable emits, isLoading should be true
      expect(component.isLoading).toBeTrue();
      
      // Emit and complete
      bookingsSubject.next(mockBookings as any);
      bookingsSubject.complete();
      tick();
      
      // After observable emits, isLoading should be false
      expect(component.isLoading).toBeFalse();
    }));

    it('should handle empty bookings', fakeAsync(() => {
      bookingServiceSpy.getMyBookings.and.returnValue(of([]));
      component.loadBookings();
      tick();
      expect(component.bookings).toEqual([]);
    }));

    it('should handle error response', fakeAsync(() => {
      bookingServiceSpy.getMyBookings.and.returnValue(throwError(() => new Error('Error')));
      component.loadBookings();
      tick();
      expect(component.errorMessage).toBeTruthy();
    }));

    it('should set loading false on error', fakeAsync(() => {
      bookingServiceSpy.getMyBookings.and.returnValue(throwError(() => new Error('Error')));
      component.loadBookings();
      tick();
      expect(component.isLoading).toBeFalse();
    }));

    it('should clear error on new load', () => {
      component.errorMessage = 'Previous error';
      component.loadBookings();
      expect(component.errorMessage).toBe('');
    });
  });

  describe('Filtering', () => {
    beforeEach(fakeAsync(() => {
      tick();
    }));

    it('should filter by Confirmed status', () => {
      component.filterBookings('Confirmed');
      expect(component.filteredBookings.length).toBe(1);
      expect(component.filteredBookings[0].status).toBe('Confirmed');
    });

    it('should filter by Pending status', () => {
      component.filterBookings('Pending');
      expect(component.filteredBookings.length).toBe(1);
      expect(component.filteredBookings[0].status).toBe('Pending');
    });

    it('should filter by Cancelled status', () => {
      component.filterBookings('Cancelled');
      expect(component.filteredBookings.length).toBe(1);
      expect(component.filteredBookings[0].status).toBe('Cancelled');
    });

    it('should filter by Completed status', () => {
      component.filterBookings('Completed');
      expect(component.filteredBookings.length).toBe(1);
    });

    it('should show all bookings with All filter', () => {
      component.filterBookings('Confirmed');
      component.filterBookings('All');
      expect(component.filteredBookings.length).toBe(4);
    });

    it('should update selected filter', () => {
      component.filterBookings('Confirmed');
      expect(component.selectedFilter).toBe('Confirmed');
    });

    it('should return empty for non-matching status', () => {
      component.filterBookings('NonExistent');
      expect(component.filteredBookings.length).toBe(0);
    });
  });

  describe('Booking Cancellation', () => {
    beforeEach(() => {
      spyOn(window, 'confirm').and.returnValue(true);
      bookingServiceSpy.cancelBooking.and.returnValue(of(void 0));
    });

    it('should call cancel service', fakeAsync(() => {
      component.cancelBooking('1');
      tick();
      expect(bookingServiceSpy.cancelBooking).toHaveBeenCalledWith('1');
    }));

    it('should set cancelling id during cancel', fakeAsync(() => {
      // Use a Subject to control when observable emits
      const cancelSubject = new Subject<void>();
      bookingServiceSpy.cancelBooking.and.returnValue(cancelSubject.asObservable());
      
      component.cancelBooking('1');
      
      // Before observable emits, cancellingBookingId should be set
      expect(component.cancellingBookingId).toBe('1');
      
      // Emit and complete
      cancelSubject.next();
      cancelSubject.complete();
      tick();
      
      // After observable emits, cancellingBookingId should be cleared
      expect(component.cancellingBookingId).toBeNull();
    }));

    it('should reload bookings after cancel', fakeAsync(() => {
      component.cancelBooking('1');
      tick();
      expect(bookingServiceSpy.getMyBookings).toHaveBeenCalled();
    }));

    it('should not cancel without confirmation', fakeAsync(() => {
      (window.confirm as jasmine.Spy).and.returnValue(false);
      component.cancelBooking('1');
      tick();
      expect(bookingServiceSpy.cancelBooking).not.toHaveBeenCalled();
    }));

    it('should handle cancel error', fakeAsync(() => {
      bookingServiceSpy.cancelBooking.and.returnValue(throwError(() => new Error('Cancel failed')));
      component.cancelBooking('1');
      tick();
      expect(component.errorMessage).toBeTruthy();
    }));

    it('should clear cancelling id after error', fakeAsync(() => {
      bookingServiceSpy.cancelBooking.and.returnValue(throwError(() => new Error('Cancel failed')));
      component.cancelBooking('1');
      tick();
      expect(component.cancellingBookingId).toBeNull();
    }));

    it('should clear cancelling id on success', fakeAsync(() => {
      component.cancelBooking('1');
      tick();
      expect(component.cancellingBookingId).toBeNull();
    }));
  });

  describe('Navigation', () => {
    it('should navigate to booking details', () => {
      component.viewBookingDetails('123');
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/bookings', '123']);
    });

    it('should navigate to hotels page', () => {
      component.navigateToHotels();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/hotels']);
    });
  });

  describe('Status Classes', () => {
    it('should return warning class for Pending', () => {
      expect(component.getStatusClass('Pending')).toBe('badge-warning');
    });

    it('should return success class for Confirmed', () => {
      expect(component.getStatusClass('Confirmed')).toBe('badge-success');
    });

    it('should return error class for Cancelled', () => {
      expect(component.getStatusClass('Cancelled')).toBe('badge-error');
    });

    it('should return primary class for Completed', () => {
      expect(component.getStatusClass('Completed')).toBe('badge-primary');
    });

    it('should return primary class for unknown status', () => {
      expect(component.getStatusClass('Unknown')).toBe('badge-primary');
    });
  });

  describe('Date Formatting', () => {
    it('should format date string correctly', () => {
      const formatted = component.formatDate('2024-01-15');
      expect(formatted).toContain('2024');
      expect(formatted).toContain('Jan');
    });

    it('should format Date object correctly', () => {
      const date = new Date(2024, 0, 15);
      const formatted = component.formatDate(date);
      expect(formatted).toContain('2024');
    });

    it('should handle different date formats', () => {
      const formatted = component.formatDate('2024-12-25');
      expect(formatted).toContain('Dec');
      expect(formatted).toContain('25');
    });
  });
});
