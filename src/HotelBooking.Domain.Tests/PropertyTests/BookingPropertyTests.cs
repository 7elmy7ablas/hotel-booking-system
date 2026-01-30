using FsCheck;
using FsCheck.Xunit;
using HotelBooking.Domain.Entities;
using Xunit;

namespace HotelBooking.Domain.Tests.PropertyTests;

/// <summary>
/// Property-based tests for Booking logic using FsCheck
/// </summary>
public class BookingPropertyTests
{
    [Property(Arbitrary = new[] { typeof(BookingGenerators) })]
    public Property TotalPrice_ShouldNeverBeNegative_ForValidBookings(ValidBookingData bookingData)
    {
        var booking = new Booking
        {
            UserId = Guid.NewGuid(),
            RoomId = Guid.NewGuid(),
            CheckIn = bookingData.CheckIn,
            CheckOut = bookingData.CheckOut,
            TotalPrice = bookingData.TotalPrice,
            Status = "Pending"
        };

        return (booking.TotalPrice >= 0).ToProperty();
    }

    [Property(Arbitrary = new[] { typeof(BookingGenerators) })]
    public Property CheckOut_ShouldAlwaysBeAfter_CheckIn(ValidBookingData bookingData)
    {
        var booking = new Booking
        {
            UserId = Guid.NewGuid(),
            RoomId = Guid.NewGuid(),
            CheckIn = bookingData.CheckIn,
            CheckOut = bookingData.CheckOut,
            TotalPrice = bookingData.TotalPrice,
            Status = "Pending"
        };

        return (booking.CheckOut > booking.CheckIn).ToProperty();
    }

    [Property(Arbitrary = new[] { typeof(BookingGenerators) })]
    public Property Booking_Duration_ShouldBePositive(ValidBookingData bookingData)
    {
        var booking = new Booking
        {
            UserId = Guid.NewGuid(),
            RoomId = Guid.NewGuid(),
            CheckIn = bookingData.CheckIn,
            CheckOut = bookingData.CheckOut,
            TotalPrice = bookingData.TotalPrice,
            Status = "Pending"
        };

        var nights = (booking.CheckOut - booking.CheckIn).Days;
        return (nights > 0).ToProperty();
    }
}

/// <summary>
/// Custom generators for property-based testing
/// </summary>
public static class BookingGenerators
{
    public static Arbitrary<ValidBookingData> ValidBookingDataGenerator() =>
        Arb.From(
            from pricePerNight in Gen.Choose(50, 1000).Select(x => (decimal)x)
            from nightsCount in Gen.Choose(1, 30)
            from startDayOffset in Gen.Choose(1, 365)
            let checkIn = DateTime.Today.AddDays(startDayOffset)
            let checkOut = checkIn.AddDays(nightsCount)
            let totalPrice = pricePerNight * nightsCount
            select new ValidBookingData
            {
                CheckIn = checkIn,
                CheckOut = checkOut,
                TotalPrice = totalPrice
            }
        );
}

/// <summary>
/// Test data for valid bookings
/// </summary>
public class ValidBookingData
{
    public DateTime CheckIn { get; set; }
    public DateTime CheckOut { get; set; }
    public decimal TotalPrice { get; set; }
}
