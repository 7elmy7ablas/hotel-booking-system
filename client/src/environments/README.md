# Environment Configuration Guide

## Overview
This directory contains environment-specific configuration files for the Hotel Booking application. These files allow you to manage different settings for development, production, and other environments.

## Files

### environment.ts (Development)
Used during development when running `ng serve` or `ng build`.

```typescript
export const environment = {
  production: false,
  apiUrl: 'https://localhost:7291/api',
  appName: 'Hotel Booking System',
  version: '1.0.0',
  
  features: {
    enableLogging: true,
    enableDebugMode: true,
    enableMockData: false
  },

  endpoints: {
    auth: '/auth',
    hotels: '/hotels',
    rooms: '/rooms',
    bookings: '/bookings',
    users: '/users'
  }
};
```

### environment.prod.ts (Production)
Used when building for production with `ng build --configuration production`.

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-production-api.com/api',
  appName: 'Hotel Booking System',
  version: '1.0.0',
  
  features: {
    enableLogging: false,
    enableDebugMode: false,
    enableMockData: false
  },

  endpoints: {
    auth: '/auth',
    hotels: '/hotels',
    rooms: '/rooms',
    bookings: '/bookings',
    users: '/users'
  }
};
```

## Configuration Properties

### Core Settings

| Property | Type | Description |
|----------|------|-------------|
| `production` | boolean | Indicates if running in production mode |
| `apiUrl` | string | Base URL for API requests |
| `appName` | string | Application name |
| `version` | string | Application version |

### Feature Flags

| Property | Type | Description |
|----------|------|-------------|
| `features.enableLogging` | boolean | Enable console logging |
| `features.enableDebugMode` | boolean | Enable debug mode features |
| `features.enableMockData` | boolean | Use mock data instead of API |

### API Endpoints

| Property | Type | Description |
|----------|------|-------------|
| `endpoints.auth` | string | Authentication endpoints path |
| `endpoints.hotels` | string | Hotels endpoints path |
| `endpoints.rooms` | string | Rooms endpoints path |
| `endpoints.bookings` | string | Bookings endpoints path |
| `endpoints.users` | string | Users endpoints path |

## Usage in Services

### Basic Usage
```typescript
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HotelService {
  private apiUrl = `${environment.apiUrl}${environment.endpoints.hotels}`;
  
  constructor(private http: HttpClient) { }
  
  getHotels(): Observable<Hotel[]> {
    return this.http.get<Hotel[]>(this.apiUrl);
    // Calls: https://localhost:7291/api/hotels
  }
}
```

### With Feature Flags
```typescript
import { environment } from '../../environments/environment';

export class MyComponent {
  ngOnInit() {
    if (environment.features.enableLogging) {
      console.log('Component initialized');
    }
    
    if (environment.features.enableDebugMode) {
      this.showDebugInfo();
    }
  }
}
```

### Dynamic Endpoint Construction
```typescript
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private baseUrl = environment.apiUrl;
  
  getBookingById(id: number): Observable<Booking> {
    const url = `${this.baseUrl}${environment.endpoints.bookings}/${id}`;
    return this.http.get<Booking>(url);
    // Calls: https://localhost:7291/api/bookings/123
  }
}
```

## Updated Services

All services have been updated to use environment configuration:

### AuthService
```typescript
// Before
private apiUrl = 'http://localhost:5000/api/auth';

// After
private apiUrl = `${environment.apiUrl}${environment.endpoints.auth}`;
// Result: https://localhost:7291/api/auth
```

### HotelService
```typescript
// Before
private apiUrl = 'http://localhost:5000/api/hotels';

// After
private apiUrl = `${environment.apiUrl}${environment.endpoints.hotels}`;
// Result: https://localhost:7291/api/hotels
```

### BookingService
```typescript
// Before
private apiUrl = 'http://localhost:5000/api/bookings';

// After
private apiUrl = `${environment.apiUrl}${environment.endpoints.bookings}`;
// Result: https://localhost:7291/api/bookings
```

### UserService
```typescript
// Before
private apiUrl = 'http://localhost:5000/api/users';

// After
private apiUrl = `${environment.apiUrl}${environment.endpoints.users}`;
// Result: https://localhost:7291/api/users
```

## Build Configurations

### Development Build
```bash
ng serve
# Uses: environment.ts
# API URL: https://localhost:7291/api
```

### Production Build
```bash
ng build --configuration production
# Uses: environment.prod.ts
# API URL: https://your-production-api.com/api
```

### Custom Build
```bash
ng build --configuration staging
# Uses: environment.staging.ts (if created)
```

## Creating Additional Environments

### 1. Create Environment File
```bash
# Create staging environment
touch src/environments/environment.staging.ts
```

### 2. Configure Environment
```typescript
// environment.staging.ts
export const environment = {
  production: false,
  apiUrl: 'https://staging-api.example.com/api',
  appName: 'Hotel Booking System (Staging)',
  version: '1.0.0-staging',
  
  features: {
    enableLogging: true,
    enableDebugMode: true,
    enableMockData: false
  },

  endpoints: {
    auth: '/auth',
    hotels: '/hotels',
    rooms: '/rooms',
    bookings: '/bookings',
    users: '/users'
  }
};
```

### 3. Update angular.json
```json
{
  "projects": {
    "hotel-booking-frontend": {
      "architect": {
        "build": {
          "configurations": {
            "staging": {
              "fileReplacements": [
                {
                  "replace": "src/environments/environment.ts",
                  "with": "src/environments/environment.staging.ts"
                }
              ]
            }
          }
        }
      }
    }
  }
}
```

### 4. Build with Staging
```bash
ng build --configuration staging
```

## Environment Variables

### Using Process Environment Variables
```typescript
// environment.ts
export const environment = {
  production: false,
  apiUrl: process.env['API_URL'] || 'https://localhost:7291/api',
  // ...
};
```

### Using .env Files (with custom webpack config)
```bash
# .env.development
API_URL=https://localhost:7291/api
ENABLE_LOGGING=true

