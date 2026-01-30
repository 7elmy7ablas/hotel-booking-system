@echo off
REM Run SpecFlow BDD Tests

echo ========================================
echo Running SpecFlow BDD Scenarios
echo ========================================

dotnet test src\HotelBooking.Tests\HotelBooking.Tests.csproj ^
    --filter "Category=BDD" ^
    --logger "console;verbosity=detailed"

if %errorlevel% neq 0 (
    echo SpecFlow tests failed!
    exit /b %errorlevel%
)

echo.
echo SpecFlow tests passed successfully!
exit /b 0
