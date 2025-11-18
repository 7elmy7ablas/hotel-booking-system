import { inject } from '@angular/core';
import { 
  Router, 
  CanActivateFn, 
  ActivatedRouteSnapshot, 
  RouterStateSnapshot,
  UrlTree 
} from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Auth Guard - Protects routes that require authentication
 * 
 * This functional guard checks if the user is authenticated by verifying:
 * 1. JWT token exists in localStorage
 * 2. AuthService.isAuthenticated() returns true
 * 
 * If authenticated: Allows access to the route
 * If not authenticated: Redirects to /login with returnUrl query parameter
 * 
 * @param route - The activated route snapshot
 * @param state - The router state snapshot
 * @returns boolean (true if authenticated) or UrlTree (redirect to login)
 * 
 * @example
 * // In app.routes.ts
 * {
 *   path: 'profile',
 *   component: ProfileComponent,
 *   canActivate: [authGuard]
 * }
 */
export const authGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  try {
    // Check if user is authenticated
    const isAuthenticated = authService.isAuthenticated;
    
    if (isAuthenticated) {
      // User is authenticated, allow access
      console.log(`[AuthGuard] Access granted to: ${state.url}`);
      return true;
    }

    // User is not authenticated
    console.warn(`[AuthGuard] Access denied to: ${state.url}. Redirecting to login.`);
    
    // Store the attempted URL for redirecting after login
    const returnUrl = state.url;
    
    // Create a UrlTree for redirection with query params
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl }
    });

  } catch (error) {
    // Handle any errors during authentication check
    console.error('[AuthGuard] Error checking authentication:', error);
    
    // On error, redirect to login for safety
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url }
    });
  }
};
