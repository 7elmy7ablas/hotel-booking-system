# 🏨 Hotel Booking System - Production Delivery Package

## Executive Summary

The Hotel Booking System is a comprehensive, enterprise-grade web application built with modern technologies and best practices. This document provides complete documentation for deployment, operation, and maintenance of the production system.

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Deployment Guide](#deployment-guide)
5. [Configuration](#configuration)
6. [API Documentation](#api-documentation)
7. [Security](#security)
8. [Monitoring & Logging](#monitoring--logging)
9. [Troubleshooting](#troubleshooting)
10. [Support & Contact](#support--contact)

---

## 🎯 System Overview

### Purpose
A full-featured hotel booking platform enabling users to:
- Search and browse hotels with advanced filtering
- View detailed hotel information and room availability
- Make, manage, and cancel reservations
- View booking history and status

### Key Features
- ✅ User authentication with JWT tokens
- ✅ Hotel search with filters (location, price, rating, amenities)
- ✅ Real-time room availability checking
- ✅ Booking management (create, view, cancel)
- ✅ Admin dashboard for hotel management
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Performance optimized with caching
- ✅ Comprehensive logging and monitoring

---

## 🏗️ Architecture

### System Architecture
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Angular 19    │────▶│   .NET 10 API   │────▶│   PostgreSQL    │
│   (Frontend)    │     │   (Backend)     │     │   (Database)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │                       │                       │
        ▼                       ▼                       ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Nginx       │     │   Redis Cache   │     │   Blob Storage  │
│   (Reverse      │     │   (Optional)    │     │   (Images)      │
│    Proxy)       │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Clean Architecture Layers
```
src/
├── HotelBooking.Domain/        # Entities, Value Objects, Domain Logic
├── HotelBooking.Application/   # Use Cases, DTOs, Interfaces
├── HotelBooking.Infrastructure/# Data Access, External Services
└── HotelBooking.API/           # Controllers, Middleware, Configuration
```

---

## 🛠️ Technology Stack

### Backend
| Component | Technology | Version |
|-----------|------------|---------|
| Runtime | .NET | 10.0 |
| Framework | ASP.NET Core | 10.0 |
| ORM | Entity Framework Core | 10.0 |
| Database | PostgreSQL | 15+ |
| Authentication | JWT Bearer | - |
| Validation | FluentValidation | 11.x |
| Logging | Serilog | 4.x |

### Frontend
| Component | Technology | Version |
|-----------|------------|---------|
| Framework | Angular | 19.x |
| UI Library | Angular Material | 19.x |
| State Management | Signals | - |
| HTTP Client | HttpClient | - |
| E2E Testing | Playwright | 1.x |

### Infrastructure
| Component | Technology |
|-----------|------------|
| Containerization | Docker |
| Orchestration | Docker Compose / Kubernetes |
| CI/CD | GitHub Actions |
| Cloud | Azure / AWS |
| CDN | Azure CDN / CloudFront |

---

## 🚀 Deployment Guide

### Prerequisites
- Docker & Docker Compose
- .NET 10 SDK (for local development)
- Node.js 22+ (for frontend development)
- PostgreSQL 15+ (or use Docker)

### Quick Start with Docker

```bash
# Clone the repository
git clone https://github.com/your-org/hotel-booking-system.git
cd hotel-booking-system

# Start all services
docker-compose up -d

# Access the application
# Frontend: http://localhost:4200
# API: http://localhost:5000
# API Docs: http://localhost:5000/swagger
```

### Manual Deployment

#### Backend
```bash
cd src/HotelBooking.API

# Restore and build
dotnet restore
dotnet build --configuration Release

# Run migrations
dotnet ef database update --project ../HotelBooking.Infrastructure

# Publish
dotnet publish -c Release -o ./publish

# Run
cd publish
dotnet HotelBooking.API.dll
```

#### Frontend
```bash
cd client

# Install dependencies
npm ci

# Build for production
npm run build -- --configuration=production

# Serve with nginx or any static file server
# Output: dist/hotel-booking-client/
```

### Azure Deployment

```bash
# Login to Azure
az login

# Create resource group
az group create --name hotel-booking-rg --location eastus

# Deploy using Bicep template
az deployment group create \
  --resource-group hotel-booking-rg \
  --template-file azure/main.bicep \
  --parameters @azure/parameters.json
```

---

## ⚙️ Configuration

### Environment Variables

#### Backend (appsettings.json)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=hotel_booking;Username=postgres;Password=your_password"
  },
  "Jwt": {
    "Secret": "your-256-bit-secret-key-here",
    "Issuer": "HotelBooking.API",
    "Audience": "HotelBooking.Client",
    "ExpirationMinutes": 60
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  }
}
```

#### Frontend (environment.prod.ts)
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.hotelbooking.com',
  endpoints: {
    auth: '/api/auth',
    hotels: '/api/hotels',
    bookings: '/api/bookings',
    rooms: '/api/rooms'
  }
};
```

### Docker Environment
```yaml
# docker-compose.override.yml
services:
  api:
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ConnectionStrings__DefaultConnection=Host=db;Database=hotel_booking;Username=postgres;Password=${DB_PASSWORD}
      - Jwt__Secret=${JWT_SECRET}
```

---

## 📡 API Documentation

### Base URL
- Development: `http://localhost:5000/api`
- Production: `https://api.hotelbooking.com/api`

### Authentication
All protected endpoints require a Bearer token:
```
Authorization: Bearer <jwt_token>
```

### Endpoints Summary

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /auth/login | User login | No |
| POST | /auth/register | User registration | No |
| GET | /hotels | List hotels (paginated) | No |
| GET | /hotels/{id} | Get hotel details | No |
| POST | /hotels | Create hotel | Admin |
| PUT | /hotels/{id} | Update hotel | Admin |
| DELETE | /hotels/{id} | Delete hotel | Admin |
| GET | /bookings | List all bookings | Admin |
| GET | /bookings/my-bookings | User's bookings | Yes |
| POST | /bookings | Create booking | Yes |
| DELETE | /bookings/{id} | Cancel booking | Yes |

### Swagger Documentation
Access interactive API documentation at:
- Development: http://localhost:5000/swagger
- Production: https://api.hotelbooking.com/swagger

---

## 🔒 Security

### Authentication
- JWT Bearer tokens with configurable expiration
- Token refresh mechanism
- Secure password hashing with BCrypt

### Authorization
- Role-based access control (Admin, User)
- Resource-level authorization for bookings

### Data Protection
- Input sanitization for XSS prevention
- SQL injection prevention via parameterized queries
- CORS configuration for allowed origins
- HTTPS enforcement in production

### Security Headers
```csharp
// Applied in production
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

---

## 📊 Monitoring & Logging

### Logging Configuration
Logs are structured JSON for easy parsing:
```json
{
  "Timestamp": "2024-01-15T10:30:00Z",
  "Level": "Information",
  "Message": "Booking created",
  "Properties": {
    "BookingId": "abc-123",
    "UserId": "user-456",
    "HotelId": "hotel-789"
  }
}
```

### Log Locations
- Development: `src/HotelBooking.API/logs/`
- Production: `/var/log/hotel-booking/` or Azure Log Analytics

### Health Checks
```
GET /health          # Overall health
GET /health/ready    # Readiness probe
GET /health/live     # Liveness probe
```

### Recommended Monitoring Stack
- **Metrics**: Application Insights / Prometheus + Grafana
- **Logs**: Azure Log Analytics / ELK Stack
- **Tracing**: Application Insights / Jaeger

---

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Failed
```
Error: Failed to connect to database
```
**Solution**: Verify connection string and ensure PostgreSQL is running.

#### JWT Token Invalid
```
Error: 401 Unauthorized
```
**Solution**: Check token expiration, verify JWT secret matches between environments.

#### CORS Error
```
Error: Access-Control-Allow-Origin
```
**Solution**: Add frontend URL to allowed origins in backend configuration.

#### Build Failures
```bash
# Clear caches and rebuild
dotnet clean
dotnet restore --no-cache
dotnet build
```

### Performance Issues
1. Check database query performance with logging
2. Verify caching is working (check Cache-Control headers)
3. Review Application Insights for slow requests

---

## 📞 Support & Contact

### Technical Support
- Email: support@hotelbooking.com
- Documentation: https://docs.hotelbooking.com

### Development Team
- Project Lead: [Name]
- Backend Lead: [Name]
- Frontend Lead: [Name]

### Repository
- GitHub: https://github.com/your-org/hotel-booking-system
- Issues: https://github.com/your-org/hotel-booking-system/issues

---

## 📄 License

This software is proprietary and confidential. Unauthorized copying, modification, distribution, or use is strictly prohibited.

© 2024 Hotel Booking System. All rights reserved.
