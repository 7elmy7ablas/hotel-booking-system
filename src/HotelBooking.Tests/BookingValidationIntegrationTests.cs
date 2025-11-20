using Xunit;
using HotelBooking.Application.Services;
using HotelBooking.Domain.Entities;
using HotelBooking.Application.Interfaces;
using Microsoft.Extensions.Logging;
using Moq;

namespace HotelBooking.Tests;

/// <summary>
/// Integration tests for booking validation service
/// Tests the complete validation flow with realistic scenarios
/// </summary>
public class BookingValidationIntegrationTests
{
    private readonly Mock<IRepository<Booking>> _mockRepository;
    private readonly Mock<ILogger<BookingValidationService>> _mockLogger;
    private readonly BookingValidationService _validationService;

    public BookingValidationIntegrationTests()
    {
        _mockRepository = new Mock<IRepository<Booking>>();
        _mockLogger = new Mock<ILogger<BookingValidationService>>();
        _validationService = new BookingValidationService(_mockRepository.Object, _mockLogger.Object);
    }

    [Fact]
    public async Task ValidateNoOverlap_WithNoExistingBookings_ShouldSucceed()
    {
        // Arrange
        var roomId = Guid.NewGuid();
        var checkIn = DateTime.UtcNow.AddDays(1);
        var checkOut = checkIn.AddDays(3);

        _mockRepository.Setup(r => r.GetAllAsync())
            .ReturnsAsync(new List<Booking>());

        // Act
        var result = await _validationService.ValidateNoOverlapAsync(roomId, checkIn, checkOut);

        // Assert
        Assert.True(result.IsValid);
        Assert.Null(result.ErrorMessage);
    }

    [Fact]
    public async Task ValidateNoOverlap_WithOverlappingBooking_ShouldFail()
    {
        // Arrange
        var roomId = Guid.NewGuid();
        var checkIn = DateTime.UtcNow.AddDays(1);
        var checkOut = checkIn.AddDays(5);

        var existingBooking = new Booking
        {
            Id = Guid.NewGuid(),
            RoomId = roomId,
            UserId = Guid.NewGuid(),
            CheckIn = checkIn.AddDays(2),
            CheckOut = checkIn.AddDays(6),
            TotalPrice = 300,
            Status = "Confirmed",
            IsDeleted = false
        };

        _mockRepository.Setup(r => r.GetAllAsync())
            .ReturnsAsync(new List<Booking> { existingBooking });

        // Act
        var result = await _validationService.ValidateNoOverlapAsync(roomId, checkIn, checkOut);

        // Assert
        Assert.False(result.IsValid);
        Assert.NotNull(result.ErrorMessage);
        Assert.Contains("already booked", result.ErrorMessage);
    }

    [Fact]
    public async Task ValidateNoOverlap_WithCancelledBooking_ShouldSucceed()
    {
        // Arrange
        var roomId = Guid.NewGuid();
        var checkIn = DateTime.UtcNow.AddDays(1);
        var checkOut = checkIn.AddDays(3);

        var cancelledBooking = new Booking
        {
            Id = Guid.NewGuid(),
            RoomId = roomId,
            UserId = Guid.NewGuid(),
            CheckIn = checkIn,
            CheckOut = checkOut,
            TotalPrice = 300,
            Status = "Cancelled",
            IsDeleted = false
        };

        _mockRepository.Setup(r => r.GetAllAsync())
            .ReturnsAsync(new List<Booking> { cancelledBooking });

        // Act
        var result = await _validationService.ValidateNoOverlapAsync(roomId, checkIn, checkOut);

        // Assert
        Assert.True(result.IsValid);
    }

    [Fact]
    public async Task ValidateNoOverlap_WithDeletedBooking_ShouldSucceed()
    {
        // Arrange
        var roomId = Guid.NewGuid();
        var checkIn = DateTime.UtcNow.AddDays(1);
        var checkOut = checkIn.AddDays(3);

        var deletedBooking = new Booking
        {
            Id = Guid.NewGuid(),
            RoomId = roomId,
            UserId = Guid.NewGuid(),
            CheckIn = checkIn,
            CheckOut = checkOut,
            TotalPrice = 300,
            Status = "Confirmed",
            IsDeleted = true
        };

        _mockRepository.Setup(r => r.GetAllAsync())
            .ReturnsAsync(new List<Booking> { deletedBooking });

        // Act
        var result = await _validationService.ValidateNoOverlapAsync(roomId, checkIn, checkOut);

        // Assert
        Assert.True(result.IsValid);
    }

