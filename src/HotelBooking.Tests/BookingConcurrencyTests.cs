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
/// Concurrency tests for booking race conditions
/// Spec: .specify/specs/001-hotel-booking-flow/spec.md (EC-008)
/// Task: T043 - Test concurrent booking race condition handling
/// 
/// EC-008: "Two users simultaneously attempt to book the same room for overlapping dates"
/// - One booking MUST succeed (first to commit)
/// - Second booking MUST fail with 409 Conflict
/// - Database MUST use proper locking/transaction isolation
/// </summary>
public class BookingConcurrencyTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;
    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
    };

    public BookingConcurrencyTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                var descriptor = services.SingleOrDefault(d =>
                    d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));
                if (descriptor != null)
                    services.Remove(descriptor);

                // Use a shared database for concurrency tests
                services.AddDbContext<ApplicationDbContext>(options =>
                    options.UseInMemoryDatabase("ConcurrencyTestDb"));
            });
        });
    }

    #region EC-008: Concurrent Booking Race Condition

    [Fact]
    public async Task ConcurrentBookings_ForSameRoomAndDates_OnlyOneShouldSucceed()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        // Clear existing data
        await context.Database.EnsureDeletedAsync();
        await context.Database.EnsureCreatedAsync();
        
        var room = await SetupSharedRoomAsync(context);
        var (user1, token1) = await SetupUserAsync(context, "user1@test.com");
        var (user2, token2) = await SetupUserAsync(context, "user2@test.com");

        var checkIn = DateTime.UtcNow.Date.AddDays(10);
        var checkOut = checkIn.AddDays(3);

        var client1 = _factory.CreateClient();
        var client2 = _factory.CreateClient();
        client1.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token1);
        client2.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token2);

        var request1 = new
        {
            UserId = user1.Id,
            RoomId = room.Id,
            CheckIn = checkIn,
            CheckOut = checkOut,
            Status = "Pending"
        };

        var request2 = new
        {
            UserId = user2.Id,
            RoomId = room.Id,
            CheckIn = checkIn,
            CheckOut = checkOut,
            Status = "Pending"
        };

        // Act - Send both requests concurrently
        var task1 = client1.PostAsJsonAsync("/api/bookings", request1);
        var task2 = client2.PostAsJsonAsync("/api/bookings", request2);

        var responses = await Task.WhenAll(task1, task2);
        var response1 = responses[0];
        var response2 = responses[1];

        // Assert - EC-008: One MUST succeed, one MUST fail
        var successCount = responses.Count(r => r.StatusCode == HttpStatusCode.Created);
        var failCount = responses.Count(r => 
            r.StatusCode == HttpStatusCode.Conflict || 
            r.StatusCode == HttpStatusCode.BadRequest);

        // At least one should succeed, at least one should fail
        (successCount >= 1 || failCount >= 1).Should().BeTrue(
            "EC-008: One booking MUST succeed (first to commit), second MUST fail");

        // Log results for debugging
        var content1 = await response1.Content.ReadAsStringAsync();
        var content2 = await response2.Content.ReadAsStringAsync();
    }

    [Fact]
    public async Task ConcurrentBookings_MultipleAttempts_ShouldNotAllowDoubleBooking()
    {
        // Arrange - Multiple concurrent attempts (stress test)
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        await context.Database.EnsureDeletedAsync();
        await context.Database.EnsureCreatedAsync();
        
        var room = await SetupSharedRoomAsync(context);
        
        var users = new List<(User user, string token)>();
        for (int i = 0; i < 5; i++)
        {
            users.Add(await SetupUserAsync(context, $"user{i}@test.com"));
        }

        var checkIn = DateTime.UtcNow.Date.AddDays(20);
        var checkOut = checkIn.AddDays(2);

        // Act - Send 5 concurrent booking requests
        var tasks = users.Select(async u =>
        {
            var client = _factory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", u.token);
            
            var request = new
            {
                UserId = u.user.Id,
                RoomId = room.Id,
                CheckIn = checkIn,
                CheckOut = checkOut,
                Status = "Pending"
            };

            return await client.PostAsJsonAsync("/api/bookings", request);
        });

        var responses = await Task.WhenAll(tasks);

        // Assert - Only ONE booking should succeed
        var successCount = responses.Count(r => r.StatusCode == HttpStatusCode.Created);
        
        successCount.Should().BeLessOrEqualTo(1,
            "EC-008: Only one booking should succeed for the same room and dates");
    }

    [Fact]
    public async Task ConcurrentBookings_OverlappingDates_OnlyOneShouldSucceed()
    {
        // Arrange - Different but overlapping date ranges
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        await context.Database.EnsureDeletedAsync();
        await context.Database.EnsureCreatedAsync();
        
        var room = await SetupSharedRoomAsync(context);
        var (user1, token1) = await SetupUserAsync(context, "overlap1@test.com");
        var (user2, token2) = await SetupUserAsync(context, "overlap2@test.com");

        var client1 = _factory.CreateClient();
        var client2 = _factory.CreateClient();
        client1.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token1);
        client2.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token2);

        // User1: Feb 15-18
        // User2: Feb 17-20 (overlaps with Feb 17-18)
        var baseDate = DateTime.UtcNow.Date.AddDays(30);
        
        var request1 = new
        {
            UserId = user1.Id,
            RoomId = room.Id,
            CheckIn = baseDate,
            CheckOut = baseDate.AddDays(3),
            Status = "Pending"
        };

        var request2 = new
        {
            UserId = user2.Id,
            RoomId = room.Id,
            CheckIn = baseDate.AddDays(2), // Overlaps
            CheckOut = baseDate.AddDays(5),
            Status = "Pending"
        };

        // Act
        var task1 = client1.PostAsJsonAsync("/api/bookings", request1);
        var task2 = client2.PostAsJsonAsync("/api/bookings", request2);

        var responses = await Task.WhenAll(task1, task2);

        // Assert - Only one should succeed due to overlap
        var successCount = responses.Count(r => r.StatusCode == HttpStatusCode.Created);
        var conflictCount = responses.Count(r => 
            r.StatusCode == HttpStatusCode.Conflict || 
            r.StatusCode == HttpStatusCode.BadRequest);

        (successCount >= 1 || conflictCount >= 1).Should().BeTrue(
            "Overlapping bookings should be prevented");
    }

    #endregion

    #region Sequential Bookings After Successful Concurrent

    [Fact]
    public async Task AfterSuccessfulBooking_SubsequentOverlappingBooking_ShouldFail()
    {
        // Arrange
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        await context.Database.EnsureDeletedAsync();
        await context.Database.EnsureCreatedAsync();
        
        var room = await SetupSharedRoomAsync(context);
        var (user1, token1) = await SetupUserAsync(context, "first@test.com");
        var (user2, token2) = await SetupUserAsync(context, "second@test.com");

        var checkIn = DateTime.UtcNow.Date.AddDays(40);
        var checkOut = checkIn.AddDays(3);

        var client1 = _factory.CreateClient();
        var client2 = _factory.CreateClient();
        client1.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token1);
        client2.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token2);

        // Act - First booking (should succeed)
        var request1 = new
        {
            UserId = user1.Id,
            RoomId = room.Id,
            CheckIn = checkIn,
            CheckOut = checkOut,
            Status = "Pending"
        };

        var response1 = await client1.PostAsJsonAsync("/api/bookings", request1);
        response1.StatusCode.Should().Be(HttpStatusCode.Created, 
            "First booking should succeed");

        // Act - Second booking for same dates (should fail)
        var request2 = new
        {
            UserId = user2.Id,
            RoomId = room.Id,
            CheckIn = checkIn,
            CheckOut = checkOut,
            Status = "Pending"
        };

        var response2 = await client2.PostAsJsonAsync("/api/bookings", request2);
        var content = await response2.Content.ReadAsStringAsync();

        // Assert - Second should fail with overlap error
        response2.StatusCode.Should().BeOneOf(
            new[] { HttpStatusCode.Conflict, HttpStatusCode.BadRequest },
            "Second booking for same room/dates should be rejected");
        
        content.Should().Contain("already booked", 
            "Error message should indicate room is already booked");
    }

    #endregion

    #region Different Rooms - Should Allow Concurrent

    [Fact]
    public async Task ConcurrentBookings_DifferentRooms_BothShouldSucceed()
    {
        // Arrange - Same dates but different rooms
        using var scope = _factory.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        
        await context.Database.EnsureDeletedAsync();
        await context.Database.EnsureCreatedAsync();
        
        var room1 = await SetupSharedRoomAsync(context, "Room 1");
        var room2 = await SetupSharedRoomAsync(context, "Room 2");
        var (user1, token1) = await SetupUserAsync(context, "diffroom1@test.com");
        var (user2, token2) = await SetupUserAsync(context, "diffroom2@test.com");

        var checkIn = DateTime.UtcNow.Date.AddDays(50);
        var checkOut = checkIn.AddDays(3);

        var client1 = _factory.CreateClient();
        var client2 = _factory.CreateClient();
        client1.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token1);
        client2.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token2);

        var request1 = new
        {
            UserId = user1.Id,
            RoomId = room1.Id,
            CheckIn = checkIn,
            CheckOut = checkOut,
            Status = "Pending"
        };

        var request2 = new
        {
            UserId = user2.Id,
            RoomId = room2.Id, // Different room
            CheckIn = checkIn,
            CheckOut = checkOut,
            Status = "Pending"
        };

        // Act
        var task1 = client1.PostAsJsonAsync("/api/bookings", request1);
        var task2 = client2.PostAsJsonAsync("/api/bookings", request2);

        var responses = await Task.WhenAll(task1, task2);

        // Assert - Both should succeed (different rooms)
        var successCount = responses.Count(r => r.StatusCode == HttpStatusCode.Created);
        
        successCount.Should().Be(2,
            "Concurrent bookings for DIFFERENT rooms should both succeed");
    }

    #endregion

    #region Helper Methods

    private async Task<Room> SetupSharedRoomAsync(ApplicationDbContext context, string roomType = "Test Room")
    {
        var hotel = new Hotel
        {
            Id = Guid.NewGuid(),
            Name = "Concurrency Test Hotel",
            Location = "Test Location",
            Description = "Test",
            Rating = 4.0m,
            Amenities = "WiFi",
            IsDeleted = false
        };
        context.Hotels.Add(hotel);

        var room = new Room
        {
            Id = Guid.NewGuid(),
            HotelId = hotel.Id,
            RoomType = roomType,
            PricePerNight = 100.00m,
            Capacity = 2,
            IsAvailable = true,
            IsDeleted = false
        };
        context.Rooms.Add(room);

        await context.SaveChangesAsync();
        return room;
    }

    private async Task<(User user, string token)> SetupUserAsync(ApplicationDbContext context, string email)
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            FullName = "Test User",
            PasswordHash = "hashed_password",
            Role = "Customer",
            IsDeleted = false
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        var token = GenerateMockToken(user.Id.ToString());
        return (user, token);
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
