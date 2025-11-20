import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';
import { adminGuard } from './guards/admin.guard';

export const routes: Routes = [
  // Public Routes
  { 
    path: '', 
    loadComponent: () => import('./components/home/home.component').then(m => m.HomeComponent),
    title: 'Home - Hotel Booking'
  },
  {
    path: 'hotels',
    loadComponent: () => import('./components/hotels/search/search.component').then(m => m.SearchComponent),
    title: 'Search Hotels - Hotel Booking'
  },
  {
    path: 'hotel-details',
    loadComponent: () => import('./components/hotels/details/details.component').then(m => m.DetailsComponent),
    title: 'Hotel Details - Hotel Booking'
  },

  // Guest-Only Routes (redirect if authenticated)
  {
    path: 'login',
    loadComponent: () => import('./components/auth/login/login.component').then(m => m.LoginComponent),
    canActivate: [guestGuard],
    title: 'Login - Hotel Booking'
  },
  {
    path: 'register',
    loadComponent: () => import('./components/auth/register/register.component').then(m => m.RegisterComponent),
    canActivate: [guestGuard],
    title: 'Register - Hotel Booking'
  },

  // Protected Routes (require authentication)
  {
    path: 'my-bookings',
    loadComponent: () => import('./features/hotels/my-bookings.component').then(m => m.MyBookingsComponent),
    canActivate: [authGuard],
    title: 'My Bookings - Hotel Booking'
  },
  {
    path: 'bookings',
    loadComponent: () => import('./components/bookings/list/booking-list.component').then(m => m.BookingListComponent),
    canActivate: [authGuard],
    title: 'My Bookings - Hotel Booking'
  },
  {
    path: 'bookings/create',
    loadComponent: () => import('./components/bookings/create/create.component').then(m => m.CreateComponent),
    canActivate: [authGuard],
    title: 'Create Booking - Hotel Booking'
  },
  {
    path: 'bookings/:id',
    loadComponent: () => import('./components/bookings/details/booking-details.component').then(m => m.BookingDetailsComponent),
    canActivate: [authGuard],
    title: 'Booking Details - Hotel Booking'
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/user/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard],
    title: 'My Profile - Hotel Booking'
  },

  // Admin Routes (require Admin role)
  {
    path: 'admin',
    loadComponent: () => import('./components/admin/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    canActivate: [adminGuard],
    title: 'Admin Dashboard - Hotel Booking'
  },

  // Wildcard Route - 404 page
  { 
    path: '**', 
    loadComponent: () => import('./components/shared/not-found/not-found.component').then(m => m.NotFoundComponent),
    title: '404 - Page Not Found'
  }
];
