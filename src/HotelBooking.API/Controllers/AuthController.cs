using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BCrypt.Net;
using HotelBooking.API.DTOs;
using HotelBooking.Domain.Entities;
using HotelBooking.Infrastructure.Data;
using HotelBooking.API.Validators;
using HotelBooking.API.Services;

namespace HotelBooking.API.Controllers;

/// <summary>
/// Controller for authentication operations
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthController> _logger;
    private readonly LogSanitizationService _sanitizationService;

    public AuthController(
        ApplicationDbContext context,
        IConfiguration configuration,
        ILogger<AuthController> logger,
        LogSanitizationService sanitizationService)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;
        _sanitizationService = sanitizationService;
    }

    /// <summary>
    /// Register a new user
    /// </summary>
    /// <param name="registerDto">Registration details</param>
    /// <returns>Created user information</returns>
    [HttpPost("register")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<UserDto>> Register([FromBody] RegisterDto registerDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            // Validate password strength
            if (!Validators.PasswordValidator.IsValid(registerDto.Password, out var passwordError))
            {
                // SECURITY: Never log passwords or password details
                var safeContext = _sanitizationService.CreateSafeLogContext(
                    ("Email", registerDto.Email),
                    ("Reason", "Weak password"));
                _logger.LogWarning("Registration attempt failed: {@Context}", safeContext);
                return BadRequest(new { message = passwordError });
            }

            // Validate email uniqueness
            var existingUser = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == registerDto.Email && !u.IsDeleted);

            if (existingUser != null)
            {
                // SECURITY: Mask email in logs
                var maskedEmailExisting = _sanitizationService.SanitizeLogMessage(registerDto.Email);
                _logger.LogWarning("Registration attempt with existing email: {Email}", maskedEmailExisting);
                return BadRequest(new { message = "Email already exists" });
            }

            // Hash password using BCrypt with work factor 12
            var passwordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password, workFactor: 12);

            // Create new user
            var user = new User
            {
                Email = registerDto.Email,
                PasswordHash = passwordHash,
                FullName = registerDto.FullName,
                PhoneNumber = registerDto.PhoneNumber,
                Role = "User",
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // SECURITY: Mask email in logs
            var maskedEmailSuccess = _sanitizationService.SanitizeLogMessage(user.Email);
            _logger.LogInformation("User registered successfully: {Email}", maskedEmailSuccess);

            // Map to UserDto
            var userDto = new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                PhoneNumber = user.PhoneNumber,
                Role = user.Role,
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt,
                IsDeleted = user.IsDeleted
            };

            return CreatedAtAction(nameof(Register), new { id = user.Id }, userDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during user registration");
            return StatusCode(500, new { message = "An error occurred during registration" });
        }
    }

    /// <summary>
    /// Login user and generate JWT token
    /// </summary>
    /// <param name="loginDto">Login credentials</param>
    /// <returns>JWT token and user information</returns>
    [HttpPost("login")]
    [ProducesResponseType(typeof(LoginResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginDto loginDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            // Find user by email
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == loginDto.Email && !u.IsDeleted);

            if (user == null)
            {
                // SECURITY: Mask email in logs, use generic message
                var maskedEmailNotFound = _sanitizationService.SanitizeLogMessage(loginDto.Email);
                _logger.LogWarning("Login attempt with non-existent email: {Email}", maskedEmailNotFound);
                return Unauthorized(new { message = "Invalid email or password" });
            }

            // Verify password
            if (!BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash))
            {
                // SECURITY: Never log password attempts, mask email
                var maskedEmailFailed = _sanitizationService.SanitizeLogMessage(loginDto.Email);
                _logger.LogWarning("Failed login attempt for email: {Email}", maskedEmailFailed);
                return Unauthorized(new { message = "Invalid email or password" });
            }

            // Generate JWT token
            var token = GenerateJwtToken(user);
            var expirationHours = _configuration.GetValue<int>("Jwt:ExpirationInHours", 24);
            var expiresAt = DateTime.UtcNow.AddHours(expirationHours);

            // SECURITY: Mask email in logs, never log tokens
            var maskedEmail = _sanitizationService.SanitizeLogMessage(user.Email);
            _logger.LogInformation("User logged in successfully: {Email}", maskedEmail);

            // Map to UserDto
            var userDto = new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                PhoneNumber = user.PhoneNumber,
                Role = user.Role,
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt,
                IsDeleted = user.IsDeleted
            };

            var response = new LoginResponseDto
            {
                Token = token,
                User = userDto,
                ExpiresAt = expiresAt
            };

            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during user login");
            return StatusCode(500, new { message = "An error occurred during login" });
        }
    }

    /// <summary>
    /// Change user password
    /// </summary>
    /// <param name="changePasswordDto">Password change details</param>
    /// <returns>Success message</returns>
    [HttpPost("change-password")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto changePasswordDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            // Find user by email
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Email == changePasswordDto.Email && !u.IsDeleted);

            if (user == null)
            {
                // SECURITY: Mask email in logs
                var maskedEmailNotFound = _sanitizationService.SanitizeLogMessage(changePasswordDto.Email);
                _logger.LogWarning("Password change attempt for non-existent email: {Email}", maskedEmailNotFound);
                return NotFound(new { message = "User not found" });
            }

            // Verify old password
            if (!BCrypt.Net.BCrypt.Verify(changePasswordDto.OldPassword, user.PasswordHash))
            {
                // SECURITY: Never log passwords, mask email
                var maskedEmailInvalid = _sanitizationService.SanitizeLogMessage(changePasswordDto.Email);
                _logger.LogWarning("Failed password change attempt for email: {Email} - Invalid old password", maskedEmailInvalid);
                return Unauthorized(new { message = "Invalid old password" });
            }

            // Validate new password strength
            if (!Validators.PasswordValidator.IsValid(changePasswordDto.NewPassword, out var passwordError))
            {
                // SECURITY: Never log passwords, mask email
                var maskedEmailWeak = _sanitizationService.SanitizeLogMessage(changePasswordDto.Email);
                _logger.LogWarning("Password change attempt with weak password: {Email}", maskedEmailWeak);
                return BadRequest(new { message = passwordError });
            }

            // Hash new password with work factor 12
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(changePasswordDto.NewPassword, workFactor: 12);
            user.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            // SECURITY: Mask email in logs
            var maskedEmailSuccess = _sanitizationService.SanitizeLogMessage(user.Email);
            _logger.LogInformation("Password changed successfully for user: {Email}", maskedEmailSuccess);

            return Ok(new { message = "Password changed successfully" });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during password change");
            return StatusCode(500, new { message = "An error occurred during password change" });
        }
    }

    /// <summary>
    /// Generate JWT token for authenticated user
    /// </summary>
    /// <param name="user">User entity</param>
    /// <returns>JWT token string</returns>
    private string GenerateJwtToken(User user)
    {
        var secret = _configuration["Jwt:Secret"] ?? throw new InvalidOperationException("JWT Secret not configured");
        var issuer = _configuration["Jwt:Issuer"] ?? "HotelBookingAPI";
        var audience = _configuration["Jwt:Audience"] ?? "HotelBookingClient";
        var expirationHours = _configuration.GetValue<int>("Jwt:ExpirationInHours", 24);

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim("userId", user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim("email", user.Email),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim("role", user.Role),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddHours(expirationHours),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
