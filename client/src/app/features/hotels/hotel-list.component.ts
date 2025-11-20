import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { HotelService } from '../../core/services/hotel.service';
import { Hotel } from '../../core/models/hotel.model';

@Component({
  selector: 'app-hotel-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  template: `
    <div class="hotel-list-page">
      <!-- Hero Section -->
      <section class="hero">
        <div class="hero-content fade-in">
          <h1 class="hero-title">Discover Your Perfect Stay</h1>
          <p class="hero-subtitle">Luxury hotels at unbeatable prices</p>
          
          <!-- Search Form -->
          <div class="search-card scale-in">
            <div class="search-form">
              <mat-form-field appearance="outline" class="search-field">
                <mat-icon matPrefix>search</mat-icon>
                <mat-label>Search destination</mat-label>
                <input matInput [(ngModel)]="searchQuery" placeholder="Where do you want to go?">
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="search-field">
                <mat-icon matPrefix>location_city</mat-icon>
                <mat-label>City</mat-label>
                <mat-select [(ngModel)]="selectedCity">
                  <mat-option value="">All Cities</mat-option>
                  <mat-option value="New York">New York</mat-option>
                  <mat-option value="Paris">Paris</mat-option>
                  <mat-option value="Tokyo">Tokyo</mat-option>
                  <mat-option value="London">London</mat-option>
                </mat-select>
              </mat-form-field>
              
              <button mat-raised-button class="search-btn">
                <mat-icon>search</mat-icon>
                Search
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Hotels Section -->
      <section class="hotels-section">
        <div class="container">
          @if (loading()) {
            <div class="hotels-grid">
              @for (i of [1,2,3,4,5,6]; track i) {
                <div class="skeleton skeleton-card"></div>
              }
            </div>
          } @else if (errorMessage()) {
            <div class="error-state">
              <mat-icon>error_outline</mat-icon>
              <h3>{{ errorMessage() }}</h3>
              <button mat-raised-button (click)="loadHotels()">Try Again</button>
            </div>
          } @else {
            <div class="hotels-grid">
              @for (hotel of hotels(); track hotel.Id) {
                <div class="hotel-card fade-in" [routerLink]="['/hotels', hotel.Id]">
                  <div class="hotel-image-wrapper">
                    @if (hotel.ImageUrl) {
                      <img [src]="hotel.ImageUrl" [alt]="hotel.Name" class="hotel-image">
                    } @else {
                      <div class="hotel-image-placeholder">
                        <mat-icon>hotel</mat-icon>
                      </div>
                    }
                    <div class="image-overlay"></div>
                    <div class="price-badge">
                      <span class="price-amount">$299</span>
                      <span class="price-period">/night</span>
                    </div>
                  </div>
                  
                  <div class="hotel-content">
                    <div class="hotel-header">
                      <h3 class="hotel-name">{{ hotel.Name }}</h3>
                      <div class="hotel-rating">
                        <mat-icon>star</mat-icon>
                        <span>{{ hotel.Rating }}</span>
                      </div>
                    </div>
                    
                    <div class="hotel-location">
                      <mat-icon>location_on</mat-icon>
                      <span>{{ hotel.City }}, {{ hotel.Country }}</span>
                    </div>
                    
                    <p class="hotel-description">{{ hotel.Description }}</p>
                    
                    <button mat-raised-button class="view-details-btn">
                      View Details
                      <mat-icon>arrow_forward</mat-icon>
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </section>
    </div>
  `,
  styles: [`
    .hotel-list-page {
      min-height: 100vh;
    }

    // Hero Section
    .hero {
      position: relative;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 6rem 2rem 8rem;
      overflow: hidden;
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image: 
          radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
        pointer-events: none;
      }
    }

    .hero-content {
      max-width: 1200px;
      margin: 0 auto;
      position: relative;
      z-index: 1;
    }

    .hero-title {
      font-size: 3rem;
      font-weight: 700;
      color: white;
      text-align: center;
      margin-bottom: 1rem;
    }

    .hero-subtitle {
      font-size: 1.25rem;
      color: rgba(255, 255, 255, 0.9);
      text-align: center;
      margin-bottom: 3rem;
    }

    // Search Card
    .search-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 2rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      max-width: 900px;
      margin: 0 auto;
    }

    .search-form {
      display: grid;
      grid-template-columns: 1fr 1fr auto;
      gap: 1rem;
      align-items: start;
    }

    .search-field {
      width: 100%;
      
      ::ng-deep .mat-mdc-text-field-wrapper {
        background: white;
      }
      
      ::ng-deep .mat-mdc-form-field-focus-overlay {
        background: transparent;
      }
    }

    .search-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      color: white !important;
      height: 56px;
      padding: 0 2rem !important;
      font-weight: 600 !important;
      border-radius: 12px !important;
      transition: all 300ms ease !important;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 15px -3px rgba(102, 126, 234, 0.4);
      }
      
      mat-icon {
        margin-right: 0.5rem;
      }
    }

    // Hotels Section
    .hotels-section {
      padding: 4rem 0;
      background: #F9FAFB;
    }

    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 2rem;
    }

    .hotels-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 2rem;
    }

    // Hotel Card
    .hotel-card {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      cursor: pointer;
      transition: all 300ms ease;
      
      &:hover {
        transform: scale(1.02);
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15);
        
        .hotel-image {
          transform: scale(1.1);
        }
        
        .view-details-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
      }
    }

    .hotel-image-wrapper {
      position: relative;
      width: 100%;
      padding-top: 56.25%; // 16:9 aspect ratio
      overflow: hidden;
      background: #E5E7EB;
    }

    .hotel-image {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 300ms ease;
    }

    .hotel-image-placeholder {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      
      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: white;
        opacity: 0.5;
      }
    }

    .image-overlay {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 50%;
      background: linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.4) 100%);
      pointer-events: none;
    }

    .price-badge {
      position: absolute;
      top: 1rem;
      right: 1rem;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      padding: 0.5rem 1rem;
      border-radius: 8px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      
      .price-amount {
        font-size: 1.25rem;
        font-weight: 700;
        color: #6366F1;
      }
      
      .price-period {
        font-size: 0.875rem;
        color: #6B7280;
      }
    }

    .hotel-content {
      padding: 1.5rem;
    }

    .hotel-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 0.75rem;
    }

    .hotel-name {
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }

    .hotel-rating {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      background: #FEF3C7;
      padding: 0.25rem 0.75rem;
      border-radius: 8px;
      
      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: #F59E0B;
      }
      
      span {
        font-weight: 600;
        color: #92400E;
      }
    }

    .hotel-location {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #6B7280;
      margin-bottom: 1rem;
      
      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .hotel-description {
      color: #6B7280;
      font-size: 0.875rem;
      line-height: 1.6;
      margin-bottom: 1.5rem;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .view-details-btn {
      width: 100%;
      background: white !important;
      color: #6366F1 !important;
      border: 2px solid #6366F1 !important;
      font-weight: 600 !important;
      border-radius: 12px !important;
      padding: 0.75rem 1.5rem !important;
      transition: all 300ms ease !important;
      
      mat-icon {
        margin-left: 0.5rem;
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    // Error State
    .error-state {
      text-align: center;
      padding: 4rem 2rem;
      
      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: #EF4444;
        margin-bottom: 1rem;
      }
      
      h3 {
        color: #374151;
        margin-bottom: 1.5rem;
      }
      
      button {
        background: #6366F1 !important;
        color: white !important;
      }
    }

    // Responsive
    @media (max-width: 768px) {
      .hero {
        padding: 4rem 1rem 6rem;
      }
      
      .hero-title {
        font-size: 2rem;
      }
      
      .hero-subtitle {
        font-size: 1rem;
      }
      
      .search-form {
        grid-template-columns: 1fr;
      }
      
      .search-btn {
        width: 100%;
      }
      
      .hotels-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class HotelListComponent implements OnInit {
  private hotelService = inject(HotelService);

  hotels = signal<Hotel[]>([]);
  loading = signal(false);
  errorMessage = signal('');
  searchQuery = '';
  selectedCity = '';

  ngOnInit(): void {
    this.loadHotels();
  }

  loadHotels(): void {
    this.loading.set(true);
    this.hotelService.getHotels().subscribe({
      next: (hotels) => {
        this.hotels.set(hotels);
        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error.message || 'Failed to load hotels');
        this.loading.set(false);
      }
    });
  }
}
