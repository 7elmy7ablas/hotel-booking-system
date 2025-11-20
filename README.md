# Hotel Booking System - Clean Architecture

A comprehensive hotel booking system built with .NET 10 following Clean Architecture principles.

## Quick Start

### Prerequisites
- .NET 10 SDK
- SQL Server (LocalDB for development, SQL Server for production)
- Node.js 18+ (for Angular frontend)

### Environment Variables

For production deployment, configure these environment variables:

**Database:**
- `CONNECTION_STRING` - Database connection string

**JWT Authentication:**
- `JWT_SECRET` - Secret key for JWT token signing (minimum 32 characters)
- `JWT_ISSUER` - Token issuer (default: "HotelBookingAPI")
- `JWT_AUDIENCE` - Token audience (default: "HotelBookingClient")

**Email (Optional):**
- `EMAIL_SMTP_SERVER` - SMTP server address
- `EMAIL_SMTP_PORT` - SMTP port
- `EMAIL_SMTP_USERNAME` - SMTP username
- `EMAIL_SMTP_PASSWORD` - SMTP password
- `EMAIL_FROM` - Sender email address

**Application:**
- `ASPNETCORE_ENVIRONMENT` - Set to "Production" for production deployment

### Setup Steps

1. Clone the repository
2. Navigate to the API project:
```bash
cd src/HotelBooking.API
```

3. Restore dependencies:
```bash
dotnet restore
```

4. Update database connection string in `appsettings.json` (development) or set `CONNECTION_STRING` environment variable (production)

5. Run database migrations:
```bash
cd ../HotelBooking.Infrastructure
dotnet ef migrations add InitialCreate --startup-project ../HotelBooking.API
dotnet ef database update --startup-project ../HotelBooking.API
```

6. Run the application:
```bash
cd ../HotelBooking.API
dotnet run
```

The API will be available at:
- HTTPS: https://localhost:5001
- HTTP: http://localhost:5000
- Swagger UI: https://localhost:5001/swagger

### Production Deployment

1. Build the application:
```bash
dotnet build -c Release
```

2. Publish the application:
```bash
dotnet publish -c Release -o ./publish
```

3. Set environment variables on your server
4. Run database migrations on production database
5. Deploy published files to your server
6. Configure reverse proxy (IIS/Nginx/Apache)
7. Verify health endpoint: `GET /api/health`

See `deployment-checklist.md` for complete deployment guide.

## Project Structure

```
src/
├── HotelBooking.Domain/          # Domain Layer - Core business entities
│   ├── Common/
│   │   └── BaseEntity.cs         # Base entity with audit fields
│   └── Entities/
│       ├── Hotel.cs              # Hotel entity
│       ├── Room.cs               # Room entity
│       ├── User.cs               # User entity
│       ├── Booking.cs            # Booking entity
│       └── Payment.cs            # Payment entity
│
├── HotelBooking.Application/     # Application Layer - Business logic interfaces
│   └── Interfaces/
│       └── IRepository.cs        # Generic repository interface
│
├── HotelBooking.Infrastructure/  # Infrastructure Layer - Data access
│   ├── Data/
│   │   └── ApplicationDbContext.cs  # EF Core DbContext
│   └── Repositories/
│       └── Repository.cs         # Generic repository implementation
│
└── HotelBooking.API/             # API Layer - Web API endpoints
    ├── Program.cs                # Application entry point
    ├── appsettings.json          # Configuration
    └── appsettings.Development.json
```

## Features

### Domain Layer
- **BaseEntity**: Common properties for all entities (Id, CreatedAt, UpdatedAt, IsDeleted, DeletedAt)
- **Hotel**: Name, Location, Description, Rating, Amenities
- **Room**: RoomType, PricePerNight, Capacity, IsAvailable
- **User**: Email, PasswordHash, FullName, PhoneNumber, Role
- **Booking**: CheckIn, CheckOut, TotalPrice, Status
- **Payment**: Amount, PaymentMethod, Status, PaymentDate

### Application Layer
- Generic repository interface with CRUD operations
- Support for async operations with cancellation tokens

### Infrastructure Layer
- **ApplicationDbContext** with:
  - Fluent API configuration for all entities
  - Soft delete query filters
  - Automatic timestamp updates (CreatedAt/UpdatedAt)
  - Proper relationships and foreign keys
  - Performance indexes on key fields
  - Decimal(18,2) precision for monetary values

