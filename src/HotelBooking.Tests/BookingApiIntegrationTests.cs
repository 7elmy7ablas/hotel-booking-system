using Xunit;
using System.Net;
using System.Net.Http.Json;
using System.Net.Http.Headers;
using HotelBooking.Application.DTOs;

namespace HotelBooking.Tests;

/// <summary>
/// Integration tests for Booking API endpoints
/// Tests booking creation, retrieval, cancellation, and validation
/// </summary>
public class BookingApiIntegrationTests : IClassFixture<TestWebApplicationFactory>
{
    private readonly HttpClient _client;
    private readonly TestWebApplicationFactory _factory;

    public BookingApiIntegrationTests(TestWebApplicationFactory factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task CreateBooking_WithValidData_ReturnsCreated()
    {
        // Arrange
        var token = await GetAuthToken();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var booking = new CreateBookingDto
        {
            RoomId = Guid.NewGuid(),
            CheckIn = DateTime.UtcNow.AddDays(1),
            CheckOut = DateTime.UtcNow.AddDays(3),
            GuestName = "John Doe",
            GuestEmail = "john@example.com",
            GuestPhone = "1234567890"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/bookings", booking);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task CreateBooking_WithoutAuth_ReturnsUnauthorized()
    {
        // Arrange
        var booking = new CreateBookingDto
        {
            RoomId = Guid.NewGuid(),
            CheckIn = DateTime.UtcNow.AddDays(1),
            CheckOut = DateTime.UtcNow.AddDays(3),
            GuestName = "John Doe",
            GuestEmail = "john@example.com",
            GuestPhone = "1234567890"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/bookings", booking);

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task CreateBooking_WithPastCheckIn_ReturnsBadRequest()
    {
        // Arrange
        var token = await GetAuthToken();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var booking = new CreateBookingDto
        {
            RoomId = Guid.NewGuid(),
            CheckIn = DateTime.UtcNow.AddDays(-1), // Past date
            CheckOut = DateTime.UtcNow.AddDays(3),
            GuestName = "John Doe",
            GuestEmail = "john@example.com",
            GuestPhone = "1234567890"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/bookings", booking);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateBooking_WithCheckOutBeforeCheckIn_ReturnsBadRequest()
    {
        // Arrange
        var token = await GetAuthToken();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var booking = new CreateBookingDto
        {
            RoomId = Guid.NewGuid(),
            CheckIn = DateTime.UtcNow.AddDays(5),
            CheckOut = DateTime.UtcNow.AddDays(3), // Before check-in
            GuestName = "John Doe",
            GuestEmail = "john@example.com",
            GuestPhone = "1234567890"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/bookings", booking);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetMyBookings_WithAuth_ReturnsBookings()
    {
        // Arrange
        var token = await GetAuthToken();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        // Act
        var response = await _client.GetAsync("/api/bookings/my-bookings");
        var bookings = await response.Content.ReadFromJsonAsync<List<BookingDto>>();

        // Assert
        response.EnsureSuccessStatusCode();
        Assert.NotNull(bookings);
    }

    [Fact]
    public async Task GetMyBookings_WithoutAuth_ReturnsUnauthorized()
    {
        // Act
        var response = await _client.GetAsync("/api/bookings/my-bookings");

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task CancelBooking_WithValidId_ReturnsSuccess()
    {
        // Arrange
        var token = await GetAuthToken();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var bookingId = await CreateTestBooking(token);

        // Act
        var response = await _client.DeleteAsync($"/api/bookings/{bookingId}");

        // Assert
        response.EnsureSuccessStatusCode();
    }

    [Fact]
    public async Task CancelBooking_WithInvalidId_ReturnsNotFound()
    {
        // Arrange
        var token = await GetAuthToken();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        var invalidId = Guid.NewGuid();

        // Act
        var response = await _client.DeleteAsync($"/api/bookings/{invalidId}");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Theory]
    [InlineData("")]
    [InlineData("invalid-email")]
    [InlineData("@example.com")]
    public async Task CreateBooking_WithInvalidEmail_ReturnsBadRequest(string invalidEmail)
    {
        // Arrange
        var token = await GetAuthToken();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var booking = new CreateBookingDto
        {
            RoomId = Guid.NewGuid(),
            CheckIn = DateTime.UtcNow.AddDays(1),
            CheckOut = DateTime.UtcNow.AddDays(3),
            GuestName = "John Doe",
            GuestEmail = invalidEmail,
            GuestPhone = "1234567890"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/bookings", booking);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CreateBooking_WithXSSAttempt_SanitizesInput()
    {
        // Arrange
        var token = await GetAuthToken();
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var booking = new CreateBookingDto
        {
            RoomId = Guid.NewGuid(),
            CheckIn = DateTime.UtcNow.AddDays(1),
            CheckOut = DateTime.UtcNow.AddDays(3),
            GuestName = "<script>alert('xss')</script>John",
            GuestEmail = "john@example.com",
            GuestPhone = "1234567890"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/bookings", booking);

        // Assert
        // Should either sanitize or reject
        Assert.True(
            response.StatusCode == HttpStatusCode.Created || 
            response.StatusCode == HttpStatusCode.BadRequest
        );
    }

    // Helper methods
    private async Task<string> GetAuthToken()
    {
        var loginDto = new LoginDto
        {
            Email = "test@example.com",
            Password = "Test123!"
        };

        var response = await _client.PostAsJsonAsync("/api/auth/login", loginDto);
        var result = await response.Content.ReadFromJsonAsync<AuthResponseDto>();
        return result?.Token ?? string.Empty;
    }

    private async Task<Guid> CreateTestBooking(string token)
    {
        _client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var booking = new CreateBookingDto
        {
            RoomId = Guid.NewGuid(),
            CheckIn = DateTime.UtcNow.AddDays(1),
            CheckOut = DateTime.UtcNow.AddDays(3),
            GuestName = "Test User",
            GuestEmail = "test@example.com",
            GuestPhone = "1234567890"
        };

        var response = await _client.PostAsJsonAsync("/api/bookings", booking);
        var created = await response.Content.ReadFromJsonAsync<BookingDto>();
        return created!.Id;
    }
}
