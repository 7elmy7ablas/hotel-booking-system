/**
 * Application Configuration
 * 
 * This file contains the main configuration for the Angular 19 application.
 * It uses the standalone architecture with functional providers.
 * 
 * @see https://angular.io/guide/standalone-components
 */

import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { 
  provideRouter, 
  withPreloading, 
  PreloadAllModules,
  withInMemoryScrolling,
  withRouterConfig,
  withDebugTracing
} from '@angular/router';
import { 
  provideHttpClient, 
  withInterceptors,
  withFetch
} from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideNativeDateAdapter } from '@angular/material/core';

import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { errorInterceptor } from './interceptors/error.interceptor';
import { environment } from '../environments/environment';

/**
 * Application Configuration
 * 
 * Providers:
 * - Zone Change Detection: Optimized with event coalescing
 * - Router: With preloading, scroll restoration, and debug tracing (dev only)
 * - HTTP Client: With interceptors and fetch API
 * - Animations: Async loading for better performance
 * - Material Date Adapter: Native date adapter for Material components
 */
export const appConfig: ApplicationConfig = {
  providers: [
    // Zone Change Detection - Optimizes change detection
    provideZoneChangeDetection({ 
      eventCoalescing: true  // Coalesce multiple events into single change detection cycle
    }),

    // Router Configuration
    provideRouter(
      routes,
      // Preload all lazy-loaded modules in the background
      withPreloading(PreloadAllModules),
      
      // Scroll to top on navigation and restore scroll position on back/forward
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled'
      }),
      
      // Router configuration options
      withRouterConfig({
        onSameUrlNavigation: 'reload',  // Reload component on same URL navigation
        paramsInheritanceStrategy: 'always'  // Always inherit params from parent routes
      }),
      
      // Enable debug tracing in development (comment out in production)
      ...(environment.features.enableDebugMode ? [withDebugTracing()] : [])
    ),

    // HTTP Client Configuration
    provideHttpClient(
      // Add HTTP interceptors (order matters!)
      withInterceptors([
        authInterceptor,    // First: Add authentication token
        errorInterceptor    // Second: Handle errors
      ]),
      
      // Use Fetch API instead of XMLHttpRequest (better performance)
      withFetch()
    ),

    // Material UI Configuration
    // Async animations for better initial load performance
    provideAnimationsAsync(),
    
    // Native date adapter for Material date components
    provideNativeDateAdapter()
  ]
};

/**
 * Development-only providers
 * 
 * These providers are only included in development builds.
 * They provide additional debugging and development tools.
 */
export const devProviders = environment.production ? [] : [
  // Add development-only providers here
  // Example: provideDevTools()
];

/**
 * Test Configuration
 * 
 * Use this configuration for unit tests.
 * It includes all providers except animations.
 */
export const testConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor])
    ),
    provideNativeDateAdapter()
    // Note: No animations in tests for better performance
  ]
};
