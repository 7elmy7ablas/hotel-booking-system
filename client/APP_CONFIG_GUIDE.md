# Application Configuration Guide

## Overview
This guide explains the Angular 19 application configuration in `app.config.ts`. The application uses the standalone architecture with functional providers.

## Current Configuration

### Complete Provider Setup

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    // 1. Zone Change Detection
    provideZoneChangeDetection({ eventCoalescing: true }),

    // 2. Router with Features
    provideRouter(
      routes,
      withPreloading(PreloadAllModules),
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled'
      }),
      withRouterConfig({
        onSameUrlNavigation: 'reload',
        paramsInheritanceStrategy: 'always'
      }),
      withDebugTracing() // Development only
    ),

    // 3. HTTP Client with Interceptors
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor]),
      withFetch()
    ),

    // 4. Material UI
    provideAnimationsAsync(),
    provideNativeDateAdapter()
  ]
};
```

## Provider Details

### 1. Zone Change Detection

**Purpose**: Optimizes Angular's change detection mechanism.

```typescript
provideZoneChangeDetection({ eventCoalescing: true })
```

**Features**:
- ✅ Event coalescing: Combines multiple events into single change detection cycle
- ✅ Better performance for high-frequency events
- ✅ Reduces unnecessary change detection runs

**Benefits**:
- Improved application performance
- Reduced CPU usage
- Better battery life on mobile devices

---

### 2. Router Configuration

**Purpose**: Configures Angular Router with advanced features.

#### a. Route Preloading
```typescript
withPreloading(PreloadAllModules)
```

**What it does**:
- Preloads all lazy-loaded modules in the background
- Happens after initial app load
- Improves navigation speed

**Benefits**:
- Faster subsequent navigation
- Better user experience
- No delay when navigating to lazy-loaded routes

#### b. Scroll Management
```typescript
withInMemoryScrolling({
  scrollPositionRestoration: 'enabled',
  anchorScrolling: 'enabled'
})
```

**Features**:
- `scrollPositionRestoration: 'enabled'`: Restores scroll position on back/forward navigation
- `anchorScrolling: 'enabled'`: Enables scrolling to anchor links (#section)

**Benefits**:
- Better UX for back/forward navigation
- Support for anchor links
- Automatic scroll to top on new navigation

#### c. Router Configuration
```typescript
withRouterConfig({
  onSameUrlNavigation: 'reload',
  paramsInheritanceStrategy: 'always'
})
```

**Features**:
- `onSameUrlNavigation: 'reload'`: Reloads component when navigating to same URL
- `paramsInheritanceStrategy: 'always'`: Child routes inherit params from parent

**Use Cases**:
- Refresh data when clicking same link
- Share route params across nested routes

#### d. Debug Tracing (Development Only)
```typescript
withDebugTracing()
```

**What it does**:
- Logs all router events to console
- Shows navigation lifecycle
- Helps debug routing issues

**When to use**:
- Development only
- Debugging routing problems
- Understanding navigation flow

**Note**: Automatically disabled in production via environment check.

---

### 3. HTTP Client Configuration

**Purpose**: Configures HTTP client with interceptors and modern features.

#### a. HTTP Interceptors
```typescript
withInterceptors([authInterceptor, errorInterceptor])
```

**Order matters!**:
1. `authInterceptor`: Adds JWT token to requests
2. `errorInterceptor`: Handles HTTP errors

**Features**:
- Automatic token injection
- Global error handling
- Request/response transformation

#### b. Fetch API
```typescript
withFetch()
```

**What it does**:
- Uses Fetch API instead of XMLHttpRequest
- Modern browser API
- Better performance

**Benefits**:
- Improved performance
- Better streaming support
- More consistent behavior

---

### 4. Material UI Configuration

**Purpose**: Configures Angular Material components.

#### a. Async Animations
```typescript
provideAnimationsAsync()
```

**What it does**:
- Loads animations asynchronously
- Reduces initial bundle size
- Improves first load performance

**Benefits**:
- Faster initial load
- Smaller main bundle
- Better Core Web Vitals scores

#### b. Native Date Adapter
```typescript
provideNativeDateAdapter()
```

**What it does**:
- Provides date adapter for Material date components
- Uses native JavaScript Date object
- Required for MatDatepicker

**Components that need it**:
- MatDatepicker
- MatDateRangePicker
- Any component using dates

---

## Environment-Specific Configuration

### Development vs Production

```typescript
// Debug tracing only in development
...(environment.features.enableDebugMode ? [withDebugTracing()] : [])
```

**Development**:
- Debug tracing enabled
- Detailed console logs
- Better error messages

**Production**:
- Debug tracing disabled
- Minimal logging
- Optimized performance

---

## Test Configuration

For unit tests, use the simplified test configuration:

```typescript
export const testConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor])
    ),
    provideNativeDateAdapter()
    // No animations for better test performance
  ]
};
```

**Usage in tests**:
```typescript
import { testConfig } from './app.config';

