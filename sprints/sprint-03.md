# Sprint 3 Planning Document: Angular Frontend Development

## Sprint Overview

| **Sprint** | **Sprint 3: Angular Frontend Development** |
|------------|-------------------------------------------|
| **Duration** | 2 weeks |
| **Start Date** | December 18, 2025 |
| **End Date** | December 31, 2025 |
| **Capacity** | 40 hours |
| **Team Velocity** | 23 story points |
| **Sprint Goal** | Build core Angular 19 components with Signals and standalone architecture for hotel booking system |

## User Stories

### US-10: Authentication UI (5 Story Points)

**Description:** As a user, I want to be able to log in and register for an account so that I can access personalized booking features.

**Acceptance Criteria:**
- [ ] User can navigate to login page with email/password fields
- [ ] User can register with email, password, and confirm password fields
- [ ] Form validation displays appropriate error messages
- [ ] Successful authentication redirects to dashboard
- [ ] JWT tokens are stored securely in localStorage
- [ ] Route guards protect authenticated routes

**Task Breakdown:**
- Create login component (4 hours)
- Create register component (4 hours)
- Implement auth service with JWT handling (6 hours)
- Create route guards (3 hours)
- Add form validation and error handling (3 hours)

**AI Prompt for GitHub Copilot:**
"Create Angular 19 standalone authentication components using Signals for state management. Implement login and register forms with reactive validation, JWT token handling, and route guards. Use the following structure:

1. Auth service with computed signals for authentication state
2. Standalone login/register components with signal-based form handling
3. Route guards using inject() function and canActivate functional guards
4. Form validation using Angular reactive forms with custom validators
5. HTTP interceptor for JWT token attachment
6. Error handling with signal-based error state management

Example structure:
- auth.service.ts: Use signal() for user state, computed() for isAuthenticated
- login.component.ts: Standalone component with FormBuilder and signal-based validation
- auth.guard.ts: Functional guard using inject(AuthService) and Router
- Use takeUntilDestroyed() for subscription management in components"
// Additional Implementation Details:
- Store JWT in HttpOnly cookie (preferred) or localStorage as fallback
- Use HttpInterceptor for automatic Bearer token attachment to API requests
- Implement functional route guards using inject() and signal-based authentication state
- Use Angular Material components (MatFormField, MatInput, MatButton, MatCard) for consistent UI
- Implement proper error handling with MatSnackBar for user feedback
- Use signal-based reactive patterns throughout authentication flow
- Add loading states using signals for better UX
- Implement automatic token refresh mechanism
- Use Angular's new control flow (@if, @for) in templates
- Follow Angular 19 best practices with standalone components and inject() function

Example implementation patterns:
```typescript
// auth.service.ts
export class AuthService {
  private userSignal = signal<User | null>(null);
  private loadingSignal = signal(false);
  
  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.userSignal());
  readonly isLoading = this.loadingSignal.asReadonly();
}

// auth.interceptor.ts
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }
  return next(req);
};

// auth.guard.ts
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  return authService.isAuthenticated() || router.createUrlTree(['/login']);
};
