<!--
╔══════════════════════════════════════════════════════════════════════════════╗
║ SYNC IMPACT REPORT                                                            ║
╠══════════════════════════════════════════════════════════════════════════════╣
║ Version Change: 0.0.0 → 1.0.0 (MAJOR - Initial ratification)                  ║
║                                                                                ║
║ Modified Principles: N/A (initial version)                                     ║
║                                                                                ║
║ Added Sections:                                                                ║
║   • I. Clean Architecture                                                      ║
║   • II. Test-First Development                                                 ║
║   • III. Booking Integrity                                                     ║
║   • IV. Security & Authentication                                              ║
║   • V. Observability & Logging                                                 ║
║   • Technology Stack (constraints)                                             ║
║   • Quality Gates                                                              ║
║   • Governance                                                                  ║
║                                                                                ║
║ Removed Sections: N/A (initial version)                                        ║
║                                                                                ║
║ Templates Requiring Updates:                                                   ║
║   • .specify/templates/plan-template.md ✅ (aligned with Technical Context)   ║
║   • .specify/templates/spec-template.md ✅ (aligned with user story format)   ║
║   • .specify/templates/tasks-template.md ✅ (aligned with phase structure)    ║
║                                                                                ║
║ Follow-up TODOs: None                                                          ║
╚══════════════════════════════════════════════════════════════════════════════╝
-->

# Hotel Booking System Constitution

## Core Principles

### I. Clean Architecture

All code MUST follow Clean Architecture with strict layer separation:

- **Domain Layer** (`HotelBooking.Domain`): Core business entities with NO external dependencies.
  Entities: Hotel, Room, User, Booking, Payment with BaseEntity (Id, CreatedAt, UpdatedAt, IsDeleted).
- **Application Layer** (`HotelBooking.Application`): Business logic interfaces and services.
  MUST depend only on Domain layer.
- **Infrastructure Layer** (`HotelBooking.Infrastructure`): Data access via Entity Framework Core.
  MUST depend only on Application layer.
- **API Layer** (`HotelBooking.API`): REST endpoints, DTOs, and Middleware.
  MUST depend only on Infrastructure layer.

**Rationale**: Layer isolation prevents coupling, enables independent testing, and ensures
business logic remains portable across UI/database changes.

### II. Test-First Development

Every feature MUST have automated tests written before or alongside implementation:

- **Domain Tests**: Entity validation, value object behavior, business rule invariants.
- **Application Tests**: Service logic with mocked repositories (Moq + FluentAssertions).
- **Integration Tests**: API endpoints via WebApplicationFactory, BDD scenarios (SpecFlow).
- **Property Tests**: Invariant verification using FsCheck for booking overlap detection.
- **E2E Tests**: User journeys via Playwright covering auth → search → book → manage flows.

**Coverage Targets**:
| Layer | Minimum Coverage |
|-------|-----------------|
| Domain | 80% |
| Application | 80% |
| API | 75% |
| Angular Services | 80% |
| Angular Components | 70% |

**Rationale**: High test coverage reduces regressions and documents expected behavior.
Property-based testing catches edge cases humans miss.

### III. Booking Integrity

The booking system MUST enforce data integrity constraints:

- **Overlap Prevention**: A room MUST NOT be double-booked. The system MUST validate that
  no existing confirmed booking overlaps with a new booking request for the same room.
  Overlap formula: `!(newCheckOut <= existingCheckIn || newCheckIn >= existingCheckOut)`
- **Price Calculation**: TotalPrice MUST equal `numberOfNights × Room.PricePerNight`.
  This calculation MUST be validated server-side regardless of client-provided values.
- **Soft Delete**: Bookings and other entities MUST use soft delete (IsDeleted flag).
  Query filters MUST exclude soft-deleted records by default.
- **Audit Trail**: All entities MUST track CreatedAt and UpdatedAt timestamps automatically.

**Rationale**: Financial accuracy and preventing double-bookings are critical for a
reservation system. Soft delete preserves history for auditing and potential recovery.

### IV. Security & Authentication

All protected endpoints MUST enforce authentication and authorization:

- **JWT Authentication**: Bearer tokens with configurable secret, issuer, and audience.
  Minimum secret length: 32 characters.
- **Role-Based Access**: Admin-only endpoints (e.g., GET /api/users, GET /api/bookings)
  MUST verify role claims before processing.
- **Input Validation**: All DTOs MUST use FluentValidation. SQL injection and XSS
  vectors MUST be neutralized.
- **Rate Limiting**: API MUST implement rate limiting to prevent abuse
  (configured via appsettings.RateLimiting.json).
- **Password Hashing**: User passwords MUST be hashed; plaintext storage is PROHIBITED.

**Rationale**: Hotel booking systems handle PII and payment data. Security is non-negotiable.

### V. Observability & Logging

All operations MUST be traceable:

- **Structured Logging**: Use Serilog with console + rolling file sinks.
  Log files: `logs/hotel-booking-{Date}.txt` (30-day retention).
- **Health Checks**: `/health` endpoint MUST verify database connectivity.
- **Error Handling**: Global exception middleware MUST log errors and return
  consistent error DTOs (never expose stack traces in production).
- **Request Correlation**: Each request SHOULD have a correlation ID for tracing.

**Rationale**: Production debugging requires structured logs. Health checks enable
orchestrators (Kubernetes, Azure App Service) to route traffic appropriately.

## Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Backend Runtime | .NET | 10 |
| ORM | Entity Framework Core | 10 |
| Database | SQL Server | LocalDB (dev) / Azure SQL (prod) |
| Frontend Framework | Angular | 19 |
| UI Library | Angular Material | 19.x |
| Backend Testing | xUnit, Moq, FluentAssertions, FsCheck, SpecFlow | Latest |
| Frontend Testing | Jasmine/Karma, Playwright | Latest |
| Containerization | Docker + docker-compose | N/A |

**Constraints**:
- All async database operations MUST use CancellationToken.
- Decimal precision for monetary values MUST be (18, 2).
- API MUST support both Swagger UI and OpenAPI spec export.

## Quality Gates

All PRs MUST pass before merge:

1. **Build Gate**: `dotnet build` succeeds with zero errors.
2. **Test Gate**: All unit + integration tests pass (`dotnet test`).
3. **Coverage Gate**: Coverage meets minimum thresholds per layer.
4. **Lint Gate**: No critical linting violations (backend and frontend).
5. **Security Gate**: No high/critical vulnerabilities from dependency scanning.

**Frontend-specific**:
- `npm test` (Karma) MUST pass.
- `npx playwright test` (E2E) MUST pass on CI.

## Governance

This Constitution supersedes all ad-hoc practices. Amendments require:

1. **Documentation**: Proposed change with rationale in a PR.
2. **Review**: Approval from at least one maintainer.
3. **Migration Plan**: If breaking, document upgrade path.
4. **Version Bump**: Follow semantic versioning (see below).

**Versioning Policy**:
- MAJOR: Backward-incompatible principle removal or redefinition.
- MINOR: New principle or section added.
- PATCH: Clarifications, typo fixes, non-semantic refinements.

**Compliance Review**: Periodic reviews (quarterly recommended) to ensure
codebase aligns with Constitution principles. Use `.specify/` artifacts
for spec-driven development workflows.

**Version**: 1.0.0 | **Ratified**: 2026-01-30 | **Last Amended**: 2026-01-30
