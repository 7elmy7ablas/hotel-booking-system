using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using Serilog;
using HotelBooking.Infrastructure.Data;
using HotelBooking.Application.Interfaces;
using HotelBooking.Infrastructure.Repositories;
using HotelBooking.API.Middleware;
using AspNetCoreRateLimit;

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(new ConfigurationBuilder()
        .AddJsonFile("appsettings.json")
        .AddJsonFile("appsettings.RateLimiting.json", optional: true)
        .Build())
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/hotel-booking-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

try
{
    var startTime = DateTime.UtcNow;
    Log.Information("Starting Hotel Booking API");

    var builder = WebApplication.CreateBuilder(args);

    // Add Serilog
    builder.Host.UseSerilog();

    // Add Controllers
    builder.Services.AddControllers()
        .AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
            options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
            options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase; // Use camelCase for JavaScript/TypeScript
        });

    // Add API Explorer and Swagger
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(options =>
    {
        options.SwaggerDoc("v1", new OpenApiInfo
        {
            Title = "Hotel Booking API",
            Version = "v1"
        });

        // Add JWT Authentication button
        options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = SecuritySchemeType.Http,
            Scheme = "Bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description = "JWT Authorization header using the Bearer scheme. Enter 'Bearer' [space] and then your token."
        });

        options.AddSecurityRequirement(new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference
                    {
                        Type = ReferenceType.SecurityScheme,
                        Id = "Bearer"
                    }
                },
                new string[] {}
            }
        });
    });

    // Add DbContext
    // Priority: Environment Variables > appsettings.{Environment}.json > appsettings.json
    var connectionString = Environment.GetEnvironmentVariable("CONNECTION_STRING")
        ?? builder.Configuration.GetConnectionString("DefaultConnection")
        ?? throw new InvalidOperationException("Database connection string not configured");
    
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseSqlServer(
            connectionString,
            sqlOptions => sqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(30),
                errorNumbersToAdd: null)));

    // Add repositories
    builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));

    // Add JWT Authentication
    // Priority: Environment Variables > appsettings.{Environment}.json > appsettings.json
    var jwtSettings = builder.Configuration.GetSection("Jwt");
    var secret = Environment.GetEnvironmentVariable("JWT_SECRET") 
        ?? jwtSettings["Secret"] 
        ?? throw new InvalidOperationException("JWT Secret not configured");
    var issuer = Environment.GetEnvironmentVariable("JWT_ISSUER") 
        ?? jwtSettings["Issuer"] 
        ?? "HotelBookingAPI";
    var audience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") 
        ?? jwtSettings["Audience"] 
        ?? "HotelBookingClient";

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
            ValidIssuer = issuer,
            ValidAudience = audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret))
        };
    });

    builder.Services.AddAuthorization();

    // Add health checks
    builder.Services.AddHealthChecks()
        .AddDbContextCheck<ApplicationDbContext>("database");

    // Add CORS
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowAngularApp", policy =>
        {
            var allowedOrigins = builder.Environment.IsDevelopment()
                ? new[] { "http://localhost:4200", "https://localhost:4200" }
                : builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? Array.Empty<string>();

            policy.WithOrigins(allowedOrigins)
                  .AllowAnyMethod()
                  .AllowAnyHeader()
                  .AllowCredentials();
            
            Log.Information("CORS Policy 'AllowAngularApp' configured with origins: {Origins}", string.Join(", ", allowedOrigins));
        });
    });

    // Add Rate Limiting
    builder.Services.AddMemoryCache();
    builder.Services.Configure<AspNetCoreRateLimit.IpRateLimitOptions>(
        builder.Configuration.GetSection("IpRateLimiting"));
    builder.Services.Configure<AspNetCoreRateLimit.IpRateLimitPolicies>(
        builder.Configuration.GetSection("IpRateLimitPolicies"));
    builder.Services.AddSingleton<AspNetCoreRateLimit.IIpPolicyStore, AspNetCoreRateLimit.MemoryCacheIpPolicyStore>();
    builder.Services.AddSingleton<AspNetCoreRateLimit.IRateLimitCounterStore, AspNetCoreRateLimit.MemoryCacheRateLimitCounterStore>();
    builder.Services.AddSingleton<AspNetCoreRateLimit.IRateLimitConfiguration, AspNetCoreRateLimit.RateLimitConfiguration>();
    builder.Services.AddSingleton<AspNetCoreRateLimit.IProcessingStrategy, AspNetCoreRateLimit.AsyncKeyLockProcessingStrategy>();
    builder.Services.AddInMemoryRateLimiting();

    // Add Response Compression
    builder.Services.AddResponseCompression(options =>
    {
        options.EnableForHttps = true;
        options.MimeTypes = new[]
        {
            "application/json",
            "application/xml",
            "text/plain",
            "text/html",
            "text/css",
            "text/javascript",
            "application/javascript"
        };
    });

    // Add Response Caching
    builder.Services.AddResponseCaching();

    var app = builder.Build();

    // Database connection retry logic
    var maxRetries = 5;
    var retryDelay = TimeSpan.FromSeconds(5);
    
    for (int i = 0; i < maxRetries; i++)
    {
        try
        {
            using (var scope = app.Services.CreateScope())
            {
                var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                await context.Database.CanConnectAsync();
                Log.Information("Database connection established successfully");
                await DbSeeder.SeedData(context);
                Log.Information("Database seeding completed");
            }
            break;
        }
        catch (Exception ex)
        {
            if (i == maxRetries - 1)
            {
                Log.Fatal(ex, "Failed to connect to database after {MaxRetries} attempts", maxRetries);
                throw;
            }
            Log.Warning(ex, "Database connection attempt {Attempt} of {MaxRetries} failed. Retrying in {Delay} seconds...", 
                i + 1, maxRetries, retryDelay.TotalSeconds);
            await Task.Delay(retryDelay);
        }
    }

    // Configure the HTTP request pipeline
    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    app.UseResponseCompression();
    app.UseMiddleware<SecurityHeadersMiddleware>();
    app.UseMiddleware<RequestLoggingMiddleware>();
    app.UseMiddleware<GlobalExceptionHandler>();
    app.UseIpRateLimiting();
    app.UseSerilogRequestLogging();
    app.UseHttpsRedirection();
    
    // CORS must be before Authentication and Authorization
    app.UseCors("AllowAngularApp");
    Log.Information("CORS middleware enabled for policy: AllowAngularApp");
    
    app.UseResponseCaching();

    app.UseAuthentication();
    app.UseAuthorization();

    // Map health check endpoint
    app.MapHealthChecks("/health");

    // Map Controllers
    app.MapControllers();

    // Root endpoint
    app.MapGet("/", () => Results.Ok(new
    {
        Service = "Hotel Booking API",
        Version = "1.0.0",
        Status = "Running",
        Architecture = "Controllers Pattern"
    }))
    .WithName("Root");

    var version = typeof(Program).Assembly.GetName().Version?.ToString() ?? "1.0.0";
    var environment = app.Environment.EnvironmentName;
    var startupDuration = (DateTime.UtcNow - startTime).TotalSeconds;

    Log.Information("╔════════════════════════════════════════════════════════════╗");
    Log.Information("║          Hotel Booking API - Started Successfully          ║");
    Log.Information("╠════════════════════════════════════════════════════════════╣");
    Log.Information("║  Application: Hotel Booking API                           ║");
    Log.Information("║  Version:     {Version,-44} ║", version);
    Log.Information("║  Environment: {Environment,-44} ║", environment);
    Log.Information("║  Startup Time: {StartupTime,-43} ║", $"{startupDuration:F2}s");
    Log.Information("║  URLs:        https://localhost:7291                       ║");
    Log.Information("║               http://localhost:5156                        ║");
    Log.Information("╚════════════════════════════════════════════════════════════╝");

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
