# Feature Specification: Admin Dashboard

**Feature Branch**: `001-admin-dashboard`  
**Created**: January 30, 2026  
**Status**: Draft  
**Input**: User description: "Admin Dashboard for Hotel Booking System with Dashboard Overview, Hotels CRUD, Bookings Management, and Users Management"

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Dashboard Overview (Priority: P1)

As an Admin, I want a dashboard overview so I can see business KPIs at a glance and make informed decisions quickly.

**Why this priority**: The dashboard is the primary landing page for administrators and provides critical business visibility. Without this, admins have no centralized view of system health and performance.

**Independent Test**: Can be fully tested by logging in as Admin and verifying all KPI cards, charts, and tables display accurate real-time data. Delivers immediate business intelligence value.

**Acceptance Scenarios**:

1. **Given** I am logged in as Admin, **When** I navigate to the dashboard, **Then** I see 4 metric cards displaying Total Bookings (all-time count), Revenue YTD (current year sum), Occupancy % (current average across all hotels), and Active Hotels (count of approved hotels).

2. **Given** I am on the dashboard, **When** the page loads, **Then** I see a "Recent Bookings" table showing bookings from the last 24 hours with columns: Booking ID, Guest Name, Hotel, Check-in Date, Status, and Amount.

3. **Given** I am viewing the Recent Bookings table, **When** I click on any booking row, **Then** I am navigated to the booking details view for that specific booking.

4. **Given** I am on the dashboard, **When** the page loads, **Then** I see a line chart showing daily revenue for the past 30 days with clearly labeled axes (Date, Revenue Amount).

5. **Given** I am on the dashboard, **When** the page loads, **Then** I see a "Top 5 Hotels" table ranked by performance showing Hotel Name, Occupancy %, and Revenue columns.

6. **Given** new bookings occur while I am viewing the dashboard, **When** a new booking is created, **Then** I receive a visual notification and the Recent Bookings table updates automatically without manual refresh.

7. **Given** I am on the dashboard, **When** the metrics are loading, **Then** I see loading skeleton placeholders for each card and table until data is fully loaded.

---

### User Story 2 - Hotels Management CRUD (Priority: P2)

As an Admin, I want full hotels CRUD functionality so I can manage all hotel listings in the system effectively.

**Why this priority**: Hotel management is foundational to the booking system. Admins must be able to add, modify, and control which hotels are visible to customers.

**Independent Test**: Can be fully tested by performing all CRUD operations (Create, Read, Update, Delete) on hotel records and verifying the approval workflow functions correctly. Delivers complete hotel inventory management capability.

**Acceptance Scenarios**:

1. **Given** I am logged in as Admin, **When** I navigate to Hotels Management, **Then** I see a table displaying all hotels with columns: Hotel Name, Location, Status (Pending/Approved/Rejected), Rooms, Created Date, and Actions.

2. **Given** I am on the Hotels Management page, **When** I type in the search box, **Then** the table filters to show only hotels matching the search term in name or location fields.

3. **Given** I am on the Hotels Management page, **When** I select a status filter (All/Pending/Approved/Rejected), **Then** the table shows only hotels with the selected status.

4. **Given** the hotels table has more than 10 entries, **When** I view the table, **Then** I see pagination controls allowing me to navigate between pages with 10 items per page.

5. **Given** I am on the Hotels Management page, **When** I select multiple hotels using checkboxes and click "Bulk Approve" or "Bulk Reject", **Then** all selected hotels' statuses are updated accordingly and I see a success confirmation.

6. **Given** I click the "Add Hotel" button, **When** the modal opens, **Then** I see a form with fields: Hotel Name (required), Location/Address (required), Description, Amenities (multi-select), Star Rating, and Image Upload (multiple images).

7. **Given** I am filling the Add Hotel form, **When** I submit with valid data, **Then** the hotel is created with "Pending" status and appears in the hotels table.

8. **Given** I click the "Edit" action on a hotel row, **When** the edit modal opens, **Then** I see the form pre-populated with existing hotel data and can modify any field.

