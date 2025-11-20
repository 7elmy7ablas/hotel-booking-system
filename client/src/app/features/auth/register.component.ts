import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
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
    MatIconModule
  ],
  template: `
    <div class="auth-page">
      <div class="auth-container fade-in">
        <div class="auth-card">
          <div class="auth-header">
            <div class="logo">
              <mat-icon>hotel</mat-icon>
              <span>LuxeStay</span>
            </div>
            <h1>Create Account</h1>
            <p>Start your luxury hotel experience</p>
          </div>

          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="auth-form">
            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Full Name</mat-label>
              <mat-icon matPrefix>person</mat-icon>
              <input matInput formControlName="FullName" placeholder="John Doe" />
              @if (registerForm.get('FullName')?.hasError('required') && registerForm.get('FullName')?.touched) {
                <mat-error>Full name is required</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Email Address</mat-label>
              <mat-icon matPrefix>email</mat-icon>
              <input matInput type="email" formControlName="Email" placeholder="you@example.com" />
              @if (registerForm.get('Email')?.hasError('required') && registerForm.get('Email')?.touched) {
                <mat-error>Email is required</mat-error>
              }
              @if (registerForm.get('Email')?.hasError('email') && registerForm.get('Email')?.touched) {
                <mat-error>Invalid email format</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Phone Number</mat-label>
              <mat-icon matPrefix>phone</mat-icon>
              <input matInput formControlName="PhoneNumber" placeholder="+1 234 567 8900" />
              @if (registerForm.get('PhoneNumber')?.hasError('required') && registerForm.get('PhoneNumber')?.touched) {
                <mat-error>Phone number is required</mat-error>
              }
            </mat-form-field>

            <mat-form-field appearance="outline" class="form-field">
              <mat-label>Password</mat-label>
              <mat-icon matPrefix>lock</mat-icon>
              <input matInput [type]="hidePassword() ? 'password' : 'text'" formControlName="Password" />
              <button mat-icon-button matSuffix type="button" (click)="togglePassword()">
                <mat-icon>{{ hidePassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
              </button>
              @if (registerForm.get('Password')?.hasError('required') && registerForm.get('Password')?.touched) {
                <mat-error>Password is required</mat-error>
              }
              @if (registerForm.get('Password')?.hasError('minlength') && registerForm.get('Password')?.touched) {
                <mat-error>Password must be at least 6 characters</mat-error>
              }
            </mat-form-field>

            @if (errorMessage()) {
              <div class="error-message">
                <mat-icon>error</mat-icon>
                <span>{{ errorMessage() }}</span>
              </div>
            }

            <button mat-raised-button type="submit" class="submit-btn" [disabled]="registerForm.invalid || loading()">
              @if (loading()) {
                <span class="loading-spinner"></span>
                Creating account...
              } @else {
                <mat-icon>person_add</mat-icon>
                Create Account
              }
            </button>
          </form>

          <div class="auth-footer">
            <p>Already have an account? <a routerLink="/login">Sign in</a></p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem;
      position: relative;
      overflow: hidden;
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-image: 
          radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
        pointer-events: none;
      }
    }

    .auth-container {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 520px;
    }

    .auth-card {
      background: white;
      border-radius: 16px;
      padding: 3rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }

    .auth-header {
      text-align: center;
      margin-bottom: 2.5rem;
      
      .logo {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        margin-bottom: 1.5rem;
        
        mat-icon {
          font-size: 40px;
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        span {
          font-size: 1.75rem;
          font-weight: 700;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      }
      
      h1 {
        font-size: 2rem;
        font-weight: 700;
        color: #111827;
        margin-bottom: 0.5rem;
      }
      
      p {
        color: #6B7280;
        font-size: 1rem;
        margin: 0;
      }
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }



    .form-field {
      width: 100%;
      
      ::ng-deep .mat-mdc-text-field-wrapper {
        border-radius: 12px;
      }
      
      ::ng-deep .mat-mdc-form-field-focus-overlay {
        border-radius: 12px;
      }
      
      ::ng-deep .mdc-text-field--outlined {
        border-radius: 12px;
      }
      
      ::ng-deep .mat-mdc-form-field-icon-prefix {
        color: #6366F1;
        margin-right: 0.75rem;
      }
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      background: #FEE2E2;
      border-radius: 12px;
      color: #991B1B;
      font-size: 0.875rem;
      
      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    .submit-btn {
      width: 100%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      color: white !important;
      font-weight: 600 !important;
      font-size: 1rem !important;
      padding: 1rem 2rem !important;
      border-radius: 12px !important;
      transition: all 300ms ease !important;
      
      &:not(:disabled):hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 15px -3px rgba(102, 126, 234, 0.4);
      }
      
      &:disabled {
        opacity: 0.6;
      }
      
      mat-icon {
        margin-right: 0.5rem;
      }
    }

    .loading-spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-right: 0.5rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .auth-footer {
      margin-top: 2rem;
      text-align: center;
      
      p {
        color: #6B7280;
        margin: 0;
        
        a {
          color: #6366F1;
          font-weight: 600;
          text-decoration: none;
          transition: color 300ms ease;
          
          &:hover {
            color: #4F46E5;
          }
        }
      }
    }

    @media (max-width: 640px) {
      .auth-card {
        padding: 2rem;
      }
      
      .auth-header h1 {
        font-size: 1.5rem;
      }
    }
  `]
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  errorMessage = signal('');
  hidePassword = signal(true);

  registerForm: FormGroup = this.fb.group({
    FullName: ['', Validators.required],
    Email: ['', [Validators.required, Validators.email]],
    PhoneNumber: ['', Validators.required],
    Password: ['', [Validators.required, Validators.minLength(6)]]
  });

  togglePassword(): void {
    this.hidePassword.set(!this.hidePassword());
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.loading.set(true);
      this.errorMessage.set('');

      this.authService.register(this.registerForm.value).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (error) => {
          this.errorMessage.set(error.message || 'Registration failed. Please try again.');
          this.loading.set(false);
        },
        complete: () => {
          this.loading.set(false);
        }
      });
    }
  }
}