# .env.production
API_URL=https://api.production.com/api
ENABLE_LOGGING=false
```

## Best Practices

### 1. Never Commit Secrets
```typescript
// ❌ Bad - Don't commit API keys
export const environment = {
  apiKey: 'sk_live_abc123xyz789',
  apiUrl: 'https://api.example.com'
};

// ✅ Good - Use environment variables
export const environment = {
  apiKey: process.env['API_KEY'] || '',
  apiUrl: process.env['API_URL'] || 'https://localhost:7291/api'
};
```

### 2. Use Type Safety
```typescript
// Create environment interface
export interface Environment {
  production: boolean;
  apiUrl: string;
  appName: string;
  version: string;
  features: {
    enableLogging: boolean;
    enableDebugMode: boolean;
    enableMockData: boolean;
  };
  endpoints: {
    auth: string;
    hotels: string;
    rooms: string;
    bookings: string;
    users: string;
  };
}

// Use in environment files
export const environment: Environment = {
  // ...
};
```

### 3. Centralize Configuration
```typescript
// config.service.ts
@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private config = environment;

  get apiUrl(): string {
    return this.config.apiUrl;
  }

  get isProduction(): boolean {
    return this.config.production;
  }

  getEndpoint(name: keyof typeof environment.endpoints): string {
    return `${this.config.apiUrl}${this.config.endpoints[name]}`;
  }
}
```

### 4. Validate Configuration
```typescript
// environment.ts
function validateEnvironment() {
  if (!environment.apiUrl) {
    throw new Error('API URL is required');
  }
  if (!environment.apiUrl.startsWith('http')) {
    throw new Error('API URL must start with http or https');
  }
}

validateEnvironment();

export const environment = {
  // ...
};
```

## Troubleshooting

### Issue: Wrong API URL in Production
**Problem**: Production build still uses development API URL

**Solution**:
1. Check `angular.json` has correct file replacements
2. Verify `environment.prod.ts` exists
3. Build with `--configuration production` flag
4. Clear build cache: `rm -rf dist/`

### Issue: Environment Not Updating
**Problem**: Changes to environment file not reflected

**Solution**:
1. Stop development server
2. Clear Angular cache: `rm -rf .angular/`
3. Restart: `ng serve`

### Issue: Import Error
**Problem**: Cannot find module '../../environments/environment'

**Solution**:
1. Check file path is correct
2. Verify environment.ts exists
3. Check TypeScript paths in tsconfig.json

## Security Considerations

### 1. API Keys
- Never commit API keys to version control
- Use environment variables for sensitive data
- Rotate keys regularly

### 2. URLs
- Always use HTTPS in production
- Validate API URLs on startup
- Use different URLs for different environments

### 3. Feature Flags
- Disable debug mode in production
- Disable logging in production
- Never expose sensitive data in logs

## Testing

### Unit Tests
```typescript
import { environment } from '../../environments/environment';

describe('HotelService', () => {
  it('should use correct API URL', () => {
    const service = TestBed.inject(HotelService);
    expect(service['apiUrl']).toBe(`${environment.apiUrl}/hotels`);
  });
});
```

### E2E Tests
```typescript
// Use environment in E2E tests
import { environment } from '../src/environments/environment';

describe('Hotel Booking App', () => {
  it('should connect to correct API', () => {
    cy.intercept(`${environment.apiUrl}/hotels`).as('getHotels');
    cy.visit('/hotels');
    cy.wait('@getHotels');
  });
});
```

## Migration Guide

### From Hardcoded URLs to Environment

1. **Identify all hardcoded URLs**
   ```bash
   grep -r "http://localhost" src/app/services/
   ```

2. **Update each service**
   ```typescript
   // Before
   private apiUrl = 'http://localhost:5000/api/hotels';
   
   // After
   import { environment } from '../../environments/environment';
   private apiUrl = `${environment.apiUrl}${environment.endpoints.hotels}`;
   ```

3. **Test in development**
   ```bash
   ng serve
   # Verify all API calls work
   ```

4. **Test production build**
   ```bash
   ng build --configuration production
   # Verify correct URLs in network tab
   ```

## Related Files

- `angular.json` - Build configurations
- `tsconfig.json` - TypeScript paths
- `src/app/services/*.service.ts` - Services using environment
- `src/app/interceptors/auth.interceptor.ts` - May use environment for skip URLs

## Additional Resources

- [Angular Environments Documentation](https://angular.io/guide/build#configuring-application-environments)
- [Angular Build Configurations](https://angular.io/guide/workspace-config#alternate-build-configurations)
