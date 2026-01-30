@echo off
REM Run Mutation Testing with Stryker.NET

echo ========================================
echo Running Mutation Testing
echo ========================================
echo.
echo Mutation testing helps identify weaknesses in your test suite
echo by introducing small changes (mutations) to your code and
echo checking if your tests catch them.
echo.

cd src

REM Run Stryker on Domain layer
echo Running mutation tests on Domain layer...
dotnet stryker ^
    --project HotelBooking.Domain\HotelBooking.Domain.csproj ^
    --test-project HotelBooking.Domain.Tests\HotelBooking.Domain.Tests.csproj ^
    --reporter "html" ^
    --reporter "progress"

if %errorlevel% neq 0 (
    echo Mutation testing failed!
    cd ..
    exit /b %errorlevel%
)

cd ..

echo.
echo ========================================
echo Mutation Testing Completed
echo ========================================
echo Report: src\StrykerOutput\reports\mutation-report.html
echo.

exit /b 0
