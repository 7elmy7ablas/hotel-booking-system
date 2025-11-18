# Angular Route Guards Documentation

## Overview
This directory contains functional route guards for the Hotel Booking application. Guards are used to control access to routes based on authentication and authorization.

## Available Guards

### 1. authGuard
**File**: `auth.guard.ts`

**Purpose**: Protects routes that require authentication.

**Behavior**:
- ✅ Checks if user is authenticated (JWT token exists)
- ✅ If authenticated: Allows access
- ❌ If not authenticated: Redirects to `/login` with `returnUrl` query parameter

**Usage**:
```typescript
// In app.routes.ts
{
  path: 'profile',
  component: ProfileComponent,
  canActivate: [authGuard],
  title: 'My Profile'
}
```

**Example Routes**:
- `/profile` - User profile page
- `/bookings` - User bookings list
- `/bookings/create` - Create new booking

---

### 2. roleGuard
**File**: `role.guard.ts`

**Purpose**: Protects routes based on user roles (Admin, Manager, User, etc.).

**Behavior**:
- ✅ First checks authentication
- ✅ Then checks if user has required role(s)
- ✅ If authorized: Allows access
- ❌ If not authorized: Redirects to `/hotels`

**Usage**:
```typescript
// In app.routes.ts
{
  path: 'admin',
  component: AdminComponent,
  canActivate: [authGuard, roleGuard],
  data: { roles: ['Admin', 'Manager'] },
  title: 'Admin Dashboard'
}
```

**Route Data**:
- `roles`: Array of allowed role names
- If no roles specified, access is granted

**Example Routes**:
- `/admin` - Admin dashboard (Admin only)
- `/admin/hotels` - Manage hotels (Admin, Manager)
- `/admin/users` - Manage users (Admin only)

---

### 3. guestGuard
**File**: `guest.guard.ts`

**Purpose**: Prevents authenticated users from accessing guest-only pages.

**Behavior**:
- ✅ If not authenticated: Allows access
- ❌ If authenticated: Redirects to `/hotels`

**Usage**:
```typescript
// In app.routes.ts
{
  path: 'login',
  component: LoginComponent,
  canActivate: [guestGuard],
  title: 'Login'
}
```

**Example Routes**:
- `/login` - Login page
- `/register` - Registration page

---

## Guard Flow Diagrams

### authGuard Flow
```
User tries to access protected route
         ↓
Is user authenticated?
    ↓           ↓
   YES          NO
    ↓           ↓
  ALLOW    REDIRECT to /login
  ACCESS   (with returnUrl)
```

### roleGuard Flow
```
User tries to access role-protected route
         ↓
Is user authenticated?
    ↓           ↓
   YES          NO
    ↓           ↓
Does user    REDIRECT
have role?   to /login
    ↓
   YES / NO
    ↓     ↓
  ALLOW  REDIRECT
  ACCESS to /hotels
```

### guestGuard Flow
```
User tries to access guest-only route
         ↓
Is user authenticated?
    ↓           ↓
   YES          NO
    ↓           ↓
REDIRECT      ALLOW
to /hotels    ACCESS
```

---

## Implementation Details

### Functional Guards (Angular 19)
All guards use the modern functional approach with `CanActivateFn`:

```typescript
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Guard logic here
};
```

### Dependency Injection
Guards use the `inject()` function to access services:
- `AuthService` - For authentication checks
- `Router` - For navigation/redirects

### Return Types
Guards can return:
- `boolean` - `true` to allow, `false` to deny
- `UrlTree` - For redirects (preferred over `router.navigate()`)

### Error Handling
All guards include try-catch blocks to handle errors gracefully:
```typescript
try {
  // Guard logic
} catch (error) {
  console.error('[GuardName] Error:', error);
  // Safe fallback behavior
}
```

---

## Authentication Check

### How It Works
The `authGuard` checks authentication by:

1. **Calling `AuthService.isAuthenticated()`**
   ```typescript
   isAuthenticated(): boolean {
     const token = localStorage.getItem('token');
     return !!token;
   }
   ```

2. **Checking JWT Token**
   - Token stored in `localStorage` with key `'token'`
   - Returns `true` if token exists
   - Returns `false` if token is missing

3. **Optional: Token Validation**
   - Can be enhanced to check token expiration
   - Can verify token format/structure
   - Can validate with backend

---

## Return URL Feature

### Purpose
Stores the intended destination URL so users can be redirected after login.

### How It Works

1. **User tries to access protected route**
   ```
   User navigates to: /bookings
   ```

