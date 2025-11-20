import { Component, inject, signal, HostListener } from '@angular/core';
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
    <header class="header" [class.scrolled]="isScrolled()">
      <div class="header-container">
        <div class="logo" routerLink="/">
          <mat-icon class="logo-icon">hotel</mat-icon>
          <span class="logo-text">LuxeStay</span>
        </div>
        
        <nav class="nav-center">
          @if (authService.isAuthenticated()) {
            <a mat-button routerLink="/hotels" class="nav-link">Hotels</a>
            <a mat-button routerLink="/dashboard" class="nav-link">Dashboard</a>
          }
        </nav>
        
        <div class="nav-right">
          @if (authService.isAuthenticated()) {
            <button mat-icon-button [matMenuTriggerFor]="menu" class="user-menu-btn">
              <mat-icon>account_circle</mat-icon>
            </button>
            <mat-menu #menu="matMenu" class="user-menu">
              <div class="user-info">
                <mat-icon>person</mat-icon>
                <span>{{ authService.currentUser()?.Email }}</span>
              </div>
              <mat-divider></mat-divider>
              <button mat-menu-item (click)="authService.logout()">
                <mat-icon>logout</mat-icon>
                <span>Logout</span>
              </button>
            </mat-menu>
          } @else {
            <a mat-button routerLink="/login" class="nav-link">Login</a>
            <a mat-raised-button routerLink="/register" class="btn-primary">Register</a>
          }
        </div>
      </div>
    </header>
  `,
  styles: [`
    .header {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      transition: all 300ms ease;
      border-bottom: 1px solid transparent;
    }

    .header.scrolled {
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      border-bottom-color: #E5E7EB;
    }

    .header-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 1rem 2rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 2rem;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      transition: transform 300ms ease;
    }

    .logo:hover {
      transform: scale(1.05);
    }

    .logo-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .logo-text {
      font-size: 1.5rem;
      font-weight: 700;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .nav-center {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex: 1;
      justify-content: center;
    }

    .nav-link {
      font-weight: 500;
      color: #374151;
      transition: color 300ms ease;
    }

    .nav-link:hover {
      color: #6366F1;
    }

    .nav-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      color: white !important;
      font-weight: 600 !important;
      padding: 0.75rem 1.5rem !important;
      border-radius: 12px !important;
      transition: all 300ms ease !important;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 15px -3px rgba(102, 126, 234, 0.4);
    }

    .user-menu-btn {
      color: #6366F1;
    }

    ::ng-deep .user-menu {
      border-radius: 12px !important;
      margin-top: 0.5rem;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      color: #374151;
      font-weight: 500;
    }

    @media (max-width: 768px) {
      .header-container {
        padding: 1rem;
      }

      .nav-center {
        display: none;
      }

      .logo-text {
        font-size: 1.25rem;
      }
    }
  `]
})
export class HeaderComponent {
  authService = inject(AuthService);
  isScrolled = signal(false);

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled.set(window.scrollY > 10);
  }
}
