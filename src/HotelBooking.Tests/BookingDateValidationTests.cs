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
/// Integration tests for booking date validation
/// Spec: .specify/specs/001-hotel-booking-flow/spec.md (EC-002, EC-003, FR-005, FR-006)
/// Task: T010 - Verify POST /api/bookings returns 400 Bad Request on invalid dates
/// </summary>
public class BookingDateValidationTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public BookingDateValidationTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                var descriptor = services.SingleOrDefault(d =>
                    d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));
                if (descriptor != null)
                    services.Remove(descriptor);

                services.AddDbContext<ApplicationDbContext>(options =>
                    options.UseInMemoryDatabase($"DateValidationTestDb_{Guid.NewGuid()}"));
            });
        });
    }

    #region EC-002: CheckOut Before CheckIn

    [Fact]
    public async Task CreateBooking_WithCheckOutBeforeCheckIn_ShouldReturn400BadRequest()
    {
        // Arrange - EC-002: "checkOut ≤ checkIn (e.g., checkIn: Feb 18, checkOut: Feb 15)"
        var client = _factory.CreateClient();
        
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        var (user, room, token) = await SetupTestDataAsync(context);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var checkIn = DateTime.UtcNow.Date.AddDays(10);
        var checkOut = checkIn.AddDays(-3); // CheckOut BEFORE CheckIn

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

        // Assert - "HTTP 400 Bad Request"
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        content.Should().Contain("Check-out date must be after check-in date",
            "EC-002: Validation error message should indicate date order issue");
    }

    [Fact]
    public async Task CreateBooking_WithSameDayCheckInAndCheckOut_ShouldReturn400BadRequest()
    {
        // Arrange - EC-002: Same day (checkOut == checkIn)
        var client = _factory.CreateClient();
        
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        var (user, room, token) = await SetupTestDataAsync(context);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var sameDay = DateTime.UtcNow.Date.AddDays(10);

        var bookingRequest = new
        {
            UserId = user.Id,
            RoomId = room.Id,
            CheckIn = sameDay,
            CheckOut = sameDay, // Same day
            Status = "Pending"
        };

        // Act
        var response = await client.PostAsJsonAsync("/api/bookings", bookingRequest);
        var content = await response.Content.ReadAsStringAsync();

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        content.Should().Contain("Check-out date must be after check-in date");
    }

    [Theory]
    [InlineData(-1)]   // 1 day before
    [InlineData(-3)]   // 3 days before
    [InlineData(-7)]   // 1 week before
    [InlineData(-30)]  // 1 month before
    public async Task CreateBooking_WithCheckOutBeforeCheckIn_VariousDays_ShouldReturn400(int daysBefore)
    {
        // Arrange
        var client = _factory.CreateClient();
        
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        var (user, room, token) = await SetupTestDataAsync(context);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var checkIn = DateTime.UtcNow.Date.AddDays(15);
        var checkOut = checkIn.AddDays(daysBefore);

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

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    #endregion

    #region EC-003: Booking in the Past

    [Fact]
    public async Task CreateBooking_WithPastCheckInDate_ShouldReturn400BadRequest()
    {
        // Arrange - EC-003: "today is Jan 30, 2026, checkIn: Jan 25, 2026"
        var client = _factory.CreateClient();
        
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        var (user, room, token) = await SetupTestDataAsync(context);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var checkIn = DateTime.UtcNow.Date.AddDays(-5); // 5 days in the past
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

        // Assert - "HTTP 400 Bad Request"
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        content.Should().Contain("Check-in date cannot be in the past",
            "EC-003: Validation error message should indicate past date issue");
    }

    [Theory]
    [InlineData(-1)]    // Yesterday
    [InlineData(-7)]    // Last week
    [InlineData(-30)]   // Last month
    [InlineData(-365)]  // Last year
    public async Task CreateBooking_WithPastCheckInDate_VariousDays_ShouldReturn400(int daysInPast)
    {
        // Arrange
        var client = _factory.CreateClient();
        
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        var (user, room, token) = await SetupTestDataAsync(context);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var checkIn = DateTime.UtcNow.Date.AddDays(daysInPast);
        var checkOut = DateTime.UtcNow.Date.AddDays(Math.Abs(daysInPast) + 3); // Future checkout

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

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [Fact]
    public async Task CreateBooking_WithTodayCheckIn_ShouldSucceed()
    {
        // Arrange - Today should be allowed (boundary case)
        var client = _factory.CreateClient();
        
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        var (user, room, token) = await SetupTestDataAsync(context);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var checkIn = DateTime.UtcNow.Date; // Today
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

        // Assert - Today should be allowed (FR-006: CheckIn ≥ today)
        response.StatusCode.Should().BeOneOf(HttpStatusCode.Created, HttpStatusCode.OK);
    }

    #endregion

    #region Duration Validation

    [Fact]
    public async Task CreateBooking_ExceedingMaxDuration_ShouldReturn400BadRequest()
    {
        // Arrange - Max duration is 30 days (from BookingValidationService)
        var client = _factory.CreateClient();
        
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        var (user, room, token) = await SetupTestDataAsync(context);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var checkIn = DateTime.UtcNow.Date.AddDays(5);
        var checkOut = checkIn.AddDays(31); // Exceeds 30-day max

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
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
        content.Should().Contain("30 days", "Should mention max duration limit");
    }

    [Fact]
    public async Task CreateBooking_AtMaxDuration30Days_ShouldSucceed()
    {
        // Arrange - Exactly 30 days should be allowed
        var client = _factory.CreateClient();
        
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        var (user, room, token) = await SetupTestDataAsync(context);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var checkIn = DateTime.UtcNow.Date.AddDays(5);
        var checkOut = checkIn.AddDays(30); // Exactly 30 days

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

        // Assert
        response.StatusCode.Should().BeOneOf(
            new[] { HttpStatusCode.Created, HttpStatusCode.OK },
            "30-day booking at maximum limit should be accepted");
    }

    #endregion

    #region Combined Invalid Date Scenarios

    [Fact]
    public async Task CreateBooking_WithPastCheckInAndCheckOutBeforeCheckIn_ShouldReturn400()
    {
        // Arrange - Both EC-002 AND EC-003 violated
        var client = _factory.CreateClient();
        
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        var (user, room, token) = await SetupTestDataAsync(context);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var checkIn = DateTime.UtcNow.Date.AddDays(-5);  // Past
        var checkOut = checkIn.AddDays(-3);              // Before checkIn

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

        // Assert
        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    #endregion

    #region Valid Date Scenarios (Positive Tests)

    [Theory]
    [InlineData(1, 2)]    // Tomorrow, 2-day stay
    [InlineData(7, 3)]    // Next week, 3-day stay
    [InlineData(30, 7)]   // Next month, 1-week stay
    [InlineData(90, 14)]  // 3 months out, 2-week stay
    public async Task CreateBooking_WithValidFutureDates_ShouldSucceed(int daysFromNow, int duration)
    {
        // Arrange
        var client = _factory.CreateClient();
        
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        var (user, room, token) = await SetupTestDataAsync(context);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);

        var checkIn = DateTime.UtcNow.Date.AddDays(daysFromNow);
        var checkOut = checkIn.AddDays(duration);

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

        // Assert
        response.StatusCode.Should().BeOneOf(HttpStatusCode.Created, HttpStatusCode.OK);
    }

    #endregion

    #region Helper Methods

    private async Task<(User user, Room room, string token)> SetupTestDataAsync(ApplicationDbContext context)
    {
        await context.Database.EnsureCreatedAsync();

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

        var hotel = new Hotel
        {
            Id = Guid.NewGuid(),
            Name = "Test Hotel",
            Location = "Test Location",
            Description = "Test Description",
            Rating = 4.0m,
            Amenities = "WiFi",
            IsDeleted = false
        };
        context.Hotels.Add(hotel);

        var room = new Room
        {
            Id = Guid.NewGuid(),
            HotelId = hotel.Id,
            RoomType = "Standard",
            PricePerNight = 100.00m,
            Capacity = 2,
            IsAvailable = true,
            IsDeleted = false
        };
        context.Rooms.Add(room);

        await context.SaveChangesAsync();

        var token = GenerateMockToken(user.Id.ToString());

        return (user, room, token);
    }

    private string GenerateMockToken(string userId)
    {
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
}
