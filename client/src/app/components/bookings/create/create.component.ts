import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatStepperModule } from '@angular/material/stepper';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../services/auth.service';
import { BookingService } from '../../../services/booking.service';
import { HotelService } from '../../../services/hotel.service';

@Component({
  selector: 'app-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './create.component.html',
  styleUrl: './create.component.scss'
})
export class CreateComponent implements OnInit {
  bookingDetailsForm: FormGroup;
  guestInfoForm: FormGroup;
  paymentForm: FormGroup;

  isAuthenticated = false;
  isBooking = false;
  bookingId: number | null = null;

  // Hotel and Room Info
  hotelId: number | null = null;
  roomId: number | null = null;
  hotelName = '';
  roomType = '';
  hotelImageUrl = '';
  pricePerNight = 0;

  // Booking Details
  checkInDate: Date | null = null;
  checkOutDate: Date | null = null;
  numberOfGuests = 1;
  numberOfNights = 0;
  totalPrice = 0;

  minDate = new Date();

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private bookingService: BookingService,
    private hotelService: HotelService,
    private snackBar: MatSnackBar
  ) {
    this.bookingDetailsForm = this.fb.group({
      checkInDate: [null, Validators.required],
      checkOutDate: [null, Validators.required],
      guests: [1, [Validators.required, Validators.min(1)]]
    });

    this.guestInfoForm = this.fb.group({
      guestName: ['', Validators.required],
      guestEmail: ['', [Validators.required, Validators.email]],
      guestPhone: ['', Validators.required],
      specialRequests: ['']
    });

    this.paymentForm = this.fb.group({
      paymentMethod: ['', Validators.required],
      acceptTerms: [false, Validators.requiredTrue]
    });
  }

  ngOnInit(): void {
    this.isAuthenticated = this.authService.isAuthenticated();

    // Get query params
    this.route.queryParams.subscribe(params => {
      this.hotelId = params['hotelId'] ? +params['hotelId'] : null;
      this.roomId = params['roomId'] ? +params['roomId'] : null;
      this.hotelName = params['hotelName'] || 'Hotel Name';
      this.roomType = params['roomType'] || 'Room Type';
      this.pricePerNight = params['pricePerNight'] ? +params['pricePerNight'] : 0;

      if (params['checkInDate']) {
        this.checkInDate = new Date(params['checkInDate']);
        this.bookingDetailsForm.patchValue({ checkInDate: this.checkInDate });
      }

      if (params['checkOutDate']) {
        this.checkOutDate = new Date(params['checkOutDate']);
        this.bookingDetailsForm.patchValue({ checkOutDate: this.checkOutDate });
      }

      if (params['guests']) {
        this.numberOfGuests = +params['guests'];
        this.bookingDetailsForm.patchValue({ guests: this.numberOfGuests });
      }

      this.calculateTotalPrice();
    });

    // Load hotel details if hotelId is available
    if (this.hotelId) {
      this.loadHotelDetails();
    }

    // Pre-fill user info if authenticated
    if (this.isAuthenticated) {
      const user = this.authService.getCurrentUser();
      if (user) {
        this.guestInfoForm.patchValue({
          guestName: `${user.firstName} ${user.lastName}`,
          guestEmail: user.email,
          guestPhone: user.phoneNumber || ''
        });
      }
    }

    // Watch for date changes
    this.bookingDetailsForm.get('checkInDate')?.valueChanges.subscribe((date) => {
      this.checkInDate = date;
      this.calculateTotalPrice();
    });

    this.bookingDetailsForm.get('checkOutDate')?.valueChanges.subscribe((date) => {
      this.checkOutDate = date;
      this.calculateTotalPrice();
    });

    this.bookingDetailsForm.get('guests')?.valueChanges.subscribe((guests) => {
      this.numberOfGuests = guests;
    });
  }

  loadHotelDetails(): void {
    if (this.hotelId) {
      this.hotelService.getHotelById(this.hotelId).subscribe({
        next: (hotel) => {
          this.hotelName = hotel.name;
          this.hotelImageUrl = hotel.imageUrl || 'https://via.placeholder.com/200x150?text=Hotel';
        },
        error: (error) => {
          console.error('Error loading hotel details:', error);
          this.hotelImageUrl = 'https://via.placeholder.com/200x150?text=Hotel';
        }
      });
    }
  }

  calculateTotalPrice(): void {
    if (this.checkInDate && this.checkOutDate) {
      const timeDiff = this.checkOutDate.getTime() - this.checkInDate.getTime();
      this.numberOfNights = Math.ceil(timeDiff / (1000 * 3600 * 24));
      this.totalPrice = this.numberOfNights * this.pricePerNight;
    } else {
      this.numberOfNights = 0;
      this.totalPrice = 0;
    }
  }

  selectPaymentMethod(method: string): void {
    this.paymentForm.patchValue({ paymentMethod: method });
  }

  confirmBooking(): void {
    if (this.bookingDetailsForm.valid && this.guestInfoForm.valid && this.paymentForm.valid) {
      this.isBooking = true;

      const bookingData = {
        roomId: this.roomId,
        hotelId: this.hotelId,
        checkInDate: this.bookingDetailsForm.value.checkInDate,
        checkOutDate: this.bookingDetailsForm.value.checkOutDate,
        guestName: this.guestInfoForm.value.guestName,
        guestEmail: this.guestInfoForm.value.guestEmail,
        guestPhone: this.guestInfoForm.value.guestPhone,
        specialRequests: this.guestInfoForm.value.specialRequests,
        totalPrice: this.totalPrice,
        paymentMethod: this.paymentForm.value.paymentMethod
      };

      this.bookingService.createBooking(bookingData).subscribe({
        next: (response) => {
          this.isBooking = false;
          this.bookingId = response.id;
          this.snackBar.open('Booking confirmed successfully!', 'Close', {
            duration: 3000,
            panelClass: ['success-snackbar']
          });
        },
        error: (error) => {
          this.isBooking = false;
          this.snackBar.open(
            error.error?.message || 'Booking failed. Please try again.',
            'Close',
            {
              duration: 5000,
              panelClass: ['error-snackbar']
            }
          );
        }
      });
    }
  }

  viewBookingDetails(): void {
    if (this.bookingId) {
      this.router.navigate(['/bookings', this.bookingId]);
    }
  }

  downloadConfirmation(): void {
    this.snackBar.open('Download feature coming soon!', 'Close', { duration: 2000 });
  }

  printConfirmation(): void {
    window.print();
  }

  navigateToLogin(): void {
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: this.router.url }
    });
  }

  navigateToRegister(): void {
    this.router.navigate(['/register'], {
      queryParams: { returnUrl: this.router.url }
    });
  }
}
