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
 * Guest Guard - Prevents authenticated users from accessing guest-only routes
 * 
 * This guard is useful for login/register pages where authenticated users
 * should be redirected away.
 * 
 * @param route - The activated route snapshot
 * @param state - The router state snapshot
 * @returns boolean (true if not authenticated) or UrlTree (redirect to home)
 * 
 * @example
 * // In app.routes.ts
 * {
 *   path: 'login',
 *   component: LoginComponent,
 *   canActivate: [guestGuard]
 * }
 */
export const guestGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  try {
    // Check if user is authenticated
    const isAuthenticated = authService.isAuthenticated();
    
    if (!isAuthenticated) {
      // User is not authenticated, allow access to guest pages
      console.log(`[GuestGuard] Access granted to guest page: ${state.url}`);
      return true;
    }

    // User is authenticated, redirect to home
    console.log('[GuestGuard] User already authenticated. Redirecting to hotels.');
    return router.createUrlTree(['/hotels']);

  } catch (error) {
    console.error('[GuestGuard] Error checking authentication:', error);
    // On error, allow access to be safe
    return true;
  }
};
