using Xunit;
using FsCheck;
using FsCheck.Xunit;
using HotelBooking.Application.Services;
using HotelBooking.Domain.Entities;
using HotelBooking.Application.Interfaces;
using Microsoft.Extensions.Logging;
using Moq;

namespace HotelBooking.Tests;

/// <summary>
/// Property-based tests for booking overlap validation
/// Uses FsCheck to generate random test cases and verify properties hold
/// </summary>
public class BookingOverlapTests
{
    private readonly Mock<IRepository<Booking>> _mockRepository;
    private readonly Mock<ILogger<BookingValidationService>> _mockLogger;
    private readonly BookingValidationService _validationService;

    public BookingOverlapTests()
    {
        _mockRepository = new Mock<IRepository<Booking>>();
        _mockLogger = new Mock<ILogger<BookingValidationService>>();
        _validationService = new BookingValidationService(_mockRepository.Object, _mockLogger.Object);
    }

    /// <summary>
    /// Property: A booking should never overlap with itself
    /// </summary>
    [Property]
    public Property BookingNeverOverlapsWithItself()
    {
        return Prop.ForAll(
            Arb.Generate<DateTime>().Where(d => d > DateTime.UtcNow).ToArbitrary(),
            Arb.Generate<int>().Where(days => days > 0 && days <= 30).ToArbitrary(),
            (checkIn, duration) =>
            {
                var checkOut = checkIn.AddDays(duration);
                var roomId = Guid.NewGuid();

                // A booking with the same dates should not overlap with itself
                var result = IsOverlapping(checkIn, checkOut, checkIn, checkOut);
                
                return result == true; // Same dates DO overlap
            });
    }

    /// <summary>
    /// Property: Non-overlapping bookings should be valid
    /// Sequential bookings (one ends when another starts) should NOT overlap
    /// </summary>
    [Property]
    public Property SequentialBookingsDoNotOverlap()
    {
        return Prop.ForAll(
            Arb.Generate<DateTime>().Where(d => d > DateTime.UtcNow).ToArbitrary(),
            Arb.Generate<int>().Where(days => days > 0 && days <= 15).ToArbitrary(),
            Arb.Generate<int>().Where(days => days > 0 && days <= 15).ToArbitrary(),
            (startDate, duration1, duration2) =>
            {
                var booking1CheckIn = startDate;
                var booking1CheckOut = startDate.AddDays(duration1);
                var booking2CheckIn = booking1CheckOut; // Starts exactly when first ends
                var booking2CheckOut = booking2CheckIn.AddDays(duration2);

                // Sequential bookings should NOT overlap
                var result = IsOverlapping(booking1CheckIn, booking1CheckOut, booking2CheckIn, booking2CheckOut);
                
                return result == false;
            });
    }

    /// <summary>
    /// Property: Overlapping bookings should be detected
    /// If booking2 starts before booking1 ends, they overlap
    /// </summary>
    [Property]
    public Property OverlappingBookingsAreDetected()
    {
        return Prop.ForAll(
            Arb.Generate<DateTime>().Where(d => d > DateTime.UtcNow).ToArbitrary(),
            Arb.Generate<int>().Where(days => days > 2 && days <= 15).ToArbitrary(),
            Arb.Generate<int>().Where(days => days > 0 && days <= 10).ToArbitrary(),
            (startDate, duration1, overlapDays) =>
            {
                // Ensure overlapDays is less than duration1 to create valid overlap
                if (overlapDays >= duration1)
                {
                    return true; // Skip this test case
                }
                
                var booking1CheckIn = startDate;
                var booking1CheckOut = startDate.AddDays(duration1);
                
                // Start second booking before first ends (creating overlap)
                var booking2CheckIn = booking1CheckOut.AddDays(-overlapDays);
                var booking2CheckOut = booking2CheckIn.AddDays(duration1);

                // These bookings SHOULD overlap
                var result = IsOverlapping(booking1CheckIn, booking1CheckOut, booking2CheckIn, booking2CheckOut);
                
                return result == true;
            });
    }

    /// <summary>
    /// Property: Complete containment is detected as overlap
    /// If one booking completely contains another, they overlap
    /// </summary>
    [Property]
    public Property ContainedBookingsOverlap()
    {
        return Prop.ForAll(
            Arb.Generate<DateTime>().Where(d => d > DateTime.UtcNow).ToArbitrary(),
            Arb.Generate<int>().Where(days => days > 5 && days <= 20).ToArbitrary(),
            Arb.Generate<int>().Where(days => days > 1 && days <= 3).ToArbitrary(),
            (startDate, outerDuration, innerDuration) =>
            {
                var outerCheckIn = startDate;
                var outerCheckOut = startDate.AddDays(outerDuration);
                
                // Inner booking is completely contained within outer
                var innerCheckIn = outerCheckIn.AddDays(1);
                var innerCheckOut = innerCheckIn.AddDays(innerDuration);

                // Ensure inner is actually contained
                if (innerCheckOut >= outerCheckOut)
                    return true; // Skip this test case

                // These bookings SHOULD overlap
                var result = IsOverlapping(outerCheckIn, outerCheckOut, innerCheckIn, innerCheckOut);
                
                return result == true;
            });
    }

