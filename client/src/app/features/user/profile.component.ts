import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { UserService } from '../../services/user.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './profile.component.html',
  styles: [`
    .profile-container {
      padding: 24px;
      max-width: 800px;
      margin: 0 auto;
    }

    h1 {
      margin-bottom: 24px;
      color: #333;
    }

    .loading {
      display: flex;
      justify-content: center;
      padding: 48px;
    }

    .profile-card {
      padding: 16px;
    }

    .profile-view {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 24px;
    }

    .profile-field {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #e0e0e0;
    }

    .label {
      font-weight: 500;
      color: #666;
    }

    .value {
      color: #333;
      font-weight: 400;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    mat-form-field {
      width: 100%;
    }

    .actions {
      display: flex;
      gap: 12px;
      margin-top: 16px;
    }
  `]
})
export class ProfileComponent implements OnInit {
  private userService = inject(UserService);
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  user = signal<User | null>(null);
  loading = signal(false);
  editMode = signal(false);
  saving = signal(false);

  profileForm: FormGroup;

  constructor() {
    this.profileForm = this.fb.group({
      fullName: ['', Validators.required],
      phoneNumber: ['']
    });
  }

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.loading.set(true);
    this.userService.getProfile().subscribe({
      next: (user) => {
        this.user.set(user);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load profile:', error);
        this.snackBar.open('Failed to load profile', 'Close', { duration: 3000 });
        this.loading.set(false);
      }
    });
  }

  enableEditMode(): void {
    const currentUser = this.user();
    if (currentUser) {
      this.profileForm.patchValue({
        fullName: currentUser.fullName,
        phoneNumber: currentUser.phoneNumber || ''
      });
      this.editMode.set(true);
    }
  }

  cancelEdit(): void {
    this.editMode.set(false);
    this.profileForm.reset();
  }

  onSave(): void {
    if (this.profileForm.invalid) {
      return;
    }

    this.saving.set(true);
    const formValue = this.profileForm.value;

    this.userService.updateProfile(formValue).subscribe({
      next: (updatedUser) => {
        this.user.set(updatedUser);
        this.saving.set(false);
        this.editMode.set(false);
        this.snackBar.open('Profile updated successfully!', 'Close', { duration: 3000 });
      },
      error: (error) => {
        console.error('Failed to update profile:', error);
        this.snackBar.open(error.message || 'Failed to update profile', 'Close', { duration: 3000 });
        this.saving.set(false);
      }
    });
  }

  formatDate(date: Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }
}
