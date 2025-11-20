using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using HotelBooking.Infrastructure.Data;
using HotelBooking.Domain.Entities;
using HotelBooking.API.Models;

namespace HotelBooking.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class HotelsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<HotelsController> _logger;
    private readonly IHostEnvironment _env;
    private readonly IMemoryCache _cache;

    public HotelsController(ApplicationDbContext context, ILogger<HotelsController> logger, IHostEnvironment env, IMemoryCache cache)
    {
        _context = context;
        _logger = logger;
        _env = env;
        _cache = cache;
    }

    // GET: api/hotels
    [HttpGet]
    [ResponseCache(Duration = 300, Location = ResponseCacheLocation.Any, VaryByQueryKeys = new[] { "pageNumber", "pageSize" })]
    [ProducesResponseType(typeof(PagedResult<Hotel>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetAllHotels([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
    {
        try
        {
            if (pageNumber < 1) pageNumber = 1;
            if (pageSize < 1) pageSize = 10;
            if (pageSize > 100) pageSize = 100;

            var cacheKey = $"hotels_page_{pageNumber}_size_{pageSize}";

            if (!_cache.TryGetValue(cacheKey, out PagedResult<Hotel>? result))
            {
                var totalCount = await _context.Hotels
                    .Where(h => !h.IsDeleted)
                    .AsNoTracking()
                    .CountAsync();

                var hotels = await _context.Hotels
                    .Where(h => !h.IsDeleted)
                    .Include(h => h.Rooms.Where(r => !r.IsDeleted))
                    .AsNoTracking()
                    .OrderBy(h => h.Name)
                    .Skip((pageNumber - 1) * pageSize)
                    .Take(pageSize)
                    .ToListAsync();

                result = new PagedResult<Hotel>
                {
                    Items = hotels,
                    PageNumber = pageNumber,
                    PageSize = pageSize,
                    TotalCount = totalCount
                };

                var cacheOptions = new MemoryCacheEntryOptions()
                    .SetAbsoluteExpiration(TimeSpan.FromMinutes(5));

                _cache.Set(cacheKey, result, cacheOptions);

                _logger.LogInformation("Hotels cached for page {PageNumber}, size {PageSize}", pageNumber, pageSize);
            }

            return Ok(result);
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
            var cacheKey = $"hotel_{id}";

            if (!_cache.TryGetValue(cacheKey, out Hotel? hotel))
            {
                hotel = await _context.Hotels
                    .Include(h => h.Rooms.Where(r => !r.IsDeleted))
                    .AsNoTracking()
                    .FirstOrDefaultAsync(h => h.Id == id && !h.IsDeleted);

                if (hotel is null)
                {
                    return NotFound(new { Message = $"Hotel with ID {id} not found" });
                }

                var cacheOptions = new MemoryCacheEntryOptions()
                    .SetAbsoluteExpiration(TimeSpan.FromMinutes(10));

                _cache.Set(cacheKey, hotel, cacheOptions);

                _logger.LogInformation("Hotel {HotelId} cached", id);
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
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

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

            _cache.Remove($"hotel_{hotel.Id}");
            InvalidateHotelListCache();

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
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

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

            _cache.Remove($"hotel_{id}");
            InvalidateHotelListCache();

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

            _cache.Remove($"hotel_{id}");
            InvalidateHotelListCache();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting hotel with ID {HotelId}", id);
            return Problem("An error occurred while deleting the hotel");
        }
    }

    private void InvalidateHotelListCache()
    {
        for (int page = 1; page <= 10; page++)
        {
            for (int size = 10; size <= 100; size += 10)
            {
                _cache.Remove($"hotels_page_{page}_size_{size}");
            }
        }
    }
}
