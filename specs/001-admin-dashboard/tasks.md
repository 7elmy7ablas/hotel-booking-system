# Tasks: Admin Dashboard

**Feature Branch**: `001-admin-dashboard`  
**Input**: [spec.md](spec.md)  
**Generated**: January 30, 2026

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1=Dashboard, US2=Hotels, US3=Bookings, US4=Users)
- Include exact file paths in descriptions

## Tech Stack (from existing project)

- **Backend**: .NET 8, Clean Architecture (API/Application/Domain/Infrastructure)
- **Frontend**: Angular 17+ with standalone components
- **Database**: Entity Framework Core with SQL Server

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Admin module structure and routing setup

- [ ] T001 Create admin module structure in client/src/app/features/admin/
- [ ] T002 [P] Create admin layout component in client/src/app/features/admin/layout/admin-layout.component.ts
- [ ] T003 [P] Configure admin routes in client/src/app/features/admin/admin.routes.ts
- [ ] T004 [P] Create AdminController base in src/HotelBooking.API/Controllers/Admin/AdminBaseController.cs
- [ ] T005 Add admin guard in client/src/app/guards/admin.guard.ts
- [ ] T006 [P] Create admin navigation component in client/src/app/features/admin/components/admin-nav/admin-nav.component.ts
- [ ] T007 Update main app routes to include admin module in client/src/app/app.routes.ts

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Backend Foundation

- [ ] T008 Create AdminDashboardService interface in src/HotelBooking.Application/Interfaces/IAdminDashboardService.cs
- [ ] T009 [P] Create AuditLog entity in src/HotelBooking.Domain/Entities/AuditLog.cs
- [ ] T010 [P] Add ApprovalStatus enum to Hotel entity in src/HotelBooking.Domain/Entities/Hotel.cs
- [ ] T011 [P] Add UserStatus enum (Active/Suspended) to User entity in src/HotelBooking.Domain/Entities/User.cs
- [ ] T012 Create AuditLog DbSet and migration in src/HotelBooking.Infrastructure/
- [ ] T013 [P] Create AdminAuthorizationAttribute in src/HotelBooking.API/Middleware/AdminAuthorizationAttribute.cs
- [ ] T014 [P] Create audit logging middleware in src/HotelBooking.API/Middleware/AuditLoggingMiddleware.cs

### Frontend Foundation

- [ ] T015 [P] Create admin API service base in client/src/app/features/admin/services/admin-api.service.ts
- [ ] T016 [P] Create shared admin table component in client/src/app/features/admin/components/data-table/data-table.component.ts
- [ ] T017 [P] Create shared admin modal component in client/src/app/features/admin/components/modal/modal.component.ts
- [ ] T018 [P] Create loading skeleton component in client/src/app/features/admin/components/skeleton/skeleton.component.ts
- [ ] T019 [P] Create empty state component in client/src/app/features/admin/components/empty-state/empty-state.component.ts
- [ ] T020 [P] Create admin styles in client/src/app/features/admin/styles/admin.scss

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Dashboard Overview (Priority: P1) 🎯 MVP

**Goal**: Display KPI metrics, recent bookings, revenue chart, and top hotels at a glance

**Independent Test**: Admin can log in, view dashboard with all 4 metric cards showing accurate data, see revenue chart and recent bookings table

### Backend Implementation

- [ ] T021 [US1] Create DashboardMetricsDto in src/HotelBooking.API/DTOs/Admin/DashboardMetricsDto.cs
- [ ] T022 [P] [US1] Create RecentBookingDto in src/HotelBooking.API/DTOs/Admin/RecentBookingDto.cs
- [ ] T023 [P] [US1] Create TopHotelDto in src/HotelBooking.API/DTOs/Admin/TopHotelDto.cs
- [ ] T024 [P] [US1] Create RevenueChartDataDto in src/HotelBooking.API/DTOs/Admin/RevenueChartDataDto.cs
- [ ] T025 [US1] Implement AdminDashboardService in src/HotelBooking.Application/Services/AdminDashboardService.cs
- [ ] T026 [US1] Create AdminDashboardController in src/HotelBooking.API/Controllers/Admin/AdminDashboardController.cs
- [ ] T027 [US1] Implement GET /api/admin/dashboard/metrics endpoint
- [ ] T028 [US1] Implement GET /api/admin/dashboard/recent-bookings endpoint
- [ ] T029 [US1] Implement GET /api/admin/dashboard/revenue-chart endpoint
- [ ] T030 [US1] Implement GET /api/admin/dashboard/top-hotels endpoint

### Frontend Implementation

