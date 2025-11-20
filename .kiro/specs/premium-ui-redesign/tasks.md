# Implementation Plan

- [ ] 1. Set up design system and shared utilities
  - Create design tokens file with color palette, spacing, and typography constants
  - Create shared utility classes for glassmorphism effects and animations
  - Set up Tailwind configuration with custom theme
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 2. Implement toast notification system
  - Create ToastService with show, success, error, warning, and info methods
  - Create ToastComponent with animations and auto-dismiss functionality
  - Add toast container to app root component
  - _Requirements: 9.1_

- [ ] 2.1 Write property test for toast notification system
  - **Property 17: Toast notification on form submission**
  - **Validates: Requirements 9.1**

- [ ] 3. Create loading skeleton components
  - Create LoadingSkeletonComponent with types: card, list, detail
  - Implement skeleton animations with shimmer effect
  - Create skeleton variants for hotel cards, booking lists, and detail pages
  - _Requirements: 9.2_

- [ ] 3.1 Write property test for loading skeleton display
  - **Property 18: Loading skeleton display**
  - **Validates: Requirements 9.2**

- [ ] 4. Create empty state component
  - Create EmptyStateComponent with title, message, illustration, and CTA
  - Design empty state variants for no bookings, no search results, no hotels
  - Add routing capability for CTA buttons
  - _Requirements: 9.5_

- [ ] 4.1 Write property test for empty state display
  - **Property 21: Empty state display**
  - **Validates: Requirements 9.5**

- [ ] 5. Update routing configuration
  - Update app.routes.ts to set home (/) as default route instead of /hotels
  - Add home route with lazy-loaded HomeComponent
  - Update hotel-details route to use :id parameter instead of query params
  - Ensure all guards are properly configured
  - _Requirements: 1.1, 7.1, 7.2, 7.3_

- [ ] 5.1 Write property test for protected route authentication
  - **Property 15: Protected route authentication**
  - **Validates: Requirements 7.3**

- [ ] 5.2 Write property test for login redirect with return URL
  - **Property 16: Login redirect with return URL**
  - **Validates: Requirements 7.4**

- [ ] 6. Enhance AuthGuard and create GuestGuard
  - Update AuthGuard to handle returnUrl properly
  - Create GuestGuard to redirect authenticated users away from login/register
  - Update RoleGuard to redirect non-admin users to home instead of /hotels
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 7. Update header component with new design
  - Implement sticky header with glassmorphism background
  - Add user dropdown menu for authenticated users (profile, my bookings, logout)
  - Show login/register buttons for guests
  - Implement role-based navigation links
  - Add mobile responsive menu
  - _Requirements: 10.1, 10.2, 10.3, 10.5_

- [ ] 7.1 Write property test for role-based navigation
  - **Property 22: Role-based navigation**
  - **Validates: Requirements 10.5**

- [ ] 8. Create home page component
  - Create HomeComponent with hero section and search bar
  - Implement featured hotels grid (6-8 hotels)
  - Add "How it works" section with steps
  - Create call-to-action section with login/register buttons
  - Add footer with navigation links
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 8.1 Write property test for featured hotels display constraint
  - **Property 1: Featured hotels display constraint**
  - **Validates: Requirements 1.2**

- [ ] 8.2 Write property test for footer presence across public routes
  - **Property 2: Footer presence across public routes**
  - **Validates: Requirements 1.5**

- [ ] 9. Create reusable hotel card component
  - Create HotelCardComponent with inputs for hotel data and showBookButton
  - Implement card layout with image, name, location, rating, price, amenities
  - Add hover effects with scale transform and shadow
  - Implement conditional "Book Now" button vs "Login to Book" message
  - Add click handlers for view details and book actions
  - _Requirements: 2.3, 2.4, 12.1, 12.3, 12.4_

- [ ] 9.1 Write property test for guest booking restriction
  - **Property 4: Guest booking restriction**
  - **Validates: Requirements 2.3**

- [ ] 9.2 Write property test for authenticated user booking access
  - **Property 5: Authenticated user booking access**
  - **Validates: Requirements 2.4**

- [ ] 9.3 Write property test for hotel card information completeness
  - **Property 25: Hotel card information completeness**
  - **Validates: Requirements 12.1, 12.3**

