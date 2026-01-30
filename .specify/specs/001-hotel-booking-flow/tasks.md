# Tasks: Hotel Booking Flow

**Input**: Design documents from `.specify/specs/001-hotel-booking-flow/`  
**Prerequisites**: spec.md ✅, constitution.md ✅  
**Generated**: 2026-01-30  

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4, US5)
- All file paths are relative to repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and test infrastructure setup

- [ ] T001 Verify .NET 10 backend builds with `dotnet build` in `src/`
- [ ] T002 [P] Verify Angular frontend builds with `npm run build` in `client/`
- [ ] T003 [P] Verify database connectivity via health endpoint `GET /health`
- [ ] T004 [P] Install/verify Playwright dependencies with `npx playwright install` in `client/`
- [ ] T005 Configure test database seeding for integration tests in `src/DataSeeder/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story testing can proceed

**⚠️ CRITICAL**: These tasks validate and fix existing infrastructure

### Validation Service Hardening

- [ ] T006 Add property-based tests (FsCheck) for overlap detection in `src/HotelBooking.Application.Tests/Services/BookingValidationServicePropertyTests.cs`
- [ ] T007 [P] Add edge case unit tests for date boundary conditions in `src/HotelBooking.Application.Tests/Services/BookingValidationServiceTests.cs`
- [ ] T008 [P] Add unit tests for price calculation formula verification in `src/HotelBooking.Application.Tests/Services/PriceCalculationTests.cs`

### API Contract Validation

- [ ] T009 Verify `POST /api/bookings` returns 409 Conflict on overlap in `src/HotelBooking.Tests/BookingOverlapIntegrationTests.cs`
- [ ] T010 [P] Verify `POST /api/bookings` returns 400 Bad Request on invalid dates in `src/HotelBooking.Tests/BookingDateValidationTests.cs`
- [ ] T011 [P] Verify server-side price calculation overrides client value in `src/HotelBooking.Tests/PriceCalculationIntegrationTests.cs`

**Checkpoint**: Foundation validated - user story implementation can now proceed

---

## Phase 3: User Story 1 - Search & Browse Hotels (Priority: P1) 🎯 MVP

**Goal**: Enable authenticated users to search hotels by location and filter by date availability

**Independent Test**: `GET /api/hotels?location=Cairo` returns hotels; `GET /api/rooms/available?checkIn=2026-02-15&checkOut=2026-02-18` returns available rooms

### Backend Tests for US1

- [ ] T012 [P] [US1] Create search filter unit tests in `src/HotelBooking.Application.Tests/Services/HotelSearchServiceTests.cs`
- [ ] T013 [P] [US1] Create room availability filter tests in `src/HotelBooking.Application.Tests/Services/RoomAvailabilityServiceTests.cs`
- [ ] T014 [US1] Create HotelsController integration tests in `src/HotelBooking.Tests/HotelSearchIntegrationTests.cs`

### Frontend Tests for US1

- [ ] T015 [P] [US1] Create HotelSearchComponent unit tests in `client/src/app/features/hotels/hotel-search.component.spec.ts`
- [ ] T016 [P] [US1] Create HotelService unit tests for search API in `client/src/app/services/hotel.service.spec.ts`

### Implementation for US1

- [ ] T017 [US1] Implement `IHotelSearchService` interface in `src/HotelBooking.Application/Interfaces/IHotelSearchService.cs`
- [ ] T018 [US1] Implement `HotelSearchService` with location filter in `src/HotelBooking.Application/Services/HotelSearchService.cs`
- [ ] T019 [US1] Implement `IRoomAvailabilityService` interface in `src/HotelBooking.Application/Interfaces/IRoomAvailabilityService.cs`
- [ ] T020 [US1] Implement `RoomAvailabilityService` with date range filter in `src/HotelBooking.Application/Services/RoomAvailabilityService.cs`
- [ ] T021 [US1] Add search endpoint `GET /api/hotels?location={location}` to `src/HotelBooking.API/Controllers/HotelsController.cs`
- [ ] T022 [US1] Add available rooms endpoint `GET /api/rooms/available` to `src/HotelBooking.API/Controllers/RoomsController.cs`
- [ ] T023 [US1] Create SearchHotelsDto in `src/HotelBooking.API/DTOs/SearchHotelsDto.cs`
- [ ] T024 [US1] Create AvailableRoomsDto in `src/HotelBooking.API/DTOs/AvailableRoomsDto.cs`

### Frontend Implementation for US1

- [ ] T025 [US1] Create `HotelSearchComponent` in `client/src/app/features/hotels/hotel-search/`
- [ ] T026 [US1] Update `HotelService` with search methods in `client/src/app/services/hotel.service.ts`
- [ ] T027 [US1] Add search route to app routing in `client/src/app/app.routes.ts`

**Checkpoint**: User Story 1 complete - users can search hotels and see available rooms

---

## Phase 4: User Story 2 - View Hotel Details & Select Room (Priority: P1)

**Goal**: Display hotel details with room list showing price, capacity, and availability

**Independent Test**: `GET /api/hotels/{id}` returns hotel with details; `GET /api/rooms/hotel/{hotelId}` returns room list

### Backend Tests for US2

- [ ] T028 [P] [US2] Create hotel details endpoint tests in `src/HotelBooking.Tests/HotelDetailsIntegrationTests.cs`
- [ ] T029 [P] [US2] Create room list endpoint tests in `src/HotelBooking.Tests/RoomListIntegrationTests.cs`

### Frontend Tests for US2

- [ ] T030 [P] [US2] Create HotelDetailsComponent unit tests in `client/src/app/features/hotels/hotel-details.component.spec.ts`
- [ ] T031 [P] [US2] Create RoomCardComponent unit tests in `client/src/app/features/hotels/room-card.component.spec.ts`

### Implementation for US2

- [ ] T032 [US2] Ensure `GET /api/hotels/{id}` includes amenities in `src/HotelBooking.API/Controllers/HotelsController.cs`
- [ ] T033 [US2] Ensure `GET /api/rooms/hotel/{hotelId}` returns availability status in `src/HotelBooking.API/Controllers/RoomsController.cs`
- [ ] T034 [US2] Create HotelDetailsDto with room list in `src/HotelBooking.API/DTOs/HotelDetailsDto.cs`
- [ ] T035 [US2] Create RoomAvailabilityDto in `src/HotelBooking.API/DTOs/RoomAvailabilityDto.cs`

### Frontend Implementation for US2

- [ ] T036 [US2] Create `HotelDetailsComponent` in `client/src/app/features/hotels/hotel-details/`
- [ ] T037 [US2] Create `RoomCardComponent` in `client/src/app/features/hotels/room-card/`
- [ ] T038 [US2] Add hotel details route with ID param in `client/src/app/app.routes.ts`

**Checkpoint**: User Story 2 complete - users can view hotel details and select rooms

---

## Phase 5: User Story 3 - Create Booking with Price Calculation (Priority: P1) 🎯 CRITICAL PATH

**Goal**: Create confirmed booking with server-side price calculation and overlap prevention

**Independent Test**: `POST /api/bookings` with valid data returns 201 with correct `TotalPrice = nights × PricePerNight`

### Backend Tests for US3 (CRITICAL: Overlap & Price)

- [ ] T039 [P] [US3] Create booking creation success tests in `src/HotelBooking.Tests/BookingCreationTests.cs`
- [ ] T040 [P] [US3] Create overlap rejection tests (EC-001) in `src/HotelBooking.Tests/BookingOverlapRejectionTests.cs`
- [ ] T041 [P] [US3] Create price calculation tests (FR-003) in `src/HotelBooking.Tests/PriceCalculationVerificationTests.cs`
- [ ] T042 [P] [US3] Create invalid date rejection tests (EC-002, EC-003) in `src/HotelBooking.Tests/BookingDateRejectionTests.cs`
- [ ] T043 [US3] Create concurrent booking race condition test (EC-008) in `src/HotelBooking.Tests/BookingConcurrencyTests.cs`

### Frontend Tests for US3

- [ ] T044 [P] [US3] Create BookingFormComponent unit tests in `client/src/app/features/booking/booking-form.component.spec.ts`
- [ ] T045 [P] [US3] Create BookingService unit tests in `client/src/app/services/booking.service.spec.ts`
- [ ] T046 [P] [US3] Create booking confirmation flow tests in `client/src/app/features/booking/booking-confirmation.component.spec.ts`

### Implementation for US3

- [ ] T047 [US3] Add `IPriceCalculationService` interface in `src/HotelBooking.Application/Interfaces/IPriceCalculationService.cs`
- [ ] T048 [US3] Implement `PriceCalculationService` with nights × rate formula in `src/HotelBooking.Application/Services/PriceCalculationService.cs`
- [ ] T049 [US3] Update `BookingsController.CreateBooking` to use `PriceCalculationService` in `src/HotelBooking.API/Controllers/BookingsController.cs`
- [ ] T050 [US3] Update `BookingsController.CreateBooking` to call `ValidateNoOverlapAsync` in `src/HotelBooking.API/Controllers/BookingsController.cs`
- [ ] T051 [US3] Add database transaction with proper isolation level for race condition handling in `src/HotelBooking.API/Controllers/BookingsController.cs`
- [ ] T052 [US3] Create `CreateBookingDto` with validation in `src/HotelBooking.API/DTOs/CreateBookingDto.cs`
- [ ] T053 [US3] Create `BookingResponseDto` in `src/HotelBooking.API/DTOs/BookingResponseDto.cs`
- [ ] T054 [US3] Add FluentValidation validator for CreateBookingDto in `src/HotelBooking.API/Validators/CreateBookingDtoValidator.cs`

### Frontend Implementation for US3

- [ ] T055 [US3] Create `BookingFormComponent` in `client/src/app/features/booking/booking-form/`
- [ ] T056 [US3] Create `BookingConfirmationComponent` in `client/src/app/features/booking/booking-confirmation/`
- [ ] T057 [US3] Implement `BookingService.createBooking()` in `client/src/app/services/booking.service.ts`
- [ ] T058 [US3] Add booking routes in `client/src/app/app.routes.ts`

**Checkpoint**: User Story 3 complete - users can create bookings with validated pricing and no overlaps

---

## Phase 6: User Story 4 - View My Bookings (Priority: P2)

**Goal**: Display user's bookings sorted by date with hotel/room details

**Independent Test**: `GET /api/bookings/my-bookings` returns authenticated user's bookings sorted by CheckIn descending

### Backend Tests for US4

- [ ] T059 [P] [US4] Create my-bookings endpoint tests in `src/HotelBooking.Tests/MyBookingsIntegrationTests.cs`
- [ ] T060 [P] [US4] Create sorting verification tests in `src/HotelBooking.Tests/BookingSortingTests.cs`
- [ ] T061 [P] [US4] Create empty bookings state test in `src/HotelBooking.Tests/EmptyBookingsTests.cs`

### Frontend Tests for US4

- [ ] T062 [P] [US4] Create MyBookingsComponent unit tests in `client/src/app/features/hotels/my-bookings.component.spec.ts`
- [ ] T063 [P] [US4] Create BookingCardComponent unit tests in `client/src/app/features/hotels/booking-card.component.spec.ts`

### Implementation for US4

- [ ] T064 [US4] Verify `GET /api/bookings/my-bookings` sorts by CheckIn descending in `src/HotelBooking.API/Controllers/BookingsController.cs`
- [ ] T065 [US4] Create `MyBookingDto` with hotel/room details in `src/HotelBooking.API/DTOs/MyBookingDto.cs`

### Frontend Implementation for US4

- [ ] T066 [US4] Create `MyBookingsComponent` in `client/src/app/features/bookings/my-bookings/`
- [ ] T067 [US4] Create `BookingCardComponent` in `client/src/app/features/bookings/booking-card/`
- [ ] T068 [US4] Implement `BookingService.getMyBookings()` in `client/src/app/services/booking.service.ts`
- [ ] T069 [US4] Add my-bookings route (protected) in `client/src/app/app.routes.ts`

**Checkpoint**: User Story 4 complete - users can view their booking history

---

## Phase 7: User Story 5 - Cancel Booking (Priority: P3)

**Goal**: Allow users to cancel their bookings (soft delete) freeing room availability

**Independent Test**: `DELETE /api/bookings/{id}` sets `IsDeleted = true` and `Status = "Cancelled"`

### Backend Tests for US5

- [ ] T070 [P] [US5] Create cancellation success tests in `src/HotelBooking.Tests/BookingCancellationTests.cs`
- [ ] T071 [P] [US5] Create room freed after cancel tests in `src/HotelBooking.Tests/CancelFreesRoomTests.cs`
- [ ] T072 [P] [US5] Create unauthorized cancel rejection tests (EC-006) in `src/HotelBooking.Tests/UnauthorizedCancelTests.cs`

### Frontend Tests for US5

- [ ] T073 [P] [US5] Create cancel confirmation dialog tests in `client/src/app/features/bookings/cancel-dialog.component.spec.ts`
- [ ] T074 [P] [US5] Create cancel flow integration tests in `client/src/app/services/booking.service.spec.ts`

### Implementation for US5

- [ ] T075 [US5] Implement `DELETE /api/bookings/{id}` for soft delete in `src/HotelBooking.API/Controllers/BookingsController.cs`
- [ ] T076 [US5] Verify cancellation respects user ownership in `src/HotelBooking.API/Controllers/BookingsController.cs`
- [ ] T077 [US5] Update `RoomAvailabilityService` to exclude cancelled bookings in `src/HotelBooking.Application/Services/RoomAvailabilityService.cs`

### Frontend Implementation for US5

- [ ] T078 [US5] Create `CancelBookingDialogComponent` in `client/src/app/features/bookings/cancel-dialog/`
- [ ] T079 [US5] Implement `BookingService.cancelBooking()` in `client/src/app/services/booking.service.ts`
- [ ] T080 [US5] Add cancel button to `BookingCardComponent` in `client/src/app/features/bookings/booking-card/`

**Checkpoint**: User Story 5 complete - users can cancel bookings and rooms become available

---

## Phase 8: E2E Tests (Full User Journey)

**Purpose**: Validate complete user flows from authentication through booking management

- [ ] T081 [P] Create auth flow E2E test (login → dashboard) in `client/e2e/auth-flow.spec.ts`
- [ ] T082 [P] Create search flow E2E test (search → results) in `client/e2e/search-flow.spec.ts`
- [ ] T083 Create complete booking E2E test (auth → search → select → book → confirm) in `client/e2e/complete-booking-flow.spec.ts`
- [ ] T084 Create my-bookings E2E test (view → cancel → verify freed) in `client/e2e/my-bookings-flow.spec.ts`
- [ ] T085 Create error handling E2E test (overlap rejection, invalid dates) in `client/e2e/booking-errors.spec.ts`

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, documentation, and production readiness

- [ ] T086 Run full test suite and verify 92%+ coverage target
- [ ] T087 [P] Add structured logging for all booking operations in `src/HotelBooking.API/Controllers/BookingsController.cs`
- [ ] T088 [P] Add request/response logging middleware in `src/HotelBooking.API/Middleware/`
- [ ] T089 Update OpenAPI spec with all new endpoints in `openapi-spec.json`
- [ ] T090 [P] Add validation error documentation to API responses
- [ ] T091 Run mutation testing to verify test quality with `run-mutation-tests.cmd`

---

## Dependencies

```
Phase 1 (Setup) → Phase 2 (Foundational) → [Phase 3-7 can partially parallelize]

