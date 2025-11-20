import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { TokenService } from '../services/token.service';

/**
 * Auth Interceptor - Adds JWT token to HTTP requests
 * 
 * This functional interceptor:
 * 1. Gets valid JWT token from TokenService (with expiry check)
 * 2. Adds Authorization header with Bearer token to requests
 * 3. Skips auth header for login/register endpoints
 * 4. Handles 401 Unauthorized responses by redirecting to login
 * 
 * @param req - The outgoing HTTP request
 * @param next - The next handler in the chain
 * @returns Observable of the HTTP event
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const tokenService = inject(TokenService);

  // Get token from TokenService (includes expiry validation)
  const token = tokenService.getToken();

  // Skip adding token for auth endpoints
  const isAuthEndpoint = req.url.includes('/auth/login') || 
                         req.url.includes('/auth/register');

  // Clone request and add Authorization header if token exists
  // SECURITY: No logging of tokens or auth operations
  let authReq = req;
  
  if (token && !isAuthEndpoint) {
    authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  // SECURITY: Removed all console.log statements to prevent token/URL leakage

  // Handle the request and catch errors
  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        // SECURITY: Removed console.error to prevent information leakage
        
        // Clear invalid token using TokenService
        tokenService.clearToken();
        
        // Redirect to login
        router.navigate(['/login'], {
          queryParams: { returnUrl: router.url, reason: 'unauthorized' }
        });
      }
      
      return throwError(() => error);
    })
  );
};


