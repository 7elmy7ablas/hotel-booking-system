import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HotelService } from '../../../services/hotel.service';
import { SelectedHotelService } from '../../../services/selected-hotel.service';
import { BookingService } from '../../../services/booking.service';
import { Hotel, Room } from '../../../models/hotel.model';

@Component({
  selector: 'app-details',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './details.component.html',
  styleUrl: './details.component.scss'
})
export class DetailsComponent implements OnInit {
  hotel: Hotel | null = null;
  rooms: Room[] = [];
  availableRooms: Room[] = [];
  bookingForm: FormGroup;
  isLoading = true;
  isBooking = false;
  errorMessage = '';
  selectedRoom: Room | null = null;
  totalPrice = 0;
  numberOfNights = 0;
  minDate = new Date();

  hotelImages: string[] = [];
  
  // Default hotel image for fallback
  defaultHotelImage = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&h=500&fit=crop&q=80';

  amenityIcons: { [key: string]: string } = {
    'WiFi': 'wifi',
    'Pool': 'pool',
    'Parking': 'local_parking',
    'Restaurant': 'restaurant',
    'Gym': 'fitness_center',
    'Spa': 'spa',
    'Bar': 'local_bar',
    'Room Service': 'room_service',
    'Air Conditioning': 'ac_unit',
    'Pet Friendly': 'pets',
    'Breakfast': 'free_breakfast',
    'Laundry': 'local_laundry_service'
  };

  constructor(
    private router: Router,
    private fb: FormBuilder,
    private hotelService: HotelService,
    private selectedHotelService: SelectedHotelService,
    private bookingService: BookingService,
    private snackBar: MatSnackBar
  ) {
    this.bookingForm = this.fb.group({
      checkInDate: [null, Validators.required],
      checkOutDate: [null, Validators.required],
      guests: [1, [Validators.required, Validators.min(1)]],
      roomId: [null, Validators.required],
      guestName: ['', Validators.required],
      guestEmail: ['', [Validators.required, Validators.email]],
      guestPhone: ['', Validators.required],
      specialRequests: ['']
    });
  }

  ngOnInit(): void {
    // Get hotel from service (loaded from sessionStorage if page refreshed)
    const selectedHotel = this.selectedHotelService.getSelectedHotel();
    
    if (!selectedHotel) {
      console.error('❌ No hotel selected, redirecting to /hotels');
      this.router.navigate(['/hotels']);
      return;
    }
    
    console.log('✅ Loading hotel from service:', selectedHotel.name);
    this.hotel = selectedHotel;
    this.hotelImages = this.generateHotelImages(selectedHotel);
    this.isLoading = false;
    
    // Load rooms for this hotel
    this.loadRooms(selectedHotel.id);

    // Watch for date changes to calculate price
    this.bookingForm.get('checkInDate')?.valueChanges.subscribe(() => {
      this.calculateTotalPrice();
      this.loadAvailableRooms();
    });

    this.bookingForm.get('checkOutDate')?.valueChanges.subscribe(() => {
      this.calculateTotalPrice();
      this.loadAvailableRooms();
    });

    this.bookingForm.get('roomId')?.valueChanges.subscribe((roomId) => {
      this.selectedRoom = this.availableRooms.find(r => r.id === roomId) || null;
      this.calculateTotalPrice();
    });
  }



  loadRooms(hotelId: number): void {
    this.hotelService.getRoomsByHotelId(hotelId).subscribe({
      next: (rooms) => {
        this.rooms = rooms;
        this.availableRooms = rooms;
      },
      error: (error) => {
        console.error('Error loading rooms:', error);
      }
    });
  }

  loadAvailableRooms(): void {
    const checkIn = this.bookingForm.get('checkInDate')?.value;
    const checkOut = this.bookingForm.get('checkOutDate')?.value;

    if (checkIn && checkOut && this.hotel) {
      this.hotelService.getAvailableRooms(this.hotel.id, checkIn, checkOut).subscribe({
        next: (rooms) => {
          this.availableRooms = rooms;
        },
        error: (error) => {
          console.error('Error loading available rooms:', error);
          this.availableRooms = this.rooms;
        }
      });
    }
  }

  generateHotelImages(hotel: Hotel): string[] {
    const images = [];
    if (hotel.imageUrl) {
      images.push(hotel.imageUrl);
    } else {
      // Use default image if no imageUrl provided
      images.push(this.defaultHotelImage);
    }
    
    // Add a few more placeholder images for the gallery
    const placeholderImages = [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&h=500&fit=crop&q=80',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&h=500&fit=crop&q=80',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&h=500&fit=crop&q=80',
      'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&h=500&fit=crop&q=80'
    ];
    
    images.push(...placeholderImages);
    return images;
  }

  calculateTotalPrice(): void {
    const checkIn = this.bookingForm.get('checkInDate')?.value;
    const checkOut = this.bookingForm.get('checkOutDate')?.value;

    if (checkIn && checkOut && this.selectedRoom) {
      const timeDiff = checkOut.getTime() - checkIn.getTime();
      this.numberOfNights = Math.ceil(timeDiff / (1000 * 3600 * 24));
      this.totalPrice = this.numberOfNights * this.selectedRoom.pricePerNight;
    } else {
      this.numberOfNights = 0;
      this.totalPrice = 0;
    }
  }

  getRatingStars(rating: number): string[] {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars: string[] = [];

    for (let i = 0; i < fullStars; i++) {
      stars.push('star');
    }
    if (hasHalfStar) {
      stars.push('star_half');
    }
    while (stars.length < 5) {
      stars.push('star_border');
    }

    return stars;
  }

  getAmenityIcon(amenity: string): string {
    return this.amenityIcons[amenity] || 'check_circle';
  }

  onBookNow(): void {
    if (this.bookingForm.invalid) {
      this.snackBar.open('Please fill in all required fields', 'Close', {
        duration: 3000
      });
      return;
    }
    
    this.isBooking = true;

    const bookingData: any = {
      roomId: this.bookingForm.value.roomId,
      checkInDate: this.bookingForm.value.checkInDate,
      checkOutDate: this.bookingForm.value.checkOutDate,
      guestName: this.bookingForm.value.guestName,
      guestEmail: this.bookingForm.value.guestEmail,
      guestPhone: this.bookingForm.value.guestPhone,
      specialRequests: this.bookingForm.value.specialRequests
    };

    this.bookingService.createBooking(bookingData).subscribe({
      next: (booking) => {
        this.isBooking = false;
        this.snackBar.open('Booking successful!', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.router.navigate(['/bookings']);
      },
      error: (error) => {
        this.isBooking = false;
        console.error('Booking error:', error);
        this.snackBar.open(
          error.error?.message || error.message || 'Booking failed. Please try again.',
          'Close',
          {
            duration: 5000,
            panelClass: ['error-snackbar']
          }
        );
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/hotels']);
  }

  /**
   * Handle image load error by setting default placeholder
   */
  onImageError(event: any): void {
    console.warn('Hotel image failed to load, using default placeholder');
    event.target.src = this.defaultHotelImage;
  }
}
