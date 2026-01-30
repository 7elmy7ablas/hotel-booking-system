import { TestBed } from '@angular/core/testing';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';

describe('authGuard', () => {
  let mockAuthService: { isAuthenticated: boolean };
  let router: jasmine.SpyObj<Router>;
  let mockRoute: ActivatedRouteSnapshot;
  let mockState: RouterStateSnapshot;

  beforeEach(() => {
    // Create mock auth service with isAuthenticated as a property
    mockAuthService = { isAuthenticated: false };
    const routerSpy = jasmine.createSpyObj('Router', ['createUrlTree']);

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: routerSpy }
      ]
    });

    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Mock route and state
    mockRoute = {} as ActivatedRouteSnapshot;
    mockState = { url: '/profile' } as RouterStateSnapshot;
  });

  it('should be created', () => {
    expect(authGuard).toBeTruthy();
  });

  describe('when user is authenticated', () => {
    beforeEach(() => {
      mockAuthService.isAuthenticated = true;
    });

    it('should return true and allow access', () => {
      const result = TestBed.runInInjectionContext(() => 
        authGuard(mockRoute, mockState)
      );

      expect(result).toBe(true);
    });

    it('should not call router.createUrlTree', () => {
      TestBed.runInInjectionContext(() => 
        authGuard(mockRoute, mockState)
      );

      expect(router.createUrlTree).not.toHaveBeenCalled();
    });
  });

  describe('when user is not authenticated', () => {
    beforeEach(() => {
      mockAuthService.isAuthenticated = false;
      router.createUrlTree.and.returnValue({} as any);
    });

    it('should redirect to login page', () => {
      TestBed.runInInjectionContext(() => 
        authGuard(mockRoute, mockState)
      );

      expect(router.createUrlTree).toHaveBeenCalledWith(
        ['/login'],
        { queryParams: { returnUrl: '/profile' } }
      );
    });

    it('should include returnUrl in query params', () => {
      const customState = { url: '/bookings/create' } as RouterStateSnapshot;
      
      TestBed.runInInjectionContext(() => 
        authGuard(mockRoute, customState)
      );

      expect(router.createUrlTree).toHaveBeenCalledWith(
        ['/login'],
        { queryParams: { returnUrl: '/bookings/create' } }
      );
    });

    it('should return UrlTree', () => {
      const mockUrlTree = {} as any;
      router.createUrlTree.and.returnValue(mockUrlTree);

      const result = TestBed.runInInjectionContext(() => 
        authGuard(mockRoute, mockState)
      );

      expect(result).toBe(mockUrlTree);
    });
  });

  describe('different route URLs', () => {
    beforeEach(() => {
      mockAuthService.isAuthenticated = false;
      router.createUrlTree.and.returnValue({} as any);
    });

    it('should handle root path', () => {
      const state = { url: '/' } as RouterStateSnapshot;
      
      TestBed.runInInjectionContext(() => 
        authGuard(mockRoute, state)
      );

      expect(router.createUrlTree).toHaveBeenCalledWith(
        ['/login'],
        { queryParams: { returnUrl: '/' } }
      );
    });

    it('should handle nested paths', () => {
      const state = { url: '/bookings/123/details' } as RouterStateSnapshot;
      
      TestBed.runInInjectionContext(() => 
        authGuard(mockRoute, state)
      );

      expect(router.createUrlTree).toHaveBeenCalledWith(
        ['/login'],
        { queryParams: { returnUrl: '/bookings/123/details' } }
      );
    });

    it('should handle paths with query params', () => {
      const state = { url: '/hotels?city=Paris&guests=2' } as RouterStateSnapshot;
      
      TestBed.runInInjectionContext(() => 
        authGuard(mockRoute, state)
      );

      expect(router.createUrlTree).toHaveBeenCalledWith(
        ['/login'],
        { queryParams: { returnUrl: '/hotels?city=Paris&guests=2' } }
      );
    });
  });
});