9. **Given** I am editing a hotel, **When** I save changes, **Then** the hotel data is updated and I see a success message with the changes reflected in the table.

10. **Given** a hotel has "Pending" status, **When** I click "Approve" action, **Then** the hotel status changes to "Approved" and becomes visible to customers.

11. **Given** I click "Delete" action on a hotel, **When** I confirm the deletion in the confirmation dialog, **Then** the hotel is removed from the system and no longer appears in the table.

12. **Given** I click "Delete" on a hotel, **When** the confirmation dialog appears and I click "Cancel", **Then** the hotel is not deleted and remains in the table.

---

### User Story 3 - Bookings Management (Priority: P3)

As an Admin, I want comprehensive bookings management so I can oversee all booking operations and maintain accurate records.

**Why this priority**: Booking oversight is essential for operations but depends on having hotels in the system first. Admins need to track, modify, and report on all bookings.

**Independent Test**: Can be fully tested by viewing, filtering, and modifying booking records, then exporting data to CSV. Delivers complete booking oversight and reporting capability.

**Acceptance Scenarios**:

1. **Given** I am logged in as Admin, **When** I navigate to Bookings Management, **Then** I see a table displaying all bookings with columns: Booking ID, Guest Name, Hotel, Room Type, Check-in, Check-out, Status, Total Amount, and Actions.

2. **Given** I am on the Bookings Management page, **When** I select a status filter (All/Pending/Confirmed/CheckedIn/CheckedOut/Cancelled), **Then** the table shows only bookings with the selected status.

3. **Given** I am on the Bookings Management page, **When** I select a date range using the date picker, **Then** the table shows only bookings with check-in dates within the selected range.

4. **Given** I am on the Bookings Management page, **When** I select a hotel from the hotel filter dropdown, **Then** the table shows only bookings for the selected hotel.

5. **Given** I am viewing a booking with "Pending" status, **When** I click "Confirm" action, **Then** the booking status changes to "Confirmed" and the guest should receive a confirmation notification.

6. **Given** I am viewing a booking with "Confirmed" status, **When** I click "Check In" action, **Then** the booking status changes to "CheckedIn".

7. **Given** I am viewing a booking with "CheckedIn" status, **When** I click "Check Out" action, **Then** the booking status changes to "CheckedOut".

8. **Given** I click "View Details" on a booking row, **When** the details modal opens, **Then** I see complete booking information including: Guest details (name, email, phone), Hotel and room details, Dates and duration, Payment information, Special requests, and Booking history/audit trail.

9. **Given** I am on the Bookings Management page with filters applied, **When** I click "Export CSV", **Then** a CSV file is downloaded containing only the currently filtered bookings with all visible columns.

10. **Given** I am on the Bookings Management page with no filters, **When** I click "Export CSV", **Then** a CSV file is downloaded containing all bookings in the system.

11. **Given** I am viewing booking details, **When** I click "Cancel Booking", **Then** the booking status changes to "Cancelled" and the guest should receive a cancellation notification.

---

### User Story 4 - Users Management (Priority: P4)

As an Admin, I want users management capabilities so I can control system access and manage user accounts effectively.

**Why this priority**: User management is important for security and access control but is less frequently used than the other features. It completes the admin functionality suite.

**Independent Test**: Can be fully tested by viewing, searching, and modifying user accounts including role changes and suspension. Delivers complete user access control capability.

**Acceptance Scenarios**:

1. **Given** I am logged in as Admin, **When** I navigate to Users Management, **Then** I see a table displaying all users with columns: User ID, Name, Email, Role (User/Admin), Status (Active/Suspended), Registration Date, Last Login, and Actions.

2. **Given** I am on the Users Management page, **When** I select a role filter (All/User/Admin), **Then** the table shows only users with the selected role.

3. **Given** I am on the Users Management page, **When** I type in the search box, **Then** the table filters to show users matching the search term in email or name fields.

