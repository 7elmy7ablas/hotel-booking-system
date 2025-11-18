/**
 * Production Environment Configuration
 * 
 * This file contains configuration for the production environment.
 * It is used when running `ng build --configuration production`.
 */

export const environment = {
  production: true,
  apiUrl: 'https://your-production-api.com/api',
  appName: 'Hotel Booking System',
  version: '1.0.0',
  
  // Feature flags
  features: {
    enableLogging: false,
    enableDebugMode: false,
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
