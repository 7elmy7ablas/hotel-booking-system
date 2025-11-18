# Hotel Booking System - Clean Architecture

A comprehensive hotel booking system built with .NET 10 following Clean Architecture principles.

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

## Getting Started

### Prerequisites
- .NET 10 SDK
- SQL Server (LocalDB or full instance)

### Database Setup

1. Update the connection string in `appsettings.json` if needed
2. Create the database migration:
```bash
cd src/HotelBooking.Infrastructure
dotnet ef migrations add InitialCreate --startup-project ../HotelBooking.API
```

3. Apply the migration:
```bash
dotnet ef database update --startup-project ../HotelBooking.API
```

### Running the Application

```bash
cd src/HotelBooking.API
dotnet run
```

The API will be available at:
- HTTPS: https://localhost:5001
- HTTP: http://localhost:5000
- Swagger UI: https://localhost:5001/swagger

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
