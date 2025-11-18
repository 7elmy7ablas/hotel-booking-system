using Microsoft.EntityFrameworkCore;
using Serilog;
using HotelBooking.Infrastructure.Data;
using HotelBooking.Application.Interfaces;
using HotelBooking.Infrastructure.Repositories;
using HotelBooking.Domain.Entities;

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(new ConfigurationBuilder()
        .AddJsonFile("appsettings.json")
        .Build())
    .Enrich.FromLogContext()
    .WriteTo.Console()
    .WriteTo.File("logs/hotel-booking-.txt", rollingInterval: RollingInterval.Day)
    .CreateLogger();

try
{
    Log.Information("Starting Hotel Booking API");

    var builder = WebApplication.CreateBuilder(args);

    // Add Serilog
    builder.Host.UseSerilog();

    // Add services to the container
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(options =>
    {
        options.SwaggerDoc("v1", new()
        {
            Title = "Hotel Booking API",
            Version = "v1",
            Description = "A comprehensive hotel booking system API"
        });
    });

    // Configure JSON serialization to handle reference loops
    builder.Services.ConfigureHttpJsonOptions(options =>
    {
        options.SerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        options.SerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
        options.SerializerOptions.PropertyNamingPolicy = null; // Keep PascalCase
    });

    // Add DbContext
    builder.Services.AddDbContext<ApplicationDbContext>(options =>
        options.UseSqlServer(
            builder.Configuration.GetConnectionString("DefaultConnection"),
            sqlOptions => sqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(30),
                errorNumbersToAdd: null)));

    // Add repositories
    builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));

    // Add health checks
    builder.Services.AddHealthChecks()
        .AddDbContextCheck<ApplicationDbContext>("database");

    // Add CORS
    builder.Services.AddCors(options =>
    {
        options.AddDefaultPolicy(policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyMethod()
                  .AllowAnyHeader();
        });
    });

    var app = builder.Build();

    // Configure the HTTP request pipeline
    if (app.Environment.IsDevelopment())
    {
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    app.UseSerilogRequestLogging();
    app.UseHttpsRedirection();
    app.UseCors();

    // Map health check endpoint
    app.MapHealthChecks("/health");

    // Sample API endpoints
    app.MapGet("/", () => Results.Ok(new
    {
        Service = "Hotel Booking API",
        Version = "1.0.0",
        Status = "Running"
    }))
    .WithName("Root");

    // GET /api/hotels - Get all hotels
    app.MapGet("/api/hotels", async (ApplicationDbContext context) =>
    {
        try
        {
            var hotels = await context.Hotels
                .Include(h => h.Rooms)
                .ToListAsync();
            return Results.Ok(hotels);
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Error retrieving hotels");
            return Results.Problem("An error occurred while retrieving hotels");
        }
    })
    .WithName("GetAllHotels")
    .Produces<IEnumerable<Hotel>>(StatusCodes.Status200OK)
    .Produces(StatusCodes.Status500InternalServerError);

    // GET /api/hotels/{id} - Get hotel by ID
    app.MapGet("/api/hotels/{id:guid}", async (Guid id, ApplicationDbContext context) =>
    {
        try
        {
            var hotel = await context.Hotels
                .Include(h => h.Rooms)
                .FirstOrDefaultAsync(h => h.Id == id);

            return hotel is not null ? Results.Ok(hotel) : Results.NotFound(new { Message = $"Hotel with ID {id} not found" });
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Error retrieving hotel with ID {HotelId}", id);
            return Results.Problem("An error occurred while retrieving the hotel");
        }
    })
    .WithName("GetHotelById")
    .Produces<Hotel>(StatusCodes.Status200OK)
    .Produces(StatusCodes.Status404NotFound)
    .Produces(StatusCodes.Status500InternalServerError);

    // POST /api/hotels - Create new hotel
    app.MapPost("/api/hotels", async (Hotel hotel, ApplicationDbContext context, HttpContext httpContext, IHostEnvironment env) =>
    {
        try
        {
            Log.Information("Attempting to create hotel: {@Hotel}", new { hotel.Name, hotel.Location, hotel.Rating });

            // Validate input
            if (string.IsNullOrWhiteSpace(hotel.Name))
            {
                Log.Warning("Hotel creation failed: Name is required");
                return Results.BadRequest(new { Message = "Hotel name is required" });
            }

            if (string.IsNullOrWhiteSpace(hotel.Location))
            {
                Log.Warning("Hotel creation failed: Location is required");
                return Results.BadRequest(new { Message = "Hotel location is required" });
            }

            // Ensure Id is generated if not provided
            if (hotel.Id == Guid.Empty)
            {
                hotel.Id = Guid.NewGuid();
                Log.Information("Generated new GUID for hotel: {HotelId}", hotel.Id);
            }

            // Set audit fields
            hotel.CreatedAt = DateTime.UtcNow;
            hotel.UpdatedAt = null;
            hotel.IsDeleted = false;
            hotel.DeletedAt = null;

            // Initialize Rooms collection if null
            hotel.Rooms ??= new List<Room>();

            Log.Information("Adding hotel to database context");

            // Add to database
            context.Hotels.Add(hotel);
            
            Log.Information("Saving changes to database");
            await context.SaveChangesAsync();

            Log.Information("Hotel created successfully with ID {HotelId}", hotel.Id);

            // Return 201 Created with Location header
            var location = $"{httpContext.Request.Scheme}://{httpContext.Request.Host}/api/hotels/{hotel.Id}";
            return Results.Created(location, hotel);
        }
        catch (DbUpdateException dbEx)
        {
            Log.Error(dbEx, "Database error creating hotel: {Message}. Inner: {InnerMessage}", 
                dbEx.Message, 
                dbEx.InnerException?.Message ?? "None");
            
            var errorResponse = new 
            { 
                Message = "Database error occurred while creating the hotel",
                Details = env.IsDevelopment() ? dbEx.Message : null,
                InnerError = env.IsDevelopment() ? dbEx.InnerException?.Message : null
            };
            
            return Results.Problem(
                detail: env.IsDevelopment() ? $"{dbEx.Message}\nInner: {dbEx.InnerException?.Message}" : "A database error occurred",
                statusCode: StatusCodes.Status500InternalServerError,
                title: "Database Error"
            );
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Unexpected error creating hotel: {Message}. Type: {ExceptionType}", 
                ex.Message, 
                ex.GetType().Name);
            
            return Results.Problem(
                detail: env.IsDevelopment() ? $"{ex.GetType().Name}: {ex.Message}\n{ex.StackTrace}" : "An unexpected error occurred",
                statusCode: StatusCodes.Status500InternalServerError,
                title: "Error Creating Hotel"
            );
        }
    })
    .WithName("CreateHotel")
    .Produces<Hotel>(StatusCodes.Status201Created)
    .Produces(StatusCodes.Status400BadRequest)
    .Produces(StatusCodes.Status500InternalServerError);

    // PUT /api/hotels/{id} - Update hotel
    app.MapPut("/api/hotels/{id:guid}", async (Guid id, Hotel updatedHotel, ApplicationDbContext context) =>
    {
        try
        {
            // Find existing hotel
            var existingHotel = await context.Hotels.FindAsync(id);

            if (existingHotel is null)
            {
                return Results.NotFound(new { Message = $"Hotel with ID {id} not found" });
            }

            // Validate input
            if (string.IsNullOrWhiteSpace(updatedHotel.Name))
            {
                return Results.BadRequest(new { Message = "Hotel name is required" });
            }

            if (string.IsNullOrWhiteSpace(updatedHotel.Location))
            {
                return Results.BadRequest(new { Message = "Hotel location is required" });
            }

            // Update properties (except Id and CreatedAt)
            existingHotel.Name = updatedHotel.Name;
            existingHotel.Location = updatedHotel.Location;
            existingHotel.Description = updatedHotel.Description;
            existingHotel.Rating = updatedHotel.Rating;
            existingHotel.Amenities = updatedHotel.Amenities;
            existingHotel.UpdatedAt = DateTime.UtcNow;

            await context.SaveChangesAsync();

            Log.Information("Hotel with ID {HotelId} updated", id);

            return Results.NoContent();
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Error updating hotel with ID {HotelId}", id);
            return Results.Problem("An error occurred while updating the hotel");
        }
    })
    .WithName("UpdateHotel")
    .Produces(StatusCodes.Status204NoContent)
    .Produces(StatusCodes.Status400BadRequest)
    .Produces(StatusCodes.Status404NotFound)
    .Produces(StatusCodes.Status500InternalServerError);

    // DELETE /api/hotels/{id} - Soft delete hotel
    app.MapDelete("/api/hotels/{id:guid}", async (Guid id, ApplicationDbContext context) =>
    {
        try
        {
            // Find hotel
            var hotel = await context.Hotels.FindAsync(id);

            if (hotel is null)
            {
                return Results.NotFound(new { Message = $"Hotel with ID {id} not found" });
            }

            // Soft delete
            hotel.IsDeleted = true;
            hotel.DeletedAt = DateTime.UtcNow;

            await context.SaveChangesAsync();

            Log.Information("Hotel with ID {HotelId} soft deleted", id);

            return Results.NoContent();
        }
        catch (Exception ex)
        {
            Log.Error(ex, "Error deleting hotel with ID {HotelId}", id);
            return Results.Problem("An error occurred while deleting the hotel");
        }
    })
    .WithName("DeleteHotel")
    .Produces(StatusCodes.Status204NoContent)
    .Produces(StatusCodes.Status404NotFound)
    .Produces(StatusCodes.Status500InternalServerError);

    Log.Information("Hotel Booking API started successfully");
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
