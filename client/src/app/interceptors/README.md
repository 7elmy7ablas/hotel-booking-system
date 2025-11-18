# HTTP Interceptors Documentation

## Overview
This directory contains HTTP interceptors for the Hotel Booking application. Interceptors allow you to inspect and transform HTTP requests and responses globally.

## Available Interceptors

### 1. authInterceptor
**File**: `auth.interceptor.ts`

**Purpose**: Adds JWT authentication token to HTTP requests.

**Features**:
- ✅ Gets JWT token from localStorage
- ✅ Adds `Authorization: Bearer <token>` header to requests
- ✅ Skips auth header for login/register endpoints
- ✅ Handles 401 Unauthorized responses
- ✅ Redirects to login on authentication failure
- ✅ Clears invalid tokens
- ✅ Preserves return URL for post-login redirect

**Behavior**:

1. **Token Injection**:
   ```typescript
   // Before interceptor
   GET /api/hotels
   
   // After interceptor (if token exists)
   GET /api/hotels
   Headers: {
     Authorization: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   }
   ```

2. **Skip Auth Endpoints**:
   - `/api/auth/login` - No token needed
   - `/api/auth/register` - No token needed
   - `/api/auth/forgot-password` - No token needed
   - `/api/auth/reset-password` - No token needed

3. **401 Handling**:
   ```
   API returns 401 Unauthorized
   ↓
   Clear token from localStorage
   ↓
   Redirect to /login?returnUrl=<current-url>
   ```

**Usage**:
```typescript
// Automatically applied to all HTTP requests
this.http.get('/api/bookings').subscribe(...);
// Token is automatically added if available
```

---

### 2. errorInterceptor
**File**: `error.interceptor.ts`

**Purpose**: Global HTTP error handling with user-friendly messages.

**Features**:
- ✅ Catches all HTTP errors
- ✅ Provides user-friendly error messages
- ✅ Logs errors for debugging
- ✅ Handles client-side and server-side errors
- ✅ Maps status codes to messages

**Error Messages by Status Code**:

| Status | Message |
|--------|---------|
| 0 | Network error. Please check your internet connection. |
| 400 | Bad request. Please check your input. |
| 401 | Unauthorized. Please login again. |
| 403 | Access denied. You do not have permission. |
| 404 | The requested resource was not found. |
| 409 | Conflict. The resource already exists. |
| 422 | Validation error. Please check your input. |
| 500 | Internal server error. Please try again later. |
| 502 | Bad gateway. The server is temporarily unavailable. |
| 503 | Service unavailable. Please try again later. |
| 504 | Gateway timeout. The server took too long to respond. |

**Usage**:
```typescript
// In component
this.http.get('/api/hotels').subscribe({
  next: (data) => console.log(data),
  error: (error) => {
    // error.userMessage contains user-friendly message
    this.snackBar.open(error.userMessage, 'Close');
  }
});
```

---

## Configuration

### app.config.ts
```typescript
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth.interceptor';
import { errorInterceptor } from './interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor])
    )
  ]
};
```

**Interceptor Order**:
1. `authInterceptor` - Adds token first
2. `errorInterceptor` - Handles errors second

---

## How Interceptors Work

### Request Flow
```
Component makes HTTP request
         ↓
   authInterceptor
   (adds token)
         ↓
   HTTP Request sent
         ↓
   Server Response
         ↓
   errorInterceptor
   (handles errors)
         ↓
   Component receives response
```

### Interceptor Chain
```typescript
// Multiple interceptors are chained
provideHttpClient(
  withInterceptors([
    interceptor1,  // Runs first
    interceptor2,  // Runs second
    interceptor3   // Runs third
  ])
)
```

---

## Token Management

### Token Storage
```typescript
// Store token after login
localStorage.setItem('token', response.token);

// Interceptor retrieves it
const token = localStorage.getItem('token');

// Clear token on logout or 401
localStorage.removeItem('token');
```

### Token Format
```
Authorization: Bearer <JWT_TOKEN>
```

Example:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

---

## Error Handling Examples

### Component-Level Error Handling
```typescript
// In component
this.hotelService.getHotels().subscribe({
  next: (hotels) => {
    this.hotels = hotels;
  },
  error: (error) => {
    // Use user-friendly message from errorInterceptor
    this.errorMessage = error.userMessage;
    
    // Or handle specific status codes
    if (error.status === 404) {
      this.errorMessage = 'No hotels found';
    }
  }
});
```

### Service-Level Error Handling
```typescript
// In service
getHotels(): Observable<Hotel[]> {
  return this.http.get<Hotel[]>('/api/hotels').pipe(
    catchError((error) => {
      console.error('Error fetching hotels:', error);
      // Re-throw or return default value
      return of([]);
    })
  );
}
```

