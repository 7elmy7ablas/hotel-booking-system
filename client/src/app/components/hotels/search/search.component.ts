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

  constructor(
    private fb: FormBuilder,
    private hotelService: HotelService,
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
    this.hotelService.getHotels().subscribe({
      next: (response) => {
        this.hotels = response;
        this.isLoading = false;
        this.hasSearched = true;
      },
      error: (error) => {
        console.error('Error loading hotels:', error);
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
        this.hotels = response;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error searching hotels:', error);
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

  viewHotelDetails(hotelId: number): void {
    this.router.navigate(['/hotels', hotelId]);
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
}
