# Sprint 2 Planning Document - Hotel Booking System

## Sprint Overview

| **Attribute** | **Details** |
|---------------|-------------|
| **Sprint Number** | Sprint 2 |
| **Sprint Name** | Backend APIs Development |
| **Duration** | 2 weeks |
| **Start Date** | December 4, 2025 |
| **End Date** | December 18, 2025 |
| **Team Capacity** | 40 hours |
| **Sprint Goal** | Build core REST APIs for hotels, rooms, bookings, and authentication |

## Sprint Backlog

| **User Story** | **Story Points** | **Priority** | **Assignee** |
|----------------|------------------|--------------|--------------|
| US-5: Authentication & Authorization API | 8 | High | TBD |
| US-6: Hotels API | 5 | High | TBD |
| US-7: Rooms API | 5 | High | TBD |
| US-8: Bookings API | 3 | High | TBD |
| US-9: API Documentation | 2 | Medium | TBD |

**Total Story Points:** 23

## User Stories Details

### US-5: Authentication & Authorization API
**Story Points:** 8  
**Priority:** High  
**Description:** As a system user, I need secure authentication and authorization so that I can access protected resources based on my role.

**Acceptance Criteria:**
- [ ] JWT authentication is implemented using ASP.NET Core Identity
- [ ] Login endpoint validates credentials and returns JWT token
- [ ] Register endpoint creates new user accounts with validation
- [ ] Refresh token endpoint allows token renewal without re-login
- [ ] Role-based authorization distinguishes between Admin and User roles

**Task Breakdown:**
| **Task** | **Estimated Hours** |
|----------|-------------------|
| Setup ASP.NET Core Identity | 3 |
| Implement JWT authentication | 4 |
| Create Login/Register endpoints | 3 |
| Implement refresh token mechanism | 2 |
| Setup role-based authorization | 2 |
| Unit testing for auth endpoints | 2 |
- [ ] Password hashing using ASP.NET Core Identity
- [ ] Refresh token rotation implemented
- [ ] JWT expiry set to 15 minutes, Refresh token to 7 days
- [ ] Rate limiting on login endpoint (5 attempts per minute)

**AI Prompt for GitHub Copilot:**
// Create a complete JWT authentication system with refresh tokens for .NET 10 minimal API

// First, create the User entity
public class ApplicationUser : IdentityUser
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}

// Create RefreshToken entity
public class RefreshToken
{
    public int Id { get; set; }
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiryDate { get; set; }
    public bool IsRevoked { get; set; }
    public string UserId { get; set; } = string.Empty;
    public ApplicationUser User { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

// Create DTOs
public record LoginRequest(string Email, string Password);
public record RegisterRequest(string Email, string Password, string FirstName, string LastName);
public record RefreshTokenRequest(string RefreshToken);
public record AuthResponse(string AccessToken, string RefreshToken, DateTime ExpiresAt);

// Create validators using FluentValidation
public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    public LoginRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty().MinimumLength(6);
    }
}

public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty().MinimumLength(6)
            .Matches(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]")
            .WithMessage("Password must contain uppercase, lowercase, number and special character");
        RuleFor(x => x.FirstName).NotEmpty().MaximumLength(50);
        RuleFor(x => x.LastName).NotEmpty().MaximumLength(50);
    }
}

// Create TokenService
public interface ITokenService
{
    string GenerateAccessToken(ApplicationUser user, IList<string> roles);
    string GenerateRefreshToken();
    ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);
}

public class TokenService : ITokenService
{
    private readonly IConfiguration _configuration;
    private readonly SymmetricSecurityKey _key;

    public TokenService(IConfiguration configuration)
    {
        _configuration = configuration;
        _key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
    }

    public string GenerateAccessToken(ApplicationUser user, IList<string> roles)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Email, user.Email!),
            new(ClaimTypes.Name, $"{user.FirstName} {user.LastName}"),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64)
        };

        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var credentials = new SigningCredentials(_key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddMinutes(15);

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: expires,
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }

    public ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
    {
        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = false,
            ValidateIssuer = false,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = _key,
            ValidateLifetime = false
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out var securityToken);

        if (securityToken is not JwtSecurityToken jwtSecurityToken || 
            !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
        {
            throw new SecurityTokenException("Invalid token");
        }

        return principal;
    }
}

// Create DbContext
public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options) { }

    public DbSet<RefreshToken> RefreshTokens { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<RefreshToken>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Token).IsRequired().HasMaxLength(500);
            entity.HasOne(e => e.User)
                  .WithMany(u => u.RefreshTokens)
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Seed roles
        builder.Entity<IdentityRole>().HasData(
            new IdentityRole { Id = "1", Name = "Admin", NormalizedName = "ADMIN" },
            new IdentityRole { Id = "2", Name = "User", NormalizedName = "USER" }
        );
    }
}

// Configure services in Program.cs
var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddIdentity<ApplicationUser, IdentityRole>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequireLowercase = true;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = true;
    options.Password.RequiredLength = 6;
    options.User.RequireUniqueEmail = true;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)),
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IValidator<LoginRequest>, LoginRequestValidator>();
builder.Services.AddScoped<IValidator<RegisterRequest>, RegisterRequestValidator>();

// Rate limiting
builder.Services.AddRateLimiter(options =>
{
    options.AddFixedWindowLimiter("AuthPolicy", configure =>
    {
        configure.PermitLimit = 5;
        configure.Window = TimeSpan.FromMinutes(1);
        configure.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        configure.QueueLimit = 2;
    });
});

