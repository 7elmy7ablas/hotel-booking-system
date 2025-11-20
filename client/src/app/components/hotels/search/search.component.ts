import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { HotelService } from '../../../services/hotel.service';
import { SelectedHotelService } from '../../../services/selected-hotel.service';
import { AuthService } from '../../../services/auth.service';
import { Hotel } from '../../../models/hotel.model';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit {
  private fb = inject(FormBuilder);
  private hotelService = inject(HotelService);
  private selectedHotelService = inject(SelectedHotelService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  searchForm: FormGroup;
  hotels: Hotel[] = [];
  filteredHotels: Hotel[] = [];
  isLoading = false;
  isAuthenticated = false;
  minDate = new Date();
  
  defaultHotelImage = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800';

  constructor() {
    this.searchForm = this.fb.group({
      search: [''],
      city: [''],
      checkInDate: [null],
      checkOutDate: [null],
      guests: [1],
      minPrice: [null],
      maxPrice: [null]
    });
  }

  ngOnInit(): void {
    this.isAuthenticated = this.authService.isAuthenticated;
    
    this.route.queryParams.subscribe(params => {
      if (params['search']) {
        this.searchForm.patchValue({ search: params['search'] });
      }
    });

    this.loadAllHotels();

    // PERFORMANCE: Debounce search input to reduce filtering operations
    this.searchForm.valueChanges.pipe(
      debounceTime(300), // Wait 300ms after user stops typing
      distinctUntilChanged() // Only emit when value actually changes
    ).subscribe(() => {
      this.applyFilters();
    });
  }

  loadAllHotels(): void {
    this.isLoading = true;
    
    this.hotelService.getHotels().subscribe({
      next: (response) => {
        this.hotels = Array.isArray(response) ? response : [];
        this.filteredHotels = this.hotels;
        this.isLoading = false;
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error loading hotels:', error);
        this.hotels = [];
        this.filteredHotels = [];
        this.isLoading = false;
      }
    });
  }

  applyFilters(): void {
    const formValue = this.searchForm.value;
    
    this.filteredHotels = this.hotels.filter(hotel => {
      const searchMatch = !formValue.search || 
        hotel.name.toLowerCase().includes(formValue.search.toLowerCase()) ||
        hotel.city.toLowerCase().includes(formValue.search.toLowerCase()) ||
        hotel.address.toLowerCase().includes(formValue.search.toLowerCase());

      const cityMatch = !formValue.city || 
        hotel.city.toLowerCase().includes(formValue.city.toLowerCase());

      return searchMatch && cityMatch;
    });
  }

  onClearFilters(): void {
    this.searchForm.reset({
      search: '',
      city: '',
      checkInDate: null,
      checkOutDate: null,
      guests: 1,
      minPrice: null,
      maxPrice: null
    });
    this.filteredHotels = this.hotels;
  }

  viewHotelDetails(hotel: Hotel): void {
    if (!hotel || !hotel.id) {
      console.error('Invalid hotel data');
      return;
    }
    
    this.selectedHotelService.setSelectedHotel(hotel);
    this.router.navigate(['/hotel-details']);
  }

  bookHotel(hotel: Hotel, event: Event): void {
    event.stopPropagation();
    
    if (!this.isAuthenticated) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: '/hotel-details' }
      });
      return;
    }

    this.selectedHotelService.setSelectedHotel(hotel);
    this.router.navigate(['/hotel-details']);
  }

  onImageError(event: any): void {
    event.target.src = this.defaultHotelImage;
  }
}
