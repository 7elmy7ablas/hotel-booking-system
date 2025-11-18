import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HotelService } from '../../core/services/hotel.service';

@Component({
  selector: 'app-hotel-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="hotel-form-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Add New Hotel</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="hotelForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline">
              <mat-label>Hotel Name</mat-label>
              <input matInput formControlName="Name" />
              @if (hotelForm.get('Name')?.hasError('required')) {
                <mat-error>Name is required</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Description</mat-label>
              <textarea matInput formControlName="Description" rows="4"></textarea>
              @if (hotelForm.get('Description')?.hasError('required')) {
                <mat-error>Description is required</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Address</mat-label>
              <input matInput formControlName="Address" />
              @if (hotelForm.get('Address')?.hasError('required')) {
                <mat-error>Address is required</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>City</mat-label>
              <input matInput formControlName="City" />
              @if (hotelForm.get('City')?.hasError('required')) {
                <mat-error>City is required</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Country</mat-label>
              <input matInput formControlName="Country" />
              @if (hotelForm.get('Country')?.hasError('required')) {
                <mat-error>Country is required</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Rating</mat-label>
              <input matInput type="number" formControlName="Rating" min="0" max="5" step="0.1" />
              @if (hotelForm.get('Rating')?.hasError('required')) {
                <mat-error>Rating is required</mat-error>
              }
              @if (hotelForm.get('Rating')?.hasError('min') || hotelForm.get('Rating')?.hasError('max')) {
                <mat-error>Rating must be between 0 and 5</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Image URL</mat-label>
              <input matInput formControlName="ImageUrl" />
            </mat-form-field>

            @if (errorMessage()) {
              <div class="error-message">{{ errorMessage() }}</div>
            }

            <div class="actions">
              <button mat-button type="button" (click)="cancel()">Cancel</button>
              <button mat-raised-button color="primary" type="submit" 
                      [disabled]="hotelForm.invalid || loading()">
                @if (loading()) {
                  <mat-spinner diameter="20"></mat-spinner>
                } @else {
                  Save Hotel
                }
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .hotel-form-container {
      padding: 24px;
      max-width: 600px;
      margin: 0 auto;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    mat-form-field {
      width: 100%;
    }

    .error-message {
      color: #f44336;
      font-size: 14px;
      margin-bottom: 16px;
    }

    .actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-top: 16px;
    }
  `]
})
export class HotelFormComponent {
  private fb = inject(FormBuilder);
  private hotelService = inject(HotelService);
  private router = inject(Router);

  loading = signal(false);
  errorMessage = signal('');

  hotelForm: FormGroup = this.fb.group({
    Name: ['', Validators.required],
    Description: ['', Validators.required],
    Address: ['', Validators.required],
    City: ['', Validators.required],
    Country: ['', Validators.required],
    Rating: [0, [Validators.required, Validators.min(0), Validators.max(5)]],
    ImageUrl: ['']
  });

  onSubmit(): void {
    if (this.hotelForm.valid) {
      this.loading.set(true);
      this.errorMessage.set('');

      this.hotelService.createHotel(this.hotelForm.value).subscribe({
        next: () => {
          this.router.navigate(['/hotels']);
        },
        error: (error) => {
          this.errorMessage.set(error.message || 'Failed to create hotel');
          this.loading.set(false);
        },
        complete: () => {
          this.loading.set(false);
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/hotels']);
  }
}
