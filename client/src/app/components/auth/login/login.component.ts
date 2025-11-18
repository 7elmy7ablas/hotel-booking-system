import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCheckboxModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loginForm: FormGroup;
  hidePassword = true;
  loading = false;
  errorMessage = '';

  constructor() {
    console.log('🎯 LoginComponent constructor called');
    
    // Create form with default test values
    this.loginForm = this.fb.group({
      email: ['admin@hotel.com', [Validators.required, Validators.email]],
      password: ['Admin@123', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
    
    console.log('📝 Form created with values:', this.loginForm.value);
  }

  ngOnInit(): void {
    console.log('🎯 LoginComponent ngOnInit called');
    console.log('📝 Form valid:', this.loginForm.valid);
    console.log('📝 Form value:', this.loginForm.value);
  }

  onSubmit(): void {
    console.log('🚀 ========== onSubmit() CALLED ==========');
    console.log('📝 Form valid:', this.loginForm.valid);
    console.log('📝 Form value:', this.loginForm.value);
    console.log('📝 Loading state:', this.loading);

    if (this.loginForm.invalid) {
      console.log('❌ Form is INVALID');
      // Mark all fields as touched to show validation errors
      Object.keys(this.loginForm.controls).forEach(key => {
        const control = this.loginForm.get(key);
        control?.markAsTouched();
        if (control?.invalid) {
          console.log(`❌ ${key} errors:`, control.errors);
        }
      });
      return;
    }

    console.log('✅ Form is VALID - proceeding with login');
    this.loading = true;
    this.errorMessage = '';

    const credentials = {
      email: this.loginForm.value.email!,
      password: this.loginForm.value.password!
    };
    
    console.log('📡 Calling authService.login() with:', credentials.email);

    this.authService.login(credentials).subscribe({
      next: (response) => {
        console.log('✅ ========== LOGIN SUCCESSFUL ==========');
        console.log('📦 Full Response:', response);
        console.log('📦 Response type:', typeof response);
        console.log('📦 Response keys:', response ? Object.keys(response) : 'null');
        console.log('📦 response.token:', response?.token);
        console.log('📦 response.Token:', (response as any)?.Token);
        
        // Check for both camelCase and PascalCase
        const token = response?.token || (response as any)?.Token;
        const user = response?.user || (response as any)?.User;
        
        // CRITICAL: Validate token exists BEFORE doing anything else
        if (!token) {
          console.error('❌ NO TOKEN IN RESPONSE!');
          console.error('❌ Response structure:', JSON.stringify(response, null, 2));
          console.error('❌ Available keys:', response ? Object.keys(response) : 'none');
          this.loading = false;
          this.errorMessage = 'No token in login response!';
          return;
        }
        
        console.log('✅ Token found in response (using fallback check)');
        console.log('📝 Token (first 30 chars):', token.substring(0, 30) + '...');
        console.log('📝 Token length:', token.length);
        
        // Use the token we found (either camelCase or PascalCase)
        const actualToken = token;
        const actualUser = user;
        
        // STEP 1: Save token to localStorage
        localStorage.setItem('token', actualToken);
        console.log('💾 Token saved to localStorage');
        
        // STEP 2: Save user data to localStorage
        if (actualUser) {
          localStorage.setItem('user', JSON.stringify(actualUser));
          console.log('💾 User saved to localStorage');
        }
        
        // STEP 3: Save remember me preference
        if (this.loginForm.value.rememberMe) {
          localStorage.setItem('rememberMe', 'true');
          console.log('💾 Remember me enabled');
        }
        
        // STEP 4: Double-check token was actually saved
        const savedToken = localStorage.getItem('token');
        console.log('🔍 Verification - Token in localStorage:', savedToken ? savedToken.substring(0, 30) + '...' : 'NOT FOUND');
        
        if (!savedToken) {
          console.error('❌ CRITICAL: Failed to save token to localStorage!');
          this.loading = false;
          this.errorMessage = 'Failed to save token!';
          return;
        }
        
        console.log('✅ Token successfully verified in localStorage');
        console.log('✅ User data:', actualUser);
        
        // STEP 5: ONLY NOW navigate (token is guaranteed to be in localStorage)
        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/hotels';
        console.log('🔄 Navigating to:', returnUrl);
        
        this.router.navigate([returnUrl]).then((success) => {
          console.log('✅ Navigation complete. Success:', success);
          console.log('🔍 Final Check - Token still in localStorage:', localStorage.getItem('token')?.substring(0, 30) + '...');
          this.loading = false;
        }).catch((error) => {
          console.error('❌ Navigation error:', error);
          this.loading = false;
        });
      },
      error: (error) => {
        console.error('❌ ========== LOGIN FAILED ==========');
        console.error('❌ Error object:', error);
        console.error('❌ Error status:', error.status);
        console.error('❌ Error message:', error.error?.message);
        
        // Clear any old tokens on error
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        this.loading = false;
        this.errorMessage = error.error?.message || 'Invalid email or password. Please try again.';
      },
      complete: () => {
        console.log('🏁 Login request complete');
      }
    });
  }

  testClick(): void {
    console.log('🖱️ ========== BUTTON CLICKED ==========');
    console.log('📝 Form valid:', this.loginForm.valid);
    console.log('📝 Form value:', this.loginForm.value);
    this.onSubmit();
  }

  getEmailErrorMessage(): string {
    const emailControl = this.loginForm.get('email');
    if (emailControl?.hasError('required')) {
      return 'Email is required';
    }
    if (emailControl?.hasError('email')) {
      return 'Please enter a valid email';
    }
    return '';
  }

  getPasswordErrorMessage(): string {
    const passwordControl = this.loginForm.get('password');
    if (passwordControl?.hasError('required')) {
      return 'Password is required';
    }
    if (passwordControl?.hasError('minlength')) {
      return 'Password must be at least 6 characters';
    }
    return '';
  }
}