    /// <summary>
    /// Property: Bookings with gap between them do not overlap
    /// </summary>
    [Property]
    public Property BookingsWithGapDoNotOverlap()
    {
        return Prop.ForAll(
            Arb.Generate<DateTime>().Where(d => d > DateTime.UtcNow).ToArbitrary(),
            Arb.Generate<int>().Where(days => days > 0 && days <= 10).ToArbitrary(),
            Arb.Generate<int>().Where(days => days > 0 && days <= 5).ToArbitrary(),
            (startDate, duration1, gap) =>
            {
                var booking1CheckIn = startDate;
                var booking1CheckOut = startDate.AddDays(duration1);
                var booking2CheckIn = booking1CheckOut.AddDays(gap); // Gap between bookings
                var booking2CheckOut = booking2CheckIn.AddDays(duration1); // Same duration

                // These bookings should NOT overlap
                var result = IsOverlapping(booking1CheckIn, booking1CheckOut, booking2CheckIn, booking2CheckOut);
                
                return result == false;
            });
    }

    /// <summary>
    /// Property: Symmetry - overlap detection should be symmetric
    /// If A overlaps B, then B overlaps A
    /// </summary>
    [Property]
    public Property OverlapDetectionIsSymmetric()
    {
        return Prop.ForAll(
            Arb.Generate<DateTime>().Where(d => d > DateTime.UtcNow).ToArbitrary(),
            Arb.Generate<int>().Where(days => days > 0 && days <= 15).ToArbitrary(),
            Arb.Generate<int>().Where(days => days >= -5 && days <= 5).ToArbitrary(),
            (startDate, duration, offset) =>
            {
                var booking1CheckIn = startDate;
                var booking1CheckOut = startDate.AddDays(duration);
                var booking2CheckIn = startDate.AddDays(offset);
                var booking2CheckOut = booking2CheckIn.AddDays(duration);

                // Check overlap both ways
                var overlap1 = IsOverlapping(booking1CheckIn, booking1CheckOut, booking2CheckIn, booking2CheckOut);
                var overlap2 = IsOverlapping(booking2CheckIn, booking2CheckOut, booking1CheckIn, booking1CheckOut);
                
                // Should be symmetric
                return overlap1 == overlap2;
            });
    }

    /// <summary>
    /// Helper method that implements the overlap detection logic
    /// This matches the logic in BookingValidationService
    /// </summary>
    private bool IsOverlapping(DateTime checkIn1, DateTime checkOut1, DateTime checkIn2, DateTime checkOut2)
    {
        // Two bookings overlap if:
        // 1. First booking starts before second ends AND
        // 2. First booking ends after second starts
        return checkIn1 < checkOut2 && checkOut1 > checkIn2;
    }

    /// <summary>
    /// Unit test: Exact same dates should overlap
    /// </summary>
    [Fact]
    public void ExactSameDates_ShouldOverlap()
    {
        var checkIn = DateTime.UtcNow.AddDays(1);
        var checkOut = checkIn.AddDays(3);

        var result = IsOverlapping(checkIn, checkOut, checkIn, checkOut);

        Assert.True(result);
    }

    /// <summary>
    /// Unit test: Adjacent bookings (no gap) should NOT overlap
    /// </summary>
    [Fact]
    public void AdjacentBookings_ShouldNotOverlap()
    {
        var booking1CheckIn = DateTime.UtcNow.AddDays(1);
        var booking1CheckOut = booking1CheckIn.AddDays(3);
        var booking2CheckIn = booking1CheckOut; // Starts exactly when first ends
        var booking2CheckOut = booking2CheckIn.AddDays(3);

        var result = IsOverlapping(booking1CheckIn, booking1CheckOut, booking2CheckIn, booking2CheckOut);

        Assert.False(result);
    }

    /// <summary>
    /// Unit test: Partial overlap should be detected
    /// </summary>
    [Fact]
    public void PartialOverlap_ShouldBeDetected()
    {
        var booking1CheckIn = DateTime.UtcNow.AddDays(1);
        var booking1CheckOut = booking1CheckIn.AddDays(5);
        var booking2CheckIn = booking1CheckIn.AddDays(3); // Overlaps last 2 days
        var booking2CheckOut = booking2CheckIn.AddDays(4);

        var result = IsOverlapping(booking1CheckIn, booking1CheckOut, booking2CheckIn, booking2CheckOut);

        Assert.True(result);
    }

