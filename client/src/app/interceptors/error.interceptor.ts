import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

/**
 * Error Interceptor - Global HTTP error handling
 * 
 * This interceptor handles HTTP errors globally and provides
 * user-friendly error messages.
 * 
 * @param req - The outgoing HTTP request
 * @param next - The next handler in the chain
 * @returns Observable of the HTTP event
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An error occurred';

      if (error.error instanceof ErrorEvent) {
        // Client-side or network error
        errorMessage = `Client Error: ${error.error.message}`;
        console.error('[ErrorInterceptor] Client-side error:', error.error.message);
      } else {
        // Backend returned an unsuccessful response code
        errorMessage = getServerErrorMessage(error);
        console.error(
          `[ErrorInterceptor] Backend returned code ${error.status}, ` +
          `body was: ${JSON.stringify(error.error)}`
        );
      }

      // Log the full error for debugging
      console.error('[ErrorInterceptor] Full error:', error);

      // Return an observable with a user-facing error message
      return throwError(() => ({
        ...error,
        userMessage: errorMessage
      }));
    })
  );
};

/**
 * Get user-friendly error message based on HTTP status code
 * 
 * @param error - The HTTP error response
 * @returns User-friendly error message
 */
function getServerErrorMessage(error: HttpErrorResponse): string {
  switch (error.status) {
    case 400:
      return error.error?.message || 'Bad request. Please check your input.';
    case 401:
      return 'Unauthorized. Please login again.';
    case 403:
      return 'Access denied. You do not have permission to perform this action.';
    case 404:
      return error.error?.message || 'The requested resource was not found.';
    case 409:
      return error.error?.message || 'Conflict. The resource already exists.';
    case 422:
      return error.error?.message || 'Validation error. Please check your input.';
    case 500:
      return 'Internal server error. Please try again later.';
    case 502:
      return 'Bad gateway. The server is temporarily unavailable.';
    case 503:
      return 'Service unavailable. Please try again later.';
    case 504:
      return 'Gateway timeout. The server took too long to respond.';
    case 0:
      return 'Network error. Please check your internet connection.';
    default:
      return error.error?.message || `Server error: ${error.status}`;
  }
}
