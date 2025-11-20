using System.Diagnostics;
using HotelBooking.API.Services;

namespace HotelBooking.API.Middleware;

/// <summary>
/// Request logging middleware with security-focused sanitization
/// SECURITY: Prevents sensitive data from being logged
/// </summary>
public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;
    private readonly LogSanitizationService _sanitizationService;

    public RequestLoggingMiddleware(
        RequestDelegate next, 
        ILogger<RequestLoggingMiddleware> logger,
        LogSanitizationService sanitizationService)
    {
        _next = next;
        _logger = logger;
        _sanitizationService = sanitizationService;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var timestamp = DateTime.UtcNow;
        var method = context.Request.Method;
        var path = context.Request.Path;
        
        // SECURITY: Sanitize query string to prevent logging sensitive data
        var queryString = context.Request.QueryString.HasValue 
            ? _sanitizationService.SanitizeLogMessage(context.Request.QueryString.Value) 
            : string.Empty;
        
        // SECURITY: Mask IP address for privacy (keep first 2 octets only)
        var ipAddress = MaskIpAddress(context.Connection.RemoteIpAddress?.ToString() ?? "Unknown");

        var stopwatch = Stopwatch.StartNew();

        await _next(context);

        stopwatch.Stop();

        var statusCode = context.Response.StatusCode;
        var duration = stopwatch.ElapsedMilliseconds;

        // SECURITY: Don't log Authorization headers or sensitive paths
        if (!IsSensitivePath(path))
        {
            _logger.LogInformation(
                "[{Timestamp:yyyy-MM-dd HH:mm:ss}] {Method} {Path}{QueryString} - Status: {StatusCode} - Duration: {Duration}ms - IP: {IpAddress}",
                timestamp, method, path, queryString, statusCode, duration, ipAddress);
        }
        else
        {
            // For sensitive paths, log minimal information
            _logger.LogInformation(
                "[{Timestamp:yyyy-MM-dd HH:mm:ss}] {Method} [SENSITIVE-PATH] - Status: {StatusCode} - Duration: {Duration}ms",
                timestamp, method, statusCode, duration);
        }
    }

    /// <summary>
    /// Check if path contains sensitive operations
    /// </summary>
    private bool IsSensitivePath(PathString path)
    {
        var sensitivePaths = new[]
        {
            "/api/auth/login",
            "/api/auth/register",
            "/api/auth/change-password",
            "/api/payments"
        };

        return sensitivePaths.Any(p => path.StartsWithSegments(p, StringComparison.OrdinalIgnoreCase));
    }

    /// <summary>
    /// Mask IP address for privacy (keep first 2 octets)
    /// Example: 192.168.1.100 -> 192.168.*.*
    /// </summary>
    private string MaskIpAddress(string ipAddress)
    {
        if (string.IsNullOrEmpty(ipAddress) || ipAddress == "Unknown")
            return "Unknown";

        var parts = ipAddress.Split('.');
        if (parts.Length == 4)
        {
            return $"{parts[0]}.{parts[1]}.*.*";
        }

        // IPv6 or other format - mask completely
        return "[IP-MASKED]";
    }
}
