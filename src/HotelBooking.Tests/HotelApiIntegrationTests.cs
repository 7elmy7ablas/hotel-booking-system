using Xunit;
using System.Net;
using System.Net.Http.Json;
using HotelBooking.Domain.Entities;
using HotelBooking.Application.DTOs;

namespace HotelBooking.Tests;

/// <summary>
/// Integration tests for Hotel API endpoints
/// Tests all CRUD operations and edge cases
/// </summary>
public class HotelApiIntegrationTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly TestWebApplicationFactory _factory;

    public HotelApiIntegrationTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetAllHotels_ReturnsSuccessStatusCode()
    {
        // Act
        var response = await _client.GetAsync("/api/hotels");

        // Assert
        response.EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetAllHotels_ReturnsHotelsList()
    {
        // Act
        var response = await _client.GetAsync("/api/hotels");
        var hotels = await response.Content.ReadFromJsonAsync<List<HotelDto>>();

        // Assert
        Assert.NotNull(hotels);
        Assert.IsType<List<HotelDto>>(hotels);
    }

    [Fact]
    public async Task GetHotelById_WithValidId_ReturnsHotel()
    {
        // Arrange
        var hotelId = await CreateTestHotel();

        // Act
        var response = await _client.GetAsync($"/api/hotels/{hotelId}");
        var hotel = await response.Content.ReadFromJsonAsync<HotelDto>();

        // Assert
        response.EnsureSuccessStatusCode();
        Assert.NotNull(hotel);
        Assert.Equal(hotelId, hotel.Id);
    }

    [Fact]
    public async Task GetHotelById_WithInvalidId_ReturnsNotFound()
    {
        // Arrange
        var invalidId = Guid.NewGuid();

        // Act
        var response = await _client.GetAsync($"/api/hotels/{invalidId}");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task CreateHotel_WithValidData_ReturnsCreated()
    {
        // Arrange
        var newHotel = new CreateHotelDto
        {
            Name = "Test Hotel",
            Description = "A test hotel",
            Location = "123 Test St",
            City = "Test City",
            Country = "Test Country",
            Rating = 4.5m,
            Amenities = new List<string> { "WiFi", "Pool" }
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/hotels", newHotel);
        var createdHotel = await response.Content.ReadFromJsonAsync<HotelDto>();

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        Assert.NotNull(createdHotel);
        Assert.Equal(newHotel.Name, createdHotel.Name);
        Assert.NotEqual(Guid.Empty, createdHotel.Id);
    }

    [Fact]
    public async Task CreateHotel_WithInvalidData_ReturnsBadRequest()
    {
        // Arrange
        var invalidHotel = new CreateHotelDto
        {
            Name = "", // Invalid: empty name
            Description = "Test",
            Location = "Test",
            City = "Test",
            Country = "Test"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/hotels", invalidHotel);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task UpdateHotel_WithValidData_ReturnsSuccess()
    {
        // Arrange
        var hotelId = await CreateTestHotel();
        var updateDto = new UpdateHotelDto
        {
            Name = "Updated Hotel Name",
            Description = "Updated description",
            Rating = 5.0m
        };

        // Act
        var response = await _client.PutAsJsonAsync($"/api/hotels/{hotelId}", updateDto);

        // Assert
        response.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task DeleteHotel_WithValidId_ReturnsSuccess()
    {
        // Arrange
        var hotelId = await CreateTestHotel();

        // Act
        var deleteResponse = await _client.DeleteAsync($"/api/hotels/{hotelId}");
        var getResponse = await _client.GetAsync($"/api/hotels/{hotelId}");

        // Assert
        deleteResponse.EnsureSuccessStatusCode();
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
    }

    [Fact]
    public async Task SearchHotels_WithCity_ReturnsFilteredResults()
    {
        // Arrange
        await CreateTestHotel("New York");
        await CreateTestHotel("Los Angeles");

        // Act
        var response = await _client.GetAsync("/api/hotels/search?city=New York");
        var hotels = await response.Content.ReadFromJsonAsync<List<HotelDto>>();

        // Assert
        response.EnsureSuccessStatusCode();
        Assert.NotNull(hotels);
        Assert.All(hotels, h => Assert.Equal("New York", h.City));
    }

    [Fact]
    public async Task SearchHotels_WithPriceRange_ReturnsFilteredResults()
    {
        // Act
        var response = await _client.GetAsync("/api/hotels/search?minPrice=50&maxPrice=200");
        var hotels = await response.Content.ReadFromJsonAsync<List<HotelDto>>();

        // Assert
        response.EnsureSuccessStatusCode();
        Assert.NotNull(hotels);
    }

    [Fact]
    public async Task GetRoomsByHotelId_ReturnsRoomsList()
    {
        // Arrange
        var hotelId = await CreateTestHotel();

        // Act
        var response = await _client.GetAsync($"/api/hotels/{hotelId}/rooms");
        var rooms = await response.Content.ReadFromJsonAsync<List<RoomDto>>();

        // Assert
        response.EnsureSuccessStatusCode();
        Assert.NotNull(rooms);
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData(null)]
    public async Task CreateHotel_WithInvalidName_ReturnsBadRequest(string invalidName)
    {
        // Arrange
        var hotel = new CreateHotelDto
        {
            Name = invalidName,
            Description = "Test",
            Location = "Test",
            City = "Test",
            Country = "Test"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/hotels", hotel);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Theory]
    [InlineData(-1)]
    [InlineData(6)]
    [InlineData(10)]
    public async Task CreateHotel_WithInvalidRating_ReturnsBadRequest(decimal invalidRating)
    {
        // Arrange
        var hotel = new CreateHotelDto
        {
            Name = "Test Hotel",
            Description = "Test",
            Location = "Test",
            City = "Test",
            Country = "Test",
            Rating = invalidRating
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/hotels", hotel);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // Helper methods
    private async Task<Guid> CreateTestHotel(string city = "Test City")
    {
        var hotel = new CreateHotelDto
        {
            Name = $"Test Hotel {Guid.NewGuid()}",
            Description = "A test hotel",
            Location = "123 Test St",
            City = city,
            Country = "Test Country",
            Rating = 4.5m,
            Amenities = new List<string> { "WiFi", "Pool" }
        };

        var response = await _client.PostAsJsonAsync("/api/hotels", hotel);
        var createdHotel = await response.Content.ReadFromJsonAsync<HotelDto>();
        return createdHotel!.Id;
    }
}
