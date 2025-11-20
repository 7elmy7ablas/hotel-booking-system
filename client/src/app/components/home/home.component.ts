import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HotelService } from '../../services/hotel.service';
import { AuthService } from '../../services/auth.service';
import { Hotel } from '../../models/hotel.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  private hotelService = inject(HotelService);
  private authService = inject(AuthService);
  private router = inject(Router);

  featuredHotels: Hotel[] = [];
  searchQuery: string = '';
  isLoading: boolean = true;
  isAuthenticated: boolean = false;

  ngOnInit(): void {
    this.isAuthenticated = this.authService.isAuthenticated;
    this.loadFeaturedHotels();
  }

  loadFeaturedHotels(): void {
    this.isLoading = true;
    this.hotelService.getHotels().subscribe({
      next: (hotels) => {
        this.featuredHotels = hotels.slice(0, 6);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading featured hotels:', error);
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      this.router.navigate(['/hotels'], { 
        queryParams: { search: this.searchQuery } 
      });
    } else {
      this.router.navigate(['/hotels']);
    }
  }

  viewHotel(hotelId: number): void {
    this.router.navigate(['/hotel-details'], { 
      queryParams: { id: hotelId } 
    });
  }

  navigateToHotels(): void {
    this.router.navigate(['/hotels']);
  }

  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }
}
