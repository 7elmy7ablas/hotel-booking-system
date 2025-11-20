import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatGridListModule } from '@angular/material/grid-list';
import { HotelService } from '../../../services/hotel.service';
import { SelectedHotelService } from '../../../services/selected-hotel.service';
import { Hotel } from '../../../models/hotel.model';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatGridListModule
  ],
  templateUrl: './search.component.html',
  styleUrl: './search.component.scss'
})
export class SearchComponent implements OnInit {
  searchForm: FormGroup;
  hotels: Hotel[] = [];
  isLoading = false;
  hasSearched = false;
  minDate = new Date();
  
  // Default hotel image for fallback
  defaultHotelImage = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=250&fit=crop&q=80';

  constructor(
    private fb: FormBuilder,
    private hotelService: HotelService,
    private selectedHotelService: SelectedHotelService,
    private router: Router
  ) {
    this.searchForm = this.fb.group({
      city: [''],
      checkInDate: [null],
      checkOutDate: [null],
      guests: [1]
    });
  }

  ngOnInit(): void {
    this.loadAllHotels();
  }

  loadAllHotels(): void {
    this.isLoading = true;
    console.log('📡 Loading all hotels...');
    
    this.hotelService.getHotels().subscribe({
      next: (response) => {
        console.log('✅ Hotels loaded:', response);
        console.log('📦 Response type:', typeof response);
        console.log('📦 Is array:', Array.isArray(response));
        
        // Ensure response is an array
        if (!response) {
          console.error('❌ Response is null or undefined');
          this.hotels = [];
        } else if (!Array.isArray(response)) {
          console.error('❌ Response is not an array:', response);
          this.hotels = [];
        } else {
          console.log('📊 Number of hotels:', response.length);
          
          // Validate hotel data
          if (response.length > 0) {
            const hotelsWithoutId = response.filter(h => !h.id);
            if (hotelsWithoutId.length > 0) {
              console.warn('⚠️ Found hotels without ID:', hotelsWithoutId);
            }
            
            // Log first hotel for debugging
            console.log('🏨 First hotel sample:', response[0]);
          }
          
          this.hotels = response;
        }
        
        this.isLoading = false;
        this.hasSearched = true;
      },
      error: (error) => {
        console.error('❌ Error loading hotels:', error);
        this.hotels = [];
        this.isLoading = false;
        this.hasSearched = true;
      }
    });
  }

  onSearch(): void {
    this.isLoading = true;
    this.hasSearched = true;

    const searchCriteria = {
      city: this.searchForm.value.city,
      checkInDate: this.searchForm.value.checkInDate,
      checkOutDate: this.searchForm.value.checkOutDate,
      guests: this.searchForm.value.guests
    };

    this.hotelService.searchHotels(searchCriteria).subscribe({
      next: (response) => {
        // Ensure response is an array
        this.hotels = Array.isArray(response) ? response : [];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error searching hotels:', error);
        this.hotels = [];
        this.isLoading = false;
        // Fallback to all hotels on error
        this.loadAllHotels();
      }
    });
  }

  onClearSearch(): void {
    this.searchForm.reset({
      city: '',
      checkInDate: null,
      checkOutDate: null,
      guests: 1
    });
    this.loadAllHotels();
  }

  /**
   * Navigate to hotel details page with validation
   * Stores hotel in service and navigates to /hotel-details (no ID in URL)
   */
  viewHotelDetails(hotel: Hotel): void {
    console.log('🏨 Attempting to view hotel details:', hotel);
    
    if (!hotel) {
      console.error('❌ Hotel object is null or undefined');
      alert('Cannot open hotel details. Hotel data is missing!');
      return;
    }
    
    if (!hotel.id) {
      console.error('❌ Hotel ID is missing:', hotel);
      alert('Cannot open hotel details. Hotel ID is missing!');
      return;
    }
    
    // Store hotel in service (also saves to sessionStorage)
    this.selectedHotelService.setSelectedHotel(hotel);
    
    // Navigate to hotel details without ID in URL
    console.log('✅ Navigating to /hotel-details');
    this.router.navigate(['/hotel-details']);
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

  /**
   * Handle image load error by setting default placeholder
   */
  onImageError(event: any): void {
    console.warn('Hotel image failed to load, using default placeholder');
    event.target.src = this.defaultHotelImage;
  }
}
