/**
 * Development Environment Configuration
 * 
 * This file contains configuration for the development environment.
 * It is used when running `ng serve` or `ng build` without production flag.
 */

export const environment = {
  production: false,
  apiUrl: 'https://localhost:7291/api',
  appName: 'Hotel Booking System',
  version: '1.0.0',
  
  // Feature flags
  features: {
    enableLogging: true,
    enableDebugMode: true,
    enableMockData: false
  },

  // API endpoints (optional - for better organization)
  endpoints: {
    auth: '/auth',
    hotels: '/hotels',
    rooms: '/rooms',
    bookings: '/bookings',
    users: '/users'
  }
};
