import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HotelService } from '../../../services/hotel.service';
import { SelectedHotelService } from '../../../services/selected-hotel.service';
import { BookingService } from '../../../services/booking.service';
import { AuthService } from '../../../services/auth.service';
import { Hotel, Room } from '../../../models/hotel.model';

@Component({
  selector: 'app-details',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss']
})
export class DetailsComponent implements OnInit {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private hotelService = inject(HotelService);
  private selectedHotelService = inject(SelectedHotelService);
  private bookingService = inject(BookingService);
  private authService = inject(AuthService);

  hotel: Hotel | null = null;
  rooms: Room[] = [];
  bookingForm: FormGroup;
  isLoading = true;
  isBooking = false;
  isAuthenticated = false;
  selectedImageIndex = 0;
  selectedRoom: Room | null = null;
  totalPrice = 0;
  numberOfNights = 0;
  minDate = new Date();
  showBookingForm = false;
  bookingMessage = '';
  bookingError = '';

  hotelImages: string[] = [];
  defaultHotelImage = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200';

  constructor() {
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
    this.isAuthenticated = this.authService.isAuthenticated;

    const selectedHotel = this.selectedHotelService.getSelectedHotel();
    
    if (!selectedHotel) {
      this.router.navigate(['/hotels']);
      return;
    }
    
    this.hotel = selectedHotel;
    this.hotelImages = this.generateHotelImages(selectedHotel);
    this.isLoading = false;
    
    this.loadRooms(selectedHotel.id);

    this.bookingForm.get('checkInDate')?.valueChanges.subscribe(() => {
      this.calculateTotalPrice();
    });

    this.bookingForm.get('checkOutDate')?.valueChanges.subscribe(() => {
      this.calculateTotalPrice();
    });

    this.bookingForm.get('roomId')?.valueChanges.subscribe((roomId) => {
      this.selectedRoom = this.rooms.find(r => r.id === roomId) || null;
      this.calculateTotalPrice();
    });
  }



  loadRooms(hotelId: string): void {
    this.hotelService.getRoomsByHotelId(hotelId).subscribe({
      next: (rooms) => {
        this.rooms = rooms;
      },
      error: (error) => {
        console.error('Error loading rooms:', error);
      }
    });
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

  selectImage(index: number): void {
    this.selectedImageIndex = index;
  }

  toggleBookingForm(): void {
    if (!this.isAuthenticated) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/hotel-details' }
      });
      return;
    }
    this.showBookingForm = !this.showBookingForm;
  }

  submitBooking(): void {
    if (this.bookingForm.invalid) {
      this.bookingError = 'Please fill in all required fields';
      return;
    }
    
    this.isBooking = true;
    this.bookingError = '';

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
        this.bookingMessage = 'Booking successful!';
        setTimeout(() => {
          this.router.navigate(['/my-bookings']);
        }, 2000);
      },
      error: (error) => {
        this.isBooking = false;
        this.bookingError = error.error?.message || 'Booking failed. Please try again.';
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/hotels']);
  }

  onImageError(event: any): void {
    event.target.src = this.defaultHotelImage;
  }
}
