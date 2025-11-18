using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using HotelBooking.Infrastructure.Data;
using HotelBooking.Domain.Entities;

namespace HotelBooking.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class HotelsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<HotelsController> _logger;
    private readonly IHostEnvironment _env;

    public HotelsController(ApplicationDbContext context, ILogger<HotelsController> logger, IHostEnvironment env)
    {
        _context = context;
        _logger = logger;
        _env = env;
    }

    // GET: api/hotels
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<Hotel>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetAllHotels()
    {
        try
        {
            var hotels = await _context.Hotels
                .Include(h => h.Rooms)
                .ToListAsync();
            return Ok(hotels);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving hotels");
            return Problem("An error occurred while retrieving hotels");
        }
    }

    // GET: api/hotels/{id}
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(Hotel), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetHotelById(Guid id)
    {
        try
        {
            var hotel = await _context.Hotels
                .Include(h => h.Rooms)
                .FirstOrDefaultAsync(h => h.Id == id);

            if (hotel is null)
            {
                return NotFound(new { Message = $"Hotel with ID {id} not found" });
            }

            return Ok(hotel);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving hotel with ID {HotelId}", id);
            return Problem("An error occurred while retrieving the hotel");
        }
    }

    // POST: api/hotels
    [HttpPost]
    [ProducesResponseType(typeof(Hotel), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> CreateHotel([FromBody] Hotel hotel)
    {
        try
        {
            _logger.LogInformation("Attempting to create hotel: {@Hotel}", new { hotel.Name, hotel.Location, hotel.Rating });

            // Validate input
            if (string.IsNullOrWhiteSpace(hotel.Name))
            {
                _logger.LogWarning("Hotel creation failed: Name is required");
                return BadRequest(new { Message = "Hotel name is required" });
            }

            if (string.IsNullOrWhiteSpace(hotel.Location))
            {
                _logger.LogWarning("Hotel creation failed: Location is required");
                return BadRequest(new { Message = "Hotel location is required" });
            }

            // Ensure Id is generated if not provided
            if (hotel.Id == Guid.Empty)
            {
                hotel.Id = Guid.NewGuid();
                _logger.LogInformation("Generated new GUID for hotel: {HotelId}", hotel.Id);
            }

            // Set audit fields
            hotel.CreatedAt = DateTime.UtcNow;
            hotel.UpdatedAt = null;
            hotel.IsDeleted = false;
            hotel.DeletedAt = null;

            // Initialize Rooms collection if null
            hotel.Rooms ??= new List<Room>();

            _logger.LogInformation("Adding hotel to database context");

            // Add to database
            _context.Hotels.Add(hotel);

            _logger.LogInformation("Saving changes to database");
            await _context.SaveChangesAsync();

            _logger.LogInformation("Hotel created successfully with ID {HotelId}", hotel.Id);

            return CreatedAtAction(nameof(GetHotelById), new { id = hotel.Id }, hotel);
        }
        catch (DbUpdateException dbEx)
        {
            _logger.LogError(dbEx, "Database error creating hotel: {Message}. Inner: {InnerMessage}",
                dbEx.Message,
                dbEx.InnerException?.Message ?? "None");

            return Problem(
                detail: _env.IsDevelopment() ? $"{dbEx.Message}\nInner: {dbEx.InnerException?.Message}" : "A database error occurred",
                statusCode: StatusCodes.Status500InternalServerError,
                title: "Database Error"
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error creating hotel: {Message}. Type: {ExceptionType}",
                ex.Message,
                ex.GetType().Name);

            return Problem(
                detail: _env.IsDevelopment() ? $"{ex.GetType().Name}: {ex.Message}\n{ex.StackTrace}" : "An unexpected error occurred",
                statusCode: StatusCodes.Status500InternalServerError,
                title: "Error Creating Hotel"
            );
        }
    }

    // PUT: api/hotels/{id}
    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> UpdateHotel(Guid id, [FromBody] Hotel updatedHotel)
    {
        try
        {
            // Find existing hotel
            var existingHotel = await _context.Hotels.FindAsync(id);

            if (existingHotel is null)
            {
                return NotFound(new { Message = $"Hotel with ID {id} not found" });
            }

            // Validate input
            if (string.IsNullOrWhiteSpace(updatedHotel.Name))
            {
                return BadRequest(new { Message = "Hotel name is required" });
            }

            if (string.IsNullOrWhiteSpace(updatedHotel.Location))
            {
                return BadRequest(new { Message = "Hotel location is required" });
            }

            // Update properties (except Id and CreatedAt)
            existingHotel.Name = updatedHotel.Name;
            existingHotel.Location = updatedHotel.Location;
            existingHotel.Description = updatedHotel.Description;
            existingHotel.Rating = updatedHotel.Rating;
            existingHotel.Amenities = updatedHotel.Amenities;
            existingHotel.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Hotel with ID {HotelId} updated", id);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating hotel with ID {HotelId}", id);
            return Problem("An error occurred while updating the hotel");
        }
    }

    // DELETE: api/hotels/{id}
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> DeleteHotel(Guid id)
    {
        try
        {
            // Find hotel
            var hotel = await _context.Hotels.FindAsync(id);

            if (hotel is null)
            {
                return NotFound(new { Message = $"Hotel with ID {id} not found" });
            }

            // Soft delete
            hotel.IsDeleted = true;
            hotel.DeletedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Hotel with ID {HotelId} soft deleted", id);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting hotel with ID {HotelId}", id);
            return Problem("An error occurred while deleting the hotel");
        }
    }
}
