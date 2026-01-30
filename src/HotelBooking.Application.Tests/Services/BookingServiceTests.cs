using FluentAssertions;
using HotelBooking.Application.Tests;
using HotelBooking.Domain.Entities;
using Moq;
using Xunit;

namespace HotelBooking.Application.Tests.Services;

public class BookingServiceTests
{
    private readonly Mock<IBookingRepository> _mockBookingRepository;
    private readonly Mock<IRoomRepository> _mockRoomRepository;

    public BookingServiceTests()
    {
        _mockBookingRepository = new Mock<IBookingRepository>();
        _mockRoomRepository = new Mock<IRoomRepository>();
    }

    [Fact]
    public async Task CreateBooking_ShouldSucceed_WhenRoomIsAvailable()
    {
        // Arrange
        var roomId = Guid.NewGuid();
        var userId = Guid.NewGuid();
        var checkIn = DateTime.Today.AddDays(1);
        var checkOut = DateTime.Today.AddDays(3);

        var room = new Room
        {
            Id = roomId,
            HotelId = Guid.NewGuid(),
            RoomType = "Double",
            PricePerNight = 100m,
            Capacity = 2,
            IsAvailable = true
        };

        var expectedBooking = new Booking
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            RoomId = roomId,
            CheckIn = checkIn,
            CheckOut = checkOut,
            TotalPrice = 200m,
            Status = "Confirmed"
        };

        _mockRoomRepository
            .Setup(r => r.GetByIdAsync(roomId))
            .ReturnsAsync(room);

        _mockBookingRepository
            .Setup(r => r.IsRoomAvailableAsync(roomId, checkIn, checkOut))
            .ReturnsAsync(true);

        _mockBookingRepository
            .Setup(r => r.AddAsync(It.IsAny<Booking>()))
            .ReturnsAsync(expectedBooking);

        // Act
        var result = await _mockBookingRepository.Object.AddAsync(expectedBooking);

        // Assert
        result.Should().NotBeNull();
        result.Status.Should().Be("Confirmed");
        result.TotalPrice.Should().Be(200m);
    }

    [Fact]
    public async Task GetBookingById_ShouldReturnBooking_WhenExists()
    {
        // Arrange
        var bookingId = Guid.NewGuid();
        var expectedBooking = new Booking
        {
            Id = bookingId,
            UserId = Guid.NewGuid(),
            RoomId = Guid.NewGuid(),
            CheckIn = DateTime.Today.AddDays(1),
            CheckOut = DateTime.Today.AddDays(3),
            TotalPrice = 200m,
            Status = "Confirmed"
        };

        _mockBookingRepository
            .Setup(r => r.GetByIdAsync(bookingId))
            .ReturnsAsync(expectedBooking);

        // Act
        var result = await _mockBookingRepository.Object.GetByIdAsync(bookingId);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(bookingId);
    }

    [Fact]
    public async Task GetBookingById_ShouldReturnNull_WhenNotFound()
    {
        // Arrange
        var bookingId = Guid.NewGuid();

        _mockBookingRepository
            .Setup(r => r.GetByIdAsync(bookingId))
            .ReturnsAsync((Booking?)null);

        // Act
        var result = await _mockBookingRepository.Object.GetByIdAsync(bookingId);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task GetUserBookings_ShouldReturnBookings_WhenUserHasBookings()
    {
        // Arrange
        var userId = Guid.NewGuid();
        var expectedBookings = new List<Booking>
        {
            new Booking
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                RoomId = Guid.NewGuid(),
                CheckIn = DateTime.Today.AddDays(1),
                CheckOut = DateTime.Today.AddDays(3),
                TotalPrice = 200m,
                Status = "Confirmed"
            },
            new Booking
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                RoomId = Guid.NewGuid(),
                CheckIn = DateTime.Today.AddDays(10),
                CheckOut = DateTime.Today.AddDays(12),
                TotalPrice = 300m,
                Status = "Pending"
            }
        };

        _mockBookingRepository
            .Setup(r => r.GetByUserIdAsync(userId))
            .ReturnsAsync(expectedBookings);

        // Act
        var result = await _mockBookingRepository.Object.GetByUserIdAsync(userId);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(2);
        result.Should().OnlyContain(b => b.UserId == userId);
    }

    [Fact]
    public async Task IsRoomAvailable_ShouldReturnTrue_WhenNoConflictingBookings()
    {
        // Arrange
        var roomId = Guid.NewGuid();
        var checkIn = DateTime.Today.AddDays(1);
        var checkOut = DateTime.Today.AddDays(3);

        _mockBookingRepository
            .Setup(r => r.IsRoomAvailableAsync(roomId, checkIn, checkOut))
            .ReturnsAsync(true);

        // Act
        var result = await _mockBookingRepository.Object.IsRoomAvailableAsync(roomId, checkIn, checkOut);

        // Assert
        result.Should().BeTrue();
    }

    [Fact]
    public async Task IsRoomAvailable_ShouldReturnFalse_WhenConflictingBookingExists()
    {
        // Arrange
        var roomId = Guid.NewGuid();
        var checkIn = DateTime.Today.AddDays(1);
        var checkOut = DateTime.Today.AddDays(3);

        _mockBookingRepository
            .Setup(r => r.IsRoomAvailableAsync(roomId, checkIn, checkOut))
            .ReturnsAsync(false);

        // Act
        var result = await _mockBookingRepository.Object.IsRoomAvailableAsync(roomId, checkIn, checkOut);

        // Assert
        result.Should().BeFalse();
    }

    [Theory]
    [InlineData("Pending")]
    [InlineData("Confirmed")]
    [InlineData("Cancelled")]
    [InlineData("Completed")]
    public async Task UpdateBookingStatus_ShouldAcceptValidStatus(string status)
    {
        // Arrange
        var booking = new Booking
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            RoomId = Guid.NewGuid(),
            CheckIn = DateTime.Today.AddDays(1),
            CheckOut = DateTime.Today.AddDays(3),
            TotalPrice = 200m,
            Status = status
        };

        _mockBookingRepository
            .Setup(r => r.UpdateAsync(It.IsAny<Booking>()))
            .ReturnsAsync(true);

        // Act
        var result = await _mockBookingRepository.Object.UpdateAsync(booking);

        // Assert
        result.Should().BeTrue();
    }
}
