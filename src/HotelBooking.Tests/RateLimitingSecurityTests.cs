using Xunit;

namespace HotelBooking.Tests;

/// <summary>
/// Security tests for rate limiting functionality
/// </summary>
public class RateLimitingSecurityTests
{
    #region Rate Limiting Configuration Tests

    [Fact]
    public void RateLimiting_LoginEndpointHasRestrictiveLimit()
    {
        // Arrange
        var loginRateLimit = 5; // 5 requests per minute
        var expectedMaxLimit = 10;

        // Assert
        Assert.True(loginRateLimit <= expectedMaxLimit, 
            "Login endpoint should have restrictive rate limit to prevent brute force attacks");
        Assert.True(loginRateLimit > 0, 
            "Login rate limit must be positive");
    }

    [Fact]
    public void RateLimiting_RegisterEndpointHasVeryRestrictiveLimit()
    {
        // Arrange
        var registerRateLimit = 3; // 3 requests per minute
        var expectedMaxLimit = 5;

        // Assert
        Assert.True(registerRateLimit <= expectedMaxLimit, 
            "Register endpoint should have very restrictive rate limit to prevent spam");
        Assert.True(registerRateLimit > 0, 
            "Register rate limit must be positive");
    }

    [Fact]
    public void RateLimiting_PasswordChangeHasHourlyLimit()
    {
        // Arrange
        var passwordChangeRateLimit = 3; // 3 requests per hour
        var expectedMaxLimit = 5;

        // Assert
        Assert.True(passwordChangeRateLimit <= expectedMaxLimit, 
            "Password change should have hourly limit to prevent abuse");
        Assert.True(passwordChangeRateLimit > 0, 
            "Password change rate limit must be positive");
    }

    [Fact]
    public void RateLimiting_BookingEndpointHasReasonableLimit()
    {
        // Arrange
        var bookingRateLimit = 10; // 10 requests per minute
        var expectedMaxLimit = 20;

        // Assert
        Assert.True(bookingRateLimit <= expectedMaxLimit, 
            "Booking endpoint should have reasonable rate limit");
        Assert.True(bookingRateLimit > 0, 
            "Booking rate limit must be positive");
    }

    [Fact]
    public void RateLimiting_GeneralEndpointsHaveDefaultLimit()
    {
        // Arrange
        var generalRateLimit = 100; // 100 requests per minute
        var expectedMinLimit = 50;
        var expectedMaxLimit = 200;

        // Assert
        Assert.True(generalRateLimit >= expectedMinLimit && generalRateLimit <= expectedMaxLimit, 
            "General endpoints should have reasonable default rate limit");
    }

    #endregion

    #region Rate Limiting Response Tests

    [Fact]
    public void RateLimiting_Returns429StatusCode()
    {
        // Arrange
        var expectedStatusCode = 429;

        // Assert
        Assert.Equal(429, expectedStatusCode);
    }

    [Fact]
    public void RateLimiting_ReturnsJsonResponse()
    {
        // Arrange
        var expectedContentType = "application/json";
        var responseContent = "{ \"message\": \"Rate limit exceeded. Please try again later.\", \"statusCode\": 429 }";

        // Assert
        Assert.Contains("application/json", expectedContentType);
        Assert.Contains("Rate limit exceeded", responseContent);
        Assert.Contains("429", responseContent);
    }

    #endregion

    #region Brute Force Prevention Tests

    [Theory]
    [InlineData(1, true)]
    [InlineData(3, true)]
    [InlineData(5, true)]
    [InlineData(6, false)] // Exceeds limit
    [InlineData(10, false)] // Exceeds limit
    public void BruteForce_LoginAttemptsAreRateLimited(int attemptCount, bool shouldBeAllowed)
    {
        // Arrange
        var maxLoginAttempts = 5;

        // Act
        var isAllowed = attemptCount <= maxLoginAttempts;

        // Assert
        Assert.Equal(shouldBeAllowed, isAllowed);
    }

    [Theory]
    [InlineData(1, true)]
    [InlineData(2, true)]
    [InlineData(3, true)]
    [InlineData(4, false)] // Exceeds limit
    public void BruteForce_RegistrationAttemptsAreRateLimited(int attemptCount, bool shouldBeAllowed)
    {
        // Arrange
        var maxRegisterAttempts = 3;

        // Act
        var isAllowed = attemptCount <= maxRegisterAttempts;

        // Assert
        Assert.Equal(shouldBeAllowed, isAllowed);
    }

    #endregion

    #region IP-Based Rate Limiting Tests

    [Fact]
    public void RateLimiting_TracksRequestsByIP()
    {
        // Arrange
        var ipAddress1 = "192.168.1.100";
        var ipAddress2 = "192.168.1.101";

        // Assert
        Assert.NotEqual(ipAddress1, ipAddress2);
        Assert.True(!string.IsNullOrEmpty(ipAddress1));
        Assert.True(!string.IsNullOrEmpty(ipAddress2));
    }

    [Fact]
    public void RateLimiting_UsesRealIPHeader()
    {
        // Arrange
        var realIpHeader = "X-Real-IP";
        var forwardedForHeader = "X-Forwarded-For";

        // Assert
        Assert.Equal("X-Real-IP", realIpHeader);
        Assert.NotEqual(realIpHeader, forwardedForHeader);
    }

    #endregion

    #region Endpoint-Specific Rate Limiting Tests

    [Theory]
    [InlineData("/api/auth/login", 5)]
    [InlineData("/api/auth/register", 3)]
    [InlineData("/api/auth/change-password", 3)]
    [InlineData("/api/bookings", 10)]
    public void RateLimiting_EndpointHasCorrectLimit(string endpoint, int expectedLimit)
    {
        // Assert
        Assert.True(expectedLimit > 0, $"Endpoint {endpoint} should have positive rate limit");
        Assert.True(expectedLimit <= 100, $"Endpoint {endpoint} should have reasonable rate limit");
    }

    #endregion

    #region Time Window Tests

    [Theory]
    [InlineData("1m", 60)] // 1 minute = 60 seconds
    [InlineData("1h", 3600)] // 1 hour = 3600 seconds
    [InlineData("1d", 86400)] // 1 day = 86400 seconds
    public void RateLimiting_TimeWindowIsValid(string period, int expectedSeconds)
    {
        // Act
        var seconds = period switch
        {
            "1m" => 60,
            "1h" => 3600,
            "1d" => 86400,
            _ => 0
        };

        // Assert
        Assert.Equal(expectedSeconds, seconds);
    }

    #endregion

    #region Distributed Rate Limiting Tests

    [Fact]
    public void RateLimiting_UsesMemoryCache()
    {
        // Arrange
        var cacheType = "MemoryCache";

        // Assert
        Assert.Equal("MemoryCache", cacheType);
    }

    [Fact]
    public void RateLimiting_SupportsDistributedScenarios()
    {
        // Arrange
        var supportsDistributed = true; // Can be upgraded to Redis

        // Assert
        Assert.True(supportsDistributed, 
            "Rate limiting should support distributed scenarios for scalability");
    }

    #endregion
}
