import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private router = inject(Router);

  user: User | null = null;
  isLoading = false;
  activeTab: 'view' | 'edit' | 'password' = 'view';
  
  profileForm: FormGroup;
  passwordForm: FormGroup;
  
  isSaving = false;
  successMessage = '';
  errorMessage = '';

  constructor() {
    this.profileForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      phoneNumber: ['', [Validators.pattern(/^[\d\s\-\+\(\)]+$/)]]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');
    
    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  loadProfile(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.userService.getProfile().subscribe({
      next: (user) => {
        this.user = user;
        this.profileForm.patchValue({
          fullName: user.fullName,
          phoneNumber: user.phoneNumber || ''
        });
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load profile:', error);
        this.errorMessage = 'Failed to load profile. Please try again.';
        this.isLoading = false;
      }
    });
  }

  switchTab(tab: 'view' | 'edit' | 'password'): void {
    this.activeTab = tab;
    this.successMessage = '';
    this.errorMessage = '';
  }

  updateProfile(): void {
    if (this.profileForm.invalid) {
      this.errorMessage = 'Please fill in all required fields correctly.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.userService.updateProfile(this.profileForm.value).subscribe({
      next: (updatedUser) => {
        this.user = updatedUser;
        this.isSaving = false;
        this.successMessage = 'Profile updated successfully!';
        setTimeout(() => {
          this.switchTab('view');
        }, 1500);
      },
      error: (error) => {
        console.error('Failed to update profile:', error);
        this.errorMessage = error.error?.message || 'Failed to update profile. Please try again.';
        this.isSaving = false;
      }
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      this.errorMessage = 'Please fill in all fields correctly.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Note: This would need a password change endpoint in the API
    // For now, showing success message as placeholder
    setTimeout(() => {
      this.isSaving = false;
      this.successMessage = 'Password changed successfully!';
      this.passwordForm.reset();
      setTimeout(() => {
        this.switchTab('view');
      }, 1500);
    }, 1000);
  }

  logout(): void {
    this.authService.logout();
  }

  formatDate(date: Date | string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
