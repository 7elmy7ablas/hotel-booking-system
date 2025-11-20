# Testing Commands Reference

## Frontend Unit Tests (Angular/Jasmine)

### Basic Commands
```bash
cd client

# Run tests once
npm test -- --watch=false

# Run with coverage
npm test -- --code-coverage --watch=false

# Run specific test file
npm test -- --include='**/auth.service.spec.ts'

# Run in headless mode (CI)
npm test -- --browsers=ChromeHeadless --watch=false

# Watch mode (development)
npm test
```

### Coverage Commands
```bash
# Generate coverage report
ng test --code-coverage --watch=false

# View coverage in browser
start coverage/index.html  # Windows
open coverage/index.html   # Mac
xdg-open coverage/index.html  # Linux

# Check coverage thresholds
ng test --code-coverage --watch=false --code-coverage-exclude='**/*.spec.ts'
```

---

## Backend Integration Tests (.NET)

### Basic Commands
```bash
cd src/HotelBooking.Tests

# Run all tests
dotnet test

# Run with detailed output
dotnet test --logger "console;verbosity=detailed"

# Run specific test
dotnet test --filter "FullyQualifiedName~BookingOverlapTests"

# Run by category
dotnet test --filter "Category=Integration"
```

### Coverage Commands
```bash
# Install coverage tool
dotnet tool install -g dotnet-coverage

# Run with coverage
dotnet test /p:CollectCoverage=true

# Generate OpenCover format
dotnet test /p:CollectCoverage=true /p:CoverageReportFormat=opencover

# Generate HTML report
dotnet tool install -g dotnet-reportgenerator-globaltool
reportgenerator -reports:coverage.opencover.xml -targetdir:coverage

# View report
start coverage/index.html
```

---

## Property-Based Tests (FsCheck)

### Commands
```bash
cd src/HotelBooking.Tests

# Run all property tests
dotnet test --filter "Category=PropertyBased"

# Run specific property test
dotnet test --filter "FullyQualifiedName~BookingOverlapTests"

# Run with verbose output
dotnet test --filter "Category=PropertyBased" --logger "console;verbosity=detailed"
```

---

## E2E Tests (Playwright)

### Setup
```bash
cd client
npm install --save-dev @playwright/test
npx playwright install
```

### Commands
```bash
# Run all E2E tests
npx playwright test

# Run with UI mode
npx playwright test --ui

# Run specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run specific test file
npx playwright test tests/e2e/booking-flow.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Debug mode
npx playwright test --debug

# Generate report
npx playwright show-report

# Update snapshots
npx playwright test --update-snapshots
```

---

## Accessibility Tests (axe-core)

### Setup
```bash
cd client
npm install --save-dev @axe-core/cli
```

### Commands
```bash
# Test entire application
npx axe http://localhost:4200

# Test with specific tags
npx axe http://localhost:4200 --tags wcag2a,wcag2aa

# Test specific page
npx axe http://localhost:4200/hotels

# Save results to file
npx axe http://localhost:4200 --save accessibility-report.json

# Test multiple URLs
npx axe http://localhost:4200 http://localhost:4200/hotels http://localhost:4200/login

# Exclude specific rules
npx axe http://localhost:4200 --disable color-contrast

# Set timeout
npx axe http://localhost:4200 --timeout 120000
```

---

## Performance Load Tests (k6)

### Setup
```bash
# Windows (Chocolatey)
choco install k6

# Mac (Homebrew)
brew install k6

# Linux (Debian/Ubuntu)
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### Commands
```bash
# Run load test
k6 run tests/load/api-load-test.js

# Run with custom VUs and duration
k6 run --vus 10 --duration 30s tests/load/api-load-test.js

# Run with stages (ramp up/down)
k6 run --stage 5s:10,10s:20,5s:0 tests/load/api-load-test.js

# Save results to JSON
k6 run --out json=results.json tests/load/api-load-test.js

# Run with environment variables
k6 run -e API_URL=https://api.example.com tests/load/api-load-test.js

# Run with thresholds
k6 run --threshold http_req_duration=p(95)<500 tests/load/api-load-test.js
```

---

## CI/CD Pipeline Commands

### GitHub Actions / Azure DevOps
```yaml
# Frontend tests
- run: cd client && npm test -- --watch=false --code-coverage --browsers=ChromeHeadless

# Backend tests
- run: cd src && dotnet test /p:CollectCoverage=true

# E2E tests
- run: cd client && npx playwright test --project=chromium

# Accessibility tests
- run: npx axe http://localhost:4200 --tags wcag2a,wcag2aa

# Load tests
- run: k6 run --vus 50 --duration 60s tests/load/api-load-test.js
```

---

## Coverage Report Locations

### Frontend
- **HTML Report:** `client/coverage/index.html`
- **LCOV:** `client/coverage/lcov.info`
- **JSON:** `client/coverage/coverage-final.json`

### Backend
- **HTML Report:** `src/HotelBooking.Tests/coverage/index.html`
- **OpenCover:** `src/HotelBooking.Tests/coverage.opencover.xml`
- **Cobertura:** `src/HotelBooking.Tests/coverage.cobertura.xml`

### E2E
- **HTML Report:** `client/playwright-report/index.html`
- **JSON:** `client/test-results/results.json`

### Accessibility
- **JSON Report:** `accessibility-report.json`
- **HTML Report:** `accessibility-report.html`

### Load Tests
- **JSON Results:** `results.json`
- **Summary:** Console output
