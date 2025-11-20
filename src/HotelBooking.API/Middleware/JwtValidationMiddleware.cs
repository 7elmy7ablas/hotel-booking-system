using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;

namespace HotelBooking.API.Middleware;

/// <summary>
/// Enhanced JWT validation middleware
/// Provides additional security checks beyond basic JWT validation
/// </summary>
public class JwtValidationMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<JwtValidationMiddleware> _logger;
    private readonly IConfiguration _configuration;

    public JwtValidationMiddleware(
        RequestDelegate next,
        ILogger<JwtValidationMiddleware> logger,
        IConfiguration configuration)
    {
        _next = next;
        _logger = logger;
        _configuration = configuration;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // Skip validation for public endpoints
        if (IsPublicEndpoint(context.Request.Path))
        {
            await _next(context);
            return;
        }

        var token = ExtractToken(context);

        if (!string.IsNullOrEmpty(token))
        {
            var validationResult = await ValidateTokenAsync(token);

            if (!validationResult.IsValid)
            {
                _logger.LogWarning("JWT validation failed: {Reason}", validationResult.FailureReason);
                
                context.Response.StatusCode = 401;
                context.Response.ContentType = "application/json";
                await context.Response.WriteAsJsonAsync(new
                {
                    message = "Invalid or expired token. Please log in again.",
                    statusCode = 401
                });
                return;
            }

            // Add validated claims to context
            context.Items["UserId"] = validationResult.UserId;
            context.Items["UserRole"] = validationResult.UserRole;
        }

        await _next(context);
    }

    private string? ExtractToken(HttpContext context)
    {
        var authHeader = context.Request.Headers["Authorization"].FirstOrDefault();

        if (string.IsNullOrEmpty(authHeader))
            return null;

        if (authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
        {
            return authHeader.Substring("Bearer ".Length).Trim();
        }

        return null;
    }

    private async Task<TokenValidationResult> ValidateTokenAsync(string token)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();

            // Read token without validation first to check structure
            if (!tokenHandler.CanReadToken(token))
            {
                return TokenValidationResult.Failure("Invalid token format");
            }

            var jwtToken = tokenHandler.ReadJwtToken(token);

            // SECURITY CHECK 1: Validate token expiry
            if (jwtToken.ValidTo < DateTime.UtcNow)
            {
                return TokenValidationResult.Failure("Token has expired");
            }

            // SECURITY CHECK 2: Validate token not used before valid time
            if (jwtToken.ValidFrom > DateTime.UtcNow)
            {
                return TokenValidationResult.Failure("Token not yet valid");
            }

            // SECURITY CHECK 3: Validate issuer
            var expectedIssuer = _configuration["Jwt:Issuer"];
            if (jwtToken.Issuer != expectedIssuer)
            {
                return TokenValidationResult.Failure("Invalid token issuer");
            }

            // SECURITY CHECK 4: Validate audience
            var expectedAudience = _configuration["Jwt:Audience"];
            if (!jwtToken.Audiences.Contains(expectedAudience))
            {
                return TokenValidationResult.Failure("Invalid token audience");
            }

            // SECURITY CHECK 5: Validate required claims exist
            var userId = jwtToken.Claims.FirstOrDefault(c => c.Type == "userId")?.Value;
            var role = jwtToken.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role)?.Value;

            if (string.IsNullOrEmpty(userId))
            {
                return TokenValidationResult.Failure("Token missing required userId claim");
            }

            if (string.IsNullOrEmpty(role))
            {
                return TokenValidationResult.Failure("Token missing required role claim");
            }

            // SECURITY CHECK 6: Validate signature
            var secret = _configuration["Jwt:Secret"];
            var key = new SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(secret!));

            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = key,
                ValidateIssuer = true,
                ValidIssuer = expectedIssuer,
                ValidateAudience = true,
                ValidAudience = expectedAudience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero // No clock skew tolerance
            };

            var principal = tokenHandler.ValidateToken(token, validationParameters, out var validatedToken);

            // SECURITY CHECK 7: Ensure token is JWT (not other token types)
            if (validatedToken is not JwtSecurityToken)
            {
                return TokenValidationResult.Failure("Invalid token type");
            }

            return TokenValidationResult.Success(userId, role);
        }
        catch (SecurityTokenExpiredException)
        {
            return TokenValidationResult.Failure("Token has expired");
        }
        catch (SecurityTokenInvalidSignatureException)
        {
            return TokenValidationResult.Failure("Invalid token signature");
        }
        catch (SecurityTokenException ex)
        {
            return TokenValidationResult.Failure($"Token validation failed: {ex.Message}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error during token validation");
            return TokenValidationResult.Failure("Token validation failed");
        }
    }

    private bool IsPublicEndpoint(PathString path)
    {
        var publicPaths = new[]
        {
            "/api/auth/login",
            "/api/auth/register",
            "/health",
            "/",
            "/swagger"
        };

        return publicPaths.Any(p => path.StartsWithSegments(p, StringComparison.OrdinalIgnoreCase));
    }

    private class TokenValidationResult
    {
        public bool IsValid { get; private set; }
        public string? FailureReason { get; private set; }
        public string? UserId { get; private set; }
        public string? UserRole { get; private set; }

        private TokenValidationResult() { }

        public static TokenValidationResult Success(string userId, string role)
        {
            return new TokenValidationResult
            {
                IsValid = true,
                UserId = userId,
                UserRole = role
            };
        }

        public static TokenValidationResult Failure(string reason)
        {
            return new TokenValidationResult
            {
                IsValid = false,
                FailureReason = reason
            };
        }
    }
}
