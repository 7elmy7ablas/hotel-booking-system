# Hotel Booking System - Angular Frontend

This is the Angular 19 frontend application for the Hotel Booking System.

## Features

- **Standalone Components**: Built with Angular 19 standalone components (no NgModules)
- **Material Design**: Uses Angular Material for UI components
- **Routing**: Configured with lazy-loaded routes
- **Authentication**: JWT-based authentication with guards and interceptors
- **Responsive Design**: Mobile-friendly interface
- **TypeScript**: Strongly typed with interfaces matching backend entities

## Project Structure

```
src/app/
├── core/
│   ├── services/          # API and business logic services
│   ├── guards/            # Route guards
│   ├── interceptors/      # HTTP interceptors
│   └── models/            # TypeScript interfaces
├── features/
│   ├── auth/              # Login and registration
│   ├── hotels/            # Hotel listing and details
│   └── dashboard/         # User dashboard
└── shared/
    └── components/        # Reusable components
```

## Prerequisites

- Node.js 18+ 
- Angular CLI 19
- Backend API running on https://localhost:7291

## Installation

```bash
# Install dependencies
npm install
```

## Development

```bash
# Start development server
ng serve

# Navigate to http://localhost:4200
```

## Build

```bash
# Production build
ng build --configuration production

# Output will be in dist/client/browser
```

## API Configuration

The API URL is configured in:
- `src/environments/environment.ts` (development)
- `src/environments/environment.prod.ts` (production)

Default API URL: `https://localhost:7291/api`

## Available Routes

- `/` - Redirects to hotels list
- `/login` - User login
- `/register` - User registration
- `/hotels` - Browse hotels
- `/hotels/:id` - Hotel details with rooms
- `/hotels/new` - Add new hotel (protected)
- `/dashboard` - User dashboard (protected)

## Models

All TypeScript interfaces match the C# backend entities with PascalCase properties:

- `Hotel` - Hotel information
- `Room` - Room details
- `User` - User profile
- `Booking` - Reservation data
- `Payment` - Payment information

## Services

- `ApiService` - Base HTTP service with error handling
- `AuthService` - Authentication and user management
- `HotelService` - Hotel and room operations

## Authentication

- JWT tokens stored in localStorage
- Auth interceptor adds token to requests
- Auth guard protects routes
- Automatic logout on token expiration

## Styling

- SCSS for component styles
- Angular Material theme (Azure/Blue)
- Responsive grid layouts
- Custom styles in component files

## Testing

```bash
# Run unit tests
ng test

# Run e2e tests
ng e2e
```

## Technologies

- Angular 19
- Angular Material 19
- RxJS
- TypeScript
- SCSS
