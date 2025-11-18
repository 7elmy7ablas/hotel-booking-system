@echo off
echo Updating database...
cd HotelBooking.Infrastructure
dotnet ef database update --startup-project ../HotelBooking.API
echo.
echo Database updated successfully!
pause
