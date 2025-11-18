# Environment Setup Guide

## Quick Start

### Development
```bash
# Start development server
ng serve

# API URL: https://localhost:7291/api
# Logging: Enabled
# Debug Mode: Enabled
```

### Production
```bash
# Build for production
ng build --configuration production

# API URL: https://your-production-api.com/api
# Logging: Disabled
# Debug Mode: Disabled
```

## Environment Files

### ✅ Created Files

1. **src/environments/environment.ts** (Development)
   - API URL: `https://localhost:7291/api`
   - Production: `false`
   - Logging: Enabled

2. **src/environments/environment.prod.ts** (Production)
   - API URL: `https://your-production-api.com/api`
   - Production: `true`
   - Logging: Disabled

## Updated Services

All services now use `environment.apiUrl`:

### ✅ AuthService
```typescript
import { environment } from '../../environments/environment';

private apiUrl = `${environment.apiUrl}${environment.endpoints.auth}`;
// Development: https://localhost:7291/api/auth
// Production: https://your-production-api.com/api/auth
```

### ✅ HotelService
```typescript
import { environment } from '../../environments/environment';

private apiUrl = `${environment.apiUrl}${environment.endpoints.hotels}`;
// Development: https://localhost:7291/api/hotels
// Production: https://your-production-api.com/api/hotels
```

### ✅ BookingService
```typescript
import { environment } from '../../environments/environment';

private apiUrl = `${environment.apiUrl}${environment.endpoints.bookings}`;
// Development: https://localhost:7291/api/bookings
// Production: https://your-production-api.com/api/bookings
```

### ✅ UserService
```typescript
import { environment } from '../../environments/environment';

private apiUrl = `${environment.apiUrl}${environment.endpoints.users}`;
// Development: https://localhost:7291/api/users
// Production: https://your-production-api.com/api/users
```

## Configuration

### Current Development Settings
```typescript
{
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
}
```

### Current Production Settings
```typescript
{
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
}
```

## How to Change API URL

### For Development
Edit `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'https://your-dev-api.com/api', // Change this
  // ...
};
```

### For Production
Edit `src/environments/environment.prod.ts`:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-production-api.com/api', // Change this
  // ...
};
```

## Testing

### Verify Development API
```bash
# Start dev server
ng serve

# Open browser console
# Check network tab for API calls
# Should see: https://localhost:7291/api/*
```

### Verify Production API
```bash
# Build for production
ng build --configuration production

# Serve production build
npx http-server dist/hotel-booking-frontend/browser

# Check network tab
# Should see: https://your-production-api.com/api/*
```

## Common Commands

```bash
# Development
ng serve                                    # Uses environment.ts
ng build                                    # Uses environment.ts

# Production
ng build --configuration production         # Uses environment.prod.ts
ng serve --configuration production         # Uses environment.prod.ts

# Check which environment is being used
ng build --configuration production --verbose
```

## Next Steps

1. **Update Production API URL**
   - Edit `src/environments/environment.prod.ts`
   - Replace `https://your-production-api.com/api` with your actual API URL

2. **Test API Connection**
   - Start development server: `ng serve`
   - Try logging in
   - Check network tab for API calls

3. **Configure CORS**
   - Ensure your API allows requests from your frontend domain
   - Add appropriate CORS headers on backend

4. **Deploy**
   - Build for production: `ng build --configuration production`
   - Deploy `dist/` folder to your hosting service

## Troubleshooting

### API calls failing?
1. Check API URL in environment file
2. Verify API is running
3. Check CORS configuration
4. Look for errors in browser console

### Wrong API URL in production?
1. Verify you're building with `--configuration production`
2. Check `environment.prod.ts` has correct URL
3. Clear build cache: `rm -rf dist/`
4. Rebuild

### Environment changes not reflecting?
1. Stop development server
2. Clear Angular cache: `rm -rf .angular/`
3. Restart: `ng serve`

## Security Notes

⚠️ **Never commit sensitive data to environment files**
- Use environment variables for API keys
- Use secrets management for production
- Don't expose internal URLs publicly

✅ **Best Practices**
- Use HTTPS in production
- Validate API URLs on startup
- Use different URLs for different environments
- Disable debug mode in production