- [ ] 10. Update hotels list page with new design
  - Redesign SearchComponent (hotels page) with modern layout
  - Implement filter sidebar with city, price range, rating, amenities
  - Add search bar with debounced input
  - Display hotels using HotelCardComponent
  - Show loading skeletons while fetching data
  - Show empty state when no results found
  - _Requirements: 2.1, 2.2, 2.5_

- [ ] 10.1 Write property test for complete hotel listing
  - **Property 3: Complete hotel listing**
  - **Validates: Requirements 2.1**

- [ ] 10.2 Write property test for search filtering correctness
  - **Property 6: Search filtering correctness**
  - **Validates: Requirements 2.5**

- [ ] 11. Update hotel details page with new design
  - Redesign DetailsComponent with modern layout
  - Implement image gallery with navigation controls
  - Display hotel information (description, amenities, location, rating)
  - Show available rooms with pricing
  - Add reviews section
  - Show booking form for authenticated users only
  - Show "Login to book this hotel" CTA for guests
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 11.1 Write property test for hotel details completeness
  - **Property 7: Hotel details completeness**
  - **Validates: Requirements 3.1**

- [ ] 11.2 Write property test for room information display
  - **Property 8: Room information display**
  - **Validates: Requirements 3.3**

- [ ] 12. Create booking wizard component
  - Create BookingWizardComponent with step-by-step interface
  - Implement Step 1: Room selection
  - Implement Step 2: Date selection with calendar
  - Implement Step 3: Guest information form
  - Implement Step 4: Review and confirm
  - Add progress indicator showing current step
  - Implement step validation before allowing progression
  - Add cancel button to return to hotel details
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 12.1 Write property test for booking wizard step validation
  - **Property 23: Booking wizard step validation**
  - **Validates: Requirements 11.2**

- [ ] 12.2 Write property test for booking wizard progress accuracy
  - **Property 24: Booking wizard progress accuracy**
  - **Validates: Requirements 11.3**

- [ ] 13. Update my bookings page with new design
  - Redesign MyBookingsComponent with modern card layout
  - Display booking cards with status badges (Pending, Confirmed, Cancelled, Completed)
  - Show booking details: dates, hotel name, room type, total price
  - Add cancel booking button with confirmation modal
  - Implement filter by status
  - Show empty state when user has no bookings
  - Show loading skeletons while fetching
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 13.1 Write property test for user bookings completeness
  - **Property 9: User bookings completeness**
  - **Validates: Requirements 4.1**

- [ ] 13.2 Write property test for booking information completeness
  - **Property 10: Booking information completeness**
  - **Validates: Requirements 4.2**

- [ ] 13.3 Write property test for cancel option availability
  - **Property 11: Cancel option availability**
  - **Validates: Requirements 4.3**

- [ ] 14. Create profile page with tabbed interface
  - Create ProfileComponent with tab navigation
  - Implement "View" tab displaying user information
  - Implement "Edit" tab with editable form fields
  - Implement "Password" tab with change password form
  - Add tab switching without page reload
  - Highlight active tab
  - Implement form validation for edit and password tabs
  - Show success toast on successful updates
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 14.1 Write property test for user profile data display
  - **Property 12: User profile data display**
  - **Validates: Requirements 5.1**

- [ ] 14.2 Write property test for profile validation
  - **Property 13: Profile validation**
  - **Validates: Requirements 5.4**

- [ ] 14.3 Write property test for profile tab switching
  - **Property 29: Profile tab switching**
  - **Validates: Requirements 14.2**

- [ ] 14.4 Write property test for profile active tab highlighting
  - **Property 30: Profile active tab highlighting**
  - **Validates: Requirements 14.3**

- [ ] 14.5 Write property test for profile tab form validation
  - **Property 31: Profile tab form validation**
  - **Validates: Requirements 14.4**

- [ ] 15. Create admin dashboard with sidebar navigation
  - Create AdminDashboardComponent with sidebar layout
  - Implement sidebar navigation with sections: Statistics, Hotels, Rooms, Bookings, Users
  - Create statistics cards showing key metrics (total hotels, bookings, users, revenue)
  - Implement section switching without page reload
  - Highlight active sidebar item
  - Maintain sidebar state during navigation
  - Add role guard to protect admin routes
  - _Requirements: 6.1, 6.2, 6.5, 13.1, 13.2, 13.3, 13.4, 13.5_

