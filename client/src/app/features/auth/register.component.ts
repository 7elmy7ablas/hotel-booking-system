import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="register-container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Register</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()">
            <mat-form-field appearance="outline">
              <mat-label>First Name</mat-label>
              <input matInput formControlName="FirstName" />
              @if (registerForm.get('FirstName')?.hasError('required')) {
                <mat-error>First name is required</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Last Name</mat-label>
              <input matInput formControlName="LastName" />
              @if (registerForm.get('LastName')?.hasError('required')) {
                <mat-error>Last name is required</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Email</mat-label>
              <input matInput type="email" formControlName="Email" />
              @if (registerForm.get('Email')?.hasError('required')) {
                <mat-error>Email is required</mat-error>
              }
              @if (registerForm.get('Email')?.hasError('email')) {
                <mat-error>Invalid email format</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Phone Number</mat-label>
              <input matInput formControlName="PhoneNumber" />
              @if (registerForm.get('PhoneNumber')?.hasError('required')) {
                <mat-error>Phone number is required</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Password</mat-label>
              <input matInput type="password" formControlName="Password" />
              @if (registerForm.get('Password')?.hasError('required')) {
                <mat-error>Password is required</mat-error>
              }
              @if (registerForm.get('Password')?.hasError('minlength')) {
                <mat-error>Password must be at least 6 characters</mat-error>
              }
            </mat-form-field>

            @if (errorMessage()) {
              <div class="error-message">{{ errorMessage() }}</div>
            }

            <button mat-raised-button color="primary" type="submit" 
                    [disabled]="registerForm.invalid || loading()">
              @if (loading()) {
                <mat-spinner diameter="20"></mat-spinner>
              } @else {
                Register
              }
            </button>
          </form>

          <div class="login-link">
            Already have an account? <a routerLink="/login">Login</a>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .register-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 80vh;
      padding: 20px;
    }

    mat-card {
      max-width: 400px;
      width: 100%;
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

    .login-link {
      margin-top: 16px;
      text-align: center;
    }

    button {
      width: 100%;
    }
  `]
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  errorMessage = signal('');

  registerForm: FormGroup = this.fb.group({
    FirstName: ['', Validators.required],
    LastName: ['', Validators.required],
    Email: ['', [Validators.required, Validators.email]],
    PhoneNumber: ['', Validators.required],
    Password: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.loading.set(true);
      this.errorMessage.set('');

      this.authService.register(this.registerForm.value).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.errorMessage.set(error.message || 'Registration failed');
          this.loading.set(false);
        },
        complete: () => {
          this.loading.set(false);
        }
      });
    }
  }
}
