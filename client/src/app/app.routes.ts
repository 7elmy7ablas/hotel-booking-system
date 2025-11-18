import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';

export const routes: Routes = [
  // Default redirect
  { 
    path: '', 
    redirectTo: '/hotels', 
    pathMatch: 'full' 
  },

  // Guest-only routes - Authentication (redirect if already logged in)
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

  // Public routes - Hotels
  {
    path: 'hotels',
    loadComponent: () => import('./components/hotels/search/search.component').then(m => m.SearchComponent),
    title: 'Search Hotels - Hotel Booking'
  },
  {
    path: 'hotels/:id',
    loadComponent: () => import('./components/hotels/details/details.component').then(m => m.DetailsComponent),
    title: 'Hotel Details - Hotel Booking'
  },

  // Protected routes - Bookings (require authentication)
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

  // Protected routes - User Profile (require authentication)
  {
    path: 'profile',
    loadComponent: () => import('./components/user/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard],
    title: 'My Profile - Hotel Booking'
  },

  // Wildcard route - 404 redirect
  { 
    path: '**', 
    redirectTo: '/hotels' 
  }
];