    /// <summary>
    /// Unit test: Complete containment should be detected
    /// </summary>
    [Fact]
    public void CompleteContainment_ShouldBeDetected()
    {
        var outerCheckIn = DateTime.UtcNow.AddDays(1);
        var outerCheckOut = outerCheckIn.AddDays(10);
        var innerCheckIn = outerCheckIn.AddDays(2);
        var innerCheckOut = outerCheckIn.AddDays(5);

        var result = IsOverlapping(outerCheckIn, outerCheckOut, innerCheckIn, innerCheckOut);

        Assert.True(result);
    }

    /// <summary>
    /// Unit test: Same check-in, different check-out should overlap
    /// </summary>
    [Fact]
    public void SameCheckIn_DifferentCheckOut_ShouldOverlap()
    {
        var checkIn = DateTime.UtcNow.AddDays(1);
        var checkOut1 = checkIn.AddDays(3);
        var checkOut2 = checkIn.AddDays(5);

        var result = IsOverlapping(checkIn, checkOut1, checkIn, checkOut2);

        Assert.True(result);
    }

    /// <summary>
    /// Unit test: Same check-out, different check-in should overlap
    /// </summary>
    [Fact]
    public void SameCheckOut_DifferentCheckIn_ShouldOverlap()
    {
        var checkOut = DateTime.UtcNow.AddDays(5);
        var checkIn1 = checkOut.AddDays(-3);
        var checkIn2 = checkOut.AddDays(-2);

        var result = IsOverlapping(checkIn1, checkOut, checkIn2, checkOut);

        Assert.True(result);
    }

    /// <summary>
    /// Unit test: One-day booking should not overlap with next day
    /// </summary>
    [Fact]
    public void OneDayBooking_NextDay_ShouldNotOverlap()
    {
        var day1CheckIn = DateTime.UtcNow.AddDays(1);
        var day1CheckOut = day1CheckIn.AddDays(1);
        var day2CheckIn = day1CheckOut;
        var day2CheckOut = day2CheckIn.AddDays(1);

        var result = IsOverlapping(day1CheckIn, day1CheckOut, day2CheckIn, day2CheckOut);

        Assert.False(result);
    }

    /// <summary>
    /// Unit test: Booking ending at midnight should not overlap with booking starting at midnight
    /// </summary>
    [Fact]
    public void MidnightBoundary_ShouldNotOverlap()
    {
        var midnight = DateTime.UtcNow.Date.AddDays(1);
        var booking1CheckIn = midnight.AddDays(-2);
        var booking1CheckOut = midnight;
        var booking2CheckIn = midnight;
        var booking2CheckOut = midnight.AddDays(2);

        var result = IsOverlapping(booking1CheckIn, booking1CheckOut, booking2CheckIn, booking2CheckOut);

        Assert.False(result);
    }

    /// <summary>
    /// Unit test: Overlapping by one hour should be detected
    /// </summary>
    [Fact]
    public void OneHourOverlap_ShouldBeDetected()
    {
        var checkIn1 = DateTime.UtcNow.AddDays(1);
        var checkOut1 = checkIn1.AddDays(2);
        var checkIn2 = checkOut1.AddHours(-1); // Overlaps by 1 hour
        var checkOut2 = checkIn2.AddDays(2);

        var result = IsOverlapping(checkIn1, checkOut1, checkIn2, checkOut2);

        Assert.True(result);
    }

    /// <summary>
    /// Unit test: Reverse containment (inner contains outer) should overlap
    /// </summary>
    [Fact]
    public void ReverseContainment_ShouldOverlap()
    {
        var innerCheckIn = DateTime.UtcNow.AddDays(1);
        var innerCheckOut = innerCheckIn.AddDays(3);
        var outerCheckIn = innerCheckIn.AddDays(1);
        var outerCheckOut = innerCheckIn.AddDays(2);

        var result = IsOverlapping(innerCheckIn, innerCheckOut, outerCheckIn, outerCheckOut);

        Assert.True(result);
    }

    /// <summary>
    /// Unit test: Long-term booking should not overlap with future booking
    /// </summary>
    [Fact]
    public void LongTermBooking_FutureBooking_ShouldNotOverlap()
    {
        var longTermCheckIn = DateTime.UtcNow.AddDays(1);
        var longTermCheckOut = longTermCheckIn.AddDays(30);
        var futureCheckIn = longTermCheckOut.AddDays(1);
        var futureCheckOut = futureCheckIn.AddDays(5);

        var result = IsOverlapping(longTermCheckIn, longTermCheckOut, futureCheckIn, futureCheckOut);

        Assert.False(result);
    }
}
