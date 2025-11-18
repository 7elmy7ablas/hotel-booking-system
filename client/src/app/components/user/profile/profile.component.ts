import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../services/auth.service';
import { UserService } from '../../../services/user.service';
import { BookingService } from '../../../services/booking.service';
import { User } from '../../../models/user.model';
import { Booking, BookingStatus } from '../../../models/booking.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  bookings: Booking[] = [];
  
  profileForm: FormGroup;
  passwordForm: FormGroup;
  
  isLoading = true;
  isUpdatingProfile = false;
  isUpdatingPassword = false;
  isLoadingBookings = false;
  
  hideCurrentPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private bookingService: BookingService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.profileForm = this.fb.group({
      fullName: ['', Validators.required],
      email: [{ value: '', disabled: true }],
      phoneNumber: ['']
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.loadUserProfile();
  }

  loadUserProfile(): void {
    this.isLoading = true;
    const currentUser = this.authService.getCurrentUser();
    
    if (currentUser) {
      this.user = currentUser;
      this.profileForm.patchValue({
        fullName: currentUser.fullName,
        email: currentUser.email,
        phoneNumber: currentUser.phoneNumber || ''
      });
      this.isLoading = false;
    } else {
      this.userService.getUserProfile().subscribe({
        next: (user) => {
          this.user = user;
          this.profileForm.patchValue({
            fullName: user.fullName,
            email: user.email,
            phoneNumber: user.phoneNumber || ''
          });
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading profile:', error);
          this.isLoading = false;
          this.snackBar.open('Failed to load profile', 'Close', { duration: 3000 });
        }
      });
    }
  }

  loadUserBookings(): void {
    this.isLoadingBookings = true;
    this.bookingService.getBookings().subscribe({
      next: (bookings) => {
        this.bookings = bookings;
        this.isLoadingBookings = false;
      },
      error: (error) => {
        console.error('Error loading bookings:', error);
        this.isLoadingBookings = false;
        this.snackBar.open('Failed to load bookings', 'Close', { duration: 3000 });
      }
    });
  }

  onTabChange(index: number): void {
    if (index === 1 && this.bookings.length === 0) {
      this.loadUserBookings();
    }
  }

  updateProfile(): void {
    if (this.profileForm.valid) {
      this.isUpdatingProfile = true;
      const profileData = {
        fullName: this.profileForm.value.fullName,
        phoneNumber: this.profileForm.value.phoneNumber
      };

      this.userService.updateUserProfile(profileData).subscribe({
        next: (response) => {
          this.isUpdatingProfile = false;
          this.user = { ...this.user, ...profileData } as User;
          this.snackBar.open('Profile updated successfully', 'Close', { duration: 3000 });
        },
        error: (error) => {
          this.isUpdatingProfile = false;
          this.snackBar.open('Failed to update profile', 'Close', { duration: 3000 });
        }
      });
    }
  }

  changePassword(): void {
    if (this.passwordForm.valid) {
      this.isUpdatingPassword = true;
      const passwordData = {
        currentPassword: this.passwordForm.value.currentPassword,
        newPassword: this.passwordForm.value.newPassword
      };

      // TODO: Implement password change API call
      setTimeout(() => {
        this.isUpdatingPassword = false;
        this.passwordForm.reset();
        this.snackBar.open('Password changed successfully', 'Close', { duration: 3000 });
      }, 1000);
    }
  }

  passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  getPasswordErrorMessage(): string {
    if (this.passwordForm.hasError('passwordMismatch')) {
      return 'Passwords do not match';
    }
    return '';
  }

  viewBookingDetails(bookingId: number): void {
    this.router.navigate(['/bookings', bookingId]);
  }

  getStatusColor(status: BookingStatus): string {
    switch (status) {
      case BookingStatus.Pending:
        return 'warn';
      case BookingStatus.Confirmed:
        return 'primary';
      case BookingStatus.Cancelled:
        return 'accent';
      case BookingStatus.Completed:
        return '';
      default:
        return '';
    }
  }

  getStatusIcon(status: BookingStatus): string {
    switch (status) {
      case BookingStatus.Pending:
        return 'schedule';
      case BookingStatus.Confirmed:
        return 'check_circle';
      case BookingStatus.Cancelled:
        return 'cancel';
      case BookingStatus.Completed:
        return 'done_all';
      default:
        return 'info';
    }
  }

  logout(): void {
    this.authService.logout();
  }

  getMemberSince(): string {
    if (this.user?.createdAt) {
      return new Date(this.user.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long'
      });
    }
    return 'N/A';
  }
}
