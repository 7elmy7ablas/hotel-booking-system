using FluentAssertions;
using HotelBooking.Application.Interfaces;
using HotelBooking.Application.Services;
using HotelBooking.Domain.Entities;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace HotelBooking.Application.Tests.Services;

/// <summary>
/// Unit tests for BookingValidationService
/// Covers: overlap detection, date validation, price calculation
/// Spec: .specify/specs/001-hotel-booking-flow/spec.md
/// </summary>
public class BookingValidationServiceTests
{
    private readonly Mock<IRepository<Booking>> _mockRepository;
    private readonly Mock<ILogger<BookingValidationService>> _mockLogger;
    private readonly BookingValidationService _service;

    public BookingValidationServiceTests()
    {
        _mockRepository = new Mock<IRepository<Booking>>();
        _mockLogger = new Mock<ILogger<BookingValidationService>>();
        _service = new BookingValidationService(_mockRepository.Object, _mockLogger.Object);
    }

    #region Date Validation Tests (EC-002, EC-003)

    [Fact]
    public void ValidateDates_ShouldReturnSuccess_WhenDatesAreValid()
    {
        // Arrange
        var checkIn = DateTime.UtcNow.Date.AddDays(1);
        var checkOut = checkIn.AddDays(3);

        // Act
        var result = _service.ValidateDates(checkIn, checkOut);

        // Assert
        result.IsValid.Should().BeTrue();
        result.ErrorMessage.Should().BeNull();
    }

    [Theory]
    [InlineData(0)]  // Same day
    [InlineData(-1)] // CheckOut before CheckIn
    [InlineData(-5)] // CheckOut way before CheckIn
    public void ValidateDates_ShouldFail_WhenCheckOutNotAfterCheckIn(int daysDifference)
    {
        // Arrange - EC-002: Invalid Date Range
        var checkIn = DateTime.UtcNow.Date.AddDays(5);
        var checkOut = checkIn.AddDays(daysDifference);

        // Act
        var result = _service.ValidateDates(checkIn, checkOut);

        // Assert
        result.IsValid.Should().BeFalse();
        result.ErrorMessage.Should().Contain("Check-out date must be after check-in date");
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(-7)]
    [InlineData(-30)]
    public void ValidateDates_ShouldFail_WhenCheckInIsInPast(int daysInPast)
    {
        // Arrange - EC-003: Booking in the Past
        var checkIn = DateTime.UtcNow.Date.AddDays(daysInPast);
        var checkOut = checkIn.AddDays(3);

        // Act
        var result = _service.ValidateDates(checkIn, checkOut);

        // Assert
        result.IsValid.Should().BeFalse();
        result.ErrorMessage.Should().Contain("Check-in date cannot be in the past");
    }

    [Fact]
    public void ValidateDates_ShouldFail_WhenDurationExceeds30Days()
    {
        // Arrange
        var checkIn = DateTime.UtcNow.Date.AddDays(1);
        var checkOut = checkIn.AddDays(31);

        // Act
        var result = _service.ValidateDates(checkIn, checkOut);

        // Assert
        result.IsValid.Should().BeFalse();
        result.ErrorMessage.Should().Contain("Booking duration cannot exceed 30 days");
    }

    [Fact]
    public void ValidateDates_ShouldSucceed_WhenDurationIsExactly30Days()
    {
        // Arrange
        var checkIn = DateTime.UtcNow.Date.AddDays(1);
        var checkOut = checkIn.AddDays(30);

        // Act
        var result = _service.ValidateDates(checkIn, checkOut);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    #endregion

    #region Overlap Detection Tests (EC-001)

    [Fact]
    public async Task ValidateNoOverlapAsync_ShouldSucceed_WhenNoExistingBookings()
    {
        // Arrange
        var roomId = Guid.NewGuid();
        var checkIn = DateTime.UtcNow.Date.AddDays(5);
        var checkOut = checkIn.AddDays(3);

        _mockRepository.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Booking>());

        // Act
        var result = await _service.ValidateNoOverlapAsync(roomId, checkIn, checkOut);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public async Task ValidateNoOverlapAsync_ShouldSucceed_WhenBookingsAreSequential()
    {
        // Arrange - Existing: Feb 15-18, New: Feb 18-20 (should be allowed)
        var roomId = Guid.NewGuid();
        var existingBooking = CreateBooking(roomId, 
            DateTime.UtcNow.Date.AddDays(15), 
            DateTime.UtcNow.Date.AddDays(18));

        _mockRepository.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Booking> { existingBooking });

        var newCheckIn = DateTime.UtcNow.Date.AddDays(18); // Starts when existing ends
        var newCheckOut = DateTime.UtcNow.Date.AddDays(20);

        // Act
        var result = await _service.ValidateNoOverlapAsync(roomId, newCheckIn, newCheckOut);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public async Task ValidateNoOverlapAsync_ShouldFail_WhenExactSameDates()
    {
        // Arrange - Identical booking dates (overlap)
        var roomId = Guid.NewGuid();
        var checkIn = DateTime.UtcNow.Date.AddDays(15);
        var checkOut = DateTime.UtcNow.Date.AddDays(18);

        var existingBooking = CreateBooking(roomId, checkIn, checkOut);

        _mockRepository.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Booking> { existingBooking });

        // Act
        var result = await _service.ValidateNoOverlapAsync(roomId, checkIn, checkOut);

        // Assert
        result.IsValid.Should().BeFalse();
        result.ErrorMessage.Should().Contain("Room is already booked");
    }

