using System.Text.Json;
using System.Text.Json.Serialization;

namespace HotelBooking.API.Middleware;

/// <summary>
/// Middleware to ensure all API responses use consistent camelCase naming
/// Handles nested objects and arrays automatically via JsonSerializerOptions
/// </summary>
public class ResponseTransformerMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ResponseTransformerMiddleware> _logger;
    private static readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull,
        ReferenceHandler = ReferenceHandler.IgnoreCycles,
        WriteIndented = false
    };

    public ResponseTransformerMiddleware(RequestDelegate next, ILogger<ResponseTransformerMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Store original response body stream
        var originalBodyStream = context.Response.Body;

        try
        {
            // Create a new memory stream to capture the response
            using var responseBody = new MemoryStream();
            context.Response.Body = responseBody;

            // Call the next middleware in the pipeline
            await _next(context);

            // Only transform JSON responses
            if (context.Response.ContentType?.Contains("application/json") == true)
            {
                // Read the response
                responseBody.Seek(0, SeekOrigin.Begin);
                var responseText = await new StreamReader(responseBody).ReadToEndAsync();

                // Only transform if there's content
                if (!string.IsNullOrWhiteSpace(responseText))
                {
                    try
                    {
                        // Parse and re-serialize with camelCase
                        var jsonDocument = JsonDocument.Parse(responseText);
                        var transformedJson = JsonSerializer.Serialize(jsonDocument.RootElement, _jsonOptions);

                        // Write transformed response
                        context.Response.Body = originalBodyStream;
                        context.Response.ContentLength = null; // Let the framework calculate
                        await context.Response.WriteAsync(transformedJson);
                        
                        _logger.LogDebug("Response transformed to camelCase for {Path}", context.Request.Path);
                        return;
                    }
                    catch (JsonException ex)
                    {
                        _logger.LogWarning(ex, "Failed to transform response to camelCase for {Path}", context.Request.Path);
                        // Fall through to write original response
                    }
                }
            }

            // Write original response if not JSON or transformation failed
            context.Response.Body = originalBodyStream;
            responseBody.Seek(0, SeekOrigin.Begin);
            await responseBody.CopyToAsync(originalBodyStream);
        }
        finally
        {
            context.Response.Body = originalBodyStream;
        }
    }
}