### API Layer
- Minimal APIs pattern
- Serilog logging (console + file)
- Swagger/OpenAPI documentation
- Health checks for database
- CORS support
- Sample endpoints:
  - `GET /` - API status
  - `GET /api/hotels` - Get all hotels
  - `GET /api/hotels/{id}` - Get hotel by ID
  - `GET /health` - Health check

## Technologies

- .NET 10
- Entity Framework Core 10
- SQL Server
- Serilog
- Swagger/OpenAPI

## API Endpoints

### Health & Status
- `GET /` - API status and version
- `GET /api/health` - Health check with version and timestamp
- `GET /health` - Database health check

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login (returns JWT token)

### Hotels
- `GET /api/hotels` - Get all hotels
- `GET /api/hotels/{id}` - Get hotel by ID
- `POST /api/hotels` - Create new hotel (requires authentication)
- `PUT /api/hotels/{id}` - Update hotel (requires authentication)
- `DELETE /api/hotels/{id}` - Delete hotel (requires authentication)

### Rooms
- `GET /api/rooms` - Get all rooms
- `GET /api/rooms/{id}` - Get room by ID
- `GET /api/rooms/hotel/{hotelId}` - Get rooms by hotel
- `GET /api/rooms/available` - Get available rooms (query params: checkIn, checkOut)
- `POST /api/rooms` - Create new room (requires authentication)
- `PUT /api/rooms/{id}` - Update room (requires authentication)
- `DELETE /api/rooms/{id}` - Delete room (requires authentication)

### Bookings
- `GET /api/bookings` - Get all bookings (admin only)
- `GET /api/bookings/{id}` - Get booking by ID
- `GET /api/bookings/user/{userId}` - Get user bookings
- `POST /api/bookings` - Create new booking (requires authentication)
- `PUT /api/bookings/{id}` - Update booking (requires authentication)
- `DELETE /api/bookings/{id}` - Cancel booking (requires authentication)

### Payments
- `GET /api/payments/{id}` - Get payment by ID
- `GET /api/payments/booking/{bookingId}` - Get payment by booking
- `POST /api/payments` - Process payment (requires authentication)

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/{id}` - Get user by ID
- `PUT /api/users/{id}` - Update user (requires authentication)
- `DELETE /api/users/{id}` - Delete user (requires authentication)

## Architecture Principles

### Clean Architecture Layers
1. **Domain** - Core business entities (no dependencies)
2. **Application** - Business logic interfaces (depends on Domain)
3. **Infrastructure** - Data access implementation (depends on Application)
4. **API** - Web API endpoints (depends on Infrastructure)

### Key Features
- **Soft Delete**: Entities are marked as deleted instead of being removed
- **Audit Trail**: Automatic tracking of creation and modification timestamps
- **Repository Pattern**: Generic repository for data access
- **Dependency Injection**: All dependencies are injected
- **Async/Await**: All database operations are asynchronous
- **Logging**: Comprehensive logging with Serilog
- **Health Checks**: Database connectivity monitoring

## Database Schema

### Indexes
- Hotels: Location, Rating
- Rooms: HotelId, IsAvailable, RoomType
- Users: Email (unique), Role
- Bookings: UserId, RoomId, CheckIn, CheckOut, Status, (RoomId + CheckIn + CheckOut)
- Payments: BookingId (unique), Status, PaymentDate

### Relationships
- Hotel → Rooms (One-to-Many)
- User → Bookings (One-to-Many)
- Room → Bookings (One-to-Many)
- Booking → Payment (One-to-One)

## Configuration

### Connection String
Update in `appsettings.json`:
```json
"ConnectionStrings": {
  "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=HotelBookingDb;Trusted_Connection=true;MultipleActiveResultSets=true;TrustServerCertificate=true"
}
```

### Logging
Logs are written to:
- Console (for development)
- File: `logs/hotel-booking-{Date}.txt` (retained for 30 days)

## Next Steps

To extend this application, consider adding:
- Authentication & Authorization (JWT)
- CQRS pattern with MediatR
- Validation with FluentValidation
- Unit tests with xUnit
- Integration tests
- Docker support
- API versioning
- Rate limiting
- Caching with Redis
- Background jobs with Hangfire