4. **Given** I am viewing a user with "User" role, **When** I click "Promote to Admin" action, **Then** the user's role changes to "Admin" and they gain admin privileges on next login.

5. **Given** I am viewing a user with "Admin" role (not my own account), **When** I click "Demote to User" action, **Then** the user's role changes to "User" and they lose admin privileges.

6. **Given** I am viewing my own admin account, **When** I look at available actions, **Then** I do not see options to demote myself or suspend my own account.

7. **Given** I am viewing an "Active" user, **When** I click "Suspend" action, **Then** the user's status changes to "Suspended" and they cannot log in until reactivated.

8. **Given** I am viewing a "Suspended" user, **When** I click "Reactivate" action, **Then** the user's status changes to "Active" and they can log in again.

9. **Given** I click "View Details" on a user row, **When** the details modal opens, **Then** I see complete user information including: Profile details, Booking history summary, Account activity log, and Role change history.

---

### Edge Cases

**Empty States:**
- **EC-001**: When there are no bookings in the system, the Recent Bookings table and Bookings Management page display a friendly "No bookings yet" message with appropriate illustration.
- **EC-002**: When there are no hotels in the system, the Hotels Management page and Top 5 Hotels table display "No hotels yet" with a prominent "Add Hotel" call-to-action.
- **EC-003**: When filters return no results, tables display "No results match your filters" with an option to clear filters.

**Permission Errors:**
- **EC-004**: When a non-admin user attempts to access any admin dashboard route, they are redirected to the home page with an "Access Denied" error message.
- **EC-005**: When an admin's session expires while on the dashboard, they are prompted to re-authenticate before continuing.
- **EC-006**: When an admin attempts to perform an action they don't have permission for (e.g., super-admin only actions), they see a clear permission error message.

**Network Failures & Loading States:**
- **EC-007**: When the network is unavailable during page load, users see an error state with "Unable to load data. Please check your connection" and a "Retry" button.
- **EC-008**: When an API call fails during an action (e.g., approving a hotel), the user sees an error toast with specific error message and the action can be retried.
- **EC-009**: All data-fetching operations show appropriate loading indicators (spinners, skeleton screens) while data is being retrieved.
- **EC-010**: When a bulk operation partially fails (some items succeed, some fail), the user sees a summary of what succeeded and what failed with specific error reasons.

**Invalid Data Handling:**
- **EC-011**: When attempting to save a hotel with invalid data (missing required fields, invalid image formats), validation errors are shown inline next to the relevant fields.
- **EC-012**: When database constraints are violated (e.g., duplicate email), a user-friendly error message is displayed instead of technical error details.
- **EC-013**: When importing or processing malformed data, the system rejects the operation gracefully and explains what data was invalid.

**Real-time Updates:**
- **EC-014**: When a new booking is created while an admin is viewing the dashboard, a notification badge appears and the data refreshes automatically within 30 seconds.
- **EC-015**: When another admin modifies a record that the current admin is viewing, the current admin sees a notification that the data has changed with an option to refresh.
- **EC-016**: When real-time connection is lost, a subtle indicator shows "Updates paused" and the system attempts to reconnect automatically.

**Concurrency & Data Integrity:**
- **EC-017**: When two admins attempt to modify the same hotel simultaneously, the second admin sees a conflict warning and must refresh before editing.
- **EC-018**: When an admin tries to approve a hotel that was already deleted by another admin, they see "This hotel no longer exists" error.

---

## Requirements *(mandatory)*

### Functional Requirements

