using System.Net;
using System.Text.Json;
using HotelBooking.API.Services;

namespace HotelBooking.API.Middleware;

/// <summary>
/// Global exception handler with security-focused error responses
/// Prevents sensitive data leakage in production
/// </summary>
public class GlobalExceptionHandler
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionHandler> _logger;
    private readonly IHostEnvironment _env;
    private readonly LogSanitizationService _sanitizationService;

    public GlobalExceptionHandler(
        RequestDelegate next, 
        ILogger<GlobalExceptionHandler> logger, 
        IHostEnvironment env,
        LogSanitizationService sanitizationService)
    {
        _next = next;
        _logger = logger;
        _env = env;
        _sanitizationService = sanitizationService;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            // Sanitize exception message before logging
            var sanitizedMessage = _sanitizationService.SanitizeException(ex);
            
            // Log with sanitized message (never log full exception in production)
            if (_env.IsDevelopment())
            {
                _logger.LogError(ex, "An unhandled exception occurred: {Message}", sanitizedMessage);
            }
            else
            {
                // In production, log minimal information
                _logger.LogError("An unhandled exception occurred. Type: {ExceptionType}, StatusCode: {StatusCode}", 
                    ex.GetType().Name, 
                    GetStatusCode(ex));
            }
            
            await HandleExceptionAsync(context, ex);
        }
    }

    private Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";
        
        var statusCode = GetStatusCode(exception);
        context.Response.StatusCode = statusCode;

        // SECURITY: Never expose internal details in production
        var response = new
        {
            message = GetUserFriendlyMessage(statusCode),
            statusCode = statusCode,
            // Only include error ID for support tracking
            errorId = Guid.NewGuid().ToString(),
            // NEVER include these in production:
            // - exception.Message (may contain sensitive data)
            // - exception.StackTrace (reveals internal structure)
            // - exception.InnerException (may contain connection strings, etc.)
            detail = _env.IsDevelopment() ? _sanitizationService.SanitizeException(exception) : null
        };

        var options = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        };

        var jsonResponse = JsonSerializer.Serialize(response, options);
        return context.Response.WriteAsync(jsonResponse);
    }

    private static int GetStatusCode(Exception exception)
    {
        return exception switch
        {
            ArgumentNullException => (int)HttpStatusCode.BadRequest,
            ArgumentException => (int)HttpStatusCode.BadRequest,
            UnauthorizedAccessException => (int)HttpStatusCode.Unauthorized,
            KeyNotFoundException => (int)HttpStatusCode.NotFound,
            InvalidOperationException => (int)HttpStatusCode.BadRequest,
            _ => (int)HttpStatusCode.InternalServerError
        };
    }

    private static string GetUserFriendlyMessage(int statusCode)
    {
        return statusCode switch
        {
            400 => "The request was invalid. Please check your input and try again.",
            401 => "Authentication is required. Please log in and try again.",
            403 => "You do not have permission to access this resource.",
            404 => "The requested resource was not found.",
            409 => "The request conflicts with the current state of the resource.",
            422 => "The request was well-formed but contains invalid data.",
            429 => "Too many requests. Please try again later.",
            500 => "An internal server error occurred. Please try again later.",
            502 => "The service is temporarily unavailable. Please try again later.",
            503 => "The service is temporarily unavailable. Please try again later.",
            _ => "An error occurred while processing your request."
        };
    }
}
