@echo off
REM Run Application Layer Tests

echo ========================================
echo Running Application Layer Unit Tests
echo ========================================

dotnet test src\HotelBooking.Application.Tests\HotelBooking.Application.Tests.csproj ^
    --logger "console;verbosity=detailed"

if %errorlevel% neq 0 (
    echo Application tests failed!
    exit /b %errorlevel%
)

echo.
echo Application tests passed successfully!
exit /b 0
