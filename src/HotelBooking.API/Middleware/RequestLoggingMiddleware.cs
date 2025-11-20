using System.Diagnostics;

namespace HotelBooking.API.Middleware;

public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var timestamp = DateTime.UtcNow;
        var method = context.Request.Method;
        var path = context.Request.Path;
        var queryString = context.Request.QueryString.HasValue ? context.Request.QueryString.Value : string.Empty;
        var ipAddress = context.Connection.RemoteIpAddress?.ToString() ?? "Unknown";

        var stopwatch = Stopwatch.StartNew();

        await _next(context);

        stopwatch.Stop();

        var statusCode = context.Response.StatusCode;
        var duration = stopwatch.ElapsedMilliseconds;

        _logger.LogInformation(
            "[{Timestamp:yyyy-MM-dd HH:mm:ss}] {Method} {Path}{QueryString} - Status: {StatusCode} - Duration: {Duration}ms - IP: {IpAddress}",
            timestamp, method, path, queryString, statusCode, duration, ipAddress);
    }
}
