import { Injectable, signal, computed } from '@angular/core';
import { Hotel } from '../models/hotel.model';

/**
 * Service to manage selected hotel state across the application
 * Uses Angular signals for reactive state management
 * Persists hotel data in sessionStorage for page refreshes
 */
@Injectable({
  providedIn: 'root'
})
export class SelectedHotelService {
  private readonly STORAGE_KEY = 'selectedHotel';
  
  // Signal for selected hotel
  private selectedHotelSignal = signal<Hotel | null>(null);
  
  // Computed signal to check if hotel is selected
  public hasSelectedHotel = computed(() => !!this.selectedHotelSignal());
  
  constructor() {
    // Load hotel from sessionStorage on service initialization
    this.loadFromStorage();
  }
  
  /**
   * Get the current selected hotel
   */
  getSelectedHotel(): Hotel | null {
    return this.selectedHotelSignal();
  }
  
  /**
   * Set the selected hotel and persist to sessionStorage
   */
  setSelectedHotel(hotel: Hotel): void {
    console.log('🏨 SelectedHotelService: Setting selected hotel:', hotel);
    
    if (!hotel || !hotel.id) {
      console.error('❌ Cannot set hotel without valid ID');
      return;
    }
    
    this.selectedHotelSignal.set(hotel);
    this.saveToStorage(hotel);
    
    console.log('✅ Hotel selected and saved to sessionStorage');
  }
  
  /**
   * Clear the selected hotel
   */
  clearSelectedHotel(): void {
    console.log('🗑️ SelectedHotelService: Clearing selected hotel');
    this.selectedHotelSignal.set(null);
    sessionStorage.removeItem(this.STORAGE_KEY);
  }
  
  /**
   * Check if a hotel is currently selected
   */
  isHotelSelected(): boolean {
    return this.hasSelectedHotel();
  }
  
  /**
   * Save hotel to sessionStorage
   */
  private saveToStorage(hotel: Hotel): void {
    try {
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(hotel));
      console.log('💾 Hotel saved to sessionStorage');
    } catch (error) {
      console.error('❌ Failed to save hotel to sessionStorage:', error);
    }
  }
  
  /**
   * Load hotel from sessionStorage
   */
  private loadFromStorage(): void {
    try {
      const storedHotel = sessionStorage.getItem(this.STORAGE_KEY);
      if (storedHotel) {
        const hotel = JSON.parse(storedHotel) as Hotel;
        this.selectedHotelSignal.set(hotel);
        console.log('✅ Hotel loaded from sessionStorage:', hotel.name);
      }
    } catch (error) {
      console.error('❌ Failed to load hotel from sessionStorage:', error);
      sessionStorage.removeItem(this.STORAGE_KEY);
    }
  }
}
