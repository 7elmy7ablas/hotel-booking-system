using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using FluentAssertions;
using HotelBooking.Domain.Entities;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using HotelBooking.Infrastructure.Data;
using Xunit;

namespace HotelBooking.Tests;

/// <summary>
/// Integration tests for server-side price calculation
/// Spec: .specify/specs/001-hotel-booking-flow/spec.md (FR-003, US3-AC2)
/// Task: T011 - Verify server-side price calculation overrides client value
/// 
/// These tests verify the controller calculates TotalPrice = nights × PricePerNight
/// and ignores any client-provided TotalPrice value.
/// </summary>
public class PriceCalculationIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public PriceCalculationIntegrationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                // Remove existing DbContext
                var descriptor = services.SingleOrDefault(d =>
                    d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));
                if (descriptor != null)
                    services.Remove(descriptor);

                // Add in-memory database for testing
                services.AddDbContext<ApplicationDbContext>(options =>
                    options.UseInMemoryDatabase($"PriceCalcTestDb_{Guid.NewGuid()}"));
            });
        });
    }

    #region FR-003: Server-Side Price Calculation

    [Fact]
    public async Task CreateBooking_ShouldCalculatePriceServerSide_IgnoringClientValue()
    {
        // Arrange
        var client = _factory.CreateClient();
        
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        var (user, room, token) = await SetupTestDataAsync(context, pricePerNight: 150.00m);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var checkIn = DateTime.UtcNow.Date.AddDays(10);
        var checkOut = checkIn.AddDays(3); // 3 nights

        // Client provides WRONG TotalPrice
        var bookingRequest = new
        {
            UserId = user.Id,
            RoomId = room.Id,
            CheckIn = checkIn,
            CheckOut = checkOut,
            TotalPrice = 999.99m, // Wrong value - should be 450
            Status = "Pending"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/bookings", bookingRequest);
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var createdBooking = JsonSerializer.Deserialize<BookingResponse>(content, _jsonOptions);
        createdBooking.Should().NotBeNull();
        
        // Server MUST calculate: 3 nights × $150 = $450
        createdBooking!.TotalPrice.Should().Be(450.00m,
            "Server must calculate TotalPrice = nights × PricePerNight, ignoring client value");
    }

    [Theory]
    [InlineData(1, 100.00, 100.00)]      // 1 night
    [InlineData(3, 150.00, 450.00)]      // 3 nights (US3-AC1 example)
    [InlineData(7, 200.00, 1400.00)]     // 1 week
    [InlineData(14, 175.50, 2457.00)]    // 2 weeks with decimal price
    public async Task CreateBooking_ShouldCalculateCorrectTotalPrice(
        int nights, decimal pricePerNight, decimal expectedTotal)
    {
        // Arrange
        var client = _factory.CreateClient();
        
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        var (user, room, token) = await SetupTestDataAsync(context, pricePerNight);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var checkIn = DateTime.UtcNow.Date.AddDays(10);
        var checkOut = checkIn.AddDays(nights);

        var bookingRequest = new
        {
            UserId = user.Id,
            RoomId = room.Id,
            CheckIn = checkIn,
            CheckOut = checkOut,
            TotalPrice = 0m, // Client sends 0
            Status = "Pending"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/bookings", bookingRequest);
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var createdBooking = JsonSerializer.Deserialize<BookingResponse>(content, _jsonOptions);
        createdBooking!.TotalPrice.Should().Be(expectedTotal,
            $"Server should calculate: {nights} nights × ${pricePerNight} = ${expectedTotal}");
    }

    [Fact]
    public async Task CreateBooking_WithNegativeClientTotalPrice_ShouldStillCalculateCorrectly()
    {
        // Arrange
        var client = _factory.CreateClient();
        
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        var (user, room, token) = await SetupTestDataAsync(context, pricePerNight: 200.00m);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var checkIn = DateTime.UtcNow.Date.AddDays(10);
        var checkOut = checkIn.AddDays(5);

        var bookingRequest = new
        {
            UserId = user.Id,
            RoomId = room.Id,
            CheckIn = checkIn,
            CheckOut = checkOut,
            TotalPrice = -500.00m, // Malicious negative value
            Status = "Pending"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/bookings", bookingRequest);
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var createdBooking = JsonSerializer.Deserialize<BookingResponse>(content, _jsonOptions);
        createdBooking!.TotalPrice.Should().Be(1000.00m,
            "Server must override negative client value: 5 nights × $200 = $1000");
    }

    [Fact]
    public async Task CreateBooking_WithAbsurdlyHighClientTotalPrice_ShouldStillCalculateCorrectly()
    {
        // Arrange
        var client = _factory.CreateClient();
        
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        var (user, room, token) = await SetupTestDataAsync(context, pricePerNight: 100.00m);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var checkIn = DateTime.UtcNow.Date.AddDays(10);
        var checkOut = checkIn.AddDays(2);

        var bookingRequest = new
        {
            UserId = user.Id,
            RoomId = room.Id,
            CheckIn = checkIn,
            CheckOut = checkOut,
            TotalPrice = 9999999.99m, // Absurdly high value
            Status = "Pending"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/bookings", bookingRequest);
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var createdBooking = JsonSerializer.Deserialize<BookingResponse>(content, _jsonOptions);
        createdBooking!.TotalPrice.Should().Be(200.00m,
            "Server must override absurd client value: 2 nights × $100 = $200");
    }

    #endregion

    #region US3-AC3: Response Includes Correct TotalPrice

    [Fact]
    public async Task CreateBooking_ResponseShouldIncludeTotalPrice()
    {
        // Arrange
        var client = _factory.CreateClient();
        
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        var (user, room, token) = await SetupTestDataAsync(context, pricePerNight: 175.00m);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var checkIn = DateTime.UtcNow.Date.AddDays(15);
        var checkOut = checkIn.AddDays(4);

        var bookingRequest = new
        {
            UserId = user.Id,
            RoomId = room.Id,
            CheckIn = checkIn,
            CheckOut = checkOut,
            Status = "Pending"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/bookings", bookingRequest);
        var content = await response.Content.ReadAsStringAsync();

        // Assert - US3-AC3: Response includes Total price
        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var createdBooking = JsonSerializer.Deserialize<BookingResponse>(content, _jsonOptions);
        createdBooking.Should().NotBeNull();
        createdBooking!.Id.Should().NotBeEmpty();
        createdBooking.TotalPrice.Should().Be(700.00m); // 4 nights × $175
        createdBooking.CheckIn.Date.Should().Be(checkIn.Date);
        createdBooking.CheckOut.Date.Should().Be(checkOut.Date);
    }

    #endregion

    #region Decimal Precision Tests (NFR-004)

    [Theory]
    [InlineData(123.45)]
    [InlineData(99.99)]
    [InlineData(0.01)]
    public async Task CreateBooking_ShouldMaintainDecimalPrecision(decimal pricePerNight)
    {
        // Arrange - NFR-004: "All monetary values MUST use decimal(18,2) precision"
        var client = _factory.CreateClient();
        
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        var (user, room, token) = await SetupTestDataAsync(context, pricePerNight);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var checkIn = DateTime.UtcNow.Date.AddDays(10);
        var checkOut = checkIn.AddDays(3);

        var bookingRequest = new
        {
            UserId = user.Id,
            RoomId = room.Id,
            CheckIn = checkIn,
            CheckOut = checkOut,
            Status = "Pending"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/bookings", bookingRequest);
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.Created);

        var createdBooking = JsonSerializer.Deserialize<BookingResponse>(content, _jsonOptions);
        var expectedTotal = 3 * pricePerNight;
        createdBooking!.TotalPrice.Should().Be(expectedTotal,
            $"Decimal precision must be maintained: 3 × {pricePerNight} = {expectedTotal}");
    }

    #endregion

    #region Helper Methods

    private async Task<(User user, Room room, string token)> SetupTestDataAsync(
        ApplicationDbContext context, decimal pricePerNight)
    {
        // Ensure database is created
        await context.Database.EnsureCreatedAsync();

        // Create user
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = $"test_{Guid.NewGuid():N}@example.com",
            FullName = "Test User",
            PasswordHash = "hashed_password",
            Role = "Customer",
            IsDeleted = false
        };
        context.Users.Add(user);

        // Create hotel
        var hotel = new Hotel
        {
            Id = Guid.NewGuid(),
            Name = "Test Hotel",
            Location = "Test Location",
            Description = "Test Description",
            Rating = 4.5m,
            Amenities = "WiFi, Pool",
            IsDeleted = false
        };
        context.Hotels.Add(hotel);

        // Create room with specified price
        var room = new Room
        {
            Id = Guid.NewGuid(),
            HotelId = hotel.Id,
            RoomType = "Deluxe",
            PricePerNight = pricePerNight,
            Capacity = 2,
            IsAvailable = true,
            IsDeleted = false
        };
        context.Rooms.Add(room);

        await context.SaveChangesAsync();

        // Generate mock JWT token
        var token = GenerateMockToken(user.Id.ToString());

        return (user, room, token);
    }

    private string GenerateMockToken(string userId)
    {
        // This is a simplified token for testing
        // In real tests, you'd use the actual token generation service
        var tokenHandler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
        var key = System.Text.Encoding.ASCII.GetBytes("ThisIsAVeryLongSecretKeyForTestingPurposesOnly123456!");
        
        var tokenDescriptor = new Microsoft.IdentityModel.Tokens.SecurityTokenDescriptor
        {
            Subject = new System.Security.Claims.ClaimsIdentity(new[]
            {
                new System.Security.Claims.Claim("userId", userId),
                new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Role, "Customer")
            }),
            Expires = DateTime.UtcNow.AddHours(1),
            SigningCredentials = new Microsoft.IdentityModel.Tokens.SigningCredentials(
                new Microsoft.IdentityModel.Tokens.SymmetricSecurityKey(key),
                Microsoft.IdentityModel.Tokens.SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    #endregion

    #region Response Models

    private class BookingResponse
    {
        public Guid Id { get; set; }
        public Guid RoomId { get; set; }
        public Guid UserId { get; set; }
        public DateTime CheckIn { get; set; }
        public DateTime CheckOut { get; set; }
        public decimal TotalPrice { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    #endregion
}
