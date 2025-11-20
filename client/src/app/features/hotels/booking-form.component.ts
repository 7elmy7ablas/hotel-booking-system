import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { BookingService } from '../../services/booking.service';
import { SelectedHotelService } from '../../services/selected-hotel.service';
import { Room } from '../../models/hotel.model';

@Component({
  selector: 'app-booking-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule
  ],
  template: `
    <div class="booking-form-container">
      <h2>Book Your Room</h2>
      <form [formGroup]="bookingForm" (ngSubmit)="onSubmit()">
        <mat-form-field appearance="outline">
          <mat-label>Check-in Date</mat-label>
          <input matInput [matDatepicker]="checkInPicker" formControlName="checkInDate" [min]="minDate">
          <mat-datepicker-toggle matSuffix [for]="checkInPicker"></mat-datepicker-toggle>
          <mat-datepicker #checkInPicker></mat-datepicker>
          @if (bookingForm.get('checkInDate')?.hasError('required') && bookingForm.get('checkInDate')?.touched) {
            <mat-error>Check-in date is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Check-out Date</mat-label>
          <input matInput [matDatepicker]="checkOutPicker" formControlName="checkOutDate" [min]="minCheckOutDate()">
          <mat-datepicker-toggle matSuffix [for]="checkOutPicker"></mat-datepicker-toggle>
          <mat-datepicker #checkOutPicker></mat-datepicker>
          @if (bookingForm.get('checkOutDate')?.hasError('required') && bookingForm.get('checkOutDate')?.touched) {
            <mat-error>Check-out date is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Room Type</mat-label>
          <mat-select formControlName="roomType">
            @for (room of rooms(); track room.id) {
              <mat-option [value]="room.id">
                {{ room.type }} - ${{ room.pricePerNight }}/night (Capacity: {{ room.capacity }})
              </mat-option>
            }
          </mat-select>
          @if (bookingForm.get('roomType')?.hasError('required') && bookingForm.get('roomType')?.touched) {
            <mat-error>Room type is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Number of Guests</mat-label>
          <input matInput type="number" formControlName="numberOfGuests" min="1">
          @if (bookingForm.get('numberOfGuests')?.hasError('required') && bookingForm.get('numberOfGuests')?.touched) {
            <mat-error>Number of guests is required</mat-error>
          }
          @if (bookingForm.get('numberOfGuests')?.hasError('min')) {
            <mat-error>At least 1 guest is required</mat-error>
          }
        </mat-form-field>

        <button mat-raised-button color="primary" type="submit" [disabled]="bookingForm.invalid || submitting()">
          {{ submitting() ? 'Booking...' : 'Book Now' }}
        </button>
      </form>
    </div>
  `,
  styles: [`
    .booking-form-container {
      padding: 24px;
      max-width: 600px;
      margin: 0 auto;
    }

    h2 {
      margin-bottom: 24px;
      color: #333;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    mat-form-field {
      width: 100%;
    }

    button {
      margin-top: 16px;
    }
  `]
})
export class BookingFormComponent {
  private fb = inject(FormBuilder);
  private bookingService = inject(BookingService);
  private selectedHotelService = inject(SelectedHotelService);
  private snackBar = inject(MatSnackBar);

  rooms = signal<Room[]>([]);
  submitting = signal(false);
  minDate = new Date();

  bookingForm: FormGroup;

  constructor() {
    this.bookingForm = this.fb.group({
      checkInDate: ['', Validators.required],
      checkOutDate: ['', Validators.required],
      roomType: ['', Validators.required],
      numberOfGuests: [1, [Validators.required, Validators.min(1)]]
    });

    this.loadHotelRooms();
  }

  minCheckOutDate(): Date {
    const checkInDate = this.bookingForm.get('checkInDate')?.value;
    if (checkInDate) {
      const minDate = new Date(checkInDate);
      minDate.setDate(minDate.getDate() + 1);
      return minDate;
    }
    return this.minDate;
  }

  loadHotelRooms(): void {
    const hotel = this.selectedHotelService.getSelectedHotel();
    if (hotel && (hotel as any).rooms) {
      this.rooms.set((hotel as any).rooms);
    }
  }

  onSubmit(): void {
    if (this.bookingForm.invalid) {
      return;
    }

    const hotel = this.selectedHotelService.getSelectedHotel();
    if (!hotel) {
      this.snackBar.open('No hotel selected', 'Close', { duration: 3000 });
      return;
    }

    const userId = localStorage.getItem('userId');
    if (!userId) {
      this.snackBar.open('Please log in to book', 'Close', { duration: 3000 });
      return;
    }

    this.submitting.set(true);

    const formValue = this.bookingForm.value;
    const bookingData = {
      roomId: formValue.roomType,
      checkInDate: formValue.checkInDate,
      checkOutDate: formValue.checkOutDate,
      guestName: '',
      guestEmail: '',
      guestPhone: ''
    };

    this.bookingService.createBooking(bookingData).subscribe({
      next: (booking) => {
        this.submitting.set(false);
        this.snackBar.open('Booking created successfully!', 'Close', { duration: 5000 });
        this.bookingForm.reset();
      },
      error: (error) => {
        this.submitting.set(false);
        this.snackBar.open(error.message || 'Failed to create booking', 'Close', { duration: 5000 });
      }
    });
  }
}
