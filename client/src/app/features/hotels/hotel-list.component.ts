import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { HotelService } from '../../core/services/hotel.service';
import { Hotel } from '../../core/models/hotel.model';

@Component({
  selector: 'app-hotel-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  template: `
    <div class="hotel-list-container">
      <h1>Available Hotels</h1>

      @if (loading()) {
        <div class="loading">
          <mat-spinner></mat-spinner>
        </div>
      } @else if (errorMessage()) {
        <div class="error">{{ errorMessage() }}</div>
      } @else {
        <div class="hotels-grid">
          @for (hotel of hotels(); track hotel.Id) {
            <mat-card>
              @if (hotel.ImageUrl) {
                <img mat-card-image [src]="hotel.ImageUrl" [alt]="hotel.Name" />
              }
              <mat-card-header>
                <mat-card-title>{{ hotel.Name }}</mat-card-title>
                <mat-card-subtitle>
                  <mat-icon>location_on</mat-icon>
                  {{ hotel.City }}, {{ hotel.Country }}
                </mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <p>{{ hotel.Description }}</p>
                <div class="rating">
                  <mat-icon>star</mat-icon>
                  <span>{{ hotel.Rating }}/5</span>
                </div>
              </mat-card-content>
              <mat-card-actions>
                <button mat-raised-button color="primary" 
                        [routerLink]="['/hotels', hotel.Id]">
                  View Details
                </button>
              </mat-card-actions>
            </mat-card>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .hotel-list-container {
      padding: 24px;
    }

    h1 {
      margin-bottom: 24px;
    }

    .loading {
      display: flex;
      justify-content: center;
      padding: 48px;
    }

    .error {
      color: #f44336;
      padding: 16px;
      text-align: center;
    }

    .hotels-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 24px;
    }

    mat-card {
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    mat-card-content {
      flex: 1;
    }

    .rating {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 8px;
      color: #ffa726;
    }

    mat-card-subtitle {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  `]
})
export class HotelListComponent implements OnInit {
  private hotelService = inject(HotelService);

  hotels = signal<Hotel[]>([]);
  loading = signal(false);
  errorMessage = signal('');

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
