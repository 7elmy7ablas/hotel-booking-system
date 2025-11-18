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
 * Role Guard - Protects routes based on user roles
 * 
 * This guard checks if the authenticated user has the required role(s)
 * to access a specific route.
 * 
 * @param route - The activated route snapshot (should contain 'roles' in data)
 * @param state - The router state snapshot
 * @returns boolean (true if authorized) or UrlTree (redirect)
 * 
 * @example
 * // In app.routes.ts
 * {
 *   path: 'admin',
 *   component: AdminComponent,
 *   canActivate: [authGuard, roleGuard],
 *   data: { roles: ['Admin', 'Manager'] }
 * }
 */
export const roleGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  try {
    // First check if user is authenticated
    if (!authService.isAuthenticated()) {
      console.warn('[RoleGuard] User not authenticated. Redirecting to login.');
      return router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url }
      });
    }

    // Get required roles from route data
    const requiredRoles = route.data['roles'] as string[] | undefined;

    // If no roles specified, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      console.log('[RoleGuard] No roles required. Access granted.');
      return true;
    }

    // Get current user
    const currentUser = authService.getCurrentUser();

    if (!currentUser || !currentUser.role) {
      console.warn('[RoleGuard] User role not found. Access denied.');
      return router.createUrlTree(['/hotels']);
    }

    // Check if user has required role
    const hasRole = requiredRoles.includes(currentUser.role);

    if (hasRole) {
      console.log(`[RoleGuard] User has required role. Access granted to: ${state.url}`);
      return true;
    }

    // User doesn't have required role
    console.warn(`[RoleGuard] User role '${currentUser.role}' not authorized. Required: ${requiredRoles.join(', ')}`);
    return router.createUrlTree(['/hotels']);

  } catch (error) {
    console.error('[RoleGuard] Error checking role authorization:', error);
    return router.createUrlTree(['/hotels']);
  }
};
