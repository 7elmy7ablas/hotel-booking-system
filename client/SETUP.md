# Angular 19 Hotel Booking System - Setup Guide

## Quick Start Commands

### 1. Install Dependencies
```bash
cd client
npm install
```

### 2. Start Development Server
```bash
ng serve
```
Application will be available at: http://localhost:4200

### 3. Build for Production
```bash
ng build --configuration production
```

## Project Configuration

### Environment Files
- **Development**: `src/environments/environment.ts`
- **Production**: `src/environments/environment.prod.ts`

Both configured with API URL: `https://localhost:7291/api`

### Angular Material
- Theme: Azure/Blue
- Components imported as needed in standalone components
- No global typography styles

### HTTP Client
- Configured with `provideHttpClient()` in `app.config.ts`
- Auth interceptor automatically adds JWT token to requests
- Base API service handles all HTTP operations

## Project Structure Created

```
client/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── guards/
│   │   │   │   └── auth.guard.ts
│   │   │   ├── interceptors/
│   │   │   │   └── auth.interceptor.ts
│   │   │   ├── models/
│   │   │   │   ├── hotel.model.ts
│   │   │   │   ├── room.model.ts
│   │   │   │   ├── user.model.ts
│   │   │   │   ├── booking.model.ts
│   │   │   │   └── payment.model.ts
│   │   │   └── services/
│   │   │       ├── api.service.ts
│   │   │       ├── auth.service.ts
│   │   │       └── hotel.service.ts
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   │   ├── login.component.ts
│   │   │   │   └── register.component.ts
│   │   │   ├── dashboard/
│   │   │   │   └── dashboard.component.ts
│   │   │   └── hotels/
│   │   │       ├── hotel-list.component.ts
│   │   │       ├── hotel-detail.component.ts
│   │   │       └── hotel-form.component.ts
│   │   ├── shared/
│   │   │   └── components/
│   │   │       ├── header.component.ts
│   │   │       ├── footer.component.ts
│   │   │       └── loading-spinner.component.ts
│   │   ├── app.component.ts
│   │   ├── app.config.ts
│   │   └── app.routes.ts
│   └── environments/
│       ├── environment.ts
│       └── environment.prod.ts
└── angular.json
```

## Key Features Implemented

### 1. Standalone Components
All components use Angular 19 standalone architecture (no NgModules)

### 2. Routing
- Lazy-loaded routes
- Auth guard for protected routes
- Route configuration in `app.routes.ts`

### 3. Authentication
- JWT token management
- Auth interceptor
- Login/Register components
- Protected routes

### 4. Services
- **ApiService**: Base HTTP service with loading states and error handling
- **AuthService**: User authentication and state management
- **HotelService**: Hotel and room CRUD operations

### 5. Models
TypeScript interfaces matching C# backend entities:
- PascalCase property names
- Guid as string type
- DateTime as string (ISO format)

### 6. Material Design
- Material toolbar, cards, forms
- Material icons
- Responsive layouts

## Development Workflow

### Run Development Server
```bash
ng serve
```

### Generate New Component
```bash
ng generate component features/component-name --standalone
```

### Generate New Service
```bash
ng generate service core/services/service-name
```

### Build
```bash
ng build
```

### Run Tests
```bash
ng test
```

## API Integration

### Base URL
Configured in environment files: `https://localhost:7291/api`

### Authentication Flow
1. User logs in via `/login`
2. JWT token received and stored in localStorage
3. Auth interceptor adds token to all subsequent requests
4. Auth guard protects routes requiring authentication

### API Endpoints Used
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/hotels` - Get all hotels
- `GET /api/hotels/:id` - Get hotel by ID
- `POST /api/hotels` - Create hotel
- `PUT /api/hotels/:id` - Update hotel
- `DELETE /api/hotels/:id` - Delete hotel
- `GET /api/hotels/:id/rooms` - Get hotel rooms

## Troubleshooting

### CORS Issues
Ensure backend API has CORS configured to allow requests from `http://localhost:4200`

### SSL Certificate Issues
If using self-signed certificate, you may need to accept it in browser first by visiting `https://localhost:7291` directly

### Port Already in Use
Change port in `angular.json` or use:
```bash
ng serve --port 4201
```

## Next Steps

1. Start the backend API
2. Run `npm install` in client folder
3. Run `ng serve`
4. Navigate to http://localhost:4200
5. Test login/registration
6. Browse hotels

## Additional Commands

### Update Angular CLI
```bash
npm install -g @angular/cli@latest
```

### Update Dependencies
```bash
ng update @angular/core @angular/cli
ng update @angular/material
```

### Lint Code
```bash
ng lint
```
