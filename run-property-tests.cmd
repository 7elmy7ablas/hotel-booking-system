@echo off
REM Run Property-Based Tests

echo ========================================
echo Running Property-Based Tests (FsCheck)
echo ========================================

dotnet test src\HotelBooking.Domain.Tests\HotelBooking.Domain.Tests.csproj ^
    --filter "FullyQualifiedName~PropertyTests" ^
    --logger "console;verbosity=detailed"

if %errorlevel% neq 0 (
    echo Property-based tests failed!
    exit /b %errorlevel%
)

echo.
echo Property-based tests passed successfully!
exit /b 0
