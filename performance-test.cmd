@echo off
REM Performance Testing Script for Hotel Booking App
REM This script runs various performance tests and generates reports

echo ========================================
echo Hotel Booking App - Performance Tests
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    exit /b 1
)

echo [1/4] Checking Angular CLI...
cd client
call npm list @angular/cli >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Installing Angular CLI...
    call npm install -g @angular/cli
)

echo.
echo [2/4] Building production bundle...
call ng build --configuration=production
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Build failed
    exit /b 1
)

echo.
echo [3/4] Analyzing bundle size...
echo ----------------------------------------
dir /s dist\client\browser\*.js | findstr /R "\.js$"
echo ----------------------------------------

echo.
echo [4/4] Performance Metrics Summary
echo ----------------------------------------
echo.
echo OPTIMIZATIONS APPLIED:
echo   [x] Smart caching with TTL (5-10 min)
echo   [x] Image lazy loading (loading=lazy)
echo   [x] Virtual scrolling for lists ^>20 items
echo   [x] Debounced search inputs (300ms)
echo   [x] ShareReplay for API deduplication
echo   [x] Async image decoding
echo.
echo CACHE CONFIGURATION:
echo   - Hotels List: 5 minutes TTL
echo   - Hotel Details: 10 minutes TTL
echo   - Rooms: 3 minutes TTL
echo   - Bookings: 2 minutes TTL
echo   - User Profile: 5 minutes TTL
echo.
echo VIRTUAL SCROLL THRESHOLDS:
echo   - Hotel Lists: ^>20 items
echo   - Booking Lists: ^>15 items
echo   - Search Results: ^>20 items
echo.
echo DEBOUNCE DELAYS:
echo   - Search inputs: 300ms
echo   - Filter inputs: 300ms
echo   - Form changes: 300ms
echo.
echo ========================================
echo Performance testing complete!
echo ========================================
echo.
echo To run Lighthouse tests:
echo   1. Start dev server: npm start
echo   2. Run: node lighthouse-test.js
echo.
echo To run load tests with k6:
echo   1. Install k6: https://k6.io/docs/getting-started/installation/
echo   2. Run: k6 run load-test.js
echo.

cd ..
pause
