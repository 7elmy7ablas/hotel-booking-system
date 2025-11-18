@echo off
echo Creating database migration...
cd HotelBooking.Infrastructure
dotnet ef migrations add InitialCreate --startup-project ../HotelBooking.API
echo.
echo Migration created successfully!
echo.
echo To apply the migration, run: update-database.cmd
pause