- [ ] T031 [US1] Create dashboard service in client/src/app/features/admin/services/dashboard.service.ts
- [ ] T032 [P] [US1] Create metric card component in client/src/app/features/admin/components/metric-card/metric-card.component.ts
- [ ] T033 [P] [US1] Create revenue chart component in client/src/app/features/admin/components/revenue-chart/revenue-chart.component.ts
- [ ] T034 [US1] Create dashboard page component in client/src/app/features/admin/pages/dashboard/dashboard.component.ts
- [ ] T035 [US1] Implement recent bookings table in dashboard component
- [ ] T036 [US1] Implement top hotels table in dashboard component
- [ ] T037 [US1] Add loading skeletons for all dashboard sections
- [ ] T038 [US1] Add empty states for dashboard when no data exists
- [ ] T039 [US1] Implement auto-refresh for dashboard data (30 second interval)
- [ ] T040 [US1] Add click navigation from recent bookings to booking details

**Checkpoint**: Dashboard MVP complete - Admin can view all KPIs and navigate to booking details

---

## Phase 4: User Story 2 - Hotels Management CRUD (Priority: P2)

**Goal**: Full CRUD operations for hotels with search, filter, pagination, and approval workflow

**Independent Test**: Admin can view hotels list, add new hotel, edit hotel, approve/reject hotels, delete hotels with confirmation

### Backend Implementation

- [ ] T041 [US2] Create AdminHotelDto in src/HotelBooking.API/DTOs/Admin/AdminHotelDto.cs
- [ ] T042 [P] [US2] Create CreateHotelDto in src/HotelBooking.API/DTOs/Admin/CreateHotelDto.cs
- [ ] T043 [P] [US2] Create UpdateHotelDto in src/HotelBooking.API/DTOs/Admin/UpdateHotelDto.cs
- [ ] T044 [P] [US2] Create BulkActionDto in src/HotelBooking.API/DTOs/Admin/BulkActionDto.cs
- [ ] T045 [US2] Create IAdminHotelService interface in src/HotelBooking.Application/Interfaces/IAdminHotelService.cs
- [ ] T046 [US2] Implement AdminHotelService in src/HotelBooking.Application/Services/AdminHotelService.cs
- [ ] T047 [US2] Create AdminHotelsController in src/HotelBooking.API/Controllers/Admin/AdminHotelsController.cs
- [ ] T048 [US2] Implement GET /api/admin/hotels with search, filter, pagination
- [ ] T049 [US2] Implement POST /api/admin/hotels (create hotel)
- [ ] T050 [US2] Implement PUT /api/admin/hotels/{id} (update hotel)
- [ ] T051 [US2] Implement DELETE /api/admin/hotels/{id} (delete hotel)
- [ ] T052 [US2] Implement PUT /api/admin/hotels/{id}/approve endpoint
- [ ] T053 [US2] Implement PUT /api/admin/hotels/{id}/reject endpoint
- [ ] T054 [US2] Implement POST /api/admin/hotels/bulk-action endpoint
- [ ] T055 [US2] Add validation to prevent deletion of hotels with active bookings

### Frontend Implementation

- [ ] T056 [US2] Create hotels management service in client/src/app/features/admin/services/hotels-management.service.ts
- [ ] T057 [US2] Create hotels list page in client/src/app/features/admin/pages/hotels/hotels-list.component.ts
- [ ] T058 [US2] Implement hotels table with sorting and selection
- [ ] T059 [US2] Add search box and status filter controls
- [ ] T060 [US2] Implement pagination component for hotels table
- [ ] T061 [US2] Create hotel form component in client/src/app/features/admin/components/hotel-form/hotel-form.component.ts
- [ ] T062 [US2] Create add hotel modal with form validation
- [ ] T063 [US2] Create edit hotel modal with pre-populated data
- [ ] T064 [US2] Implement image upload for hotels (multiple images)
- [ ] T065 [US2] Implement bulk approve/reject functionality
- [ ] T066 [US2] Create delete confirmation dialog
- [ ] T067 [US2] Add success/error toast notifications for all CRUD operations
- [ ] T068 [US2] Handle empty state when no hotels exist

**Checkpoint**: Hotels CRUD complete - Admin can fully manage hotel listings

---

## Phase 5: User Story 3 - Bookings Management (Priority: P3)

**Goal**: View all bookings, filter by status/date/hotel, manage booking lifecycle, export CSV

**Independent Test**: Admin can view all bookings, filter them, change booking status through lifecycle, export to CSV

### Backend Implementation

