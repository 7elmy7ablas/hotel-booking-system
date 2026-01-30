# Feature Specification: Hotel Booking Flow

**Feature Branch**: `001-hotel-booking-flow`  
**Created**: 2026-01-30  
**Status**: Approved  
**Constitution**: v1.0.0 (Principles II, III, IV apply)

## Overview

Complete end-to-end booking flow enabling authenticated users to search hotels, select rooms, choose dates, and create confirmed bookings with accurate pricing.

---

## Preconditions

| ID | Precondition | Verification |
|----|--------------|--------------|
| PRE-001 | User MUST be authenticated with valid JWT token | `Authorization: Bearer <token>` header present |
| PRE-002 | At least one hotel with available rooms exists in database | Seed data or test fixture |
| PRE-003 | User has "Customer" or "Admin" role | JWT claims include valid role |
| PRE-004 | Database is accessible and healthy | `/health` endpoint returns 200 |

---

## User Scenarios & Testing

### User Story 1 - Search & Browse Hotels (Priority: P1)

A logged-in user searches for hotels by location and/or dates to find available accommodations.

**Why this priority**: Search is the entry point to the booking funnel. Without search, no bookings occur.

**Independent Test**: Can be tested by calling `GET /api/hotels` and `GET /api/rooms/available` endpoints.

**Acceptance Scenarios**:

1. **Given** a logged-in user on the search page,  
   **When** they enter location "Cairo" and dates "2026-02-15" to "2026-02-18",  
   **Then** the system returns hotels in Cairo with rooms available for those dates.

2. **Given** a logged-in user,  
   **When** they search without specifying dates,  
   **Then** the system returns all hotels (availability not filtered).

3. **Given** a logged-in user,  
   **When** they search for a location with no hotels,  
   **Then** the system returns an empty list with HTTP 200 (not an error).

**API Endpoints**:
```
GET /api/hotels?location={location}
GET /api/rooms/available?checkIn={date}&checkOut={date}
```

---

### User Story 2 - View Hotel Details & Select Room (Priority: P1)

A user views a hotel's details including available rooms, amenities, and pricing to make a selection.

**Why this priority**: Room selection is required before booking. Critical path.

**Independent Test**: Can be tested by calling `GET /api/hotels/{id}` and `GET /api/rooms/hotel/{hotelId}`.

**Acceptance Scenarios**:

1. **Given** a logged-in user viewing search results,  
   **When** they click on "Nile Ritz-Carlton",  
   **Then** they see hotel details: name, location, description, rating, amenities, and list of rooms.

2. **Given** a logged-in user on hotel details page,  
   **When** rooms are displayed,  
   **Then** each room shows: RoomType, PricePerNight, Capacity, and availability status.

3. **Given** a logged-in user on hotel details page with dates selected,  
   **When** a room is already booked for those dates,  
   **Then** that room is marked as "Unavailable" or hidden from selection.

**API Endpoints**:
```
GET /api/hotels/{id}
GET /api/rooms/hotel/{hotelId}
GET /api/rooms/available?hotelId={id}&checkIn={date}&checkOut={date}
```

---

### User Story 3 - Create Booking with Price Calculation (Priority: P1) 🎯 MVP

A user selects dates and confirms a booking. The system calculates the correct total price and creates the booking record.

**Why this priority**: This is the core transaction. Without it, the system has no value.

**Independent Test**: Can be tested end-to-end via `POST /api/bookings` with mock user token.

**Acceptance Scenarios**:

1. **Given** a logged-in user has selected Room ID `abc-123` (PricePerNight = $150),  
   **When** they book from "2026-02-15" (CheckIn) to "2026-02-18" (CheckOut),  
   **Then** the system creates a booking with:
   - `TotalPrice = 3 nights × $150 = $450`
   - `Status = "Confirmed"`
   - `UserId` = current user's ID
   - `RoomId` = selected room

2. **Given** a logged-in user submitting a booking,  
   **When** the request includes a client-calculated `TotalPrice`,  
   **Then** the server MUST recalculate and override with correct value (never trust client).

3. **Given** a successful booking creation,  
   **When** the booking is saved,  
   **Then** the response includes:
   - Booking ID
   - Confirmation number (if applicable)
   - Total price
   - Check-in/Check-out dates
   - HTTP 201 Created

**API Endpoint**:
```
POST /api/bookings
Content-Type: application/json
Authorization: Bearer <token>

{
  "roomId": "guid",
  "checkIn": "2026-02-15",
  "checkOut": "2026-02-18"
}
```

