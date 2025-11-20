import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { SelectedHotelService } from '../services/selected-hotel.service';

/**
 * Guard to protect hotel details route
 * Ensures user can only access hotel details if they selected a hotel from search/list
 * Redirects to /hotels if no hotel is selected
 */
export const hotelDetailsGuard: CanActivateFn = (route, state) => {
  const selectedHotelService = inject(SelectedHotelService);
  const router = inject(Router);
  
  const hasHotel = selectedHotelService.isHotelSelected();
  
  if (!hasHotel) {
    console.warn('⚠️ HotelDetailsGuard: No hotel selected, redirecting to /hotels');
    router.navigate(['/hotels']);
    return false;
  }
  
  console.log('✅ HotelDetailsGuard: Hotel selected, allowing access');
  return true;
};
