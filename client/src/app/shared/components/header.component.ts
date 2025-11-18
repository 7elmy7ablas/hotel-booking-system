import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule
  ],
  template: `
    <mat-toolbar color="primary">
      <span class="logo" routerLink="/">Hotel Booking</span>
      <span class="spacer"></span>
      
      @if (authService.isAuthenticated()) {
        <button mat-button routerLink="/hotels">Hotels</button>
        <button mat-button routerLink="/dashboard">Dashboard</button>
        <button mat-icon-button [matMenuTriggerFor]="menu">
          <mat-icon>account_circle</mat-icon>
        </button>
        <mat-menu #menu="matMenu">
          <button mat-menu-item disabled>
            {{ authService.currentUser()?.Email }}
          </button>
          <button mat-menu-item (click)="authService.logout()">
            <mat-icon>logout</mat-icon>
            Logout
          </button>
        </mat-menu>
      } @else {
        <button mat-button routerLink="/login">Login</button>
        <button mat-raised-button routerLink="/register">Register</button>
      }
    </mat-toolbar>
  `,
  styles: [`
    .logo {
      cursor: pointer;
      font-size: 20px;
      font-weight: 500;
    }

    .spacer {
      flex: 1;
    }
  `]
})
export class HeaderComponent {
  authService = inject(AuthService);
}
