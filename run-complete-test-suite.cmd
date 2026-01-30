@echo off
REM Run All Backend and Frontend Tests

echo ========================================
echo Running Complete Test Suite
echo ========================================
echo.

REM Set error flag
set "TEST_FAILED=0"

REM 1. Run Backend Unit Tests
echo [1/6] Running Domain Layer Tests...
call run-domain-tests.cmd
if %errorlevel% neq 0 set "TEST_FAILED=1"

echo.
echo [2/6] Running Application Layer Tests...
call run-application-tests.cmd
if %errorlevel% neq 0 set "TEST_FAILED=1"

echo.
echo [3/6] Running API Integration Tests...
call run-api-tests.cmd
if %errorlevel% neq 0 set "TEST_FAILED=1"

echo.
echo [4/6] Running Property-Based Tests...
call run-property-tests.cmd
if %errorlevel% neq 0 set "TEST_FAILED=1"

echo.
echo [5/6] Running Frontend Unit Tests...
call run-frontend-unit-tests.cmd
if %errorlevel% neq 0 set "TEST_FAILED=1"

echo.
echo [6/6] Running Frontend E2E Tests...
call run-frontend-e2e-tests.cmd
if %errorlevel% neq 0 set "TEST_FAILED=1"

echo.
echo ========================================
echo Generating Coverage Reports
echo ========================================

call run-backend-tests-with-coverage.cmd

echo.
echo ========================================
echo Test Suite Execution Summary
echo ========================================
echo.

if "%TEST_FAILED%"=="1" (
    echo Status: FAILED - Some tests did not pass
    echo Please review the output above for details
    exit /b 1
) else (
    echo Status: PASSED - All tests completed successfully
    echo.
    echo Backend Coverage: See coverage-report\index.html
    echo Frontend Coverage: See client\coverage\index.html
    echo E2E Report: See client\playwright-report\index.html
    exit /b 0
)
