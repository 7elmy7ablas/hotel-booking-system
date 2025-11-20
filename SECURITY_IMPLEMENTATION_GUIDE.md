# Security Implementation Guide

Quick reference for developers on how to use the security features.

---

## 1. XSS Prevention (Frontend)

### Using SanitizationService

```typescript
import { SanitizationService } from './services/sanitization.service';

constructor(private sanitizer: SanitizationService) {}

// Sanitize HTML content
const safeHtml = this.sanitizer.sanitizeHtml(userInput);

// Sanitize plain text
const safeText = this.sanitizer.sanitizeText(userInput);

// Sanitize email
const safeEmail = this.sanitizer.sanitizeEmail(email);

// Sanitize search query
const safeQuery = this.sanitizer.sanitizeSearchQuery(searchTerm);

// Sanitize booking data
const safeBooking = this.sanitizer.sanitizeBookingData(bookingForm.value);
```

### In Templates

```html
<!-- NEVER use innerHTML directly -->
<div [innerHTML]="userContent"></div> ❌

<!-- ALWAYS sanitize first -->
<div [innerHTML]="sanitizer.sanitizeHtml(userContent)"></div> ✅

<!-- Or use text interpolation (auto-sanitized) -->
<div>{{ userContent }}</div> ✅
```

---

## 2. Secure Logging (Frontend)

### DO NOT Log Sensitive Data

```typescript
// ❌ NEVER DO THIS
console.log('User password:', password);
console.log('Auth token:', token);
console.log('User email:', email);

// ✅ DO THIS INSTEAD
// Use ErrorHandlingService for production-safe logging
this.errorService.logError(error, 'ComponentName');
```

### Production-Safe Error Logging

```typescript
import { ErrorHandlingService } from './services/error-handling.service';

constructor(private errorService: ErrorHandlingService) {}

try {
  // Your code
} catch (error) {
  // Automatically sanitizes sensitive data
  this.errorService.logError(error, 'MyComponent');
}
```

---

## 3. Secure Logging (Backend)

### Using LogSanitizationService

```csharp
private readonly LogSanitizationService _sanitizationService;

// Sanitize log messages
var sanitizedMessage = _sanitizationService.SanitizeLogMessage(message);
_logger.LogInformation(sanitizedMessage);

// Create safe log context
var safeContext = _sanitizationService.CreateSafeLogContext(
    ("Email", user.Email),
    ("Action", "Login")
);
_logger.LogInformation("User action: {@Context}", safeContext);
```

### DO NOT Log Sensitive Data

```csharp
// ❌ NEVER DO THIS
_logger.LogInformation("User password: {Password}", password);
_logger.LogInformation("JWT token: {Token}", token);
_logger.LogInformation("Credit card: {Card}", cardNumber);

// ✅ DO THIS INSTEAD
_logger.LogInformation("User login attempt for: {Email}", 
    _sanitizationService.SanitizeLogMessage(email));
```

---

## 4. JWT Authentication

### Frontend - Storing Tokens

```typescript
// ✅ Use TokenService (handles expiry automatically)
this.tokenService.setToken(token, expiresAt);

// ✅ Check authentication
if (this.authService.isAuthenticated) {
  // User is logged in
}

// ✅ Get token (auto-validates expiry)
const token = this.tokenService.getToken();
```

### Backend - Validating Tokens

```csharp
// JWT validation is automatic via JwtValidationMiddleware
// Just use [Authorize] attribute

[Authorize]
[HttpGet]
public async Task<IActionResult> GetSecureData()
{
    // Token is already validated
    var userId = User.FindFirst("userId")?.Value;
    return Ok(data);
}

// Role-based authorization
[Authorize(Roles = "Admin")]
[HttpDelete("{id}")]
public async Task<IActionResult> DeleteResource(Guid id)
{
    // Only admins can access
}
```

---

## 5. Rate Limiting

### Configuration (appsettings.json)

```json
{
  "IpRateLimiting": {
    "EnableEndpointRateLimiting": true,
    "GeneralRules": [
      {
        "Endpoint": "*/api/auth/login",
        "Period": "1m",
        "Limit": 5
      }
    ]
  }
}
```

### Testing Rate Limits

```bash
# Test login rate limit (should block after 5 requests)
for i in {1..10}; do
  curl -X POST http://localhost:5156/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"Test123!"}'
done
```

---

## 6. Error Handling

### Frontend - User-Friendly Errors

```typescript
// ErrorHandlingService automatically provides user-friendly messages
this.bookingService.createBooking(data).subscribe({
  next: (booking) => {
    // Success
  },
  error: (error) => {
    // Error interceptor shows user-friendly message
    // No need to handle manually
  }
});
```

### Backend - Production-Safe Errors

```csharp
try
{
    // Your code
}
catch (Exception ex)
{
    // Development: Full details
    // Production: Generic message only
    if (_env.IsDevelopment())
    {
        _logger.LogError(ex, "Detailed error message");
    }
    else
    {
        _logger.LogError("Error occurred. Type: {Type}", ex.GetType().Name);
    }
    
    return Problem(
        detail: _env.IsDevelopment() ? ex.Message : null,
        statusCode: 500,
        title: "An error occurred"
    );
}
```

