@echo off
REM Install Global Testing Tools for Hotel Booking System

echo ========================================
echo Installing Global Testing Tools
echo ========================================

REM Install .NET Report Generator Global Tool
echo.
echo Installing dotnet-reportgenerator-globaltool...
dotnet tool install --global dotnet-reportgenerator-globaltool

if %errorlevel% neq 0 (
    echo dotnet-reportgenerator-globaltool may already be installed, updating...
    dotnet tool update --global dotnet-reportgenerator-globaltool
)

REM Install .NET Coverage Tool
echo.
echo Installing dotnet-coverage...
dotnet tool install --global dotnet-coverage

if %errorlevel% neq 0 (
    echo dotnet-coverage may already be installed, updating...
    dotnet tool update --global dotnet-coverage
)

REM Install .NET Stryker Mutation Testing
echo.
echo Installing dotnet-stryker (mutation testing)...
dotnet tool install --global dotnet-stryker

if %errorlevel% neq 0 (
    echo dotnet-stryker may already be installed, updating...
    dotnet tool update --global dotnet-stryker
)

echo.
echo ========================================
echo Installing Playwright for Frontend E2E
echo ========================================

cd client

REM Install Playwright browsers
echo Installing Playwright browsers...
call npx playwright install

if %errorlevel% neq 0 (
    echo Failed to install Playwright browsers!
    cd ..
    exit /b %errorlevel%
)

echo Installing Playwright system dependencies...
call npx playwright install-deps

cd ..

echo.
echo ========================================
echo Global Tools Installed Successfully
echo ========================================
echo.
echo Installed tools:
echo - dotnet-reportgenerator-globaltool (Code coverage reports)
echo - dotnet-coverage (Code coverage collection)
echo - dotnet-stryker (Mutation testing)
echo - Playwright browsers (E2E testing)
echo.
echo Verifying installations...
dotnet tool list --global

echo.
echo Setup complete!
exit /b 0