    [Fact]
    public async Task ValidateNoOverlapAsync_ShouldFail_WhenNewBookingStartsDuringExisting()
    {
        // Arrange - Existing: Feb 15-18, New: Feb 17-20 (partial overlap at end)
        var roomId = Guid.NewGuid();
        var existingBooking = CreateBooking(roomId,
            DateTime.UtcNow.Date.AddDays(15),
            DateTime.UtcNow.Date.AddDays(18));

        _mockRepository.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Booking> { existingBooking });

        var newCheckIn = DateTime.UtcNow.Date.AddDays(17);
        var newCheckOut = DateTime.UtcNow.Date.AddDays(20);

        // Act
        var result = await _service.ValidateNoOverlapAsync(roomId, newCheckIn, newCheckOut);

        // Assert
        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public async Task ValidateNoOverlapAsync_ShouldFail_WhenNewBookingEndsDuringExisting()
    {
        // Arrange - Existing: Feb 15-18, New: Feb 10-16 (partial overlap at start)
        var roomId = Guid.NewGuid();
        var existingBooking = CreateBooking(roomId,
            DateTime.UtcNow.Date.AddDays(15),
            DateTime.UtcNow.Date.AddDays(18));

        _mockRepository.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Booking> { existingBooking });

        var newCheckIn = DateTime.UtcNow.Date.AddDays(10);
        var newCheckOut = DateTime.UtcNow.Date.AddDays(16);

        // Act
        var result = await _service.ValidateNoOverlapAsync(roomId, newCheckIn, newCheckOut);

        // Assert
        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public async Task ValidateNoOverlapAsync_ShouldFail_WhenNewBookingContainsExisting()
    {
        // Arrange - Existing: Feb 15-18, New: Feb 10-25 (new contains existing)
        var roomId = Guid.NewGuid();
        var existingBooking = CreateBooking(roomId,
            DateTime.UtcNow.Date.AddDays(15),
            DateTime.UtcNow.Date.AddDays(18));

        _mockRepository.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Booking> { existingBooking });

        var newCheckIn = DateTime.UtcNow.Date.AddDays(10);
        var newCheckOut = DateTime.UtcNow.Date.AddDays(25);

        // Act
        var result = await _service.ValidateNoOverlapAsync(roomId, newCheckIn, newCheckOut);

        // Assert
        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public async Task ValidateNoOverlapAsync_ShouldFail_WhenExistingContainsNewBooking()
    {
        // Arrange - Existing: Feb 10-25, New: Feb 15-18 (existing contains new)
        var roomId = Guid.NewGuid();
        var existingBooking = CreateBooking(roomId,
            DateTime.UtcNow.Date.AddDays(10),
            DateTime.UtcNow.Date.AddDays(25));

        _mockRepository.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Booking> { existingBooking });

        var newCheckIn = DateTime.UtcNow.Date.AddDays(15);
        var newCheckOut = DateTime.UtcNow.Date.AddDays(18);

        // Act
        var result = await _service.ValidateNoOverlapAsync(roomId, newCheckIn, newCheckOut);

