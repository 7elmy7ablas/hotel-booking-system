# Security Testing Guide

Complete guide for testing all security fixes in the hotel booking application.

---

## Prerequisites

```bash
# Install dependencies
cd client
npm install

# Verify DOMPurify is installed
npm list dompurify
# Should show: dompurify@3.0.6
```

---

## 1. Backend Security Tests

### Run All Security Tests

```bash
cd src
dotnet test HotelBooking.Tests/HotelBooking.Tests.csproj --filter "FullyQualifiedName~SecurityTests"
```

### Expected Output

```
✅ SecurityTests.PasswordValidator_ValidatesPasswordStrength (6 cases)
✅ SecurityTests.PasswordValidator_RejectsCommonPasswords
✅ SecurityTests.LogSanitization_RemovesPasswordsFromLogs
✅ SecurityTests.LogSanitization_RemovesTokensFromLogs
✅ SecurityTests.LogSanitization_MasksEmailAddresses
✅ SecurityTests.LogSanitization_RemovesPhoneNumbers
✅ SecurityTests.LogSanitization_RemovesCreditCardNumbers
✅ SecurityTests.LogSanitization_SanitizesExceptionMessages
✅ SecurityTests.JWT_ValidatesTokenExpiry
✅ SecurityTests.JWT_ValidatesTokenSignature
✅ SecurityTests.JWT_ValidatesRequiredClaims
✅ SecurityTests.RateLimiting_ConfigurationIsValid
✅ SecurityTests.InputValidation_DetectsMaliciousContent (5 cases)
✅ SecurityTests.InputValidation_ValidatesEmailFormat (5 cases)
✅ SecurityTests.SQLInjection_DetectsMaliciousQueries (4 cases)

Total: 20+ tests
Passed: 20+
Failed: 0
```

### Run Specific Test Categories

```bash
# Password validation tests
dotnet test --filter "FullyQualifiedName~PasswordValidator"

# Log sanitization tests
dotnet test --filter "FullyQualifiedName~LogSanitization"

# JWT validation tests
dotnet test --filter "FullyQualifiedName~JWT"

# Input validation tests
dotnet test --filter "FullyQualifiedName~InputValidation"
```

---

## 2. Frontend Security Tests

### Run All Sanitization Tests

```bash
cd client
npm test -- --include='**/sanitization.service.spec.ts'
```

### Expected Output

```
✅ SanitizationService - Security Tests
  ✅ should be created
  
  ✅ XSS Prevention
    ✅ should remove script tags from HTML
    ✅ should remove event handlers from HTML
    ✅ should remove iframe tags
    ✅ should allow safe HTML tags
    ✅ should sanitize text input by removing HTML
    ✅ should encode special characters in text
  
  ✅ Email Sanitization
    ✅ should validate and sanitize valid email
    ✅ should reject invalid email format
    ✅ should convert email to lowercase
  
  ✅ Search Query Sanitization
    ✅ should remove SQL injection attempts
    ✅ should remove script tags from search
    ✅ should limit search query length
  
  ✅ Description Sanitization
    ✅ should remove dangerous tags from description
    ✅ should remove event handlers from description
    ✅ should limit description length
  
  ✅ Phone Number Sanitization
    ✅ should keep valid phone number characters
    ✅ should remove invalid characters from phone
  
  ✅ Booking Data Sanitization
    ✅ should sanitize all booking fields
  
  ✅ User Data Sanitization
    ✅ should sanitize user registration data
  
  ✅ Number Sanitization
    ✅ should parse valid numbers
    ✅ should return null for invalid numbers
  
  ✅ Date Sanitization
    ✅ should validate and sanitize valid dates
    ✅ should return null for invalid dates
  
  ✅ Object Sanitization
    ✅ should recursively sanitize object properties

Total: 30+ tests
Passed: 30+
Failed: 0
```

### Run Specific Test Suites

```bash
# XSS prevention tests only
npm test -- --include='**/sanitization.service.spec.ts' --grep='XSS Prevention'

# Email validation tests only
npm test -- --include='**/sanitization.service.spec.ts' --grep='Email Sanitization'
```

---

## 3. Manual Security Testing

### Test 1: XSS Prevention