**Dashboard Overview:**
- **FR-001**: System MUST display a metrics card showing Total Bookings count across all hotels and all time.
- **FR-002**: System MUST display a metrics card showing Revenue YTD (Year-to-Date) calculated from January 1 of the current year.
- **FR-003**: System MUST display a metrics card showing Occupancy % as the current average occupancy rate across all active hotels.
- **FR-004**: System MUST display a metrics card showing count of Active Hotels (status = Approved).
- **FR-005**: System MUST display a Recent Bookings table showing bookings created in the last 24 hours.
- **FR-006**: System MUST make each row in the Recent Bookings table clickable to navigate to booking details.
- **FR-007**: System MUST display a line chart showing daily revenue totals for the past 30 days.
- **FR-008**: System MUST display a Top 5 Hotels table ranked by combined occupancy and revenue metrics.
- **FR-009**: System MUST provide visual notifications when new bookings are created in real-time.
- **FR-010**: System MUST auto-refresh dashboard data at regular intervals (maximum 30 seconds).

**Hotels Management:**
- **FR-011**: System MUST display a paginated table of all hotels with sorting capability.
- **FR-012**: System MUST support text search filtering on hotel name and location fields.
- **FR-013**: System MUST support filtering hotels by status (Pending/Approved/Rejected).
- **FR-014**: System MUST support bulk selection and bulk status change operations.
- **FR-015**: System MUST provide an Add Hotel modal with form validation.
- **FR-016**: System MUST support multiple image uploads per hotel (minimum 1, maximum 10 images).
- **FR-017**: System MUST create new hotels with "Pending" status by default.
- **FR-018**: System MUST support the approval workflow: Pending → Approved or Pending → Rejected.
- **FR-019**: System MUST require confirmation before deleting a hotel.
- **FR-020**: System MUST prevent deletion of hotels with active (non-completed) bookings.

**Bookings Management:**
- **FR-021**: System MUST display a paginated table of all bookings across all hotels.
- **FR-022**: System MUST support filtering bookings by status, date range, and hotel.
- **FR-023**: System MUST enforce valid booking status transitions: Pending → Confirmed → CheckedIn → CheckedOut.
- **FR-024**: System MUST allow cancellation of bookings in Pending or Confirmed status only.
- **FR-025**: System MUST display complete booking details in a modal view.
- **FR-026**: System MUST support CSV export of bookings (all or filtered).
- **FR-027**: System MUST include all visible columns plus booking ID in CSV exports.
- **FR-028**: System MUST log all booking status changes with timestamp and admin user.

**Users Management:**
- **FR-029**: System MUST display a paginated table of all registered users.
- **FR-030**: System MUST support filtering users by role (User/Admin).
- **FR-031**: System MUST support text search on user email and name fields.
- **FR-032**: System MUST support role changes between User and Admin roles.
- **FR-033**: System MUST prevent admins from modifying their own role or status.
- **FR-034**: System MUST support suspending and reactivating user accounts.
- **FR-035**: System MUST prevent suspended users from logging into the system.
- **FR-036**: System MUST log all user management actions with timestamp and performing admin.

**Security & Access Control:**
- **FR-037**: System MUST restrict all admin dashboard routes to users with Admin role only.
- **FR-038**: System MUST redirect unauthorized users to an appropriate page with error message.
- **FR-039**: System MUST validate admin session on every admin API request.
- **FR-040**: System MUST implement rate limiting on admin API endpoints.

**Error Handling & UX:**
- **FR-041**: System MUST display appropriate empty states when no data exists.
- **FR-042**: System MUST display loading indicators during all data fetch operations.
- **FR-043**: System MUST display user-friendly error messages for all failure scenarios.
- **FR-044**: System MUST provide retry capability for failed network operations.
- **FR-045**: System MUST preserve filter state across page navigation within the same session.

### Key Entities

- **Dashboard Metrics**: Aggregated business KPIs including booking counts, revenue calculations, occupancy rates, and hotel statistics. Computed in real-time from underlying booking and hotel data.

- **Hotel**: Represents a lodging property with attributes including name, location, description, amenities, star rating, images, and approval status. Has many Rooms and receives many Bookings.

- **Booking**: Represents a reservation made by a guest at a hotel. Contains guest information, date range, room details, payment information, and status. Belongs to a Hotel and a User (guest).

