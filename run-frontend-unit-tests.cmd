@echo off
REM Frontend Test Execution Scripts

echo ========================================
echo Running Frontend Unit Tests (Jasmine/Karma)
echo ========================================

cd client

REM Run tests with coverage
call npm run test:coverage

if %errorlevel% neq 0 (
    echo Frontend unit tests failed!
    cd ..
    exit /b %errorlevel%
)

cd ..

echo.
echo ========================================
echo Frontend Unit Tests Completed
echo ========================================
echo Coverage report: client\coverage\index.html
echo.

exit /b 0
