# Angular 19 Routing Configuration Guide

## Overview
This document describes the routing configuration for the Hotel Booking application built with Angular 19 standalone components.

## Route Structure

### Public Routes (No Authentication Required)

#### Home
- **Path**: `/` 
- **Redirect**: `/hotels`
- **Description**: Default route redirects to hotel search

#### Authentication Routes
- **Path**: `/login`
- **Component**: `LoginComponent`
- **Description**: User login page
- **Title**: "Login - Hotel Booking"

- **Path**: `/register`
- **Component**: `RegisterComponent`
- **Description**: User registration page
- **Title**: "Register - Hotel Booking"

#### Hotel Routes
- **Path**: `/hotels`
- **Component**: `SearchComponent`
- **Description**: Hotel search and listing page
- **Title**: "Search Hotels - Hotel Booking"

- **Path**: `/hotels/:id`
- **Component**: `DetailsComponent`
- **Description**: Hotel details page with booking form
- **Title**: "Hotel Details - Hotel Booking"
- **Parameters**: 
  - `id`: Hotel ID (number)

### Protected Routes (Authentication Required)

All protected routes use the `authGuard` which checks if the user is authenticated. If not, they are redirected to `/login` with a `returnUrl` query parameter.

#### Booking Routes
- **Path**: `/bookings`
- **Component**: `BookingListComponent`
- **Guard**: `authGuard`
- **Description**: List of user's bookings with filtering
- **Title**: "My Bookings - Hotel Booking"

- **Path**: `/bookings/create`
- **Component**: `CreateComponent`
- **Guard**: `authGuard`
- **Description**: Multi-step booking creation form
- **Title**: "Create Booking - Hotel Booking"
- **Query Parameters** (optional):
  - `hotelId`: Hotel ID
  - `roomId`: Room ID
  - `hotelName`: Hotel name
  - `roomType`: Room type
  - `pricePerNight`: Price per night
  - `checkInDate`: Check-in date
  - `checkOutDate`: Check-out date
  - `guests`: Number of guests

- **Path**: `/bookings/:id`
- **Component**: `BookingDetailsComponent`
- **Guard**: `authGuard`
- **Description**: Detailed view of a specific booking
- **Title**: "Booking Details - Hotel Booking"
- **Parameters**:
  - `id`: Booking ID (number)

#### User Profile Route
- **Path**: `/profile`
- **Component**: `ProfileComponent`
- **Guard**: `authGuard`
- **Description**: User profile management with tabs for profile, bookings, and settings
- **Title**: "My Profile - Hotel Booking"

### Wildcard Route
- **Path**: `**`
- **Redirect**: `/hotels`
- **Description**: Catches all undefined routes and redirects to hotel search
- **Alternative**: Can be changed to load `NotFoundComponent` for a 404 page

## Features

### Lazy Loading
All routes use lazy loading with `loadComponent()` for optimal performance:
```typescript
loadComponent: () => import('./path/to/component').then(m => m.ComponentName)
```

### Preloading Strategy
The application uses `PreloadAllModules` strategy to preload all lazy-loaded modules in the background after the initial load.

### Route Guards
- **authGuard**: Functional guard that checks authentication status
  - Returns `true` if authenticated
  - Redirects to `/login` with `returnUrl` if not authenticated
  - Located at: `client/src/app/guards/auth.guard.ts`

### Page Titles
Each route has a custom title that appears in the browser tab.

### HTTP Interceptors
Configured in `app.config.ts`:
- **authInterceptor**: Adds JWT token to all HTTP requests
- **errorInterceptor**: Handles HTTP errors globally

## Navigation Examples

### Programmatic Navigation

```typescript
// Navigate to hotel details
this.router.navigate(['/hotels', hotelId]);

// Navigate to create booking with query params
this.router.navigate(['/bookings/create'], {
  queryParams: {
    hotelId: 123,
    roomId: 456,
    hotelName: 'Grand Hotel',
    roomType: 'Deluxe Suite',
    pricePerNight: 200,
    checkInDate: '2025-01-15',
    checkOutDate: '2025-01-20',
    guests: 2
  }
});

// Navigate with return URL
this.router.navigate(['/login'], {
  queryParams: { returnUrl: this.router.url }
});
```

### Template Navigation

```html
<!-- Simple navigation -->
<a routerLink="/hotels">Browse Hotels</a>

<!-- Navigation with parameters -->
<a [routerLink]="['/hotels', hotel.id]">View Details</a>

<!-- Navigation with query params -->
<a [routerLink]="['/bookings/create']" 
   [queryParams]="{hotelId: hotel.id, roomId: room.id}">
  Book Now
</a>

<!-- Active link styling -->
<a routerLink="/bookings" routerLinkActive="active-link">
  My Bookings
</a>
```

## File Structure

```
client/src/app/
├── app.routes.ts              # Main routing configuration
├── app.config.ts              # Application configuration with router setup
├── app.component.ts           # Root component with router outlet
├── app.component.html         # Layout with header, router-outlet, footer
├── guards/
│   └── auth.guard.ts          # Authentication guard
├── interceptors/
│   ├── auth.interceptor.ts    # JWT token interceptor
│   └── error.interceptor.ts   # Error handling interceptor
└── components/
    ├── auth/
    │   ├── login/
    │   └── register/
    ├── hotels/
    │   ├── search/
    │   └── details/
    ├── bookings/
    │   ├── list/
    │   ├── create/
    │   └── details/
    ├── user/
    │   └── profile/
    └── shared/
        ├── header/
        ├── footer/
        └── not-found/
```

## Configuration Files

### app.routes.ts
Main routing configuration with all route definitions.

### app.config.ts
Application configuration including:
- Router with preloading strategy
- HTTP client with interceptors
- Animations
- Zone change detection

### app.component.html
Root template structure:
```html
<div class="app-container">
  <app-header></app-header>
  <main class="main-content">
    <router-outlet />
  </main>
  <app-footer></app-footer>
</div>
```

## Testing Routes

### Development
```bash
# Start development server
ng serve

# Navigate to different routes
http://localhost:4200/
http://localhost:4200/hotels
http://localhost:4200/hotels/1
http://localhost:4200/login
http://localhost:4200/register
http://localhost:4200/bookings (requires auth)
http://localhost:4200/profile (requires auth)
```

### Testing Protected Routes
1. Try accessing `/bookings` without logging in
2. Should redirect to `/login?returnUrl=/bookings`
3. After login, should redirect back to `/bookings`

## Best Practices

1. **Always use lazy loading** for better performance
2. **Use route guards** for protected routes
3. **Set page titles** for better SEO and UX
4. **Use query parameters** for optional data
5. **Use route parameters** for required identifiers
6. **Handle 404 errors** with wildcard route
7. **Preload modules** for better UX after initial load

## Troubleshooting

### Route not found
- Check that the component path in `loadComponent()` is correct
- Verify the component is exported properly
- Check for typos in route paths

### Guard not working
- Verify `authGuard` is imported correctly
- Check that `AuthService.isAuthenticated()` returns correct value
- Ensure token is stored in localStorage

### Lazy loading errors
- Check import paths in `loadComponent()`
- Verify component is standalone
- Check for circular dependencies

## Future Enhancements

- Add route resolvers for data pre-fetching
- Implement route animations
- Add breadcrumb navigation
- Create admin routes with role-based guards
- Add route-specific meta tags for SEO
