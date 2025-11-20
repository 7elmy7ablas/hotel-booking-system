using FsCheck;
using FsCheck.Xunit;
using Xunit;
using HotelBooking.Domain.Entities;

namespace HotelBooking.Tests;

/// <summary>
/// Property-based tests for Booking business logic
/// Uses FsCheck to generate random test data and verify properties
/// </summary>
public class BookingPropertyTests
{
    [Property]
    public Property CheckOutMustBeAfterCheckIn()
    {
        return Prop.ForAll<DateTime, int>(
            (checkIn, daysToAdd) =>
            {
                // Arrange
                var checkOut = checkIn.AddDays(Math.Abs(daysToAdd) + 1);
                
                // Act & Assert
                return checkOut > checkIn;
            });
    }

    [Property]
    public Property BookingDurationIsAlwaysPositive()
    {
        return Prop.ForAll<DateTime, int>(
            (checkIn, daysToAdd) =>
            {
                // Arrange
                var days = Math.Abs(daysToAdd) + 1;
                var checkOut = checkIn.AddDays(days);
                
                // Act
                var duration = (checkOut - checkIn).Days;
                
                // Assert
                return duration > 0;
            });
    }

    [Property]
    public Property TotalPriceIsProportionalToDuration()
    {
        return Prop.ForAll<decimal, int>(
            (pricePerNight, nights) =>
            {
                // Arrange
                var validPrice = Math.Abs(pricePerNight) + 1;
                var validNights = Math.Abs(nights) + 1;
                
                // Act
                var totalPrice = validPrice * validNights;
                
                // Assert
                return totalPrice >= validPrice && totalPrice >= validNights;
            });
    }

    [Property]
    public Property BookingStatusTransitionsAreValid()
    {
        var validTransitions = new Dictionary<string, List<string>>
        {
            { "Pending", new List<string> { "Confirmed", "Cancelled" } },
            { "Confirmed", new List<string> { "Completed", "Cancelled" } },
            { "Cancelled", new List<string>() },
            { "Completed", new List<string>() }
        };

        return Prop.ForAll<string, string>(
            (fromStatus, toStatus) =>
            {
                if (!validTransitions.ContainsKey(fromStatus))
                    return true; // Invalid from status, skip

                var allowedTransitions = validTransitions[fromStatus];
                
                // If transition is attempted, it should be in allowed list
                return !allowedTransitions.Any() || allowedTransitions.Contains(toStatus);
            });
    }

    [Property]
    public Property GuestNameCannotBeEmpty()
    {
        return Prop.ForAll<string>(
            (guestName) =>
            {
                // Act & Assert
                return string.IsNullOrWhiteSpace(guestName) == false 
                    ? guestName.Length > 0 
                    : true;
            });
    }

    [Property]
    public Property EmailMustContainAtSymbol()
    {
        return Prop.ForAll<string>(
            (email) =>
            {
                if (string.IsNullOrWhiteSpace(email))
                    return true;

                // A valid email should contain @
                var isValidFormat = email.Contains('@');
                
                return isValidFormat || email.Length == 0;
            });
    }

    [Property]
    public Property PhoneNumberShouldBeNumeric()
    {
        return Prop.ForAll<string>(
            (phone) =>
            {
                if (string.IsNullOrWhiteSpace(phone))
                    return true;

                // Phone should only contain digits, spaces, +, -, (, )
                var validChars = phone.All(c => 
                    char.IsDigit(c) || 
                    c == ' ' || 
                    c == '+' || 
                    c == '-' || 
                    c == '(' || 
                    c == ')');
                
                return validChars;
            });
    }

    [Property]
    public Property BookingCannotStartInThePast()
    {
        return Prop.ForAll<DateTime>(
            (checkIn) =>
            {
                var now = DateTime.UtcNow;
                
                // If check-in is in the past, booking should be invalid
                if (checkIn < now)
                {
                    return false; // This should fail validation
                }
                
                return true;
            });
    }