- [ ] 15.1 Write property test for role-based admin access
  - **Property 14: Role-based admin access**
  - **Validates: Requirements 6.5**

- [ ] 15.2 Write property test for admin sidebar active state
  - **Property 26: Admin sidebar active state**
  - **Validates: Requirements 13.3**

- [ ] 15.3 Write property test for admin section content display
  - **Property 27: Admin section content display**
  - **Validates: Requirements 13.4**

- [ ] 15.4 Write property test for admin navigation state persistence
  - **Property 28: Admin navigation state persistence**
  - **Validates: Requirements 13.5**

- [ ] 16. Implement admin hotel management
  - Create hotel management interface with table/grid view
  - Add "Add Hotel" button opening modal form
  - Implement edit hotel functionality with pre-filled form
  - Implement delete hotel with confirmation modal
  - Add form validation for hotel data
  - Show success/error toasts for operations
  - _Requirements: 6.3_

- [ ] 17. Implement admin room management
  - Create room management interface showing rooms by hotel
  - Add "Add Room" button opening modal form
  - Implement edit room functionality
  - Implement delete room with confirmation
  - Add form validation for room data
  - Link room management to hotel selection
  - _Requirements: 6.4_

- [ ] 18. Implement admin booking overview
  - Create booking management interface with filterable table
  - Display all bookings with user, hotel, room, dates, status
  - Add filter by status, date range, hotel
  - Implement booking status update functionality
  - Add export to CSV functionality
  - _Requirements: 6.1_

- [ ] 19. Implement admin user management
  - Create user management interface with table view
  - Display user list with email, name, role, registration date
  - Add search/filter functionality
  - Implement user role update (User/Admin)
  - Add user deactivation functionality
  - _Requirements: 6.1_

- [ ] 20. Enhance form validation across application
  - Implement real-time validation for all forms
  - Add validation error messages with clear guidance
  - Implement email format validation
  - Implement phone number format validation
  - Add password strength indicator
  - Ensure validation prevents form submission when invalid
  - _Requirements: 9.3, 9.4_

- [ ] 20.1 Write property test for real-time form validation
  - **Property 20: Real-time form validation**
  - **Validates: Requirements 9.4**

- [ ] 20.2 Write property test for error message clarity
  - **Property 19: Error message clarity**
  - **Validates: Requirements 9.3**

- [ ] 21. Implement error handling and user feedback
  - Add HTTP interceptor for global error handling
  - Implement network error handling with retry mechanism
  - Add authentication error handling with auto-logout
  - Implement validation error display
  - Add business logic error handling
  - Implement server error handling with user-friendly messages
  - _Requirements: 9.1, 9.3_

- [ ] 22. Add animations and transitions
  - Implement page transition animations
  - Add card hover animations (scale, shadow)
  - Implement modal fade-in/fade-out animations
  - Add toast slide-in animations
  - Implement skeleton shimmer animations
  - Add button ripple effects
  - _Requirements: 8.3_

- [ ] 23. Implement responsive design
  - Ensure all components are mobile-responsive
  - Implement mobile navigation menu
  - Adjust grid layouts for tablet and mobile
  - Optimize image sizes for different viewports
  - Test on multiple screen sizes
  - _Requirements: 10.1_

- [ ] 24. Optimize performance
  - Implement lazy loading for routes
  - Add image lazy loading with intersection observer
  - Implement OnPush change detection strategy where applicable
  - Add debouncing to search inputs
  - Optimize bundle size with tree shaking
  - Implement virtual scrolling for long lists
  - _Requirements: All_

- [ ] 25. Add accessibility features
  - Ensure keyboard navigation works for all interactive elements
  - Add ARIA labels and roles
  - Implement focus management for modals and dropdowns
  - Ensure color contrast meets WCAG AA standards
  - Add alt text for all images
  - Test with screen readers
  - _Requirements: All_

- [ ] 26. Final integration and testing
  - Ensure all components integrate properly
  - Test all user flows end-to-end
  - Verify all guards work correctly
  - Test authentication flows with redirects
  - Verify role-based access control
  - Test error scenarios
  - Ensure all toasts and notifications work
  - _Requirements: All_

- [ ] 27. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
