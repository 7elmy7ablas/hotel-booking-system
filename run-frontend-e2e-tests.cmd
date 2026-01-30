@echo off
REM Frontend E2E Test Execution

echo ========================================
echo Running Frontend E2E Tests (Playwright)
echo ========================================

cd client

REM Make sure the app is built
echo Building Angular application...
call npm run build

if %errorlevel% neq 0 (
    echo Build failed!
    cd ..
    exit /b %errorlevel%
)

REM Run Playwright tests
echo.
echo Running E2E tests...
call npm run e2e

if %errorlevel% neq 0 (
    echo E2E tests failed!
    echo Opening test report...
    call npm run e2e:report
    cd ..
    exit /b %errorlevel%
)

cd ..

echo.
echo ========================================
echo E2E Tests Completed Successfully
echo ========================================
echo Report: client\playwright-report\index.html
echo.

exit /b 0
