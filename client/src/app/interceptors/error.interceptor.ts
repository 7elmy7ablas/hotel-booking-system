import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ErrorHandlingService } from '../services/error-handling.service';

/**
 * Error Interceptor - Global HTTP error handling
 * 
 * This interceptor handles HTTP errors globally and provides
 * user-friendly error messages via MatSnackBar using ErrorHandlingService.
 * 
 * @param req - The outgoing HTTP request
 * @param next - The next handler in the chain
 * @returns Observable of the HTTP event
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar);
  const errorService = inject(ErrorHandlingService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Get user-friendly error message from ErrorHandlingService
      const errorDetails = errorService.getUserFriendlyMessage(error);
      
      // Log error for debugging
      errorService.logError(error, 'HTTP Interceptor');

      // Show error message in snackbar
      snackBar.open(errorDetails.message, 'Close', {
        duration: 5000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['error-snackbar']
      });

      // Return an observable with a user-facing error message
      return throwError(() => ({
        ...error,
        userMessage: errorDetails.message,
        errorDetails
      }));
    })
  );
};