- **User**: Represents a registered account in the system. Has role (User/Admin), status (Active/Suspended), profile information, and authentication credentials. May have many Bookings (as guest) or perform many admin actions (as admin).

- **Audit Log**: Tracks all administrative actions including who performed the action, what was changed, when it occurred, and the before/after values for compliance and debugging purposes.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

**Performance & Responsiveness:**
- **SC-001**: Dashboard page fully loads and displays all metrics within 3 seconds on standard broadband connection.
- **SC-002**: Table pagination and filtering operations complete within 1 second.
- **SC-003**: CRUD operations (create, update, delete) complete and confirm within 2 seconds.
- **SC-004**: CSV export generates and downloads within 5 seconds for up to 10,000 records.

**Usability & Task Completion:**
- **SC-005**: Admins can locate and view any specific booking within 30 seconds using search/filters.
- **SC-006**: Admins can complete the hotel approval workflow in under 5 clicks from dashboard.
- **SC-007**: 95% of admin users can successfully complete all primary tasks on first attempt without documentation.
- **SC-008**: Error messages enable admins to understand and resolve issues without contacting support.

**Data Accuracy & Reliability:**
- **SC-009**: Dashboard metrics accurately reflect current database state with maximum 30-second delay.
- **SC-010**: All admin actions are logged with 100% accuracy for audit compliance.
- **SC-011**: System maintains data integrity with zero orphaned records or inconsistent states.

**Security & Access Control:**
- **SC-012**: Zero unauthorized access incidents to admin functionality by non-admin users.
- **SC-013**: All sensitive admin actions require re-confirmation or secondary verification.
- **SC-014**: Suspended users are blocked from system access within 1 minute of suspension.

**Business Value:**
- **SC-015**: Admin time spent on routine booking/hotel management tasks reduced by 50% compared to manual processes.
- **SC-016**: Hotel approval turnaround time reduced to under 24 hours on average.
- **SC-017**: Admin dashboard provides single source of truth, eliminating need for external reporting tools.

---

## Assumptions

1. **Authentication exists**: The system already has user authentication in place with session management.
2. **Role-based access**: The User entity already has a role field distinguishing Users from Admins.
3. **Existing data models**: Hotel, Booking, and User entities already exist in the database with basic CRUD operations.
4. **Email notifications**: The system has email notification capability that can be triggered by booking status changes.
5. **Standard pagination**: Default page size of 10 items with ability to change to 25, 50, or 100.
6. **Time zones**: All dates and times are displayed in the admin's local timezone with UTC storage.
7. **Currency**: Revenue figures are displayed in a single currency (system default) without multi-currency support.
8. **Image storage**: The system has cloud storage capability for hotel images (or will use local storage for MVP).
9. **Real-time updates**: WebSocket or polling mechanism is acceptable for real-time features.
10. **Browser support**: Modern browsers (Chrome, Firefox, Safari, Edge - latest 2 versions) are supported.

---

## Test Specifications

### E2E Test Scenarios

**Dashboard Overview E2E Tests:**

| Test ID | Scenario | Preconditions | Steps | Expected Result |
|---------|----------|---------------|-------|-----------------|
| E2E-001 | View dashboard metrics | Admin logged in, sample data exists | 1. Navigate to /admin/dashboard | All 4 metric cards display with correct values |
| E2E-002 | Recent bookings navigation | Admin logged in, bookings exist | 1. View dashboard 2. Click booking row | Navigated to booking details page |
| E2E-003 | Revenue chart display | Admin logged in, revenue data exists | 1. Navigate to dashboard | 30-day line chart renders with accurate data points |
| E2E-004 | Real-time booking notification | Admin on dashboard | 1. Create booking via API 2. Wait up to 30s | Notification appears, table updates |
| E2E-005 | Dashboard loading states | Admin logged in | 1. Navigate to dashboard with slow network | Skeleton loaders display until data loads |

**Hotels Management E2E Tests:**