2. **Guard redirects with returnUrl**
   ```typescript
   router.createUrlTree(['/login'], {
     queryParams: { returnUrl: '/bookings' }
   });
   ```
   Result: `/login?returnUrl=/bookings`

3. **After successful login**
   ```typescript
   // In LoginComponent
   const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/hotels';
   this.router.navigate([returnUrl]);
   ```
   User is redirected to: `/bookings`

---

## Usage Examples

### Basic Protected Route
```typescript
{
  path: 'profile',
  component: ProfileComponent,
  canActivate: [authGuard]
}
```

### Multiple Guards
```typescript
{
  path: 'admin/users',
  component: UserManagementComponent,
  canActivate: [authGuard, roleGuard],
  data: { roles: ['Admin'] }
}
```

### Guest-Only Route
```typescript
{
  path: 'login',
  component: LoginComponent,
  canActivate: [guestGuard]
}
```

### Child Routes with Guards
```typescript
{
  path: 'admin',
  canActivate: [authGuard, roleGuard],
  data: { roles: ['Admin'] },
  children: [
    { path: 'dashboard', component: AdminDashboardComponent },
    { path: 'hotels', component: HotelManagementComponent },
    { path: 'users', component: UserManagementComponent }
  ]
}
```

---

## Testing Guards

### Manual Testing

1. **Test authGuard**:
   ```bash
   # Without login
   Navigate to: http://localhost:4200/profile
   Expected: Redirect to /login?returnUrl=/profile
   
   # After login
   Navigate to: http://localhost:4200/profile
   Expected: Access granted
   ```

2. **Test roleGuard**:
   ```bash
   # Login as regular user
   Navigate to: http://localhost:4200/admin
   Expected: Redirect to /hotels
   
   # Login as admin
   Navigate to: http://localhost:4200/admin
   Expected: Access granted
   ```

3. **Test guestGuard**:
   ```bash
   # While logged in
   Navigate to: http://localhost:4200/login
   Expected: Redirect to /hotels
   
   # After logout
   Navigate to: http://localhost:4200/login
   Expected: Access granted
   ```

### Unit Testing

```typescript
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated']);
    const routerSpy = jasmine.createSpyObj('Router', ['createUrlTree']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should allow access when authenticated', () => {
    authService.isAuthenticated.and.returnValue(true);
    
    const result = authGuard(null as any, { url: '/profile' } as any);
    
    expect(result).toBe(true);
  });

  it('should redirect to login when not authenticated', () => {
    authService.isAuthenticated.and.returnValue(false);
    
    authGuard(null as any, { url: '/profile' } as any);
    
    expect(router.createUrlTree).toHaveBeenCalledWith(
      ['/login'],
      { queryParams: { returnUrl: '/profile' } }
    );
  });
});
```

---

## Troubleshooting

### Guard Not Working
1. Check that guard is imported in routes
2. Verify `AuthService.isAuthenticated()` logic
3. Check localStorage for token
4. Look for console errors/warnings

### Infinite Redirect Loop
1. Ensure login route doesn't have `authGuard`
2. Check that `guestGuard` redirects to valid route
3. Verify guard return values

### Token Not Found
1. Check token is stored after login
2. Verify localStorage key name matches
3. Check for token expiration

### Role Check Failing
1. Verify user object has `role` property
2. Check role names match exactly (case-sensitive)
3. Ensure route data includes `roles` array

---

## Best Practices

1. **Always use UrlTree for redirects**
   ```typescript
   // ✅ Good
   return router.createUrlTree(['/login']);
   
   // ❌ Avoid
   router.navigate(['/login']);
   return false;
   ```

2. **Include error handling**
   ```typescript
   try {
     // Guard logic
   } catch (error) {
     console.error('[Guard] Error:', error);
     // Safe fallback
   }
   ```

3. **Log guard decisions**
   ```typescript
   console.log('[AuthGuard] Access granted');
   console.warn('[AuthGuard] Access denied');
   ```

4. **Combine guards when needed**
   ```typescript
   canActivate: [authGuard, roleGuard]
   ```

5. **Store returnUrl for better UX**
   ```typescript
   queryParams: { returnUrl: state.url }
   ```

---

## Future Enhancements

- [ ] Token expiration check
- [ ] JWT token validation
- [ ] Permission-based guard (more granular than roles)
- [ ] Can deactivate guard (prevent navigation away)
- [ ] Async guards with Observable/Promise
- [ ] Guard for checking email verification
- [ ] Guard for subscription/payment status
