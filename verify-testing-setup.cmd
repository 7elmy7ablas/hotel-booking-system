@echo off
REM Verify Testing Infrastructure Setup

echo ========================================
echo Testing Infrastructure Verification
echo ========================================
echo.

set "ERRORS=0"

REM Check .NET SDK
echo [1/10] Checking .NET SDK...
dotnet --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] .NET SDK not found! Please install .NET 10 SDK
    set "ERRORS=1"
) else (
    echo [OK] .NET SDK found
)

REM Check Node.js
echo [2/10] Checking Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found! Please install Node.js
    set "ERRORS=1"
) else (
    echo [OK] Node.js found
)

REM Check npm
echo [3/10] Checking npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm not found!
    set "ERRORS=1"
) else (
    echo [OK] npm found
)

REM Check if backend projects exist
echo [4/10] Checking backend test projects...
if exist "src\HotelBooking.Domain.Tests\HotelBooking.Domain.Tests.csproj" (
    echo [OK] Domain.Tests project found
) else (
    echo [ERROR] Domain.Tests project not found!
    set "ERRORS=1"
)

if exist "src\HotelBooking.Application.Tests\HotelBooking.Application.Tests.csproj" (
    echo [OK] Application.Tests project found
) else (
    echo [ERROR] Application.Tests project not found!
    set "ERRORS=1"
)

if exist "src\HotelBooking.Tests\HotelBooking.Tests.csproj" (
    echo [OK] API Tests project found
) else (
    echo [ERROR] API Tests project not found!
    set "ERRORS=1"
)

REM Check SpecFlow files
echo [5/10] Checking SpecFlow configuration...
if exist "src\HotelBooking.Tests\Features\HotelBooking.feature" (
    echo [OK] SpecFlow feature files found
) else (
    echo [WARN] SpecFlow feature files not found
)

REM Check Playwright configuration
echo [6/10] Checking Playwright configuration...
if exist "client\playwright.config.ts" (
    echo [OK] Playwright configuration found
) else (
    echo [ERROR] Playwright configuration not found!
    set "ERRORS=1"
)

REM Check frontend E2E tests
echo [7/10] Checking E2E test files...
if exist "client\e2e\hotel-booking.spec.ts" (
    echo [OK] E2E test files found
) else (
    echo [ERROR] E2E test files not found!
    set "ERRORS=1"
)

REM Check test scripts
echo [8/10] Checking test execution scripts...
if exist "run-complete-test-suite.cmd" (
    echo [OK] Test scripts found
) else (
    echo [ERROR] Test scripts not found!
    set "ERRORS=1"
)

REM Try to build backend solution
echo [9/10] Verifying backend solution builds...
cd src
dotnet build HotelBooking.sln --no-restore --verbosity quiet >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARN] Backend solution build has warnings/errors
    echo       Run 'dotnet build src\HotelBooking.sln' for details
) else (
    echo [OK] Backend solution builds successfully
)
cd ..

REM Check if frontend dependencies are installed
echo [10/10] Checking frontend dependencies...
if exist "client\node_modules" (
    echo [OK] Frontend dependencies installed
) else (
    echo [WARN] Frontend dependencies not installed
    echo       Run 'cd client && npm install' to install
)

echo.
echo ========================================
echo Verification Summary
echo ========================================
echo.

if "%ERRORS%"=="1" (
    echo Status: FAILED
    echo Some components are missing or misconfigured.
    echo Please review the errors above and fix them.
    echo.
    echo Quick fixes:
    echo 1. Install .NET 10 SDK from https://dotnet.microsoft.com/download
    echo 2. Install Node.js from https://nodejs.org/
    echo 3. Run 'cd client && npm install'
    echo 4. Run 'dotnet restore src\HotelBooking.sln'
    exit /b 1
) else (
    echo Status: PASSED
    echo.
    echo Testing infrastructure is properly installed!
    echo.
    echo Next steps:
    echo 1. Install global tools: install-testing-tools.cmd
    echo 2. Run tests: run-complete-test-suite.cmd
    echo 3. View documentation: TESTING_INFRASTRUCTURE.md
    echo.
    exit /b 0
)
