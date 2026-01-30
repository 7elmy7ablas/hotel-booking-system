import { Routes } from '@angular/router';
import { adminGuard } from '../../guards/admin.guard';

/**
 * Admin Module Routes
 * 
 * All routes are protected by adminGuard which checks:
 * 1. User is authenticated
 * 2. User has Admin role
 */
export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    canActivate: [adminGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
        title: 'Admin Dashboard - Hotel Booking'
      },
      {
        path: 'hotels',
        loadComponent: () => import('./pages/hotels/hotels-list.component').then(m => m.HotelsListComponent),
        title: 'Hotels Management - Hotel Booking'
      },
      {
        path: 'bookings',
        loadComponent: () => import('./pages/bookings/bookings-list.component').then(m => m.BookingsListComponent),
        title: 'Bookings Management - Hotel Booking'
      },
      {
        path: 'users',
        loadComponent: () => import('./pages/users/users-list.component').then(m => m.UsersListComponent),
        title: 'Users Management - Hotel Booking'
      }
    ]
  }
];
