# App Configuration Quick Reference

## Current Setup

### ✅ Configured Providers

| Provider | Purpose | Status |
|----------|---------|--------|
| `provideZoneChangeDetection` | Optimized change detection | ✅ Configured |
| `provideRouter` | Routing with preloading | ✅ Configured |
| `provideHttpClient` | HTTP with interceptors | ✅ Configured |
| `provideAnimationsAsync` | Material animations | ✅ Configured |
| `provideNativeDateAdapter` | Material date components | ✅ Configured |

### Router Features

- ✅ **Preloading**: All modules preloaded in background
- ✅ **Scroll Restoration**: Automatic scroll position management
- ✅ **Anchor Scrolling**: Support for #anchor links
- ✅ **Debug Tracing**: Enabled in development only

### HTTP Features

- ✅ **Auth Interceptor**: Automatic JWT token injection
- ✅ **Error Interceptor**: Global error handling
- ✅ **Fetch API**: Modern HTTP implementation

### Material Features

- ✅ **Async Animations**: Lazy-loaded for performance
- ✅ **Native Date Adapter**: For date pickers

## Quick Commands

```bash
# Development (with debug tracing)
ng serve

# Production (optimized)
ng build --configuration production

# Test (no animations)
ng test
```

## Provider Order

```
1. Zone Change Detection  ← Core Angular
2. Router                 ← Navigation
3. HTTP Client            ← API calls
4. Animations             ← Material UI
5. Date Adapter           ← Material dates
```

## Environment-Specific

### Development
- Debug tracing: **ON**
- Logging: **ON**
- API: `https://localhost:7291/api`

### Production
- Debug tracing: **OFF**
- Logging: **OFF**
- API: `https://your-production-api.com/api`

## Common Tasks

### Add New Interceptor
```typescript
provideHttpClient(
  withInterceptors([
    authInterceptor,
    errorInterceptor,
    newInterceptor  // Add here
  ])
)
```

### Add New Service
```typescript
providers: [
  // ... existing providers
  MyNewService
]
```

### Disable Debug Tracing
```typescript
// Remove or comment out
withDebugTracing()
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Animations not working | Check `provideAnimationsAsync()` |
| Routes not loading | Check `provideRouter(routes)` |
| HTTP failing | Check `provideHttpClient()` |
| Date picker error | Check `provideNativeDateAdapter()` |

## Performance Tips

1. ✅ Event coalescing enabled
2. ✅ Module preloading enabled
3. ✅ Async animations enabled
4. ✅ Fetch API enabled
5. ✅ Lazy loading enabled

## Files

- `app.config.ts` - Main configuration
- `app.routes.ts` - Route definitions
- `interceptors/*.ts` - HTTP interceptors
- `guards/*.ts` - Route guards
- `environments/*.ts` - Environment config
