import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { AuthService } from '../../../services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatDividerModule
  ],
  template: `
    <mat-sidenav-container class="admin-container">
      <!-- Sidebar -->
      <mat-sidenav 
        #sidenav 
        [mode]="isMobile() ? 'over' : 'side'" 
        [opened]="!isMobile()"
        class="admin-sidenav">
        
        <!-- Logo -->
        <div class="sidenav-header">
          <mat-icon class="logo-icon">admin_panel_settings</mat-icon>
          <span class="logo-text">Admin Panel</span>
        </div>

        <mat-divider></mat-divider>

        <!-- Navigation -->
        <mat-nav-list>
          @for (item of navItems; track item.route) {
            <a mat-list-item 
               [routerLink]="item.route" 
               routerLinkActive="active"
               [routerLinkActiveOptions]="{ exact: item.route === '/admin/dashboard' }">
              <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
              <span matListItemTitle>{{ item.label }}</span>
            </a>
          }
        </mat-nav-list>

        <div class="sidenav-spacer"></div>

        <mat-divider></mat-divider>

        <!-- Back to Site -->
        <mat-nav-list>
          <a mat-list-item routerLink="/">
            <mat-icon matListItemIcon>arrow_back</mat-icon>
            <span matListItemTitle>Back to Site</span>
          </a>
        </mat-nav-list>
      </mat-sidenav>

      <!-- Main Content -->
      <mat-sidenav-content class="admin-content">
        <!-- Top Toolbar -->
        <mat-toolbar class="admin-toolbar">
          @if (isMobile()) {
            <button mat-icon-button (click)="sidenav.toggle()">
              <mat-icon>menu</mat-icon>
            </button>
          }

          <span class="toolbar-spacer"></span>

          <!-- User Menu -->
          <button mat-icon-button [matMenuTriggerFor]="userMenu">
            <mat-icon>account_circle</mat-icon>
          </button>
          <mat-menu #userMenu="matMenu">
            <div class="user-info-menu">
              <mat-icon>person</mat-icon>
              <div class="user-details">
                <span class="user-name">{{ currentUser()?.fullName }}</span>
                <span class="user-email">{{ currentUser()?.email }}</span>
              </div>
            </div>
            <mat-divider></mat-divider>
            <button mat-menu-item routerLink="/">
              <mat-icon>home</mat-icon>
              <span>Back to Site</span>
            </button>
            <button mat-menu-item (click)="logout()">
              <mat-icon>logout</mat-icon>
              <span>Logout</span>
            </button>
          </mat-menu>
        </mat-toolbar>

        <!-- Page Content -->
        <main class="page-content">
          <router-outlet></router-outlet>
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .admin-container {
      height: 100vh;
    }

    .admin-sidenav {
      width: 260px;
      background: linear-gradient(180deg, #1a237e 0%, #283593 100%);
      color: white;
    }

    .sidenav-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 20px 16px;
    }

    .logo-icon {
      font-size: 32px;
      width: 32px;
      height: 32px;
      color: #90caf9;
    }

    .logo-text {
      font-size: 20px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    .admin-sidenav mat-divider {
      border-color: rgba(255, 255, 255, 0.12);
    }

    .admin-sidenav mat-nav-list a {
      color: rgba(255, 255, 255, 0.87);
      margin: 4px 8px;
      border-radius: 8px;
      transition: all 200ms ease;
    }

    .admin-sidenav mat-nav-list a:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    .admin-sidenav mat-nav-list a.active {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }

    .admin-sidenav mat-nav-list a mat-icon {
      color: rgba(255, 255, 255, 0.7);
    }

    .admin-sidenav mat-nav-list a.active mat-icon {
      color: #90caf9;
    }

    .sidenav-spacer {
      flex: 1;
    }

    .admin-content {
      display: flex;
      flex-direction: column;
      background: #f5f5f5;
    }

    .admin-toolbar {
      background: white;
      border-bottom: 1px solid #e0e0e0;
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .toolbar-spacer {
      flex: 1;
    }

    .page-content {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
    }

    .user-info-menu {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
    }

    .user-info-menu mat-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: #1a237e;
    }

    .user-details {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-weight: 500;
      color: #333;
    }

    .user-email {
      font-size: 12px;
      color: #666;
    }

    @media (max-width: 768px) {
      .page-content {
        padding: 16px;
      }
    }
  `]
})
export class AdminLayoutComponent {
  private authService = inject(AuthService);
  private breakpointObserver = inject(BreakpointObserver);

  isMobile = signal(false);
  
  currentUser = signal<any>(null);

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/admin/dashboard' },
    { label: 'Hotels', icon: 'hotel', route: '/admin/hotels' },
    { label: 'Bookings', icon: 'book_online', route: '/admin/bookings' },
    { label: 'Users', icon: 'people', route: '/admin/users' }
  ];

  constructor() {
    this.breakpointObserver.observe([Breakpoints.Handset])
      .subscribe(result => {
        this.isMobile.set(result.matches);
      });
    
    // Load current user
    this.currentUser.set(this.authService.getCurrentUser());
  }

  logout(): void {
    this.authService.logout();
  }
}
