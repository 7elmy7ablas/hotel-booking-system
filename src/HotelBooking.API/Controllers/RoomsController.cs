using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using HotelBooking.Infrastructure.Data;
using HotelBooking.Domain.Entities;

namespace HotelBooking.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class RoomsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<RoomsController> _logger;

    public RoomsController(ApplicationDbContext context, ILogger<RoomsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/rooms
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<Room>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetAllRooms()
    {
        try
        {
            _logger.LogInformation("Retrieving all rooms");

            var rooms = await _context.Rooms
                .Where(r => !r.IsDeleted)
                .Include(r => r.Hotel)
                .ToListAsync();

            _logger.LogInformation("Retrieved {Count} rooms", rooms.Count);

            return Ok(rooms);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving rooms");
            return Problem("An error occurred while retrieving rooms");
        }
    }

    // GET: api/rooms/{id}
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(Room), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetRoomById(Guid id)
    {
        try
        {
            _logger.LogInformation("Retrieving room with ID {RoomId}", id);

            var room = await _context.Rooms
                .Include(r => r.Hotel)
                .FirstOrDefaultAsync(r => r.Id == id && !r.IsDeleted);

            if (room is null)
            {
                _logger.LogWarning("Room with ID {RoomId} not found", id);
                return NotFound(new { Message = $"Room with ID {id} not found" });
            }

            _logger.LogInformation("Room with ID {RoomId} retrieved successfully", id);

            return Ok(room);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving room with ID {RoomId}", id);
            return Problem("An error occurred while retrieving the room");
        }
    }

    // POST: api/rooms
    [HttpPost]
    [ProducesResponseType(typeof(Room), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> CreateRoom([FromBody] Room room)
    {
        try
        {
            _logger.LogInformation("Attempting to create room: {@Room}", new { room.RoomType, room.HotelId, room.PricePerNight });

            // Validate HotelId exists
            var hotelExists = await _context.Hotels.AnyAsync(h => h.Id == room.HotelId && !h.IsDeleted);
            if (!hotelExists)
            {
                _logger.LogWarning("Room creation failed: Hotel with ID {HotelId} not found", room.HotelId);
                return NotFound(new { Message = $"Hotel with ID {room.HotelId} not found" });
            }

            // Validate PricePerNight > 0
            if (room.PricePerNight <= 0)
            {
                _logger.LogWarning("Room creation failed: PricePerNight must be greater than 0");
                return BadRequest(new { Message = "PricePerNight must be greater than 0" });
            }

            // Validate Capacity > 0
            if (room.Capacity <= 0)
            {
                _logger.LogWarning("Room creation failed: Capacity must be greater than 0");
                return BadRequest(new { Message = "Capacity must be greater than 0" });
            }

            // Validate RoomType
            if (string.IsNullOrWhiteSpace(room.RoomType))
            {
                _logger.LogWarning("Room creation failed: RoomType is required");
                return BadRequest(new { Message = "RoomType is required" });
            }

            // Generate new Guid for Id
            if (room.Id == Guid.Empty)
            {
                room.Id = Guid.NewGuid();
                _logger.LogInformation("Generated new GUID for room: {RoomId}", room.Id);
            }

            // Set audit fields
            room.CreatedAt = DateTime.UtcNow;
            room.UpdatedAt = null;
            room.IsDeleted = false;
            room.DeletedAt = null;

            // Add to database
            _context.Rooms.Add(room);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Room created successfully with ID {RoomId}", room.Id);

            return CreatedAtAction(nameof(GetRoomById), new { id = room.Id }, room);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating room");
            return Problem("An error occurred while creating the room");
        }
    }

    // PUT: api/rooms/{id}
    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> UpdateRoom(Guid id, [FromBody] Room updatedRoom)
    {
        try
        {
            _logger.LogInformation("Attempting to update room with ID {RoomId}", id);

            // Find existing room
            var existingRoom = await _context.Rooms.FindAsync(id);

            if (existingRoom is null || existingRoom.IsDeleted)
            {
                _logger.LogWarning("Room with ID {RoomId} not found", id);
                return NotFound(new { Message = $"Room with ID {id} not found" });
            }

            // Validate HotelId exists if changed
            if (existingRoom.HotelId != updatedRoom.HotelId)
            {
                var hotelExists = await _context.Hotels.AnyAsync(h => h.Id == updatedRoom.HotelId && !h.IsDeleted);
                if (!hotelExists)
                {
                    _logger.LogWarning("Room update failed: Hotel with ID {HotelId} not found", updatedRoom.HotelId);
                    return NotFound(new { Message = $"Hotel with ID {updatedRoom.HotelId} not found" });
                }
            }

            // Validate PricePerNight > 0
            if (updatedRoom.PricePerNight <= 0)
            {
                _logger.LogWarning("Room update failed: PricePerNight must be greater than 0");
                return BadRequest(new { Message = "PricePerNight must be greater than 0" });
            }

            // Validate Capacity > 0
            if (updatedRoom.Capacity <= 0)
            {
                _logger.LogWarning("Room update failed: Capacity must be greater than 0");
                return BadRequest(new { Message = "Capacity must be greater than 0" });
            }

            // Validate RoomType
            if (string.IsNullOrWhiteSpace(updatedRoom.RoomType))
            {
                _logger.LogWarning("Room update failed: RoomType is required");
                return BadRequest(new { Message = "RoomType is required" });
            }

            // Update properties (except Id and CreatedAt)
            existingRoom.HotelId = updatedRoom.HotelId;
            existingRoom.RoomType = updatedRoom.RoomType;
            existingRoom.PricePerNight = updatedRoom.PricePerNight;
            existingRoom.Capacity = updatedRoom.Capacity;
            existingRoom.IsAvailable = updatedRoom.IsAvailable;
            existingRoom.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Room with ID {RoomId} updated successfully", id);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating room with ID {RoomId}", id);
            return Problem("An error occurred while updating the room");
        }
    }

    // DELETE: api/rooms/{id}
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> DeleteRoom(Guid id)
    {
        try
        {
            _logger.LogInformation("Attempting to delete room with ID {RoomId}", id);

            // Find room
            var room = await _context.Rooms.FindAsync(id);

            if (room is null || room.IsDeleted)
            {
                _logger.LogWarning("Room with ID {RoomId} not found", id);
                return NotFound(new { Message = $"Room with ID {id} not found" });
            }

            // Soft delete
            room.IsDeleted = true;
            room.DeletedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Room with ID {RoomId} soft deleted successfully", id);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting room with ID {RoomId}", id);
            return Problem("An error occurred while deleting the room");
        }
    }
}