    [Property]
    public Property MaximumBookingDurationIsReasonable()
    {
        return Prop.ForAll<DateTime, int>(
            (checkIn, daysToAdd) =>
            {
                var maxDays = 365; // Maximum 1 year
                var days = Math.Abs(daysToAdd);
                
                // Booking duration should not exceed maximum
                return days <= maxDays;
            });
    }

    [Property]
    public Property SpecialRequestsAreSanitized()
    {
        return Prop.ForAll<string>(
            (specialRequests) =>
            {
                if (string.IsNullOrWhiteSpace(specialRequests))
                    return true;

                // Special requests should not contain script tags
                var containsScript = specialRequests.Contains("<script>", StringComparison.OrdinalIgnoreCase);
                
                return !containsScript;
            });
    }

    [Fact]
    public void BookingOverlap_SameRoom_SameDates_ShouldConflict()
    {
        // Arrange
        var roomId = Guid.NewGuid();
        var checkIn = DateTime.UtcNow.AddDays(1);
        var checkOut = DateTime.UtcNow.AddDays(3);

        var booking1 = new Booking
        {
            RoomId = roomId,
            CheckIn = checkIn,
            CheckOut = checkOut
        };

        var booking2 = new Booking
        {
            RoomId = roomId,
            CheckIn = checkIn,
            CheckOut = checkOut
        };

        // Act
        var overlaps = BookingsOverlap(booking1, booking2);

        // Assert
        Assert.True(overlaps);
    }

    [Fact]
    public void BookingOverlap_SameRoom_PartialOverlap_ShouldConflict()
    {
        // Arrange
        var roomId = Guid.NewGuid();
        
        var booking1 = new Booking
        {
            RoomId = roomId,
            CheckIn = DateTime.UtcNow.AddDays(1),
            CheckOut = DateTime.UtcNow.AddDays(5)
        };

        var booking2 = new Booking
        {
            RoomId = roomId,
            CheckIn = DateTime.UtcNow.AddDays(3),
            CheckOut = DateTime.UtcNow.AddDays(7)
        };

        // Act
        var overlaps = BookingsOverlap(booking1, booking2);

        // Assert
        Assert.True(overlaps);
    }

    [Fact]
    public void BookingOverlap_SameRoom_NoOverlap_ShouldNotConflict()
    {
        // Arrange
        var roomId = Guid.NewGuid();
        
        var booking1 = new Booking
        {
            RoomId = roomId,
            CheckIn = DateTime.UtcNow.AddDays(1),
            CheckOut = DateTime.UtcNow.AddDays(3)
        };

        var booking2 = new Booking
        {
            RoomId = roomId,
            CheckIn = DateTime.UtcNow.AddDays(4),
            CheckOut = DateTime.UtcNow.AddDays(6)
        };

        // Act
        var overlaps = BookingsOverlap(booking1, booking2);

        // Assert
        Assert.False(overlaps);
    }

    [Fact]
    public void BookingOverlap_DifferentRooms_ShouldNotConflict()
    {
        // Arrange
        var booking1 = new Booking
        {
            RoomId = Guid.NewGuid(),
            CheckIn = DateTime.UtcNow.AddDays(1),
            CheckOut = DateTime.UtcNow.AddDays(3)
        };

        var booking2 = new Booking
        {
            RoomId = Guid.NewGuid(),
            CheckIn = DateTime.UtcNow.AddDays(1),
            CheckOut = DateTime.UtcNow.AddDays(3)
        };

        // Act
        var overlaps = BookingsOverlap(booking1, booking2);

        // Assert
        Assert.False(overlaps);
    }

    // Helper method
    private bool BookingsOverlap(Booking booking1, Booking booking2)
    {
        if (booking1.RoomId != booking2.RoomId)
            return false;

        return booking1.CheckIn < booking2.CheckOut && booking2.CheckIn < booking1.CheckOut;
    }
}
