@echo off
REM CI/CD Test Runner - Headless mode for automated environments

echo ========================================
echo Running Tests in CI Mode
echo ========================================

REM Run backend tests with coverage
echo Running backend tests...
dotnet test src\HotelBooking.sln ^
    /p:CollectCoverage=true ^
    /p:CoverletOutputFormat=cobertura ^
    /p:CoverletOutput=..\TestResults\coverage.cobertura.xml ^
    --logger "trx;LogFileName=test-results.trx" ^
    --logger "console;verbosity=minimal" ^
    --no-build

if %errorlevel% neq 0 (
    echo Backend tests failed!
    exit /b %errorlevel%
)

REM Run frontend tests in CI mode
echo.
echo Running frontend tests in CI mode...
cd client
call npm run test:ci

if %errorlevel% neq 0 (
    echo Frontend tests failed!
    cd ..
    exit /b %errorlevel%
)

cd ..

echo.
echo ========================================
echo CI Tests Completed Successfully
echo ========================================

exit /b 0
