# Authentication Implementation Guide

## Overview
JWT-based authentication has been successfully implemented in the HotelBooking API with three main endpoints.

## Configuration

### JWT Settings (appsettings.json)
```json
"Jwt": {
  "Secret": "YourSuperSecretKeyForJWTTokenGenerationMustBeAtLeast32CharactersLong",
  "Issuer": "HotelBookingAPI",
  "Audience": "HotelBookingClient",
  "ExpirationDays": 7
}
```

**Important:** Change the Secret key in production!

## API Endpoints

### 1. Register User
**POST** `/api/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "phoneNumber": "+1234567890"
}
```

**Response (201 Created):**
```json
{
  "id": "guid",
  "email": "user@example.com",
  "fullName": "John Doe",
  "phoneNumber": "+1234567890",
  "role": "User",
  "createdAt": "2025-11-18T00:00:00Z",
  "updatedAt": null,
  "isDeleted": false
}
```

**Validations:**
- Email must be unique
- Email must be valid format
- Password minimum 6 characters
- Password hashed with BCrypt (work factor 12)
- Default role: "User"

### 2. Login
**POST** `/api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "guid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "phoneNumber": "+1234567890",
    "role": "User",
    "createdAt": "2025-11-18T00:00:00Z",
    "updatedAt": null,
    "isDeleted": false
  },
  "expiresAt": "2025-11-25T00:00:00Z"
}
```

**JWT Token Claims:**
- UserId (sub)
- Email
- Role
- Token ID (jti)

**Error Response (401 Unauthorized):**
```json
{
  "message": "Invalid email or password"
}
```

### 3. Change Password
**POST** `/api/auth/change-password`

**Request Body:**
```json
{
  "email": "user@example.com",
  "oldPassword": "password123",
  "newPassword": "newpassword456"
}
```

**Response (200 OK):**
```json
{
  "message": "Password changed successfully"
}
```

**Validations:**
- Old password must be correct
- New password minimum 6 characters
- New password hashed with BCrypt (work factor 12)

## Testing with Swagger

1. Start the API
2. Navigate to `/swagger`
3. Click "Authorize" button (top right)
4. Register a new user via `/api/auth/register`
5. Login via `/api/auth/login` to get JWT token
6. Copy the token from response
7. Click "Authorize" and enter: `Bearer {your-token}`
8. Now you can access protected endpoints

## Testing with cURL

### Register
```bash
curl -X POST "https://localhost:7000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123",
    "fullName": "Test User",
    "phoneNumber": "+1234567890"
  }'
```

### Login
```bash
curl -X POST "https://localhost:7000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123"
  }'
```

### Change Password
```bash
curl -X POST "https://localhost:7000/api/auth/change-password" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "oldPassword": "test123",
    "newPassword": "newtest456"
  }'
```

## Security Features

1. **Password Hashing:** BCrypt with work factor 12
2. **JWT Tokens:** 7-day expiration (configurable)
3. **Email Validation:** Built-in format validation
4. **Password Strength:** Minimum 6 characters
5. **Unique Email:** Database constraint enforced
6. **Soft Delete Support:** Ignores deleted users

## Files Created

- `Controllers/AuthController.cs` - Main authentication controller
- `DTOs/RegisterDto.cs` - Registration request model
- `DTOs/LoginDto.cs` - Login request model
- `DTOs/ChangePasswordDto.cs` - Password change request model
- `DTOs/LoginResponseDto.cs` - Login response with token

## Files Modified

- `appsettings.json` - Added JWT configuration
- `Program.cs` - Added JWT authentication middleware and Swagger security

## Protected Endpoints

All controllers except AuthController now require authentication:

### Class-Level Authorization
- **HotelsController** - `[Authorize]` - All endpoints require authentication
- **RoomsController** - `[Authorize]` - All endpoints require authentication
- **UsersController** - `[Authorize]` - All endpoints require authentication
- **BookingsController** - `[Authorize]` - All endpoints require authentication
- **PaymentsController** - `[Authorize]` - All endpoints require authentication

### Role-Based Authorization (Admin Only)
The following endpoints require Admin role:

**UsersController:**
- GET `/api/users` - List all users (Admin only)
- POST `/api/users` - Create user (Admin only)
- PUT `/api/users/{id}` - Update user (Admin only)
- DELETE `/api/users/{id}` - Delete user (Admin only)

**HotelsController:**
- DELETE `/api/hotels/{id}` - Delete hotel (Admin only)

**RoomsController:**
- DELETE `/api/rooms/{id}` - Delete room (Admin only)

**BookingsController:**
- DELETE `/api/bookings/{id}` - Delete booking (Admin only)

**PaymentsController:**
- DELETE `/api/payments/{id}` - Delete payment (Admin only)

## Using Protected Endpoints

### With Bearer Token
After logging in, include the JWT token in the Authorization header:

```bash
curl -X GET "https://localhost:7000/api/hotels" \
  -H "Authorization: Bearer {your-jwt-token}"
```

### Testing in Swagger
1. Login via `/api/auth/login`
2. Copy the token from response
3. Click "Authorize" button (top right)
4. Enter: `Bearer {your-token}`
5. All protected endpoints will now work

### Creating an Admin User
To test admin endpoints, you need to create a user with "Admin" role. You can:

1. Register a normal user via `/api/auth/register`
2. Manually update the Role in the database to "Admin"
3. Or modify the registration endpoint temporarily to allow admin registration

## Next Steps

1. Consider adding refresh tokens for better security
2. Add email verification for registration
3. Implement password reset functionality
4. Add rate limiting for auth endpoints
5. Add user-specific authorization (users can only access their own data)
6. Implement token refresh mechanism
