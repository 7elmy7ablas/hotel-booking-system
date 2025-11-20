@echo off
REM Generate comprehensive test report with coverage statistics

echo ========================================
echo   GENERATING TEST REPORT
echo ========================================
echo.

REM Check if test results exist
if not exist "test-results" (
    echo ERROR: No test results found!
    echo Please run: run-all-tests.cmd
    exit /b 1
)

echo [1/3] Analyzing Backend Coverage...
echo ----------------------------------------

REM Check for backend coverage
if exist "test-results\coverage\backend-coverage.xml" (
    echo Backend Coverage Report: test-results\coverage\backend-coverage.xml
    echo.
    REM Parse coverage if reportgenerator is installed
    where reportgenerator >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        reportgenerator ^
          -reports:test-results\coverage\backend-coverage.xml ^
          -targetdir:test-results\coverage\backend-html ^
          -reporttypes:Html
        echo HTML Report: test-results\coverage\backend-html\index.html
    ) else (
        echo Note: Install ReportGenerator for HTML reports
        echo   dotnet tool install -g dotnet-reportgenerator-globaltool
    )
) else (
    echo WARNING: Backend coverage not found
)

echo.
echo [2/3] Analyzing Frontend Coverage...
echo ----------------------------------------

if exist "test-results\coverage\frontend-coverage\index.html" (
    echo Frontend Coverage Report: test-results\coverage\frontend-coverage\index.html
    
    REM Extract coverage percentages from lcov-report
    if exist "test-results\coverage\frontend-coverage\lcov-report\index.html" (
        echo.
        echo Opening coverage report...
        start test-results\coverage\frontend-coverage\index.html
    )
) else (
    echo WARNING: Frontend coverage not found
)

echo.
echo [3/3] Generating Summary Report...
echo ----------------------------------------

REM Create summary report
echo Generating TEST_SUMMARY.md...

(
echo # Test Summary Report
echo.
echo **Generated:** %date% %time%
echo.
echo ## Test Execution Results
echo.
echo ### Backend Tests
echo.
if exist "test-results\backend-tests.trx" (
    echo - Unit Tests: COMPLETED
) else (
    echo - Unit Tests: NOT RUN
)
echo.
if exist "test-results\integration-tests.trx" (
    echo - Integration Tests: COMPLETED
) else (
    echo - Integration Tests: NOT RUN
)
echo.
if exist "test-results\property-tests.trx" (
    echo - Property-Based Tests: COMPLETED
) else (
    echo - Property-Based Tests: NOT RUN
)
echo.
if exist "test-results\security-tests.trx" (
    echo - Security Tests: COMPLETED
) else (
    echo - Security Tests: NOT RUN
)
echo.
echo ### Frontend Tests
echo.
if exist "test-results\coverage\frontend-coverage" (
    echo - Unit Tests: COMPLETED
    echo - Coverage Report: Available
) else (
    echo - Unit Tests: NOT RUN
)
echo.
echo ## Coverage Reports
echo.
echo ### Backend Coverage
echo.
if exist "test-results\coverage\backend-coverage.xml" (
    echo - Format: Cobertura XML
    echo - Location: `test-results/coverage/backend-coverage.xml`
    if exist "test-results\coverage\backend-html\index.html" (
        echo - HTML Report: `test-results/coverage/backend-html/index.html`
    )
) else (
    echo - Status: Not Available
)
echo.
echo ### Frontend Coverage
echo.
if exist "test-results\coverage\frontend-coverage\index.html" (
    echo - Format: HTML + LCOV
    echo - Location: `test-results/coverage/frontend-coverage/index.html`
    echo - Target: 80%% statements, 75%% branches, 80%% functions, 80%% lines
) else (
    echo - Status: Not Available
)
echo.
echo ## Test Artifacts
echo.
echo All test results and coverage reports are located in:
echo.
echo ```
echo test-results/
echo ├── backend-tests.trx
echo ├── integration-tests.trx
echo ├── property-tests.trx
echo ├── security-tests.trx
echo └── coverage/
echo     ├── backend-coverage.xml
echo     ├── backend-html/
echo     └── frontend-coverage/
echo ```
echo.
echo ## Next Steps
echo.
echo 1. Review coverage reports to identify untested code
echo 2. Add tests for any critical paths below 80%% coverage
echo 3. Run E2E tests: `npm run e2e` ^(if configured^)
echo 4. Run performance tests: `performance-test.cmd`
echo 5. Run accessibility audit: `verify-accessibility-fixes.cmd`
echo 6. Run security audit: `verify-security-fixes.cmd`
echo.
echo ## Commands
echo.
echo - Run all tests: `run-all-tests.cmd`
echo - Frontend tests only: `cd client ^&^& npm test`
echo - Backend tests only: `cd src ^&^& dotnet test`
echo - Generate report: `generate-test-report.cmd`
echo.
) > test-results\TEST_SUMMARY.md

echo.
echo ========================================
echo   REPORT GENERATED
echo ========================================
echo.
echo   Summary: test-results\TEST_SUMMARY.md
echo.
if exist "test-results\coverage\backend-html\index.html" (
    echo   Backend Coverage: test-results\coverage\backend-html\index.html
)
if exist "test-results\coverage\frontend-coverage\index.html" (
    echo   Frontend Coverage: test-results\coverage\frontend-coverage\index.html
)
echo.
echo ========================================

REM Open summary in default editor
start test-results\TEST_SUMMARY.md

pause