    [Fact]
    public async Task ValidateNoOverlap_WithDifferentRoom_ShouldSucceed()
    {
        // Arrange
        var roomId1 = Guid.NewGuid();
        var roomId2 = Guid.NewGuid();
        var checkIn = DateTime.UtcNow.AddDays(1);
        var checkOut = checkIn.AddDays(3);

        var existingBooking = new Booking
        {
            Id = Guid.NewGuid(),
            RoomId = roomId2,
            UserId = Guid.NewGuid(),
            CheckIn = checkIn,
            CheckOut = checkOut,
            TotalPrice = 300,
            Status = "Confirmed",
            IsDeleted = false
        };

        _mockRepository.Setup(r => r.GetAllAsync())
            .ReturnsAsync(new List<Booking> { existingBooking });

        // Act
        var result = await _validationService.ValidateNoOverlapAsync(roomId1, checkIn, checkOut);

        // Assert
        Assert.True(result.IsValid);
    }

    [Fact]
    public async Task ValidateNoOverlap_ExcludingCurrentBooking_ShouldSucceed()
    {
        // Arrange
        var roomId = Guid.NewGuid();
        var bookingId = Guid.NewGuid();
        var checkIn = DateTime.UtcNow.AddDays(1);
        var checkOut = checkIn.AddDays(3);

        var existingBooking = new Booking
        {
            Id = bookingId,
            RoomId = roomId,
            UserId = Guid.NewGuid(),
            CheckIn = checkIn,
            CheckOut = checkOut,
            TotalPrice = 300,
            Status = "Confirmed",
            IsDeleted = false
        };

        _mockRepository.Setup(r => r.GetAllAsync())
            .ReturnsAsync(new List<Booking> { existingBooking });

        // Act - Exclude the current booking (for update scenario)
        var result = await _validationService.ValidateNoOverlapAsync(roomId, checkIn, checkOut, bookingId);

        // Assert
        Assert.True(result.IsValid);
    }

    [Fact]
    public async Task ValidateNoOverlap_WithMultipleNonOverlappingBookings_ShouldSucceed()
    {
        // Arrange
        var roomId = Guid.NewGuid();
        var checkIn = DateTime.UtcNow.AddDays(10);
        var checkOut = checkIn.AddDays(3);

        var bookings = new List<Booking>
        {
            new Booking
            {
                Id = Guid.NewGuid(),
                RoomId = roomId,
                UserId = Guid.NewGuid(),
                CheckIn = DateTime.UtcNow.AddDays(1),
                CheckOut = DateTime.UtcNow.AddDays(5),
                TotalPrice = 400,
                Status = "Confirmed",
                IsDeleted = false
            },
            new Booking
            {
                Id = Guid.NewGuid(),
                RoomId = roomId,
                UserId = Guid.NewGuid(),
                CheckIn = DateTime.UtcNow.AddDays(15),
                CheckOut = DateTime.UtcNow.AddDays(20),
                TotalPrice = 500,
                Status = "Confirmed",
                IsDeleted = false
            }
        };

        _mockRepository.Setup(r => r.GetAllAsync())
            .ReturnsAsync(bookings);

        // Act
        var result = await _validationService.ValidateNoOverlapAsync(roomId, checkIn, checkOut);

        // Assert
        Assert.True(result.IsValid);
    }

    [Fact]
    public void ValidateDates_WithValidDates_ShouldSucceed()
    {
        // Arrange
        var checkIn = DateTime.UtcNow.AddDays(1);
        var checkOut = checkIn.AddDays(3);

        // Act
        var result = _validationService.ValidateDates(checkIn, checkOut);

        // Assert
        Assert.True(result.IsValid);
    }

    [Fact]
    public void ValidateDates_WithCheckOutBeforeCheckIn_ShouldFail()
    {
        // Arrange
        var checkIn = DateTime.UtcNow.AddDays(5);
        var checkOut = DateTime.UtcNow.AddDays(3);

        // Act
        var result = _validationService.ValidateDates(checkIn, checkOut);

        // Assert
        Assert.False(result.IsValid);
        Assert.Contains("after check-in", result.ErrorMessage);
    }

    [Fact]
    public void ValidateDates_WithCheckInInPast_ShouldFail()
    {
        // Arrange
        var checkIn = DateTime.UtcNow.AddDays(-1);
        var checkOut = DateTime.UtcNow.AddDays(2);

        // Act
        var result = _validationService.ValidateDates(checkIn, checkOut);

        // Assert
        Assert.False(result.IsValid);
        Assert.Contains("past", result.ErrorMessage);
    }

    [Fact]
    public void ValidateDates_WithDurationExceeding30Days_ShouldFail()
    {
        // Arrange
        var checkIn = DateTime.UtcNow.AddDays(1);
        var checkOut = checkIn.AddDays(31);

        // Act
        var result = _validationService.ValidateDates(checkIn, checkOut);

        // Assert
        Assert.False(result.IsValid);
        Assert.Contains("30 days", result.ErrorMessage);
    }

    [Fact]
    public void ValidateDates_WithExactly30Days_ShouldSucceed()
    {
        // Arrange
        var checkIn = DateTime.UtcNow.AddDays(1);
        var checkOut = checkIn.AddDays(30);

        // Act
        var result = _validationService.ValidateDates(checkIn, checkOut);

        // Assert
        Assert.True(result.IsValid);
    }
}
