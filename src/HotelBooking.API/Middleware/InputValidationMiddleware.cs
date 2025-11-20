using System.Text.RegularExpressions;
using System.Text;

namespace HotelBooking.API.Middleware;

public class InputValidationMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<InputValidationMiddleware> _logger;

    // Patterns for detecting malicious input
    private static readonly Regex SqlInjectionPattern = new(@"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)|(-{2})|(/\*)|(\*/)|(\bOR\b.*=.*)|(\bAND\b.*=.*)", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private static readonly Regex XssPattern = new(@"<script|javascript:|onerror=|onload=|<iframe|eval\(|expression\(", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    private static readonly Regex PathTraversalPattern = new(@"\.\./|\.\.\\|%2e%2e", RegexOptions.IgnoreCase | RegexOptions.Compiled);

    public InputValidationMiddleware(RequestDelegate next, ILogger<InputValidationMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Validate query parameters
        foreach (var param in context.Request.Query)
        {
            if (IsMaliciousInput(param.Value.ToString()))
            {
                _logger.LogWarning("Malicious input detected in query parameter: {ParamName}", param.Key);
                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                await context.Response.WriteAsJsonAsync(new { message = "Invalid input detected", statusCode = 400 });
                return;
            }
        }

        // Validate request body for POST/PUT requests
        if (context.Request.Method == "POST" || context.Request.Method == "PUT")
        {
            context.Request.EnableBuffering();
            
            using var reader = new StreamReader(context.Request.Body, Encoding.UTF8, leaveOpen: true);
            var body = await reader.ReadToEndAsync();
            context.Request.Body.Position = 0;

            if (!string.IsNullOrEmpty(body) && IsMaliciousInput(body))
            {
                _logger.LogWarning("Malicious input detected in request body");
                context.Response.StatusCode = StatusCodes.Status400BadRequest;
                await context.Response.WriteAsJsonAsync(new { message = "Invalid input detected", statusCode = 400 });
                return;
            }
        }

        await _next(context);
    }

    private bool IsMaliciousInput(string input)
    {
        if (string.IsNullOrEmpty(input))
            return false;

        return SqlInjectionPattern.IsMatch(input) ||
               XssPattern.IsMatch(input) ||
               PathTraversalPattern.IsMatch(input);
    }
}
