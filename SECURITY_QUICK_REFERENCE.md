# Security Quick Reference Card

One-page reference for all security features.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
cd client && npm install

# 2. Run tests
cd ../src && dotnet test --filter "SecurityTests"
cd ../client && npm test -- --include='**/sanitization.service.spec.ts'

# 3. Start application
cd ../src/HotelBooking.API && dotnet run
cd ../../client && npm start
```

---

## 🛡️ Security Features

| Feature | Status | Location |
|---------|--------|----------|
| XSS Prevention | ✅ Active | `SanitizationService` |
| Rate Limiting | ✅ Active | `Program.cs` |
| JWT Validation | ✅ Active | `JwtValidationMiddleware` |
| Log Sanitization | ✅ Active | `LogSanitizationService` |
| Error Handling | ✅ Active | `GlobalExceptionHandler` |

---

## 📝 Common Tasks

### Sanitize User Input (Frontend)

```typescript
// Inject service
constructor(private sanitizer: SanitizationService) {}

// Sanitize HTML
const safe = this.sanitizer.sanitizeHtml(userInput);

// Sanitize text
const safe = this.sanitizer.sanitizeText(userInput);

// Sanitize email
const safe = this.sanitizer.sanitizeEmail(email);
```

### Secure Logging (Backend)

```csharp
// Inject service
private readonly LogSanitizationService _sanitizer;

// Sanitize message
var safe = _sanitizer.SanitizeLogMessage(message);
_logger.LogInformation(safe);

// Create safe context
var context = _sanitizer.CreateSafeLogContext(
    ("Email", email),
    ("Action", "Login")
);
_logger.LogInformation("User action: {@Context}", context);
```

### Validate JWT (Backend)

```csharp
// Automatic via middleware
[Authorize]
[HttpGet]
public async Task<IActionResult> SecureEndpoint()
{
    var userId = User.FindFirst("userId")?.Value;
    return Ok(data);
}

// Role-based
[Authorize(Roles = "Admin")]
[HttpDelete("{id}")]
public async Task<IActionResult> AdminOnly(Guid id)
{
    return NoContent();
}
```

---

## 🔒 Rate Limits

| Endpoint | Limit | Period |
|----------|-------|--------|
| `/api/auth/login` | 5 | 1 min |
| `/api/auth/register` | 3 | 1 min |
| `/api/auth/change-password` | 3 | 1 hour |
| `/api/bookings` | 10 | 1 min |
| All others | 100 | 1 min |

---

## ✅ Security Checklist

### Before Commit
- [ ] No `console.log()` with sensitive data
- [ ] All inputs sanitized
- [ ] Passwords never logged
- [ ] Tokens never logged

### Before Deploy
- [ ] Run all tests
- [ ] Set JWT secret (env var)
- [ ] Review log levels
- [ ] Test auth flow

---

## 🧪 Test Commands

```bash
# Backend security tests
cd src
dotnet test --filter "SecurityTests"

# Frontend XSS tests
cd client
npm test -- --include='**/sanitization.service.spec.ts'

# All tests
dotnet test && npm test
```

---

## ❌ Don't Do This

```typescript
// ❌ Log sensitive data
console.log('Password:', password);
console.log('Token:', token);

// ❌ Use innerHTML without sanitization
element.innerHTML = userInput;

// ❌ Expose internal errors
throw new Error('DB connection: ' + connectionString);
```

---

## ✅ Do This Instead

```typescript
// ✅ Use sanitization
const safe = this.sanitizer.sanitizeHtml(userInput);

// ✅ Use error service
this.errorService.logError(error, 'Component');

// ✅ Generic errors
return { message: 'An error occurred' };
```

---

## 📊 Test Results

### Expected Output

```
Backend:  20+ tests ✅
Frontend: 30+ tests ✅
Total:    50+ tests ✅
```

---

## 🆘 Troubleshooting

### DOMPurify Not Found
```bash
cd client
npm install dompurify @types/dompurify
```

### Tests Failing
```bash
# Clear cache
npm test -- --clearCache
dotnet clean && dotnet build
```

### Rate Limiting Not Working
```bash
# Check config
cat src/HotelBooking.API/appsettings.json | grep "IpRateLimiting"
```

---

## 📚 Documentation

- **Full Report:** `SECURITY_FIXES_REPORT.md`
- **Implementation Guide:** `SECURITY_IMPLEMENTATION_GUIDE.md`
- **Testing Guide:** `SECURITY_TESTING_GUIDE.md`
- **Summary:** `SECURITY_FIXES_SUMMARY.md`

---

## 🎯 Key Files

### Frontend
- `client/src/app/services/sanitization.service.ts`
- `client/src/app/services/error-handling.service.ts`
- `client/src/app/services/auth.service.ts`

### Backend
- `src/HotelBooking.API/Services/LogSanitizationService.cs`
- `src/HotelBooking.API/Middleware/JwtValidationMiddleware.cs`
- `src/HotelBooking.API/Middleware/GlobalExceptionHandler.cs`

### Tests
- `src/HotelBooking.Tests/SecurityTests.cs`
- `client/src/app/services/sanitization.service.spec.ts`

---

## 🔐 Password Requirements

- ✅ At least 8 characters
- ✅ One uppercase letter
- ✅ One lowercase letter
- ✅ One number
- ✅ One special character
- ❌ Not a common password

---

## 🌐 Environment Variables

```bash
# Production
export JWT_SECRET="your-secure-secret-key-here"
export JWT_ISSUER="HotelBookingAPI"
export JWT_AUDIENCE="HotelBookingClient"
export ASPNETCORE_ENVIRONMENT="Production"
```

---

## 📞 Support

1. Check implementation guide
2. Review test results
3. Run diagnostics
4. Check logs

---

**Status:** ✅ All security features active  
**Last Updated:** November 20, 2025
