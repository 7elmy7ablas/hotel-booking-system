# Comprehensive Testing Guide - Hotel Booking System

## Overview
Complete testing strategy covering unit tests, integration tests, property-based tests, E2E tests, accessibility testing, and performance load testing.

---

## 📋 Testing Coverage Summary

### Current Status
- **Backend Tests:** Property-based tests implemented (BookingOverlapTests)
- **Frontend Tests:** Jasmine/Karma configured, tests needed
- **Integration Tests:** Need implementation
- **E2E Tests:** Need implementation
- **A11y Tests:** Need implementation
- **Load Tests:** Need implementation

### Target Coverage
- **Unit Tests:** 80% minimum
- **Integration Tests:** All API endpoints
- **Property-Based Tests:** All critical business logic
- **E2E Tests:** All major user flows
- **A11y Tests:** WCAG 2.1 AA compliance
- **Load Tests:** 100 concurrent users

---

## 🧪 1. Unit Tests (Frontend)

### Setup
```bash
cd client
npm install --save-dev @angular/core @angular/common @angular/platform-browser-dynamic
npm install --save-dev jasmine-core karma karma-jasmine karma-chrome-launcher
npm install --save-dev karma-coverage karma-jasmine-html-reporter
```

### Run Tests
```bash
# Run all tests
npm test

# Run with coverage
ng test --code-coverage

# Run in headless mode (CI)
ng test --browsers=ChromeHeadless --watch=false --code-coverage

# View coverage report
open coverage/index.html
```

### Coverage Thresholds (karma.conf.js)
```javascript
coverageReporter: {
  check: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80
    }
  }
}
```

---

## 🔧 2. Integration Tests (Backend)

### Setup
```bash
cd src/HotelBooking.Tests
dotnet add package Microsoft.AspNetCore.Mvc.Testing
dotnet add package FluentAssertions
dotnet add package Moq
```

### Run Tests
```bash
# Run all tests
dotnet test

# Run with coverage
dotnet test /p:CollectCoverage=true /p:CoverageReportFormat=opencover

# Generate HTML report
dotnet tool install -g dotnet-reportgenerator-globaltool
reportgenerator -reports:coverage.opencover.xml -targetdir:coverage -reporttypes:Html

# View report
start coverage/index.html
```

---

## 🎲 3. Property-Based Tests

### Existing Tests
- `BookingOverlapTests.cs` - Booking overlap validation

### Run Property Tests
```bash
cd src/HotelBooking.Tests
dotnet test --filter "Category=PropertyBased"
```

---

## 🌐 4. E2E Tests

### Setup (Playwright)
```bash
cd client
npm install --save-dev @playwright/test
npx playwright install
```

### Run E2E Tests
```bash
# Run all E2E tests
npx playwright test

# Run with UI
npx playwright test --ui

# Run specific test
npx playwright test tests/booking-flow.spec.ts

# Generate report
npx playwright show-report
```

---

## ♿ 5. Accessibility Tests

### Setup (axe-core)
```bash
cd client
npm install --save-dev @axe-core/cli axe-core
```

### Run A11y Tests
```bash
# Test running application
npx axe http://localhost:4200 --tags wcag2a,wcag2aa

# Test specific page
npx axe http://localhost:4200/hotels --save accessibility-report.json

# Generate HTML report
npx axe http://localhost:4200 --save report.html
```

---

## 📊 6. Performance Load Tests

### Setup (k6)
```bash
# Install k6
# Windows: choco install k6
# Mac: brew install k6
# Linux: sudo apt-get install k6
```

### Run Load Tests
```bash
# Run load test
k6 run tests/load/booking-load-test.js

# Run with custom VUs
k6 run --vus 100 --duration 30s tests/load/booking-load-test.js

# Generate HTML report
k6 run --out json=results.json tests/load/booking-load-test.js
```

---

See TESTING_COMMANDS.md for detailed commands and TESTING_IMPLEMENTATION.md for test code examples.
