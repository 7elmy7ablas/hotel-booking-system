@echo off
REM Run API Integration Tests

echo ========================================
echo Running API Integration Tests
echo ========================================

dotnet test src\HotelBooking.Tests\HotelBooking.Tests.csproj ^
    --logger "console;verbosity=detailed"

if %errorlevel% neq 0 (
    echo API tests failed!
    exit /b %errorlevel%
)

echo.
echo API tests passed successfully!
exit /b 0