TestBed.configureTestingModule({
  providers: testConfig.providers
});
```

---

## Adding New Providers

### Example: Adding a Custom Service

```typescript
import { MyCustomService } from './services/my-custom.service';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... existing providers
    MyCustomService  // Add your service
  ]
};
```

### Example: Adding Third-Party Library

```typescript
import { provideThirdPartyLib } from 'third-party-lib';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... existing providers
    provideThirdPartyLib({
      apiKey: environment.thirdPartyApiKey
    })
  ]
};
```

---

## Common Configurations

### Adding State Management (NgRx)

```typescript
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { reducers } from './store/reducers';
import { effects } from './store/effects';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... existing providers
    provideStore(reducers),
    provideEffects(effects)
  ]
};
```

### Adding Service Worker

```typescript
import { provideServiceWorker } from '@angular/service-worker';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... existing providers
    provideServiceWorker('ngsw-worker.js', {
      enabled: environment.production,
      registrationStrategy: 'registerWhenStable:30000'
    })
  ]
};
```

### Adding i18n (Internationalization)

```typescript
import { provideTransloco } from '@ngneat/transloco';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... existing providers
    provideTransloco({
      config: {
        availableLangs: ['en', 'es', 'fr'],
        defaultLang: 'en',
        reRenderOnLangChange: true
      }
    })
  ]
};
```

---

## Performance Optimization

### Current Optimizations

1. **Event Coalescing**: Reduces change detection cycles
2. **Module Preloading**: Faster navigation
3. **Async Animations**: Smaller initial bundle
4. **Fetch API**: Better HTTP performance
5. **Lazy Loading**: Routes loaded on demand

### Additional Optimizations

#### Enable OnPush Change Detection
```typescript
// In components
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush
})
```

#### Use TrackBy in Lists
```typescript
// In templates
*ngFor="let item of items; trackBy: trackByFn"
```

#### Optimize Images
```typescript
// Use NgOptimizedImage
import { NgOptimizedImage } from '@angular/common';

@Component({
  imports: [NgOptimizedImage]
})
```

---

## Troubleshooting

### Issue: Animations Not Working

**Problem**: Material animations not showing

**Solution**:
1. Check `provideAnimationsAsync()` is in providers
2. Verify animations are imported in component
3. Check browser supports animations

### Issue: Router Not Working

**Problem**: Routes not loading

**Solution**:
1. Verify `provideRouter(routes)` is in providers
2. Check routes are imported correctly
3. Verify `<router-outlet>` is in template

### Issue: HTTP Requests Failing

**Problem**: API calls not working

**Solution**:
1. Check `provideHttpClient()` is in providers
2. Verify interceptors are configured
3. Check CORS settings on backend

### Issue: Date Picker Not Working

**Problem**: MatDatepicker shows error

**Solution**:
1. Add `provideNativeDateAdapter()` to providers
2. Import MatDatepickerModule in component
3. Check date format is correct

---

## Best Practices

### 1. Provider Order
```typescript
// ✅ Good - Logical order
providers: [
  provideZoneChangeDetection(),  // Core
  provideRouter(),               // Routing
  provideHttpClient(),           // HTTP
  provideAnimationsAsync(),      // UI
  provideNativeDateAdapter()     // Material
]

// ❌ Bad - Random order
providers: [
  provideAnimationsAsync(),
  provideZoneChangeDetection(),
  provideNativeDateAdapter(),
  provideRouter(),
  provideHttpClient()
]
```

### 2. Environment-Specific Providers
```typescript
// ✅ Good - Use environment
...(environment.production ? [] : [withDebugTracing()])

// ❌ Bad - Hardcoded
withDebugTracing()  // Always enabled
```

### 3. Interceptor Order
```typescript
// ✅ Good - Auth before error
withInterceptors([authInterceptor, errorInterceptor])

// ❌ Bad - Error before auth
withInterceptors([errorInterceptor, authInterceptor])
```

### 4. Documentation
```typescript
// ✅ Good - Documented
provideZoneChangeDetection({ 
  eventCoalescing: true  // Coalesce events for better performance
})

// ❌ Bad - No explanation
provideZoneChangeDetection({ eventCoalescing: true })
```

---

## Migration Guide

### From NgModule to Standalone

#### Before (NgModule)
```typescript
@NgModule({
  imports: [
    BrowserModule,
    RouterModule.forRoot(routes),
    HttpClientModule,
    BrowserAnimationsModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ]
})
export class AppModule { }
```

#### After (Standalone)
```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimationsAsync()
  ]
};
```

---

## Testing

### Unit Test Setup
```typescript
import { TestBed } from '@angular/core/testing';
import { testConfig } from './app.config';

describe('MyComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: testConfig.providers
    });
  });
});
```

### E2E Test Setup
```typescript
// No special configuration needed
// App uses production config
```

---

## Related Files

- `app.routes.ts` - Route definitions
- `app.component.ts` - Root component
- `main.ts` - Application bootstrap
- `interceptors/*.ts` - HTTP interceptors
- `guards/*.ts` - Route guards
- `environments/*.ts` - Environment configuration

---

## Additional Resources

- [Angular Standalone Components](https://angular.io/guide/standalone-components)
- [Angular Router](https://angular.io/guide/router)
- [HTTP Client](https://angular.io/guide/http)
- [Angular Material](https://material.angular.io/)
- [Performance Guide](https://angular.io/guide/performance-best-practices)
