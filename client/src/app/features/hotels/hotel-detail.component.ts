import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { HotelService } from '../../core/services/hotel.service';
import { Hotel } from '../../core/models/hotel.model';
import { Room } from '../../core/models/room.model';

@Component({
  selector: 'app-hotel-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule
  ],
  template: `
    <div class="hotel-detail-page">
      @if (loading()) {
        <div class="loading-container">
          <div class="skeleton skeleton-hero"></div>
          <div class="container">
            <div class="skeleton skeleton-card"></div>
          </div>
        </div>
      } @else if (errorMessage()) {
        <div class="error-container">
          <mat-icon>error_outline</mat-icon>
          <h2>{{ errorMessage() }}</h2>
          <button mat-raised-button (click)="goBack()">Back to Hotels</button>
        </div>
      } @else if (hotel()) {
        <!-- Hotel Hero -->
        <div class="hotel-hero fade-in">
          @if (hotel()!.ImageUrl) {
            <img [src]="hotel()!.ImageUrl" [alt]="hotel()!.Name" class="hero-image">
          } @else {
            <div class="hero-placeholder">
              <mat-icon>hotel</mat-icon>
            </div>
          }
          <div class="hero-overlay"></div>
          
          <div class="hero-content">
            <button mat-icon-button class="back-btn" (click)="goBack()">
              <mat-icon>arrow_back</mat-icon>
            </button>
            
            <div class="hero-info">
              <h1 class="hotel-title">{{ hotel()!.Name }}</h1>
              <div class="hotel-meta">
                <div class="location">
                  <mat-icon>location_on</mat-icon>
                  <span>{{ hotel()!.Address }}, {{ hotel()!.City }}, {{ hotel()!.Country }}</span>
                </div>
                <div class="rating">
                  <mat-icon>star</mat-icon>
                  <span>{{ hotel()!.Rating }}/5</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Hotel Details -->
        <div class="container">
          <div class="hotel-details scale-in">
            <div class="details-card">
              <h2>About This Hotel</h2>
              <p class="description">{{ hotel()!.Description }}</p>
              
              <div class="amenities">
                <mat-chip-set>
                  <mat-chip>
                    <mat-icon>wifi</mat-icon>
                    Free WiFi
                  </mat-chip>
                  <mat-chip>
                    <mat-icon>pool</mat-icon>
                    Swimming Pool
                  </mat-chip>
                  <mat-chip>
                    <mat-icon>restaurant</mat-icon>
                    Restaurant
                  </mat-chip>
                  <mat-chip>
                    <mat-icon>fitness_center</mat-icon>
                    Gym
                  </mat-chip>
                  <mat-chip>
                    <mat-icon>local_parking</mat-icon>
                    Parking
                  </mat-chip>
                </mat-chip-set>
              </div>
            </div>
          </div>

          <!-- Available Rooms -->
          <div class="rooms-section">
            <h2>Available Rooms</h2>
            
            @if (loadingRooms()) {
              <div class="rooms-grid">
                @for (i of [1,2,3]; track i) {
                  <div class="skeleton skeleton-card"></div>
                }
              </div>
            } @else {
              <div class="rooms-grid">
                @for (room of rooms(); track room.Id) {
                  <div class="room-card fade-in">
                    <div class="room-image-wrapper">
                      @if (room.ImageUrl) {
                        <img [src]="room.ImageUrl" [alt]="room.Type" class="room-image">
                      } @else {
                        <div class="room-image-placeholder">
                          <mat-icon>bed</mat-icon>
                        </div>
                      }
                      <div class="availability-badge" [class.available]="room.IsAvailable">
                        {{ room.IsAvailable ? 'Available' : 'Booked' }}
                      </div>
                    </div>
                    
                    <div class="room-content">
                      <div class="room-header">
                        <div>
                          <h3 class="room-type">{{ room.Type }}</h3>
                          <p class="room-number">Room {{ room.RoomNumber }}</p>
                        </div>
                        <div class="room-price">
                          <span class="price-amount">\${{ room.PricePerNight }}</span>
                          <span class="price-period">/night</span>
                        </div>
                      </div>
                      
                      <p class="room-description">{{ room.Description }}</p>
                      
                      <div class="room-features">
                        <div class="feature">
                          <mat-icon>people</mat-icon>
                          <span>{{ room.Capacity }} Guests</span>
                        </div>
                        <div class="feature">
                          <mat-icon>king_bed</mat-icon>
                          <span>King Bed</span>
                        </div>
                        <div class="feature">
                          <mat-icon>square_foot</mat-icon>
                          <span>35 m²</span>
                        </div>
                      </div>
                      
                      <button mat-raised-button 
                              class="book-btn"
                              [disabled]="!room.IsAvailable">
                        <mat-icon>event_available</mat-icon>
                        {{ room.IsAvailable ? 'Book Now' : 'Not Available' }}
                      </button>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .hotel-detail-page {
      min-height: 100vh;
      background: #F9FAFB;
    }

    // Hero Section
    .hotel-hero {
      position: relative;
      height: 500px;
      overflow: hidden;
    }

    .hero-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .hero-placeholder {
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      
      mat-icon {
        font-size: 120px;
        width: 120px;
        height: 120px;
        color: white;
        opacity: 0.5;
      }
    }

    .hero-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%);
    }

    .hero-content {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 2rem;
      color: white;
    }

    .back-btn {
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      color: white;
      width: 48px;
      height: 48px;
      align-self: flex-start;
      transition: all 300ms ease;
      
      &:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: translateX(-4px);
      }
    }

    .hero-info {
      max-width: 1400px;
      margin: 0 auto;
      width: 100%;
    }

    .hotel-title {
      font-size: 3rem;
      font-weight: 700;
      color: white;
      margin-bottom: 1rem;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }

    .hotel-meta {
      display: flex;
      gap: 2rem;
      align-items: center;
    }

    .location {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 1.125rem;
      
      mat-icon {
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
    }

    .rating {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-size: 1.125rem;
      font-weight: 600;
      
      mat-icon {
        color: #FCD34D;
        font-size: 24px;
        width: 24px;
        height: 24px;
      }
    }

    // Details Section
    .container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 0 2rem;
    }

    .hotel-details {
      margin-top: -4rem;
      position: relative;
      z-index: 10;
      margin-bottom: 3rem;
    }

    .details-card {
      background: white;
      border-radius: 16px;
      padding: 2.5rem;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
      
      h2 {
        font-size: 1.875rem;
        font-weight: 700;
        color: #111827;
        margin-bottom: 1.5rem;
      }
      
      .description {
        font-size: 1.125rem;
        line-height: 1.8;
        color: #6B7280;
        margin-bottom: 2rem;
      }
    }

    .amenities {
      ::ng-deep .mat-mdc-chip-set {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
      }
      
      ::ng-deep .mat-mdc-chip {
        background: #EEF2FF !important;
        color: #6366F1 !important;
        border-radius: 8px !important;
        padding: 0.75rem 1rem !important;
        font-weight: 500 !important;
        
        mat-icon {
          margin-right: 0.5rem;
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }
    }

    // Rooms Section
    .rooms-section {
      padding-bottom: 4rem;
      
      h2 {
        font-size: 2rem;
        font-weight: 700;
        color: #111827;
        margin-bottom: 2rem;
      }
    }

    .rooms-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
      gap: 2rem;
    }

    .room-card {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      transition: all 300ms ease;
      
      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.15);
      }
    }

    .room-image-wrapper {
      position: relative;
      width: 100%;
      padding-top: 66.67%;
      overflow: hidden;
      background: #E5E7EB;
    }

    .room-image {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .room-image-placeholder {
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

    .availability-badge {
      position: absolute;
      top: 1rem;
      right: 1rem;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.875rem;
      background: #FEE2E2;
      color: #991B1B;
      
      &.available {
        background: #D1FAE5;
        color: #065F46;
      }
    }

    .room-content {
      padding: 1.5rem;
    }

    .room-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 1rem;
    }

    .room-type {
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
      margin: 0 0 0.25rem 0;
    }

    .room-number {
      font-size: 0.875rem;
      color: #6B7280;
      margin: 0;
    }

    .room-price {
      text-align: right;
      
      .price-amount {
        display: block;
        font-size: 1.5rem;
        font-weight: 700;
        color: #10B981;
      }
      
      .price-period {
        font-size: 0.875rem;
        color: #6B7280;
      }
    }

    .room-description {
      color: #6B7280;
      font-size: 0.875rem;
      line-height: 1.6;
      margin-bottom: 1rem;
    }

    .room-features {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
      padding: 1rem 0;
      border-top: 1px solid #E5E7EB;
      border-bottom: 1px solid #E5E7EB;
    }

    .feature {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #6B7280;
      font-size: 0.875rem;
      
      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: #6366F1;
      }
    }

    .book-btn {
      width: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      color: white !important;
      font-weight: 600 !important;
      border-radius: 12px !important;
      padding: 0.75rem 1.5rem !important;
      transition: all 300ms ease !important;
      
      &:not(:disabled):hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 15px -3px rgba(102, 126, 234, 0.4);
      }
      
      &:disabled {
        background: #E5E7EB !important;
        color: #9CA3AF !important;
      }
      
      mat-icon {
        margin-right: 0.5rem;
      }
    }

    // Loading & Error States
    .loading-container,
    .error-container {
      padding: 4rem 2rem;
      text-align: center;
    }

    .skeleton-hero {
      height: 500px;
      margin-bottom: 2rem;
    }

    .error-container {
      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        color: #EF4444;
        margin-bottom: 1rem;
      }
      
      h2 {
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
      .hotel-hero {
        height: 400px;
      }
      
      .hotel-title {
        font-size: 2rem;
      }
      
      .hotel-meta {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }
      
      .details-card {
        padding: 1.5rem;
      }
      
      .rooms-grid {
        grid-template-columns: 1fr;
      }
      
      .room-features {
        flex-direction: column;
        gap: 0.75rem;
      }
    }
  `]
})
export class HotelDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private hotelService = inject(HotelService);

  hotel = signal<Hotel | null>(null);
  rooms = signal<Room[]>([]);
  loading = signal(false);
  loadingRooms = signal(false);
  errorMessage = signal('');

  ngOnInit(): void {
    const hotelId = this.route.snapshot.paramMap.get('id');
    if (hotelId) {
      this.loadHotel(hotelId);
      this.loadRooms(hotelId);
    }
  }

  loadHotel(id: string): void {
    this.loading.set(true);
    this.hotelService.getHotel(id).subscribe({
      next: (hotel) => {
        this.hotel.set(hotel);
        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error.message || 'Failed to load hotel');
        this.loading.set(false);
      }
    });
  }

  loadRooms(hotelId: string): void {
    this.loadingRooms.set(true);
    this.hotelService.getHotelRooms(hotelId).subscribe({
      next: (rooms) => {
        this.rooms.set(rooms);
        this.loadingRooms.set(false);
      },
      error: (error) => {
        console.error('Failed to load rooms:', error);
        this.loadingRooms.set(false);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/hotels']);
  }
}
