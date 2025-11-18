import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="dashboard-container">
      <h1>Welcome, {{ authService.currentUser()?.FirstName }}!</h1>

      <div class="cards-grid">
        <mat-card>
          <mat-card-header>
            <mat-icon mat-card-avatar>hotel</mat-icon>
            <mat-card-title>Browse Hotels</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>Explore our collection of hotels worldwide</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="primary" routerLink="/hotels">
              View Hotels
            </button>
          </mat-card-actions>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-icon mat-card-avatar>book</mat-icon>
            <mat-card-title>My Bookings</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>View and manage your reservations</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="primary">
              View Bookings
            </button>
          </mat-card-actions>
        </mat-card>

        <mat-card>
          <mat-card-header>
            <mat-icon mat-card-avatar>person</mat-icon>
            <mat-card-title>Profile</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <p>Update your personal information</p>
          </mat-card-content>
          <mat-card-actions>
            <button mat-raised-button color="primary">
              Edit Profile
            </button>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 24px;
    }

    h1 {
      margin-bottom: 32px;
    }

    .cards-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 24px;
    }

    mat-icon[mat-card-avatar] {
      font-size: 40px;
      width: 40px;
      height: 40px;
    }
  `]
})
export class DashboardComponent {
  authService = inject(AuthService);
}