**Response** (201 Created):
```json
{
  "id": "booking-guid",
  "roomId": "room-guid",
  "userId": "user-guid",
  "checkIn": "2026-02-15T14:00:00Z",
  "checkOut": "2026-02-18T11:00:00Z",
  "totalPrice": 450.00,
  "status": "Confirmed",
  "createdAt": "2026-01-30T10:30:00Z"
}
```

---

### User Story 4 - View My Bookings (Priority: P2)

A user views their booking history to see upcoming and past reservations.

**Why this priority**: Users need confirmation and ability to manage bookings, but this is post-transaction.

**Independent Test**: Can be tested via `GET /api/bookings/user/{userId}` with authenticated request.

**Acceptance Scenarios**:

1. **Given** a logged-in user with 3 existing bookings,  
   **When** they navigate to "My Bookings",  
   **Then** they see all 3 bookings sorted by CheckIn date (descending - upcoming first).

2. **Given** a logged-in user,  
   **When** they view My Bookings,  
   **Then** each booking displays: Hotel name, Room type, Dates, Total price, Status.

3. **Given** a logged-in user,  
   **When** they have no bookings,  
   **Then** they see an empty state message: "No bookings found."

4. **Given** a user with a cancelled (soft-deleted) booking,  
   **When** they view My Bookings,  
   **Then** cancelled bookings are either hidden or shown with "Cancelled" status (configurable).

**API Endpoint**:
```
GET /api/bookings/user/{userId}
Authorization: Bearer <token>
```

---

### User Story 5 - Cancel Booking (Priority: P3)

A user cancels an existing booking, freeing the room for future bookings.

**Why this priority**: Important for user experience but not critical for MVP.

**Independent Test**: Can be tested via `DELETE /api/bookings/{id}`.

**Acceptance Scenarios**:

1. **Given** a logged-in user with an upcoming booking,  
   **When** they click "Cancel Booking",  
   **Then** the booking is soft-deleted (IsDeleted = true) and status set to "Cancelled".

2. **Given** a cancelled booking for Room X from Feb 15-18,  
   **When** another user searches for Room X on Feb 15-18,  
   **Then** the room IS available (cancellation freed the slot).

3. **Given** a user attempting to cancel another user's booking,  
   **When** they call DELETE /api/bookings/{otherId},  
   **Then** they receive 403 Forbidden.

---

## Edge Cases

### EC-001: Overlapping Booking Attempt

**Given** Room "Deluxe Suite" is booked from Feb 15-18,  
**When** a user tries to book the same room from Feb 16-20,  
**Then** the system MUST reject with:
- HTTP 409 Conflict
- Error message: "Room is not available for the selected dates"

**Overlap Detection Logic** (Constitution Principle III):
```
isOverlap = !(newCheckOut <= existingCheckIn || newCheckIn >= existingCheckOut)
```

| Existing Booking | New Attempt | Result |
|-----------------|-------------|--------|
| Feb 15-18 | Feb 18-20 | ✅ Allowed (sequential) |
| Feb 15-18 | Feb 17-20 | ❌ Overlap |
| Feb 15-18 | Feb 10-16 | ❌ Overlap |
| Feb 15-18 | Feb 10-15 | ✅ Allowed (ends when existing starts) |
| Feb 15-18 | Feb 15-18 | ❌ Overlap (identical) |

---

### EC-002: Invalid Date Range - CheckOut Before CheckIn

**Given** a user submitting a booking,  
**When** `checkOut` ≤ `checkIn` (e.g., checkIn: Feb 18, checkOut: Feb 15),  
**Then** the system MUST reject with:
- HTTP 400 Bad Request
- Validation error: "Check-out date must be after check-in date"

---

### EC-003: Booking in the Past

**Given** today is Jan 30, 2026,  
**When** a user tries to book with checkIn: Jan 25, 2026,  
**Then** the system MUST reject with:
- HTTP 400 Bad Request
- Validation error: "Check-in date cannot be in the past"

---

### EC-004: No Available Rooms

**Given** all rooms in a hotel are booked for Feb 15-18,  
**When** a user searches for that hotel on those dates,  
**Then** the system returns:
- Hotel in results (hotel exists)
- Empty room list or all rooms marked unavailable
- UI should show "No rooms available for selected dates"

---

### EC-005: Non-Existent Room ID

**Given** a user submits a booking with roomId: "non-existent-guid",  
**When** the POST /api/bookings is processed,  
**Then** the system MUST return:
- HTTP 404 Not Found
- Error: "Room not found"

