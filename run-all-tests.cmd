@echo off
REM Comprehensive Test Suite Runner for Hotel Booking App
REM Runs all frontend and backend tests with coverage reports

echo ========================================
echo   HOTEL BOOKING APP - TEST SUITE
echo ========================================
echo.

set TOTAL_TESTS=0
set PASSED_TESTS=0
set FAILED_TESTS=0

REM Create test results directory
if not exist "test-results" mkdir test-results
if not exist "test-results\coverage" mkdir test-results\coverage

echo [1/6] Running Backend Unit Tests...
echo ----------------------------------------
cd src
dotnet test HotelBooking.Tests/HotelBooking.Tests.csproj ^
  --configuration Release ^
  --logger "trx;LogFileName=backend-tests.trx" ^
  --results-directory ../test-results ^
  /p:CollectCoverage=true ^
  /p:CoverletOutputFormat=cobertura ^
  /p:CoverletOutput=../test-results/coverage/backend-coverage.xml

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Backend tests passed
    set /a PASSED_TESTS+=1
) else (
    echo [FAILED] Backend tests failed
    set /a FAILED_TESTS+=1
)
cd ..

echo.
echo [2/6] Running Frontend Unit Tests...
echo ----------------------------------------
cd client
call ng test --no-watch --code-coverage --browsers=ChromeHeadless

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Frontend tests passed
    set /a PASSED_TESTS+=1
) else (
    echo [FAILED] Frontend tests failed
    set /a FAILED_TESTS+=1
)

REM Copy coverage report
if exist "coverage" (
    xcopy /E /I /Y coverage ..\test-results\coverage\frontend-coverage
)
cd ..

echo.
echo [3/6] Running Integration Tests...
echo ----------------------------------------
cd src
dotnet test HotelBooking.Tests/HotelBooking.Tests.csproj ^
  --filter "FullyQualifiedName~Integration" ^
  --logger "trx;LogFileName=integration-tests.trx" ^
  --results-directory ../test-results

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Integration tests passed
    set /a PASSED_TESTS+=1
) else (
    echo [FAILED] Integration tests failed
    set /a FAILED_TESTS+=1
)
cd ..

echo.
echo [4/6] Running Property-Based Tests...
echo ----------------------------------------
cd src
dotnet test HotelBooking.Tests/HotelBooking.Tests.csproj ^
  --filter "FullyQualifiedName~Property" ^
  --logger "trx;LogFileName=property-tests.trx" ^
  --results-directory ../test-results

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Property-based tests passed
    set /a PASSED_TESTS+=1
) else (
    echo [FAILED] Property-based tests failed
    set /a FAILED_TESTS+=1
)
cd ..

echo.
echo [5/6] Running Security Tests...
echo ----------------------------------------
cd src
dotnet test HotelBooking.Tests/HotelBooking.Tests.csproj ^
  --filter "FullyQualifiedName~Security" ^
  --logger "trx;LogFileName=security-tests.trx" ^
  --results-directory ../test-results

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Security tests passed
    set /a PASSED_TESTS+=1
) else (
    echo [FAILED] Security tests failed
    set /a FAILED_TESTS+=1
)
cd ..

echo.
echo [6/6] Running Accessibility Tests...
echo ----------------------------------------
cd client
call ng test --no-watch --include="**/*.accessibility.spec.ts" --browsers=ChromeHeadless

if %ERRORLEVEL% EQU 0 (
    echo [SUCCESS] Accessibility tests passed
    set /a PASSED_TESTS+=1
) else (
    echo [FAILED] Accessibility tests failed
    set /a FAILED_TESTS+=1
)
cd ..

echo.
echo ========================================
echo   TEST RESULTS SUMMARY
echo ========================================
echo.
echo   Total Test Suites: 6
echo   Passed: %PASSED_TESTS%
echo   Failed: %FAILED_TESTS%
echo.
echo ========================================
echo   COVERAGE REPORTS
echo ========================================
echo.
echo   Backend Coverage:  test-results\coverage\backend-coverage.xml
echo   Frontend Coverage: test-results\coverage\frontend-coverage
echo.
echo   To view frontend coverage:
echo   cd test-results\coverage\frontend-coverage
echo   start index.html
echo.
echo ========================================
echo   TEST ARTIFACTS
echo ========================================
echo.
echo   Test Results: test-results\
echo   - backend-tests.trx
echo   - integration-tests.trx
echo   - property-tests.trx
echo   - security-tests.trx
echo.
echo ========================================

if %FAILED_TESTS% GTR 0 (
    echo.
    echo [WARNING] Some tests failed!
    echo Please review the test results above.
    exit /b 1
) else (
    echo.
    echo [SUCCESS] All tests passed!
    exit /b 0
)
