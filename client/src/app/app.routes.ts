import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/hotels', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'hotels',
    loadComponent: () => import('./features/hotels/hotel-list.component').then(m => m.HotelListComponent)
  },
  {
    path: 'hotels/new',
    loadComponent: () => import('./features/hotels/hotel-form.component').then(m => m.HotelFormComponent),
    canActivate: [authGuard]
  },
  {
    path: 'hotels/:id',
    loadComponent: () => import('./features/hotels/hotel-detail.component').then(m => m.HotelDetailComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard]
  }
];
