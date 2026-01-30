@echo off
REM Run Domain Layer Tests

echo ========================================
echo Running Domain Layer Unit Tests
echo ========================================

dotnet test src\HotelBooking.Domain.Tests\HotelBooking.Domain.Tests.csproj ^
    --logger "console;verbosity=detailed"

if %errorlevel% neq 0 (
    echo Domain tests failed!
    exit /b %errorlevel%
)

echo.
echo Domain tests passed successfully!
exit /b 0
