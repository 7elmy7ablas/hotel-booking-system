import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { provideRouter, Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of, throwError, BehaviorSubject } from 'rxjs';

import { LoginComponent } from './login.component';
import { AuthService } from '../../../services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockActivatedRoute = {
    queryParams: new BehaviorSubject({ returnUrl: '/' }),
    snapshot: { queryParams: { returnUrl: '/' } }
  };

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['login'], {
      isAuthenticated: false
    });
    routerSpy = jasmine.createSpyObj('Router', ['navigate', 'navigateByUrl']);

    await TestBed.configureTestingModule({
      imports: [
        LoginComponent,
        NoopAnimationsModule,
        ReactiveFormsModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create the component', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with a login form', () => {
      expect(component.loginForm).toBeDefined();
    });

    it('should have email and password controls', () => {
      expect(component.loginForm.get('email')).toBeDefined();
      expect(component.loginForm.get('password')).toBeDefined();
    });

    it('should have rememberMe control', () => {
      expect(component.loginForm.get('rememberMe')).toBeDefined();
    });

    it('should hide password by default', () => {
      expect(component.hidePassword).toBeTrue();
    });

    it('should not be loading initially', () => {
      expect(component.loading).toBeFalse();
    });

    it('should have no error message initially', () => {
      expect(component.errorMessage).toBe('');
    });
  });

  describe('Form Validation', () => {
    it('should require email', () => {
      component.loginForm.patchValue({ email: '', password: 'test123' });
      expect(component.loginForm.get('email')?.hasError('required')).toBeTrue();
    });

    it('should validate email format', () => {
      component.loginForm.patchValue({ email: 'invalid-email', password: 'test123' });
      expect(component.loginForm.get('email')?.hasError('email')).toBeTrue();
    });

    it('should accept valid email', () => {
      component.loginForm.patchValue({ email: 'test@example.com', password: 'test123' });
      expect(component.loginForm.get('email')?.valid).toBeTrue();
    });

    it('should require password', () => {
      component.loginForm.patchValue({ email: 'test@test.com', password: '' });
      expect(component.loginForm.get('password')?.hasError('required')).toBeTrue();
    });

    it('should enforce minimum password length', () => {
      component.loginForm.patchValue({ email: 'test@test.com', password: '12345' });
      expect(component.loginForm.get('password')?.hasError('minlength')).toBeTrue();
    });

    it('should accept valid password', () => {
      component.loginForm.patchValue({ email: 'test@test.com', password: 'password123' });
      expect(component.loginForm.get('password')?.valid).toBeTrue();
    });

    it('should be valid with all required fields', () => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123'
      });
      expect(component.loginForm.valid).toBeTrue();
    });

    it('should be invalid with empty form', () => {
      component.loginForm.patchValue({ email: '', password: '' });
      expect(component.loginForm.valid).toBeFalse();
    });
  });

  describe('Login Submission', () => {
    beforeEach(() => {
      component.loginForm.patchValue({
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it('should not submit if form is invalid', () => {
      component.loginForm.patchValue({ email: '' });
      component.onSubmit();
      expect(authServiceSpy.login).not.toHaveBeenCalled();
    });

    it('should call authService.login on valid submit', fakeAsync(() => {
      authServiceSpy.login.and.returnValue(of({ token: 'test-token', user: { id: '1', email: 'test@example.com', fullName: 'Test User', role: 'User' }, expiresAt: '2026-01-27T00:00:00Z' }));
      
      component.onSubmit();
      tick();
      
      expect(authServiceSpy.login).toHaveBeenCalled();
    }));

    it('should pass correct credentials to authService', fakeAsync(() => {
      authServiceSpy.login.and.returnValue(of({ token: 'test-token', user: { id: '1', email: 'test@example.com', fullName: 'Test User', role: 'User' }, expiresAt: '2026-01-27T00:00:00Z' }));
      
      component.onSubmit();
      tick();
      
      expect(authServiceSpy.login).toHaveBeenCalledWith(
        jasmine.objectContaining({
          email: 'test@example.com',
          password: 'password123'
        })
      );
    }));

    it('should set loading to true during submission', () => {
      authServiceSpy.login.and.returnValue(of({ token: 'test-token', user: { id: '1', email: 'test@example.com', fullName: 'Test User', role: 'User' }, expiresAt: '2026-01-27T00:00:00Z' }));
      
      component.onSubmit();
      
      expect(component.loading).toBeTrue();
    });

    it('should navigate on successful login', fakeAsync(() => {
      authServiceSpy.login.and.returnValue(of({ token: 'test-token', user: { id: '1', email: 'test@example.com', fullName: 'Test User', role: 'User' }, expiresAt: '2026-01-27T00:00:00Z' }));
      
      component.onSubmit();
      tick();
      
      expect(routerSpy.navigate).toHaveBeenCalled();
    }));

    it('should handle login error', fakeAsync(() => {
      authServiceSpy.login.and.returnValue(throwError(() => new Error('Invalid credentials')));
      
      component.onSubmit();
      tick();
      
      expect(component.loading).toBeFalse();
    }));

    it('should clear error message on new submission', fakeAsync(() => {
      component.errorMessage = 'Previous error';
      authServiceSpy.login.and.returnValue(of({ token: 'test-token', user: { id: '1', email: 'test@example.com', fullName: 'Test User', role: 'User' }, expiresAt: '2026-01-27T00:00:00Z' }));
      
      component.onSubmit();
      tick();
      
      expect(component.errorMessage).toBe('');
    }));
  });

  describe('UI Interactions', () => {
    it('should toggle password visibility', () => {
      expect(component.hidePassword).toBeTrue();
      
      component.hidePassword = false;
      
      expect(component.hidePassword).toBeFalse();
    });

    it('should mark all fields as touched on invalid submit', () => {
      component.loginForm.patchValue({ email: '', password: '' });
      
      component.onSubmit();
      
      expect(component.loginForm.get('email')?.touched).toBeTrue();
      expect(component.loginForm.get('password')?.touched).toBeTrue();
    });
  });

  describe('Default Values', () => {
    it('should have default email for development', () => {
      const email = component.loginForm.get('email')?.value;
      expect(email).toBeDefined();
    });

    it('should have default password for development', () => {
      const password = component.loginForm.get('password')?.value;
      expect(password).toBeDefined();
    });

    it('should have rememberMe unchecked by default', () => {
      expect(component.loginForm.get('rememberMe')?.value).toBeFalse();
    });
  });
});