| Test ID | Scenario | Preconditions | Steps | Expected Result |
|---------|----------|---------------|-------|-----------------|
| E2E-006 | Create new hotel | Admin logged in | 1. Click Add Hotel 2. Fill form 3. Submit | Hotel created with Pending status |
| E2E-007 | Approve hotel | Admin logged in, pending hotel exists | 1. Find pending hotel 2. Click Approve | Status changes to Approved |
| E2E-008 | Bulk reject hotels | Admin logged in, multiple pending hotels | 1. Select 3 hotels 2. Click Bulk Reject | All 3 hotels rejected |
| E2E-009 | Search and filter hotels | Admin logged in, varied hotels exist | 1. Enter search term 2. Select status filter | Table shows matching hotels only |
| E2E-010 | Delete hotel with confirmation | Admin logged in, hotel without bookings | 1. Click Delete 2. Confirm | Hotel removed from system |
| E2E-011 | Edit hotel details | Admin logged in, hotel exists | 1. Click Edit 2. Modify fields 3. Save | Changes persisted and visible |

**Bookings Management E2E Tests:**

| Test ID | Scenario | Preconditions | Steps | Expected Result |
|---------|----------|---------------|-------|-----------------|
| E2E-012 | Full booking lifecycle | Admin logged in, pending booking | 1. Confirm 2. Check In 3. Check Out | Status progresses correctly |
| E2E-013 | Filter by date range | Admin logged in, bookings span dates | 1. Select date range | Only bookings in range shown |
| E2E-014 | Export filtered CSV | Admin logged in, filter applied | 1. Apply filters 2. Click Export | CSV contains filtered records only |
| E2E-015 | View booking details | Admin logged in, booking exists | 1. Click View Details | Modal shows complete information |
| E2E-016 | Cancel booking | Admin logged in, confirmed booking | 1. Open details 2. Click Cancel | Booking status = Cancelled |

**Users Management E2E Tests:**

| Test ID | Scenario | Preconditions | Steps | Expected Result |
|---------|----------|---------------|-------|-----------------|
| E2E-017 | Promote user to admin | Admin logged in, regular user exists | 1. Find user 2. Click Promote | User role changes to Admin |
| E2E-018 | Suspend user | Admin logged in, active user exists | 1. Find user 2. Click Suspend | User cannot log in |
| E2E-019 | Cannot modify own account | Admin logged in | 1. Find own account in list | No suspend/demote actions available |
| E2E-020 | Search users | Admin logged in, users exist | 1. Enter email in search | Matching users displayed |

**Edge Case E2E Tests:**

