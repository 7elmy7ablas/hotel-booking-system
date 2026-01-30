import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-bookings-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1>Bookings Management</h1>
        <p>View and manage all bookings across hotels.</p>
      </div>
      
      <mat-card class="placeholder-card">
        <mat-card-content>
          <mat-icon>construction</mat-icon>
          <h2>Coming Soon</h2>
          <p>Bookings management functionality will be available in the next release.</p>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-container {
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 24px;
    }

    .page-header h1 {
      font-size: 28px;
      font-weight: 600;
      color: #1a237e;
      margin: 0 0 8px;
    }

    .page-header p {
      color: #666;
      margin: 0;
    }

    .placeholder-card {
      text-align: center;
      padding: 48px;
    }

    .placeholder-card mat-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #1a237e;
      margin-bottom: 16px;
    }

    .placeholder-card h2 {
      font-size: 24px;
      color: #333;
      margin: 0 0 8px;
    }

    .placeholder-card p {
      color: #666;
      margin: 0;
    }
  `]
})
export class BookingsListComponent {}
