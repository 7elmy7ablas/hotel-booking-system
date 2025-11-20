import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HotelService } from '../../services/hotel.service';
import { Hotel } from '../../models/hotel.model';

@Component({
  selector: 'app-hotel-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="management-container">
      <div class="management-header">
        <h2>Hotel Management</h2>
        <button class="btn btn-primary" (click)="showAddForm = true">
          Add Hotel
        </button>
      </div>

      <div *ngIf="isLoading" class="loading">Loading hotels...</div>

      <div *ngIf="!isLoading" class="hotels-table">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Location</th>
              <th>Rating</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let hotel of hotels">
              <td>{{ hotel.name }}</td>
              <td>{{ hotel.city }}, {{ hotel.country }}</td>
              <td>{{ hotel.rating || 'N/A' }}</td>
              <td>
                <button class="btn btn-sm btn-outline">Edit</button>
                <button class="btn btn-sm btn-danger">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div *ngIf="showAddForm" class="modal-overlay" (click)="showAddForm = false">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <h3>Add New Hotel</h3>
          <form [formGroup]="hotelForm" (ngSubmit)="saveHotel()">
            <div class="form-group">
              <label>Hotel Name</label>
              <input type="text" formControlName="name" class="form-input" />
            </div>
            <div class="form-actions">
              <button type="submit" class="btn btn-primary">Save</button>
              <button type="button" class="btn btn-outline" (click)="showAddForm = false">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .management-container { padding: 24px; }
    .management-header { display: flex; justify-content: space-between; margin-bottom: 24px; }
    .hotels-table { background: white; padding: 24px; border-radius: 12px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal-content { background: white; padding: 32px; border-radius: 16px; max-width: 500px; width: 90%; }
    .form-group { margin-bottom: 16px; }
    .form-actions { display: flex; gap: 12px; margin-top: 24px; }
  `]
})
export class HotelManagementComponent implements OnInit {
  private hotelService = inject(HotelService);
  private fb = inject(FormBuilder);

  hotels: Hotel[] = [];
  isLoading = false;
  showAddForm = false;

  hotelForm: FormGroup;

  constructor() {
    this.hotelForm = this.fb.group({
      name: ['', Validators.required],
      city: ['', Validators.required],
      country: ['', Validators.required],
      address: ['', Validators.required],
      description: [''],
      rating: [0]
    });
  }

  ngOnInit(): void {
    this.loadHotels();
  }

  loadHotels(): void {
    this.isLoading = true;
    this.hotelService.getHotels().subscribe({
      next: (hotels) => {
        this.hotels = hotels;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  saveHotel(): void {
    if (this.hotelForm.valid) {
      console.log('Saving hotel:', this.hotelForm.value);
      this.showAddForm = false;
      this.hotelForm.reset();
    }
  }
}
