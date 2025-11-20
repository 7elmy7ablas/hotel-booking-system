# Hotel Booking System

A modern hotel booking application built with Angular 19 and Material Design.

## Features

- **User Authentication**: Secure login and registration with JWT tokens
- **Hotel Search**: Browse and search hotels with advanced filtering
- **Room Booking**: Book hotel rooms with date selection and guest management
- **Booking Management**: View and manage your bookings
- **User Profile**: Update personal information and preferences
- **Responsive Design**: Mobile-first design with Material UI components

## Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- Angular CLI (v19 or higher)

## Setup Instructions

1. Clone the repository
2. Navigate to the client directory:
   ```bash
   cd client
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start the development server:
   ```bash
   ng serve
   ```

5. Open your browser and navigate to `http://localhost:4200`

## Build for Production

To build the application for production:

```bash
ng build --configuration production
```

The build artifacts will be stored in the `dist/` directory.

## Backend API Requirement

This application requires a backend API to be running. The API should be configured in the environment files:

- Development: `src/environments/environment.ts`
- Production: `src/environments/environment.prod.ts`

Default API URL: `https://localhost:7291/api`

Make sure the backend API is running and accessible before starting the frontend application.

## Available Scripts

- `npm start` or `ng serve` - Start development server
- `ng build` - Build the project
- `ng build --configuration production` - Build for production
- `ng test` - Run unit tests
- `ng lint` - Lint the code

## Project Structure

```
client/
├── src/
│   ├── app/
│   │   ├── components/      # Reusable UI components
│   │   ├── features/        # Feature modules
│   │   ├── guards/          # Route guards
│   │   ├── interceptors/    # HTTP interceptors
│   │   ├── models/          # TypeScript interfaces
│   │   ├── services/        # API services
│   │   └── shared/          # Shared utilities
│   ├── environments/        # Environment configurations
│   └── styles.scss          # Global styles
└── angular.json             # Angular CLI configuration
```

## Technologies Used

- Angular 19
- Angular Material
- RxJS
- TypeScript
- SCSS

## License

This project is licensed under the MIT License.