```bash
# Start the API
cd src/HotelBooking.API
dotnet run

# Test XSS in hotel name
curl -X POST http://localhost:5156/api/hotels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "<script>alert(\"XSS\")</script>Malicious Hotel",
    "location": "Test City",
    "description": "<img src=x onerror=alert(\"XSS\")>",
    "rating": 4.5
  }'

# Expected: Script tags should be removed/sanitized
```

### Test 2: Rate Limiting

```bash
# Test login rate limit (should block after 5 attempts)
for i in {1..10}; do
  echo "Attempt $i"
  curl -X POST http://localhost:5156/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"WrongPass123!"}'
  echo ""
done

# Expected: First 5 attempts return 401, next 5 return 429 (Rate Limit Exceeded)
```

### Test 3: JWT Expiry

```bash
# 1. Login and get token
TOKEN=$(curl -X POST http://localhost:5156/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hotel.com","password":"Admin123!"}' \
  | jq -r '.token')

# 2. Use token immediately (should work)
curl -X GET http://localhost:5156/api/bookings \
  -H "Authorization: Bearer $TOKEN"

# 3. Wait for token to expire (or modify JWT expiry to 1 minute for testing)
# 4. Try again (should fail with 401)
curl -X GET http://localhost:5156/api/bookings \
  -H "Authorization: Bearer $TOKEN"

# Expected: 401 Unauthorized after expiry
```

### Test 4: Log Sanitization

```bash
# 1. Start API with logging
cd src/HotelBooking.API
dotnet run

# 2. Attempt login with email
curl -X POST http://localhost:5156/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'

# 3. Check logs (logs/hotel-booking-*.txt)
cat logs/hotel-booking-*.txt | grep "test@example.com"

# Expected: Email should be masked as "t***@example.com"
```

### Test 5: Production Error Handling

```bash
# 1. Set environment to Production
export ASPNETCORE_ENVIRONMENT=Production

# 2. Trigger an error (e.g., invalid booking)
curl -X POST http://localhost:5156/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "userId": "00000000-0000-0000-0000-000000000000",
    "roomId": "00000000-0000-0000-0000-000000000000",
    "checkIn": "2024-01-01",
    "checkOut": "2024-01-05"
  }'

# Expected: Generic error message, no stack trace or internal details
# Response should be like:
# {
#   "message": "An error occurred while processing your request.",
#   "statusCode": 500,
#   "errorId": "..."
# }
```

---

## 4. Integration Testing

### Full Authentication Flow

```bash
# 1. Register new user
curl -X POST http://localhost:5156/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@test.com",
    "password": "SecurePass123!",
    "fullName": "Test User",
    "phoneNumber": "555-123-4567"
  }'

# 2. Login with new user
TOKEN=$(curl -X POST http://localhost:5156/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"newuser@test.com","password":"SecurePass123!"}' \
  | jq -r '.token')

# 3. Access protected endpoint
curl -X GET http://localhost:5156/api/users/profile \
  -H "Authorization: Bearer $TOKEN"

# 4. Try to access admin endpoint (should fail)
curl -X DELETE http://localhost:5156/api/hotels/00000000-0000-0000-0000-000000000000 \
  -H "Authorization: Bearer $TOKEN"

# Expected: 403 Forbidden (user is not admin)
```

### Full Booking Flow with Sanitization

```bash
# 1. Login as user
TOKEN=$(curl -X POST http://localhost:5156/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@hotel.com","password":"User123!"}' \
  | jq -r '.token')

# 2. Get available hotels
HOTELS=$(curl -X GET http://localhost:5156/api/hotels \
  -H "Authorization: Bearer $TOKEN")

# 3. Create booking with potentially malicious input
curl -X POST http://localhost:5156/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "userId": "USER_ID_HERE",
    "roomId": "ROOM_ID_HERE",
    "checkIn": "2024-12-01",
    "checkOut": "2024-12-05",
    "guestName": "<script>alert(\"XSS\")</script>John Doe",
    "guestEmail": "john@example.com",
    "specialRequests": "<img src=x onerror=alert(\"XSS\")>No smoking"
  }'

# Expected: Booking created with sanitized data (no script tags)
```

---

## 5. Performance Testing

### Rate Limiting Performance

```bash
# Test rate limiting doesn't impact normal usage
time for i in {1..100}; do
  curl -s -X GET http://localhost:5156/api/hotels > /dev/null
done

# Expected: All requests succeed (under 100 req/min limit)
```

### Sanitization Performance