- [ ] T069 [US3] Create AdminBookingDto in src/HotelBooking.API/DTOs/Admin/AdminBookingDto.cs
- [ ] T070 [P] [US3] Create BookingDetailsDto in src/HotelBooking.API/DTOs/Admin/BookingDetailsDto.cs
- [ ] T071 [P] [US3] Create BookingFilterDto in src/HotelBooking.API/DTOs/Admin/BookingFilterDto.cs
- [ ] T072 [US3] Create IAdminBookingService interface in src/HotelBooking.Application/Interfaces/IAdminBookingService.cs
- [ ] T073 [US3] Implement AdminBookingService in src/HotelBooking.Application/Services/AdminBookingService.cs
- [ ] T074 [US3] Create AdminBookingsController in src/HotelBooking.API/Controllers/Admin/AdminBookingsController.cs
- [ ] T075 [US3] Implement GET /api/admin/bookings with filters (status, date range, hotel)
- [ ] T076 [US3] Implement GET /api/admin/bookings/{id} (booking details)
- [ ] T077 [US3] Implement PUT /api/admin/bookings/{id}/status (change status)
- [ ] T078 [US3] Implement booking status transition validation (Pending→Confirmed→CheckedIn→CheckedOut)
- [ ] T079 [US3] Implement PUT /api/admin/bookings/{id}/cancel endpoint
- [ ] T080 [US3] Implement GET /api/admin/bookings/export?format=csv endpoint
- [ ] T081 [US3] Add audit logging for all booking status changes

### Frontend Implementation

- [ ] T082 [US3] Create bookings management service in client/src/app/features/admin/services/bookings-management.service.ts
- [ ] T083 [US3] Create bookings list page in client/src/app/features/admin/pages/bookings/bookings-list.component.ts
- [ ] T084 [US3] Implement bookings table with all columns
- [ ] T085 [US3] Add status filter dropdown
- [ ] T086 [US3] Add date range picker for filtering
- [ ] T087 [US3] Add hotel filter dropdown
- [ ] T088 [US3] Create booking details modal in client/src/app/features/admin/components/booking-details/booking-details.component.ts
- [ ] T089 [US3] Implement booking status action buttons (Confirm, Check In, Check Out, Cancel)
- [ ] T090 [US3] Implement CSV export button with current filters
- [ ] T091 [US3] Add pagination for bookings table
- [ ] T092 [US3] Handle empty state when no bookings match filters

**Checkpoint**: Bookings Management complete - Admin can oversee all booking operations

---

## Phase 6: User Story 4 - Users Management (Priority: P4)

**Goal**: View users, filter by role, search, change roles, suspend/reactivate accounts

**Independent Test**: Admin can view users list, search/filter, promote/demote users, suspend and reactivate accounts

### Backend Implementation

- [ ] T093 [US4] Create AdminUserDto in src/HotelBooking.API/DTOs/Admin/AdminUserDto.cs
- [ ] T094 [P] [US4] Create UserDetailsDto in src/HotelBooking.API/DTOs/Admin/UserDetailsDto.cs
- [ ] T095 [P] [US4] Create ChangeRoleDto in src/HotelBooking.API/DTOs/Admin/ChangeRoleDto.cs
- [ ] T096 [US4] Create IAdminUserService interface in src/HotelBooking.Application/Interfaces/IAdminUserService.cs
- [ ] T097 [US4] Implement AdminUserService in src/HotelBooking.Application/Services/AdminUserService.cs
- [ ] T098 [US4] Create AdminUsersController in src/HotelBooking.API/Controllers/Admin/AdminUsersController.cs
- [ ] T099 [US4] Implement GET /api/admin/users with filters (role, search)
- [ ] T100 [US4] Implement GET /api/admin/users/{id} (user details with booking history)
- [ ] T101 [US4] Implement PUT /api/admin/users/{id}/role (change role)
- [ ] T102 [US4] Add validation to prevent self-role-change
- [ ] T103 [US4] Implement PUT /api/admin/users/{id}/suspend endpoint
- [ ] T104 [US4] Implement PUT /api/admin/users/{id}/reactivate endpoint
- [ ] T105 [US4] Add session invalidation when user is suspended
- [ ] T106 [US4] Add audit logging for all user management actions

### Frontend Implementation

- [ ] T107 [US4] Create users management service in client/src/app/features/admin/services/users-management.service.ts
- [ ] T108 [US4] Create users list page in client/src/app/features/admin/pages/users/users-list.component.ts
- [ ] T109 [US4] Implement users table with all columns
- [ ] T110 [US4] Add role filter dropdown
- [ ] T111 [US4] Add search box for email/name
- [ ] T112 [US4] Create user details modal in client/src/app/features/admin/components/user-details/user-details.component.ts
- [ ] T113 [US4] Implement role change actions (Promote to Admin, Demote to User)
- [ ] T114 [US4] Implement suspend/reactivate actions
- [ ] T115 [US4] Hide self-modification actions (cannot suspend/demote own account)
- [ ] T116 [US4] Add pagination for users table
- [ ] T117 [US4] Handle empty state when no users match filters

**Checkpoint**: Users Management complete - Admin can fully control user access

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Error handling, real-time updates, and final refinements

### Error Handling & UX

- [ ] T118 [P] Implement global error handling for admin API calls
- [ ] T119 [P] Add retry logic for failed network operations
- [ ] T120 [P] Implement permission error handling (redirect non-admins)
- [ ] T121 [P] Add session expiry handling with re-authentication prompt