var app = builder.Build();

app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

// Auth endpoints
app.MapPost("/api/auth/register", async (
    RegisterRequest request,
    UserManager<ApplicationUser> userManager,
    IValidator<RegisterRequest> validator,
    ITokenService tokenService) =>
{
    var validationResult = await validator.ValidateAsync(request);
    if (!validationResult.IsValid)
    {
        return Results.BadRequest(validationResult.Errors.Select(e => e.ErrorMessage));
    }

    var existingUser = await userManager.FindByEmailAsync(request.Email);
    if (existingUser != null)
    {
        return Results.BadRequest("User already exists");
    }

    var user = new ApplicationUser
    {
        UserName = request.Email,
        Email = request.Email,
        FirstName = request.FirstName,
        LastName = request.LastName
    };

    var result = await userManager.CreateAsync(user, request.Password);
    if (!result.Succeeded)
    {
        return Results.BadRequest(result.Errors.Select(e => e.Description));
    }

    await userManager.AddToRoleAsync(user, "User");
    
    var roles = await userManager.GetRolesAsync(user);
    var accessToken = tokenService.GenerateAccessToken(user, roles);
    var refreshToken = tokenService.GenerateRefreshToken();

    var refreshTokenEntity = new RefreshToken
    {
        Token = refreshToken,
        ExpiryDate = DateTime.UtcNow.AddDays(7),
        UserId = user.Id
    };

    user.RefreshTokens.Add(refreshTokenEntity);
    await userManager.UpdateAsync(user);

    return Results.Ok(new AuthResponse(accessToken, refreshToken, DateTime.UtcNow.AddMinutes(15)));
})
.RequireRateLimiting("AuthPolicy");

app.MapPost("/api/auth/login", async (
    LoginRequest request,
    UserManager<ApplicationUser> userManager,
    IValidator<LoginRequest> validator,
    ITokenService tokenService,
    ApplicationDbContext context) =>
{
    var validationResult = await validator.ValidateAsync(request);
    if (!validationResult.IsValid)
    {
        return Results.BadRequest(validationResult.Errors.Select(e => e.ErrorMessage));
    }

    var user = await userManager.FindByEmailAsync(request.Email);
    if (user == null || !await userManager.CheckPasswordAsync(user, request.Password))
    {
        return Results.Unauthorized();
    }

    var roles = await userManager.GetRolesAsync(user);
    var accessToken = tokenService.GenerateAccessToken(user, roles);
    var refreshToken = tokenService.GenerateRefreshToken();

    // Revoke existing refresh tokens
    var existingTokens = context.RefreshTokens.Where(rt => rt.UserId == user.Id && !rt.IsRevoked);
    foreach (var token in existingTokens)
    {
        token.IsRevoked = true;
    }

    var refreshTokenEntity = new RefreshToken
    {
        Token = refreshToken,
        ExpiryDate = DateTime.UtcNow.AddDays(7),
        UserId = user.Id
    };

    context.RefreshTokens.Add(refreshTokenEntity);
    await context.SaveChangesAsync();

    return Results.Ok(new AuthResponse(accessToken, refreshToken, DateTime.UtcNow.AddMinutes(15)));
})
.RequireRateLimiting("AuthPolicy");

app.MapPost("/api/auth/refresh-token", async (
    RefreshTokenRequest request,
    UserManager<ApplicationUser> userManager,
    ITokenService tokenService,
    ApplicationDbContext context) =>
{
    var refreshTokenEntity = await context.RefreshTokens
        .Include(rt => rt.User)
        .FirstOrDefaultAsync(rt => rt.Token == request.RefreshToken && !rt.IsRevoked);

    if (refreshTokenEntity == null || refreshTokenEntity.ExpiryDate <= DateTime.UtcNow)
    {
        return Results.Unauthorized();
    }

    // Revoke the used refresh token
    refreshTokenEntity.IsRevoked = true;

    var user = refreshTokenEntity.User;
    var roles = await userManager.GetRolesAsync(user);
    var newAccessToken = tokenService.GenerateAccessToken(user, roles);
    var newRefreshToken = tokenService.GenerateRefreshToken();

    var newRefreshTokenEntity = new RefreshToken
    {
        Token = newRefreshToken,
        ExpiryDate = DateTime.UtcNow.AddDays(7),
        UserId = user.Id
    };

    context.RefreshTokens.Add(newRefreshTokenEntity);
    await context.SaveChangesAsync();

    return Results.Ok(new AuthResponse(newAccessToken, newRefreshToken, DateTime.UtcNow.AddMinutes(15)));
});

// Protected endpoint example
app.MapGet("/api/auth/profile", (ClaimsPrincipal user) =>
{
    var userId = user.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    var email = user.FindFirst(ClaimTypes.Email)?.Value;
    var name = user.FindFirst(ClaimTypes.Name)?.Value;
    var roles = user.FindAll(ClaimTypes.Role).Select(c => c.Value);

    return Results.Ok(new { UserId = userId, Email = email, Name = name, Roles = roles });
})
.RequireAuthorization();

// Admin only endpoint example
app.MapGet("/api/admin/users", () => Results.Ok("Admin access granted"))
    .RequireAuthorization(policy => policy.RequireRole("Admin"));

app.Run();

