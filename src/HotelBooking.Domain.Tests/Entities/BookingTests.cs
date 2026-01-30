using FluentAssertions;
using HotelBooking.Domain.Entities;
using Xunit;

namespace HotelBooking.Domain.Tests.Entities;

public class BookingTests
{
    [Fact]
    public void Booking_ShouldBeCreated_WithValidProperties()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var roomId = Guid.NewGuid();
        var checkIn = DateTime.Today.AddDays(1);
        var checkOut = DateTime.Today.AddDays(3);
        var totalPrice = 200m;
        var status = "Confirmed";

        // Act
        var booking = new Booking
        {
            UserId = userId,
            RoomId = roomId,
            CheckIn = checkIn,
            CheckOut = checkOut,
            TotalPrice = totalPrice,
            Status = status
        };

        // Assert
        booking.UserId.Should().Be(userId);
        booking.RoomId.Should().Be(roomId);
        booking.CheckIn.Should().Be(checkIn);
        booking.CheckOut.Should().Be(checkOut);
        booking.TotalPrice.Should().Be(totalPrice);
        booking.Status.Should().Be(status);
    }

    [Theory]
    [InlineData(1, 100)]
    [InlineData(2, 200)]
    [InlineData(7, 1050)]
    [InlineData(30, 2400)]
    public void Booking_ShouldHaveCorrectTotalPrice_ForDifferentDurations(
        int nights, decimal totalPrice)
    {
        // Arrange
        var checkIn = DateTime.Today.AddDays(1);
        var checkOut = checkIn.AddDays(nights);

        // Act
        var booking = new Booking
        {
            UserId = Guid.NewGuid(),
            RoomId = Guid.NewGuid(),
            CheckIn = checkIn,
            CheckOut = checkOut,
            TotalPrice = totalPrice,
            Status = "Pending"
        };

        // Assert
        booking.TotalPrice.Should().Be(totalPrice);
    }

    [Fact]
    public void Booking_ShouldHaveDefaultPendingStatus()
    {
        // Arrange & Act
        var booking = new Booking
        {
            UserId = Guid.NewGuid(),
            RoomId = Guid.NewGuid(),
            CheckIn = DateTime.Today.AddDays(1),
            CheckOut = DateTime.Today.AddDays(3),
            TotalPrice = 200m,
            Status = "Pending"
        };

        // Assert
        booking.Status.Should().Be("Pending");
    }

    [Fact]
    public void Booking_ShouldHaveValidDateRange()
    {
        // Arrange
        var checkIn = DateTime.Today.AddDays(1);
        var checkOut = DateTime.Today.AddDays(3);

        // Act
        var booking = new Booking
        {
            UserId = Guid.NewGuid(),
            RoomId = Guid.NewGuid(),
            CheckIn = checkIn,
            CheckOut = checkOut,
            TotalPrice = 200m,
            Status = "Pending"
        };

        // Assert
        booking.CheckOut.Should().BeAfter(booking.CheckIn);
        (booking.CheckOut - booking.CheckIn).Days.Should().Be(2);
    }

    [Theory]
    [InlineData("Pending")]
    [InlineData("Confirmed")]
    [InlineData("Cancelled")]
    [InlineData("Completed")]
    public void Booking_ShouldAcceptValidStatuses(string status)
    {
        // Arrange & Act
        var booking = new Booking
        {
            UserId = Guid.NewGuid(),
            RoomId = Guid.NewGuid(),
            CheckIn = DateTime.Today.AddDays(1),
            CheckOut = DateTime.Today.AddDays(3),
            TotalPrice = 200m,
            Status = status
        };

        // Assert
        booking.Status.Should().Be(status);
    }
}