---

## 7. Input Validation

### Frontend Validation

```typescript
// Always validate before sending to API
const bookingData = {
  guestName: this.sanitizer.sanitizeName(form.guestName),
  guestEmail: this.sanitizer.sanitizeEmail(form.guestEmail),
  guestPhone: this.sanitizer.sanitizePhoneNumber(form.guestPhone),
  specialRequests: this.sanitizer.sanitizeDescription(form.specialRequests)
};

// Validate email format
if (!bookingData.guestEmail) {
  this.showError('Invalid email address');
  return;
}
```

### Backend Validation

```csharp
// Use Data Annotations
public class BookingDto
{
    [Required]
    [EmailAddress]
    public string GuestEmail { get; set; }
    
    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string GuestName { get; set; }
    
    [Phone]
    public string GuestPhone { get; set; }
}

// Validate in controller
if (!ModelState.IsValid)
{
    return BadRequest(ModelState);
}
```

---

## 8. Password Security

### Frontend - Password Requirements

```typescript
// Password must meet these requirements:
// - At least 8 characters
// - At least one uppercase letter
// - At least one lowercase letter
// - At least one number
// - At least one special character

const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

if (!passwordPattern.test(password)) {
  this.showError('Password does not meet requirements');
}
```

### Backend - Password Validation

```csharp
// Use PasswordValidator
if (!PasswordValidator.IsValid(password, out var errorMessage))
{
    return BadRequest(new { message = errorMessage });
}

// Hash password with BCrypt (work factor 12)
var passwordHash = BCrypt.Net.BCrypt.HashPassword(password, workFactor: 12);

// Verify password
var isValid = BCrypt.Net.BCrypt.Verify(inputPassword, storedHash);
```

---

## 9. Security Headers

### Backend - SecurityHeadersMiddleware

```csharp
// Already configured in Program.cs
app.UseMiddleware<SecurityHeadersMiddleware>();

// Adds these headers:
// - X-Content-Type-Options: nosniff
// - X-Frame-Options: DENY
// - X-XSS-Protection: 1; mode=block
// - Referrer-Policy: no-referrer
// - Permissions-Policy: geolocation=(), microphone=(), camera=()
```

---

## 10. Testing Security

### Run Security Tests

```bash
# Backend security tests
cd src
dotnet test --filter "FullyQualifiedName~SecurityTests"

# Frontend security tests
cd client
npm test -- --include='**/sanitization.service.spec.ts'
```

### Manual Security Testing

```bash
# Test XSS prevention
curl -X POST http://localhost:5156/api/hotels \
  -H "Content-Type: application/json" \
  -d '{"name":"<script>alert(\"XSS\")</script>Hotel"}'

# Test rate limiting
for i in {1..10}; do
  curl -X POST http://localhost:5156/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"Test123!"}'
done

# Test JWT expiry
# 1. Login and get token
# 2. Wait for token to expire
# 3. Try to access protected endpoint
# 4. Should get 401 Unauthorized
```

---

## Security Checklist

### Before Committing Code

- [ ] No `console.log()` with sensitive data
- [ ] All user inputs sanitized
- [ ] Passwords never logged
- [ ] Tokens never logged
- [ ] Email addresses masked in logs
- [ ] Error messages don't expose internals
- [ ] All endpoints have rate limiting
- [ ] JWT validation on protected routes
- [ ] Input validation on all forms
- [ ] SQL injection prevention (use EF Core)

### Before Deploying

- [ ] Run all security tests
- [ ] Set JWT secret via environment variable
- [ ] Review production log levels
- [ ] Verify rate limiting configuration
- [ ] Test authentication flow
- [ ] Check error messages in production mode
- [ ] Verify HTTPS enforcement
- [ ] Review CORS configuration

---

## Common Security Mistakes

### ❌ DON'T

```typescript
// Don't log sensitive data
console.log('Password:', password);

// Don't use innerHTML without sanitization
element.innerHTML = userInput;

// Don't store tokens in localStorage without expiry
localStorage.setItem('token', token);

// Don't expose internal errors to users
throw new Error('Database connection failed: ' + connectionString);
```

### ✅ DO

```typescript
// Use sanitization service
const safe = this.sanitizer.sanitizeHtml(userInput);

// Use TokenService with expiry
this.tokenService.setToken(token, expiresAt);

// Use ErrorHandlingService
this.errorService.logError(error, 'Component');

// Return generic error messages
return { message: 'An error occurred. Please try again.' };
```

---

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [DOMPurify Documentation](https://github.com/cure53/DOMPurify)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [ASP.NET Core Security](https://docs.microsoft.com/en-us/aspnet/core/security/)
- [Angular Security Guide](https://angular.io/guide/security)

---

**Last Updated:** November 20, 2025
