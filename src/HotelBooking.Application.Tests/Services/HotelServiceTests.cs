using FluentAssertions;
using HotelBooking.Application.Tests;
using HotelBooking.Domain.Entities;
using Moq;
using Xunit;

namespace HotelBooking.Application.Tests.Services;

public class HotelServiceTests
{
    private readonly Mock<IHotelRepository> _mockHotelRepository;

    public HotelServiceTests()
    {
        _mockHotelRepository = new Mock<IHotelRepository>();
    }

    [Fact]
    public async Task GetAllHotels_ShouldReturnHotels_WhenHotelsExist()
    {
        // Arrange
        var expectedHotels = new List<Hotel>
        {
            new Hotel { Id = Guid.NewGuid(), Name = "Grand Hotel", Location = "Cairo" },
            new Hotel { Id = Guid.NewGuid(), Name = "Beach Resort", Location = "Sharm El Sheikh" }
        };

        _mockHotelRepository
            .Setup(r => r.GetAllAsync())
            .ReturnsAsync(expectedHotels);

        // Act
        var result = await _mockHotelRepository.Object.GetAllAsync();

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(2);
    }

    [Fact]
    public async Task GetHotelById_ShouldReturnHotel_WhenHotelExists()
    {
        // Arrange
        var hotelId = Guid.NewGuid();
        var expectedHotel = new Hotel
        {
            Id = hotelId,
            Name = "Grand Hotel",
            Location = "Cairo",
            Description = "Luxury hotel"
        };

        _mockHotelRepository
            .Setup(r => r.GetByIdAsync(hotelId))
            .ReturnsAsync(expectedHotel);

        // Act
        var result = await _mockHotelRepository.Object.GetByIdAsync(hotelId);

        // Assert
        result.Should().NotBeNull();
        result!.Id.Should().Be(hotelId);
        result.Name.Should().Be("Grand Hotel");
    }

    [Fact]
    public async Task GetHotelById_ShouldReturnNull_WhenHotelNotFound()
    {
        // Arrange
        var hotelId = Guid.NewGuid();

        _mockHotelRepository
            .Setup(r => r.GetByIdAsync(hotelId))
            .ReturnsAsync((Hotel?)null);

        // Act
        var result = await _mockHotelRepository.Object.GetByIdAsync(hotelId);

        // Assert
        result.Should().BeNull();
    }

    [Fact]
    public async Task SearchHotels_ShouldReturnFilteredHotels_WhenLocationMatches()
    {
        // Arrange
        var location = "Cairo";
        var expectedHotels = new List<Hotel>
        {
            new Hotel { Id = Guid.NewGuid(), Name = "Grand Hotel", Location = location },
            new Hotel { Id = Guid.NewGuid(), Name = "City Hotel", Location = location }
        };

        _mockHotelRepository
            .Setup(r => r.SearchByLocationAsync(location))
            .ReturnsAsync(expectedHotels);

        // Act
        var result = await _mockHotelRepository.Object.SearchByLocationAsync(location);

        // Assert
        result.Should().NotBeNull();
        result.Should().HaveCount(2);
        result.Should().OnlyContain(h => h.Location == location);
    }

    [Theory]
    [InlineData("Cairo")]
    [InlineData("Alexandria")]
    [InlineData("Luxor")]
    public async Task SearchHotels_ShouldReturnCorrectLocation_ForDifferentLocations(string location)
    {
        // Arrange
        var expectedHotels = new List<Hotel>
        {
            new Hotel { Id = Guid.NewGuid(), Name = "Hotel 1", Location = location }
        };

        _mockHotelRepository
            .Setup(r => r.SearchByLocationAsync(location))
            .ReturnsAsync(expectedHotels);

        // Act
        var result = await _mockHotelRepository.Object.SearchByLocationAsync(location);

        // Assert
        result.Should().NotBeNull();
        result.Should().OnlyContain(h => h.Location == location);
    }

    [Fact]
    public async Task CreateHotel_ShouldReturnNewHotel_WhenDataIsValid()
    {
        // Arrange
        var newHotel = new Hotel
        {
            Name = "New Hotel",
            Location = "Cairo, Egypt",
            Description = "A new hotel",
            Rating = 4.5m
        };

        _mockHotelRepository
            .Setup(r => r.AddAsync(It.IsAny<Hotel>()))
            .ReturnsAsync(newHotel);

        // Act
        var result = await _mockHotelRepository.Object.AddAsync(newHotel);

        // Assert
        result.Should().NotBeNull();
        result.Name.Should().Be("New Hotel");
        _mockHotelRepository.Verify(r => r.AddAsync(It.IsAny<Hotel>()), Times.Once);
    }

    [Fact]
    public async Task DeleteHotel_ShouldReturnTrue_WhenHotelDeleted()
    {
        // Arrange
        var hotelId = Guid.NewGuid();

        _mockHotelRepository
            .Setup(r => r.DeleteAsync(hotelId))
            .ReturnsAsync(true);

        // Act
        var result = await _mockHotelRepository.Object.DeleteAsync(hotelId);

        // Assert
        result.Should().BeTrue();
    }
}
