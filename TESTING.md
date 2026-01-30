# 🧪 Hotel Booking System - Testing Guide

## Overview

Comprehensive testing infrastructure for Hotel Booking System with **296+ backend tests** and **90%+ code coverage** target.

| Layer | Framework | Test Types | Tests |
|-------|-----------|------------|-------|
| Backend (.NET 10) | xUnit, Moq, FluentAssertions | Unit, Integration, Controller | **296** |
| Frontend (Angular 19) | Jasmine/Karma, Playwright | Unit, Component, E2E | **30+** |

---

## 🚀 Quick Start

### 1. Install Testing Tools
```bash
install-testing-tools.cmd
```

### 2. Run All Tests
```bash
# Backend
cd src && dotnet test HotelBooking.sln

# Frontend Unit Tests
cd client && npm test

# Frontend E2E Tests
cd client && npx playwright test
```

---

## 📁 Test Project Structure

```
hotel-booking-system/
├── src/
│   ├── HotelBooking.Domain.Tests/        # Domain layer unit tests (23 tests)
│   │   ├── Entities/                     # Entity tests
│   │   └── PropertyTests/                # FsCheck property tests
│   ├── HotelBooking.Application.Tests/   # Application layer tests (19 tests)
│   │   └── Services/                     # Service tests with mocks
│   └── HotelBooking.Tests/               # Controller + API tests (254 tests)
│       ├── Controllers/                  # BookingsControllerTests, HotelsControllerTests
│       ├── BookingOverlapTests.cs        # Overlap detection tests
│       ├── BookingValidationTests.cs     # Validation tests
│       └── SecurityTests.cs              # Security tests
├── client/
│   ├── e2e/                              # Playwright E2E tests
│   │   ├── full-user-journey.spec.ts     # Complete user flow tests
│   │   └── hotel-booking.spec.ts         # Booking E2E tests
│   └── src/app/**/*.spec.ts              # Unit tests
```

---

## 🔧 Test Commands

### All Tests
| Command | Description |
|---------|-------------|
| `run-complete-test-suite.cmd` | Run ALL tests (Backend + Frontend) |
| `run-ci-tests.cmd` | Headless tests for CI/CD pipelines |
| `run-backend-tests-with-coverage.cmd` | Backend tests with HTML coverage report |

### Backend Tests
| Command | Description |
|---------|-------------|
| `run-domain-tests.cmd` | Domain layer unit tests |
| `run-application-tests.cmd` | Application layer unit tests |
| `run-api-tests.cmd` | API integration tests |
| `run-specflow-tests.cmd` | BDD scenario tests |
| `run-property-tests.cmd` | Property-based tests (FsCheck) |
| `run-mutation-tests.cmd` | Mutation testing (Stryker) |

### Frontend Tests
| Command | Description |
|---------|-------------|
| `run-frontend-unit-tests.cmd` | Jasmine/Karma unit tests |
| `run-frontend-e2e-tests.cmd` | Playwright E2E tests |

---

## 📊 Coverage Reports

After running tests with coverage:
- **Backend**: `src/coverage-report/index.html`
- **Frontend**: `client/coverage/index.html`

---

## 🏗️ Testing Architecture

```
┌─────────────────── BACKEND (.NET 10) ───────────────────┐
│                                                          │
│  Domain.Tests      Application.Tests    HotelBooking.Tests
│  ────────────      ────────────────     ─────────────────
│  • Entity Tests    • Service Tests      • API Integration
│  • Value Objects   • Mocked Repos       • BDD Scenarios
│  • Property Tests  • Business Logic     • WebAppFactory
│                                                          │
│  Tools: xUnit, FluentAssertions, FsCheck, Moq, SpecFlow │
└──────────────────────────────────────────────────────────┘

┌─────────────────── FRONTEND (Angular 19) ───────────────┐
│                                                          │
│  Unit Tests        Component Tests      E2E Tests        │
│  ──────────        ───────────────      ─────────        │
│  • Services        • Angular Comps      • User Flows     │
│  • Utilities       • Form Validation    • Authentication │
│  • Validators      • Event Handlers     • Booking Flow   │
│                                                          │
│  Tools: Jasmine, Karma, Playwright                       │
└──────────────────────────────────────────────────────────┘
```

---

## 🎯 Coverage Targets

| Project | Target | Enforced |
|---------|--------|----------|
| HotelBooking.Domain | 80% | Yes |
| HotelBooking.Application | 80% | Yes |
| HotelBooking.API | 75% | Yes |
| Angular Components | 70% | Yes |
| Angular Services | 80% | Yes |

---

## Manual Commands

### Backend
```bash
cd src
dotnet test HotelBooking.Domain.Tests --collect:"XPlat Code Coverage"
dotnet test HotelBooking.Application.Tests --collect:"XPlat Code Coverage"
dotnet test HotelBooking.Tests --collect:"XPlat Code Coverage"
```

### Frontend
```bash
cd client
npm test -- --code-coverage
npx playwright test
```

---

## CI/CD Integration

For GitHub Actions / Azure DevOps:
```bash
run-ci-tests.cmd
```

This runs all tests in headless mode with coverage reporting suitable for CI pipelines.