Within User Stories:
US1 (Search) ← US2 (Details) ← US3 (Booking) ← US4 (My Bookings) ← US5 (Cancel)
         └─────────────────────────────────┘
              (US3 is the critical path)

Test Dependencies:
T006, T007, T008 → T009, T010, T011 (validation tests before integration tests)
```

---

## Parallel Execution Opportunities

### Phase 2 (Foundational)
```
┌─────────┬─────────┬─────────┐
│  T007   │  T008   │  T010   │  (Unit tests - parallel)
└────┬────┴────┬────┴────┬────┘
     └─────────┴─────────┘
            ↓
     T006, T009, T011 (Integration tests)
```

### Phase 5 (US3 - Critical)
```
┌─────────┬─────────┬─────────┬─────────┐
│  T039   │  T040   │  T041   │  T042   │  (Backend tests - parallel)
└─────────┴─────────┴─────────┴─────────┘
┌─────────┬─────────┬─────────┐
│  T044   │  T045   │  T046   │  (Frontend tests - parallel)
└─────────┴─────────┴─────────┘
            ↓
     T047 → T048 → T049 → T050 → T051 (Implementation sequence)
```

---

## Summary

| Category | Count |
|----------|-------|
| **Total Tasks** | 91 |
| **Phase 1 (Setup)** | 5 |
| **Phase 2 (Foundational)** | 6 |
| **Phase 3 (US1 - Search)** | 16 |
| **Phase 4 (US2 - Details)** | 11 |
| **Phase 5 (US3 - Booking)** | 20 |
| **Phase 6 (US4 - My Bookings)** | 11 |
| **Phase 7 (US5 - Cancel)** | 11 |
| **Phase 8 (E2E)** | 5 |
| **Phase 9 (Polish)** | 6 |

### Priority Breakdown

| Priority | User Stories | Task Count |
|----------|--------------|------------|
| **P1 (Critical Path)** | US1, US2, US3 | 47 |
| **P2 (Core)** | US4 | 11 |
| **P3 (Enhancement)** | US5 | 11 |

### MVP Scope (Recommended)

For minimum viable product, complete:
- **Phase 1-2**: Setup + Foundational (11 tasks)
- **Phase 5**: User Story 3 - Create Booking (20 tasks)
- **Phase 8**: Critical E2E (T083 only)

**MVP Total**: ~32 tasks covering core booking creation with validation

### Test Type Distribution

| Test Type | Tasks |
|-----------|-------|
| Unit Tests (Backend) | 12 |
| Integration Tests (Backend) | 18 |
| Property Tests (FsCheck) | 1 |
| Unit Tests (Frontend) | 14 |
| E2E Tests (Playwright) | 5 |

---

## Validation Checklist

✅ All tasks follow `- [ ] [ID] [P?] [Story?] Description with file path` format  
✅ Tasks organized by user story for independent implementation  
✅ Each user story has independent test criteria  
✅ Critical path (US3) prioritized with overlap & price validation  
✅ E2E tests cover full user journey  
✅ 92%+ coverage target included in Phase 9