```bash
# Test sanitization overhead
# Run frontend tests with timing
cd client
npm test -- --include='**/sanitization.service.spec.ts' --reporter=time

# Expected: Each test completes in <100ms
```

---

## 6. Verification Checklist

### Backend Security

- [ ] All SecurityTests pass (20+ tests)
- [ ] Rate limiting blocks after configured limit
- [ ] JWT validation rejects expired tokens
- [ ] JWT validation rejects invalid signatures
- [ ] Logs don't contain passwords
- [ ] Logs don't contain tokens
- [ ] Logs mask email addresses
- [ ] Production errors don't expose internals
- [ ] SQL injection attempts are blocked

### Frontend Security

- [ ] All sanitization tests pass (30+ tests)
- [ ] Script tags are removed from HTML
- [ ] Event handlers are removed
- [ ] Email validation works correctly
- [ ] Search queries are sanitized
- [ ] No console.log with sensitive data
- [ ] Error messages are user-friendly
- [ ] DOMPurify is installed and working

### Integration

- [ ] Full authentication flow works
- [ ] Rate limiting doesn't block legitimate users
- [ ] Token expiry triggers re-login
- [ ] XSS attempts are sanitized
- [ ] Admin-only endpoints are protected
- [ ] Error handling works in production mode

---

## 7. Continuous Testing

### Pre-Commit Hook

Create `.git/hooks/pre-commit`:

```bash
#!/bin/bash

echo "Running security tests..."

# Backend tests
cd src
dotnet test --filter "FullyQualifiedName~SecurityTests" --logger "console;verbosity=minimal"
BACKEND_RESULT=$?

# Frontend tests
cd ../client
npm test -- --include='**/sanitization.service.spec.ts' --watch=false
FRONTEND_RESULT=$?

if [ $BACKEND_RESULT -ne 0 ] || [ $FRONTEND_RESULT -ne 0 ]; then
  echo "❌ Security tests failed. Commit aborted."
  exit 1
fi

echo "✅ All security tests passed."
exit 0
```

### CI/CD Pipeline

Add to your CI/CD configuration:

```yaml
# .github/workflows/security-tests.yml
name: Security Tests

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup .NET
        uses: actions/setup-dotnet@v1
        with:
          dotnet-version: '8.0.x'
      
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '20.x'
      
      - name: Backend Security Tests
        run: |
          cd src
          dotnet test --filter "FullyQualifiedName~SecurityTests"
      
      - name: Frontend Security Tests
        run: |
          cd client
          npm install
          npm test -- --include='**/sanitization.service.spec.ts' --watch=false
```

---

## 8. Troubleshooting

### Tests Failing

```bash
# Clear test cache
cd client
rm -rf node_modules/.cache
npm test -- --clearCache

# Rebuild backend
cd src
dotnet clean
dotnet build
dotnet test
```

### DOMPurify Not Found

```bash
cd client
npm install dompurify @types/dompurify --save
```

### Rate Limiting Not Working

```bash
# Check configuration
cat src/HotelBooking.API/appsettings.json | grep -A 20 "IpRateLimiting"

# Verify middleware is registered
cat src/HotelBooking.API/Program.cs | grep "UseIpRateLimiting"
```

---

## 9. Test Results Archive

### Save Test Results

```bash
# Backend
cd src
dotnet test --logger "trx;LogFileName=security-tests.trx" \
  --filter "FullyQualifiedName~SecurityTests"

# Frontend
cd client
npm test -- --include='**/sanitization.service.spec.ts' \
  --reporters=junit --outputFile=security-tests.xml
```

### View Test Coverage

```bash
# Backend coverage
cd src
dotnet test /p:CollectCoverage=true /p:CoverletOutputFormat=opencover \
  --filter "FullyQualifiedName~SecurityTests"

# Frontend coverage
cd client
npm test -- --coverage --include='**/sanitization.service.spec.ts'
```

---

## Summary

✅ **Backend Tests:** 20+ security tests  
✅ **Frontend Tests:** 30+ XSS prevention tests  
✅ **Manual Tests:** 5 integration scenarios  
✅ **Performance:** All tests complete in <5 seconds  
✅ **Coverage:** All security features tested

**Next Steps:**
1. Run all tests: `dotnet test` and `npm test`
2. Verify manual tests work as expected
3. Set up CI/CD pipeline for continuous testing
4. Review test results regularly

---

**Last Updated:** November 20, 2025