### Real-time Updates

- [ ] T122 Implement real-time booking notification service in client/src/app/features/admin/services/realtime.service.ts
- [ ] T123 Add booking notification badge to dashboard
- [ ] T124 Implement auto-refresh when data changes detected

### Testing

- [ ] T125 [P] Add unit tests for AdminDashboardService in src/HotelBooking.Application.Tests/
- [ ] T126 [P] Add unit tests for AdminHotelService in src/HotelBooking.Application.Tests/
- [ ] T127 [P] Add unit tests for AdminBookingService in src/HotelBooking.Application.Tests/
- [ ] T128 [P] Add unit tests for AdminUserService in src/HotelBooking.Application.Tests/
- [ ] T129 [P] Add integration tests for admin API endpoints in src/HotelBooking.Tests/
- [ ] T130 [P] Add E2E tests for admin flows in client/e2e/admin/

### Documentation

- [ ] T131 [P] Update API documentation with admin endpoints
- [ ] T132 [P] Add admin user guide in docs/admin-guide.md

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational) ← BLOCKS ALL USER STORIES
    ↓
┌───────────────────────────────────────────────────┐
│  Phase 3 (US1)  Phase 4 (US2)  Phase 5 (US3)  Phase 6 (US4)  │
│  Dashboard      Hotels         Bookings        Users          │
│     ↓              ↓              ↓              ↓            │
│   [MVP]         [P2]           [P3]           [P4]           │
└───────────────────────────────────────────────────┘
    ↓
Phase 7 (Polish)
```

### User Story Independence

- **US1 (Dashboard)**: Depends only on Foundational - Can be MVP release
- **US2 (Hotels)**: Depends only on Foundational - Independent of Dashboard
- **US3 (Bookings)**: Depends only on Foundational - Uses existing Booking entity
- **US4 (Users)**: Depends only on Foundational - Uses existing User entity

### Within Each User Story

1. Backend DTOs (parallelizable)
2. Backend Service interface → implementation
3. Backend Controller with endpoints
4. Frontend Service
5. Frontend Components (parallelizable)
6. Frontend Page assembly
7. Error handling and edge cases

---

## Parallel Execution Examples

### Phase 2 Parallel Group

```
T009 AuditLog entity
T010 Hotel ApprovalStatus
T011 User Status enum
─── can run together ───
T013 AdminAuthorizationAttribute
T014 AuditLoggingMiddleware
T015 Admin API service
T016 Data table component
T017 Modal component
T018 Skeleton component
T019 Empty state component
T020 Admin styles
```

### User Story 1 Parallel Group

```
Backend DTOs (T021-T024) can run together
Frontend components:
  T032 Metric card
  T033 Revenue chart
  ─── can run together ───
```

### Cross-Story Parallel (with team)

```
Developer A: US1 (T021-T040)
Developer B: US2 (T041-T068)
Developer C: US3 (T069-T092)
Developer D: US4 (T093-T117)
─── all can run after Phase 2 ───
```

---

## Implementation Strategy

### MVP First (Dashboard Only)

1. ✅ Complete Phase 1: Setup (T001-T007)
2. ✅ Complete Phase 2: Foundational (T008-T020)
3. ✅ Complete Phase 3: User Story 1 - Dashboard (T021-T040)
4. **VALIDATE**: Admin can view KPIs, recent bookings, revenue chart, top hotels
5. **DEPLOY**: MVP provides immediate business visibility

### Incremental Delivery

| Increment | Stories Included | Business Value |
|-----------|------------------|----------------|
| MVP | Dashboard (P1) | KPI visibility, business intelligence |
| +Hotels | Dashboard + Hotels (P1-P2) | Hotel inventory management |
| +Bookings | All above + Bookings (P1-P3) | Full operational oversight |
| Complete | All stories (P1-P4) | Complete admin control |

### Task Count Summary

| Phase | Tasks | Parallel Tasks |
|-------|-------|----------------|
| Phase 1: Setup | 7 | 4 |
| Phase 2: Foundational | 13 | 10 |
| Phase 3: US1 Dashboard | 20 | 6 |
| Phase 4: US2 Hotels | 28 | 4 |
| Phase 5: US3 Bookings | 24 | 3 |
| Phase 6: US4 Users | 25 | 3 |
| Phase 7: Polish | 15 | 12 |
| **Total** | **132** | **42** |

---

## Notes

- All admin endpoints require `[AdminAuthorize]` attribute
- All state-changing operations must create AuditLog entries
- Frontend services should handle 401/403 errors consistently
- Use existing Hotel, Booking, User entities - extend with new fields
- Dashboard auto-refresh uses polling (SignalR optional enhancement)
- CSV export uses server-side generation for large datasets
