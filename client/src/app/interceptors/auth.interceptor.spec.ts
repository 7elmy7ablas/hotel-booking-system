import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { authInterceptor } from './auth.interceptor';
import { TokenService } from '../services/token.service';

describe('authInterceptor', () => {
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let router: jasmine.SpyObj<Router>;
  let tokenService: jasmine.SpyObj<TokenService>;

  beforeEach(() => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate'], {
      url: '/test-url'
    });
    
    const tokenServiceSpy = jasmine.createSpyObj('TokenService', ['getToken', 'clearToken']);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerSpy },
        { provide: TokenService, useValue: tokenServiceSpy }
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
    httpClient = TestBed.inject(HttpClient);
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    tokenService = TestBed.inject(TokenService) as jasmine.SpyObj<TokenService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Token Injection', () => {
    it('should add Authorization header when token exists', () => {
      const testToken = 'test-jwt-token';
      tokenService.getToken.and.returnValue(testToken);

      httpClient.get('/api/hotels').subscribe();

      const req = httpMock.expectOne('/api/hotels');
      expect(req.request.headers.has('Authorization')).toBe(true);
      expect(req.request.headers.get('Authorization')).toBe(`Bearer ${testToken}`);
      
      req.flush({});
    });

    it('should not add Authorization header when token does not exist', () => {
      tokenService.getToken.and.returnValue(null);

      httpClient.get('/api/hotels').subscribe();

      const req = httpMock.expectOne('/api/hotels');
      expect(req.request.headers.has('Authorization')).toBe(false);
      
      req.flush({});
    });
  });

  describe('Skip Auth Endpoints', () => {
    beforeEach(() => {
      tokenService.getToken.and.returnValue('test-token');
    });

    it('should not add Authorization header for login endpoint', () => {
      httpClient.post('/api/auth/login', {}).subscribe();

      const req = httpMock.expectOne('/api/auth/login');
      expect(req.request.headers.has('Authorization')).toBe(false);
      
      req.flush({});
    });

    it('should not add Authorization header for register endpoint', () => {
      httpClient.post('/api/auth/register', {}).subscribe();

      const req = httpMock.expectOne('/api/auth/register');
      expect(req.request.headers.has('Authorization')).toBe(false);
      
      req.flush({});
    });

    it('should not add Authorization header for forgot-password endpoint', () => {
      httpClient.post('/api/auth/forgot-password', {}).subscribe();

      const req = httpMock.expectOne('/api/auth/forgot-password');
      expect(req.request.headers.has('Authorization')).toBe(false);
      
      req.flush({});
    });

    it('should not add Authorization header for reset-password endpoint', () => {
      httpClient.post('/api/auth/reset-password', {}).subscribe();

      const req = httpMock.expectOne('/api/auth/reset-password');
      expect(req.request.headers.has('Authorization')).toBe(false);
      
      req.flush({});
    });
  });

  describe('401 Error Handling', () => {
    beforeEach(() => {
      tokenService.getToken.and.returnValue('test-token');
    });

    it('should clear token on 401 error', (done) => {
      httpClient.get('/api/bookings').subscribe({
        error: () => {
          expect(tokenService.clearToken).toHaveBeenCalled();
          done();
        }
      });

      const req = httpMock.expectOne('/api/bookings');
      req.flush({}, { status: 401, statusText: 'Unauthorized' });
    });

    it('should redirect to login on 401 error', (done) => {
      httpClient.get('/api/bookings').subscribe({
        error: () => {
          expect(router.navigate).toHaveBeenCalledWith(
            ['/login'],
            jasmine.objectContaining({ queryParams: jasmine.any(Object) })
          );
          done();
        }
      });

      const req = httpMock.expectOne('/api/bookings');
      req.flush({}, { status: 401, statusText: 'Unauthorized' });
    });

    it('should pass through error after handling', (done) => {
      httpClient.get('/api/bookings').subscribe({
        error: (error) => {
          expect(error.status).toBe(401);
          done();
        }
      });

      const req = httpMock.expectOne('/api/bookings');
      req.flush({}, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('Other Error Handling', () => {
    it('should handle 403 Forbidden error', (done) => {
      tokenService.getToken.and.returnValue('test-token');

      httpClient.get('/api/admin').subscribe({
        error: (error) => {
          expect(error.status).toBe(403);
          // Token should NOT be cleared for 403
          expect(tokenService.clearToken).not.toHaveBeenCalled();
          done();
        }
      });

      const req = httpMock.expectOne('/api/admin');
      req.flush({}, { status: 403, statusText: 'Forbidden' });
    });

    it('should handle network error (status 0)', (done) => {
      tokenService.getToken.and.returnValue('test-token');

      httpClient.get('/api/hotels').subscribe({
        error: (error) => {
          expect(error.status).toBe(0);
          done();
        }
      });

      const req = httpMock.expectOne('/api/hotels');
      req.error(new ProgressEvent('error'), { status: 0 });
    });
  });

  describe('Different HTTP Methods', () => {
    beforeEach(() => {
      tokenService.getToken.and.returnValue('test-token');
    });

    it('should add token to GET requests', () => {
      httpClient.get('/api/hotels').subscribe();

      const req = httpMock.expectOne('/api/hotels');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      req.flush({});
    });

    it('should add token to POST requests', () => {
      httpClient.post('/api/bookings', {}).subscribe();

      const req = httpMock.expectOne('/api/bookings');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      req.flush({});
    });

    it('should add token to PUT requests', () => {
      httpClient.put('/api/bookings/1', {}).subscribe();

      const req = httpMock.expectOne('/api/bookings/1');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      req.flush({});
    });

    it('should add token to DELETE requests', () => {
      httpClient.delete('/api/bookings/1').subscribe();

      const req = httpMock.expectOne('/api/bookings/1');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      req.flush({});
    });
  });

  describe('Edge Cases', () => {
    it('should handle concurrent requests', () => {
      tokenService.getToken.and.returnValue('test-token');

      httpClient.get('/api/hotels').subscribe();
      httpClient.get('/api/bookings').subscribe();
      httpClient.get('/api/profile').subscribe();

      const req1 = httpMock.expectOne('/api/hotels');
      const req2 = httpMock.expectOne('/api/bookings');
      const req3 = httpMock.expectOne('/api/profile');

      expect(req1.request.headers.get('Authorization')).toBe('Bearer test-token');
      expect(req2.request.headers.get('Authorization')).toBe('Bearer test-token');
      expect(req3.request.headers.get('Authorization')).toBe('Bearer test-token');

      req1.flush({});
      req2.flush({});
      req3.flush({});
    });

    it('should handle URL with query parameters', () => {
      tokenService.getToken.and.returnValue('test-token');

      httpClient.get('/api/hotels?city=Paris&guests=2').subscribe();

      const req = httpMock.expectOne('/api/hotels?city=Paris&guests=2');
      expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
      req.flush({});
    });
  });
});
