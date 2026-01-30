@echo off
REM Backend Test Coverage Report Generation Script

echo ========================================
echo Running .NET Tests with Coverage
echo ========================================

REM Clean previous coverage results
if exist "TestResults" rd /s /q TestResults
if exist "coverage-report" rd /s /q coverage-report

REM Run all tests with coverage
dotnet test src\HotelBooking.sln ^
    /p:CollectCoverage=true ^
    /p:CoverletOutputFormat=cobertura ^
    /p:CoverletOutput=..\TestResults\coverage.cobertura.xml ^
    /p:Threshold=80 ^
    /p:ThresholdType=line ^
    --logger "trx;LogFileName=test-results.trx" ^
    --logger "console;verbosity=detailed"

if %errorlevel% neq 0 (
    echo Tests failed!
    exit /b %errorlevel%
)

echo.
echo ========================================
echo Generating HTML Coverage Report
echo ========================================

REM Generate HTML report using ReportGenerator
dotnet reportgenerator ^
    -reports:TestResults\coverage.cobertura.xml ^
    -targetdir:coverage-report ^
    -reporttypes:Html;HtmlSummary;Badges;TextSummary

if %errorlevel% neq 0 (
    echo Failed to generate coverage report!
    exit /b %errorlevel%
)

echo.
echo ========================================
echo Coverage Report Generated Successfully
echo ========================================
echo.
echo Report location: coverage-report\index.html
echo.

REM Display text summary
if exist "coverage-report\Summary.txt" (
    type coverage-report\Summary.txt
)

echo.
echo Opening coverage report in browser...
start coverage-report\index.html

exit /b 0