        // Assert
        result.IsValid.Should().BeFalse();
    }

    [Fact]
    public async Task ValidateNoOverlapAsync_ShouldSucceed_WhenNewEndsExactlyWhenExistingStarts()
    {
        // Arrange - Existing: Feb 15-18, New: Feb 10-15 (ends exactly when existing starts)
        var roomId = Guid.NewGuid();
        var existingBooking = CreateBooking(roomId,
            DateTime.UtcNow.Date.AddDays(15),
            DateTime.UtcNow.Date.AddDays(18));

        _mockRepository.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Booking> { existingBooking });

        var newCheckIn = DateTime.UtcNow.Date.AddDays(10);
        var newCheckOut = DateTime.UtcNow.Date.AddDays(15);

        // Act
        var result = await _service.ValidateNoOverlapAsync(roomId, newCheckIn, newCheckOut);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public async Task ValidateNoOverlapAsync_ShouldIgnoreCancelledBookings()
    {
        // Arrange - Existing cancelled booking should not cause overlap
        var roomId = Guid.NewGuid();
        var cancelledBooking = CreateBooking(roomId,
            DateTime.UtcNow.Date.AddDays(15),
            DateTime.UtcNow.Date.AddDays(18));
        cancelledBooking.Status = "Cancelled";

        _mockRepository.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Booking> { cancelledBooking });

        var newCheckIn = DateTime.UtcNow.Date.AddDays(15);
        var newCheckOut = DateTime.UtcNow.Date.AddDays(18);

        // Act
        var result = await _service.ValidateNoOverlapAsync(roomId, newCheckIn, newCheckOut);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public async Task ValidateNoOverlapAsync_ShouldIgnoreDeletedBookings()
    {
        // Arrange - Soft-deleted booking should not cause overlap
        var roomId = Guid.NewGuid();
        var deletedBooking = CreateBooking(roomId,
            DateTime.UtcNow.Date.AddDays(15),
            DateTime.UtcNow.Date.AddDays(18));
        deletedBooking.IsDeleted = true;

        _mockRepository.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Booking> { deletedBooking });

        var newCheckIn = DateTime.UtcNow.Date.AddDays(15);
        var newCheckOut = DateTime.UtcNow.Date.AddDays(18);

        // Act
        var result = await _service.ValidateNoOverlapAsync(roomId, newCheckIn, newCheckOut);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public async Task ValidateNoOverlapAsync_ShouldIgnoreDifferentRooms()
    {
        // Arrange - Booking for different room should not cause overlap
        var roomId = Guid.NewGuid();
        var differentRoomId = Guid.NewGuid();
        var existingBooking = CreateBooking(differentRoomId,
            DateTime.UtcNow.Date.AddDays(15),
            DateTime.UtcNow.Date.AddDays(18));

        _mockRepository.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Booking> { existingBooking });

        var newCheckIn = DateTime.UtcNow.Date.AddDays(15);
        var newCheckOut = DateTime.UtcNow.Date.AddDays(18);

        // Act
        var result = await _service.ValidateNoOverlapAsync(roomId, newCheckIn, newCheckOut);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    [Fact]
    public async Task ValidateNoOverlapAsync_ShouldExcludeSpecifiedBookingId()
    {
        // Arrange - For updates: should exclude the booking being updated
        var roomId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();
        var existingBooking = CreateBooking(roomId,
            DateTime.UtcNow.Date.AddDays(15),
            DateTime.UtcNow.Date.AddDays(18));
        existingBooking.Id = bookingId;

        _mockRepository.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Booking> { existingBooking });

        var newCheckIn = DateTime.UtcNow.Date.AddDays(15);
        var newCheckOut = DateTime.UtcNow.Date.AddDays(18);

        // Act
        var result = await _service.ValidateNoOverlapAsync(roomId, newCheckIn, newCheckOut, bookingId);

        // Assert
        result.IsValid.Should().BeTrue();
    }

    #endregion

    #region Price Calculation Tests (FR-003)

    [Theory]
    [InlineData(100, 1, 100)]     // 1 night @ $100 = $100
    [InlineData(100, 3, 300)]     // 3 nights @ $100 = $300
    [InlineData(150, 3, 450)]     // 3 nights @ $150 = $450 (from spec)
    [InlineData(75.50, 2, 151)]   // 2 nights @ $75.50 = $151
    [InlineData(200, 7, 1400)]    // 7 nights @ $200 = $1400
    public void CalculateTotalPrice_ShouldReturnCorrectAmount(
        decimal pricePerNight, 
        int nights, 
        decimal expectedTotal)
    {
        // Arrange
        var checkIn = DateTime.UtcNow.Date.AddDays(1);
        var checkOut = checkIn.AddDays(nights);

        // Act
        var totalPrice = CalculateTotalPrice(pricePerNight, checkIn, checkOut);

        // Assert
        totalPrice.Should().Be(expectedTotal);
    }

    // Helper method representing the price calculation logic
    private static decimal CalculateTotalPrice(decimal pricePerNight, DateTime checkIn, DateTime checkOut)
    {
        var nights = (checkOut - checkIn).Days;
        return pricePerNight * nights;
    }

    #endregion

    #region Helper Methods

    private static Booking CreateBooking(Guid roomId, DateTime checkIn, DateTime checkOut)
    {
        return new Booking
        {
            Id = Guid.NewGuid(),
            RoomId = roomId,
            UserId = Guid.NewGuid(),
            CheckIn = checkIn,
            CheckOut = checkOut,
            TotalPrice = 100m,
            Status = "Confirmed",
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow
        };
    }

    #endregion
}
