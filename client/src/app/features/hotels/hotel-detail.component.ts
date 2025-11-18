import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
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
    MatProgressSpinnerModule,
    MatIconModule
  ],
  template: `
    <div class="hotel-detail-container">
      @if (loading()) {
        <div class="loading">
          <mat-spinner></mat-spinner>
        </div>
      } @else if (errorMessage()) {
        <div class="error">{{ errorMessage() }}</div>
      } @else if (hotel()) {
        <mat-card class="hotel-card">
          @if (hotel()!.ImageUrl) {
            <img mat-card-image [src]="hotel()!.ImageUrl" [alt]="hotel()!.Name" />
          }
          <mat-card-header>
            <mat-card-title>{{ hotel()!.Name }}</mat-card-title>
            <mat-card-subtitle>
              <mat-icon>location_on</mat-icon>
              {{ hotel()!.Address }}, {{ hotel()!.City }}, {{ hotel()!.Country }}
            </mat-card-subtitle>
          </mat-card-header>
          <mat-card-content>
            <p>{{ hotel()!.Description }}</p>
            <div class="rating">
              <mat-icon>star</mat-icon>
              <span>{{ hotel()!.Rating }}/5</span>
            </div>
          </mat-card-content>
        </mat-card>

        <h2>Available Rooms</h2>
        @if (loadingRooms()) {
          <div class="loading">
            <mat-spinner></mat-spinner>
          </div>
        } @else {
          <div class="rooms-grid">
            @for (room of rooms(); track room.Id) {
              <mat-card>
                @if (room.ImageUrl) {
                  <img mat-card-image [src]="room.ImageUrl" [alt]="room.Type" />
                }
                <mat-card-header>
                  <mat-card-title>{{ room.Type }}</mat-card-title>
                  <mat-card-subtitle>Room {{ room.RoomNumber }}</mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <p>{{ room.Description }}</p>
                  <div class="room-info">
                    <div><mat-icon>people</mat-icon> Capacity: {{ room.Capacity }}</div>
                    <div class="price">{{ room.PricePerNight }} USD/night</div>
                  </div>
                  <div class="availability" [class.available]="room.IsAvailable">
                    {{ room.IsAvailable ? 'Available' : 'Not Available' }}
                  </div>
                </mat-card-content>
                <mat-card-actions>
                  <button mat-raised-button color="primary" 
                          [disabled]="!room.IsAvailable">
                    Book Now
                  </button>
                </mat-card-actions>
              </mat-card>
            }
          </div>
        }
      }

      <button mat-button (click)="goBack()">
        <mat-icon>arrow_back</mat-icon> Back to Hotels
      </button>
    </div>
  `,
  styles: [`
    .hotel-detail-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
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

    .hotel-card {
      margin-bottom: 32px;
    }

    h2 {
      margin: 24px 0;
    }

    .rating {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-top: 16px;
      color: #ffa726;
      font-size: 18px;
    }

    .rooms-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 24px;
      margin-bottom: 24px;
    }

    .room-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 16px;
    }

    .room-info > div {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .price {
      font-size: 20px;
      font-weight: bold;
      color: #4caf50;
    }

    .availability {
      margin-top: 8px;
      padding: 4px 8px;
      border-radius: 4px;
      text-align: center;
      background-color: #f44336;
      color: white;
    }

    .availability.available {
      background-color: #4caf50;
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
