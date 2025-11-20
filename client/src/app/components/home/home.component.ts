import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { HotelService } from '../../services/hotel.service';
import { AuthService } from '../../services/auth.service';
import { Hotel } from '../../models/hotel.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  private hotelService = inject(HotelService);
  private authService = inject(AuthService);
  private router = inject(Router);

  featuredHotels: Hotel[] = [];
  searchQuery: string = '';
  isLoading: boolean = true;
  isAuthenticated: boolean = false;
  
  // PERFORMANCE: Debounce search input
  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;

  ngOnInit(): void {
    this.isAuthenticated = this.authService.isAuthenticated;
    this.loadFeaturedHotels();
    
    // PERFORMANCE: Setup debounced search (300ms delay)
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(query => {
      // Auto-search could be implemented here if needed
      // For now, we keep manual search on submit
    });
  }
  
  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
  }

  loadFeaturedHotels(): void {
    this.isLoading = true;
    // PERFORMANCE: Using cached hotel service call
    this.hotelService.getHotels().subscribe({
      next: (hotels) => {
        this.featuredHotels = hotels.slice(0, 6);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading featured hotels:', error);
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    const trimmedQuery = this.searchQuery.trim();
    if (trimmedQuery) {
      this.router.navigate(['/hotels'], { 
        queryParams: { search: trimmedQuery } 
      });
    } else {
      this.router.navigate(['/hotels']);
    }
  }

  viewHotel(hotelId: string): void {
    this.router.navigate(['/hotel-details'], { 
      queryParams: { id: hotelId } 
    });
  }

  navigateToHotels(): void {
    this.router.navigate(['/hotels']);
  }

  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }
}
