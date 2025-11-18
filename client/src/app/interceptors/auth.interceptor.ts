import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

/**
 * Auth Interceptor - Adds JWT token to HTTP requests
 * 
 * This functional interceptor:
 * 1. Gets JWT token from localStorage
 * 2. Adds Authorization header with Bearer token to requests
 * 3. Skips auth header for login/register endpoints
 * 4. Handles 401 Unauthorized responses by redirecting to login
 * 
 * @param req - The outgoing HTTP request
 * @param next - The next handler in the chain
 * @returns Observable of the HTTP event
 * 
 * @example
 * // In app.config.ts
 * provideHttpClient(
 *   withInterceptors([authInterceptor])
 * )
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // List of endpoints that should not have auth token
  const skipAuthEndpoints = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/forgot-password',
    '/api/auth/reset-password'
  ];

  // Check if the request URL should skip authentication
  const shouldSkipAuth = skipAuthEndpoints.some(endpoint => 
    req.url.includes(endpoint)
  );

  try {
    // Get token from localStorage
    const token = localStorage.getItem('token');

    // If token exists and endpoint requires auth, add Authorization header
    if (token && !shouldSkipAuth) {
      console.log(`[AuthInterceptor] Adding token to request: ${req.method} ${req.url}`);
      
      // Clone the request and add Authorization header
      const clonedRequest = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });

      // Pass the cloned request to the next handler
      return next(clonedRequest).pipe(
        catchError((error: HttpErrorResponse) => {
          return handleAuthError(error, router);
        })
      );
    }

    // No token or endpoint doesn't require auth
    if (shouldSkipAuth) {
      console.log(`[AuthInterceptor] Skipping auth for: ${req.method} ${req.url}`);
    } else {
      console.log(`[AuthInterceptor] No token found for: ${req.method} ${req.url}`);
    }

    // Pass the original request
    return next(req).pipe(
      catchError((error: HttpErrorResponse) => {
        return handleAuthError(error, router);
      })
    );

  } catch (error) {
    console.error('[AuthInterceptor] Error processing request:', error);
    // On error, pass the original request
    return next(req).pipe(
      catchError((error: HttpErrorResponse) => {
        return handleAuthError(error, router);
      })
    );
  }
};

/**
 * Handle authentication errors
 * 
 * @param error - The HTTP error response
 * @param router - Angular router for navigation
 * @returns Observable that throws the error
 */
function handleAuthError(error: HttpErrorResponse, router: Router) {
  if (error.status === 401) {
    // Unauthorized - token is invalid or expired
    console.warn('[AuthInterceptor] 401 Unauthorized - Redirecting to login');
    
    // Clear invalid token
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Get current URL for return redirect
    const currentUrl = router.url;
    
    // Redirect to login with return URL
    router.navigate(['/login'], {
      queryParams: { returnUrl: currentUrl }
    });
  } else if (error.status === 403) {
    // Forbidden - user doesn't have permission
    console.warn('[AuthInterceptor] 403 Forbidden - Access denied');
  } else if (error.status === 0) {
    // Network error or CORS issue
    console.error('[AuthInterceptor] Network error - Check API connection');
  }

  // Re-throw the error for component-level handling
  return throwError(() => error);
}