| Test ID | Scenario | Preconditions | Steps | Expected Result |
|---------|----------|---------------|-------|-----------------|
| E2E-021 | Non-admin access attempt | Regular user logged in | 1. Navigate to /admin/* | Redirected with access denied |
| E2E-022 | Empty dashboard state | Admin logged in, no data | 1. Navigate to dashboard | Empty state messages displayed |
| E2E-023 | Network failure recovery | Admin logged in | 1. Disconnect network 2. Perform action 3. Reconnect 4. Retry | Action completes after reconnect |

### Integration Test Scenarios

**API Integration Tests:**

| Test ID | Scenario | Preconditions | Steps | Expected Result |
|---------|----------|---------------|-------|-----------------|
| INT-001 | Dashboard metrics API | Sample data seeded | Call GET /api/admin/dashboard/metrics | Returns accurate aggregated metrics |
| INT-002 | Hotels list with filters | Hotels seeded | Call GET /api/admin/hotels?status=pending | Returns only pending hotels |
| INT-003 | Hotel approval API | Pending hotel exists | Call PUT /api/admin/hotels/{id}/approve | Hotel status updated to Approved |
| INT-004 | Bulk hotel operation | Multiple hotels exist | Call POST /api/admin/hotels/bulk-action | All specified hotels updated |
| INT-005 | Bookings export API | Bookings exist | Call GET /api/admin/bookings/export?format=csv | Returns valid CSV content |
| INT-006 | User role change API | User exists | Call PUT /api/admin/users/{id}/role | Role updated, logged |
| INT-007 | Authorization check | Non-admin token | Call any admin API endpoint | Returns 403 Forbidden |
| INT-008 | Rate limiting | Valid admin token | Call API rapidly 100+ times | Returns 429 after limit exceeded |

**Database Integration Tests:**

| Test ID | Scenario | Preconditions | Steps | Expected Result |
|---------|----------|---------------|-------|-----------------|
| INT-009 | Hotel deletion cascade | Hotel with no bookings | Delete hotel | Hotel removed, no orphans |
| INT-010 | Booking status audit | Booking exists | Change status via API | Audit log entry created |
| INT-011 | User suspension effect | User with session | Suspend user | Existing sessions invalidated |
| INT-012 | Concurrent edit conflict | Hotel exists | Two updates same hotel simultaneously | Second update gets conflict error |

### Unit Test Scenarios

**Dashboard Service Unit Tests:**

| Test ID | Scenario | Input | Expected Output |
|---------|----------|-------|-----------------|
| UNIT-001 | Calculate YTD revenue | Bookings array with amounts | Sum of completed booking amounts since Jan 1 |
| UNIT-002 | Calculate occupancy rate | Hotels with room/booking data | Percentage of occupied rooms |
| UNIT-003 | Get recent bookings | Time range parameter | Bookings within 24 hours |
| UNIT-004 | Rank top hotels | Hotels with metrics | Top 5 sorted by performance score |

**Hotels Service Unit Tests:**

| Test ID | Scenario | Input | Expected Output |
|---------|----------|-------|-----------------|
| UNIT-005 | Validate hotel data | Hotel DTO | Validation result with errors |
| UNIT-006 | Filter hotels by status | Status enum | Filtered hotel list |
| UNIT-007 | Process bulk action | Hotel IDs, action type | Updated hotels or error |
| UNIT-008 | Check deletability | Hotel ID | Boolean (has active bookings) |

**Bookings Service Unit Tests:**

| Test ID | Scenario | Input | Expected Output |
|---------|----------|-------|-----------------|
| UNIT-009 | Validate status transition | Current status, new status | Boolean validity |
| UNIT-010 | Generate CSV content | Bookings array | Formatted CSV string |
| UNIT-011 | Apply booking filters | Filter criteria object | Filtered booking list |
| UNIT-012 | Calculate booking duration | Check-in, check-out dates | Number of nights |

**Users Service Unit Tests:**

| Test ID | Scenario | Input | Expected Output |
|---------|----------|-------|-----------------|
| UNIT-013 | Check self-modification | User ID, current user ID | Boolean (is same user) |
| UNIT-014 | Validate role change | Current role, new role | Validation result |
| UNIT-015 | Search users | Search term | Matched users by email/name |

**Authorization Unit Tests:**

| Test ID | Scenario | Input | Expected Output |
|---------|----------|-------|-----------------|
| UNIT-016 | Verify admin role | User claims | Boolean is admin |
| UNIT-017 | Validate session | Session token | Session validity status |
| UNIT-018 | Check permission | User, action, resource | Boolean has permission |

---

## Out of Scope

The following items are explicitly excluded from this feature specification:

1. **Financial reporting**: Detailed financial reports, invoicing, or accounting integrations
2. **Advanced analytics**: Custom report builder, data visualization customization, or BI tool integration
3. **Multi-tenancy**: Support for multiple admin organizations or white-label functionality
4. **Mobile admin app**: Native mobile application for admin functions (web responsive only)
5. **Automated workflows**: Rule-based automatic approvals or booking status changes
6. **Inventory management**: Room inventory, pricing rules, or availability calendar management
7. **Customer communication**: Direct messaging or chat with guests from admin panel
8. **Third-party integrations**: Channel managers, OTAs, or external booking platforms
9. **Internationalization**: Multi-language admin interface or multi-currency support
10. **Advanced user management**: Password reset by admin, 2FA management, or SSO configuration