---

### EC-006: Unauthorized Booking Attempt

**Given** a user without a valid JWT token,  
**When** they attempt POST /api/bookings,  
**Then** the system MUST return:
- HTTP 401 Unauthorized

---

### EC-007: Booking Exceeds Room Capacity

**Given** a room with Capacity = 2,  
**When** a user tries to book for 4 guests,  
**Then** the system SHOULD return:
- HTTP 400 Bad Request
- Error: "Number of guests exceeds room capacity"

*(Note: If guest count is not part of booking DTO, this may be deferred)*

---

### EC-008: Concurrent Booking Race Condition

**Given** two users simultaneously attempt to book the same room for overlapping dates,  
**When** both requests reach the server at the same time,  
**Then**:
- One booking MUST succeed (first to commit)
- Second booking MUST fail with 409 Conflict
- Database MUST use proper locking/transaction isolation

---

## Requirements

### Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-001 | System MUST allow authenticated users to search hotels by location | P1 |
| FR-002 | System MUST filter available rooms by date range | P1 |
| FR-003 | System MUST calculate TotalPrice as `nights × PricePerNight` server-side | P1 |
| FR-004 | System MUST prevent overlapping bookings for the same room | P1 |
| FR-005 | System MUST validate that CheckOut > CheckIn | P1 |
| FR-006 | System MUST validate that CheckIn ≥ today | P1 |
| FR-007 | System MUST return user's bookings sorted by date | P2 |
| FR-008 | System MUST support booking cancellation (soft delete) | P2 |
| FR-009 | System SHOULD validate guest count against room capacity | P3 |
| FR-010 | System MUST log all booking operations for audit trail | P1 |

### Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR-001 | Booking creation MUST complete within 500ms (p95) |
| NFR-002 | Search results MUST return within 1 second for up to 1000 hotels |
| NFR-003 | System MUST handle 100 concurrent booking requests |
| NFR-004 | All monetary values MUST use decimal(18,2) precision |

---

## Key Entities

| Entity | Key Attributes | Relationships |
|--------|----------------|---------------|
| **Hotel** | Id, Name, Location, Description, Rating, Amenities | Has many Rooms |
| **Room** | Id, HotelId, RoomType, PricePerNight, Capacity, IsAvailable | Belongs to Hotel, Has many Bookings |
| **Booking** | Id, UserId, RoomId, CheckIn, CheckOut, TotalPrice, Status, IsDeleted | Belongs to User, Belongs to Room |
| **User** | Id, Email, FullName, Role | Has many Bookings |

---

## Success Criteria

| ID | Measurable Outcome |
|----|-------------------|
| SC-001 | User can complete search → select → book flow in under 60 seconds |
| SC-002 | 100% of overlapping booking attempts are rejected |
| SC-003 | TotalPrice matches `nights × PricePerNight` in 100% of bookings |
| SC-004 | All E2E tests for booking flow pass (Playwright) |
| SC-005 | Property-based tests (FsCheck) verify overlap detection for 1000+ random cases |

---

## Test Matrix

| Scenario | Unit Test | Integration Test | E2E Test | Property Test |
|----------|-----------|------------------|----------|---------------|
| Search hotels | ✅ | ✅ | ✅ | |
| Filter available rooms | ✅ | ✅ | ✅ | |
| Calculate total price | ✅ | ✅ | | ✅ |
| Create booking | ✅ | ✅ | ✅ | |
| Overlap detection | ✅ | ✅ | | ✅ (FsCheck) |
| Invalid dates | ✅ | ✅ | ✅ | |
| View My Bookings | ✅ | ✅ | ✅ | |
| Cancel booking | ✅ | ✅ | ✅ | |
| Auth required | ✅ | ✅ | ✅ | |
| Race condition | | ✅ | | |

---

## API Contract Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/hotels` | No | List/search hotels |
| GET | `/api/hotels/{id}` | No | Hotel details |
| GET | `/api/rooms/hotel/{hotelId}` | No | Rooms for hotel |
| GET | `/api/rooms/available` | No | Available rooms by date |
| POST | `/api/bookings` | ✅ JWT | Create booking |
| GET | `/api/bookings/user/{userId}` | ✅ JWT | User's bookings |
| DELETE | `/api/bookings/{id}` | ✅ JWT | Cancel booking |

---

## Out of Scope (This Spec)

- Payment processing (separate spec)
- Email confirmation notifications
- Booking modification (change dates)
- Multi-room bookings
- Promo codes / discounts
