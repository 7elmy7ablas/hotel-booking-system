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
 * Admin Guard - Protects routes that require Admin role
 * 
 * This functional guard checks if the user:
 * 1. Is authenticated
 * 2. Has the 'Admin' role
 * 
 * If authenticated and admin: Allows access to the route
 * If not authenticated: Redirects to /login with returnUrl
 * If authenticated but not admin: Redirects to home page
 * 
 * @param route - The activated route snapshot
 * @param state - The router state snapshot
 * @returns boolean (true if admin) or UrlTree (redirect)
 * 
 * @example
 * // In app.routes.ts
 * {
 *   path: 'admin',
 *   component: AdminDashboardComponent,
 *   canActivate: [adminGuard]
 * }
 */
export const adminGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  try {
    // First check if user is authenticated
    const isAuthenticated = authService.isAuthenticated;
    
    if (!isAuthenticated) {
      // User is not authenticated, redirect to login
      console.warn(`[AdminGuard] User not authenticated. Redirecting to login.`);
      return router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url }
      });
    }

    // Get current user
    const currentUser = authService.getCurrentUser();
    
    if (!currentUser) {
      console.warn(`[AdminGuard] No user data found. Redirecting to login.`);
      return router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url }
      });
    }

    // Check if user has Admin role
    const userRole = currentUser.role || currentUser.Role;
    const isAdmin = userRole === 'Admin';
    
    if (isAdmin) {
      // User is admin, allow access
      console.log(`[AdminGuard] Admin access granted to: ${state.url}`);
      return true;
    }

    // User is authenticated but not admin
    console.warn(`[AdminGuard] Access denied. User role: ${userRole}. Redirecting to home.`);
    return router.createUrlTree(['/']);

  } catch (error) {
    // Handle any errors during role check
    console.error('[AdminGuard] Error checking admin role:', error);
    
    // On error, redirect to home for safety
    return router.createUrlTree(['/']);
  }
};