---

## Testing Interceptors

### Manual Testing

#### Test authInterceptor:
```bash
# 1. Login to get token
POST /api/auth/login
Response: { token: "..." }

# 2. Make authenticated request
GET /api/bookings
# Check Network tab - should have Authorization header

# 3. Clear token and make request
localStorage.removeItem('token');
GET /api/bookings
# Should redirect to login
```

#### Test 401 Handling:
```bash
# 1. Set invalid token
localStorage.setItem('token', 'invalid-token');

# 2. Make request
GET /api/bookings
# Should get 401, clear token, redirect to login
```

#### Test Skip Auth:
```bash
# Login/register should work without token
POST /api/auth/login
# Check Network tab - should NOT have Authorization header
```

### Unit Testing

```typescript
import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting()
      ]
    });

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should add Authorization header when token exists', () => {
    localStorage.setItem('token', 'test-token');
    
    const http = TestBed.inject(HttpClient);
    http.get('/api/hotels').subscribe();

    const req = httpMock.expectOne('/api/hotels');
    expect(req.request.headers.has('Authorization')).toBe(true);
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');
  });

  it('should not add Authorization header for login endpoint', () => {
    localStorage.setItem('token', 'test-token');
    
    const http = TestBed.inject(HttpClient);
    http.post('/api/auth/login', {}).subscribe();

    const req = httpMock.expectOne('/api/auth/login');
    expect(req.request.headers.has('Authorization')).toBe(false);
  });

  it('should handle 401 error', () => {
    localStorage.setItem('token', 'test-token');
    
    const http = TestBed.inject(HttpClient);
    http.get('/api/bookings').subscribe({
      error: (error) => {
        expect(error.status).toBe(401);
        expect(localStorage.getItem('token')).toBeNull();
      }
    });

    const req = httpMock.expectOne('/api/bookings');
    req.flush({}, { status: 401, statusText: 'Unauthorized' });
  });
});
```

---

## Debugging

### Enable Console Logging
Both interceptors include console logging:

```typescript
// authInterceptor logs
console.log('[AuthInterceptor] Adding token to request: GET /api/hotels');
console.log('[AuthInterceptor] Skipping auth for: POST /api/auth/login');
console.warn('[AuthInterceptor] 401 Unauthorized - Redirecting to login');

// errorInterceptor logs
console.error('[ErrorInterceptor] Backend returned code 404');
console.error('[ErrorInterceptor] Full error:', error);
```

### Check Network Tab
1. Open browser DevTools
2. Go to Network tab
3. Make HTTP request
4. Check request headers for `Authorization`
5. Check response status and body

### Check localStorage
```javascript
// In browser console
localStorage.getItem('token');
// Should return JWT token or null
```

---

## Common Issues

### Token Not Being Added
**Problem**: Authorization header missing from requests

**Solutions**:
1. Check token exists in localStorage
2. Verify endpoint is not in skip list
3. Check interceptor is registered in app.config.ts
4. Clear browser cache and reload

### 401 Loop
**Problem**: Continuous redirects to login

**Solutions**:
1. Ensure login endpoint is in skip list
2. Check token is being stored after login
3. Verify token format is correct
4. Check backend is returning valid token

### CORS Errors
**Problem**: CORS policy blocking requests

**Solutions**:
1. Configure backend CORS settings
2. Check API URL is correct
3. Verify Authorization header is allowed in CORS
4. Use proxy configuration for development

---

## Best Practices

1. **Always use HTTPS in production**
   - JWT tokens should never be sent over HTTP
   - Use secure flag for cookies if applicable

2. **Token Expiration**
   - Implement token refresh mechanism
   - Check token expiration before requests
   - Handle token refresh in interceptor

3. **Error Messages**
   - Show user-friendly messages to users
   - Log detailed errors for debugging
   - Don't expose sensitive information

4. **Security**
   - Never log tokens in production
   - Clear tokens on logout
   - Validate tokens on backend
   - Use short-lived tokens

5. **Testing**
   - Test with valid tokens
   - Test with invalid tokens
   - Test with expired tokens
   - Test skip auth endpoints

---

## Future Enhancements

- [ ] Token refresh mechanism
- [ ] Token expiration check
- [ ] Retry failed requests after token refresh
- [ ] Request caching
- [ ] Request throttling/debouncing
- [ ] Loading indicator interceptor
- [ ] Request/response logging interceptor
- [ ] Mock data interceptor for testing
- [ ] Offline mode handling
- [ ] Request queue for offline requests

---

## Related Files

- `app.config.ts` - Interceptor configuration
- `auth.service.ts` - Authentication service
- `auth.guard.ts` - Route guard
- `services/*.service.ts` - HTTP services using interceptors
