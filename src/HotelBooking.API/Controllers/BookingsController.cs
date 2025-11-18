using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using HotelBooking.Infrastructure.Data;
using HotelBooking.Domain.Entities;

namespace HotelBooking.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class BookingsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<BookingsController> _logger;

    public BookingsController(ApplicationDbContext context, ILogger<BookingsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/bookings
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<Booking>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetAllBookings()
    {
        try
        {
            _logger.LogInformation("Retrieving all bookings");

            var bookings = await _context.Bookings
                .Where(b => !b.IsDeleted)
                .Include(b => b.User)
                .Include(b => b.Room)
                    .ThenInclude(r => r!.Hotel)
                .Include(b => b.Payment)
                .ToListAsync();

            _logger.LogInformation("Retrieved {Count} bookings", bookings.Count);

            return Ok(bookings);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving bookings");
            return Problem("An error occurred while retrieving bookings");
        }
    }

    // GET: api/bookings/{id}
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(Booking), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetBookingById(Guid id)
    {
        try
        {
            _logger.LogInformation("Retrieving booking with ID {BookingId}", id);

            var booking = await _context.Bookings
                .Include(b => b.User)
                .Include(b => b.Room)
                    .ThenInclude(r => r!.Hotel)
                .Include(b => b.Payment)
                .FirstOrDefaultAsync(b => b.Id == id && !b.IsDeleted);

            if (booking is null)
            {
                _logger.LogWarning("Booking with ID {BookingId} not found", id);
                return NotFound(new { Message = $"Booking with ID {id} not found" });
            }

            _logger.LogInformation("Booking with ID {BookingId} retrieved successfully", id);

            return Ok(booking);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving booking with ID {BookingId}", id);
            return Problem("An error occurred while retrieving the booking");
        }
    }

    // POST: api/bookings
    [HttpPost]
    [ProducesResponseType(typeof(Booking), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> CreateBooking([FromBody] Booking booking)
    {
        try
        {
            _logger.LogInformation("Attempting to create booking: {@Booking}", new { booking.UserId, booking.RoomId, booking.CheckIn, booking.CheckOut });

            // Validate UserId exists
            var userExists = await _context.Users.AnyAsync(u => u.Id == booking.UserId && !u.IsDeleted);
            if (!userExists)
            {
                _logger.LogWarning("Booking creation failed: User with ID {UserId} not found", booking.UserId);
                return NotFound(new { Message = $"User with ID {booking.UserId} not found" });
            }

            // Validate RoomId exists and get room details
            var room = await _context.Rooms
                .Include(r => r.Hotel)
                .FirstOrDefaultAsync(r => r.Id == booking.RoomId && !r.IsDeleted);

            if (room is null)
            {
                _logger.LogWarning("Booking creation failed: Room with ID {RoomId} not found", booking.RoomId);
                return NotFound(new { Message = $"Room with ID {booking.RoomId} not found" });
            }

            // Validate CheckOut > CheckIn
            if (booking.CheckOut <= booking.CheckIn)
            {
                _logger.LogWarning("Booking creation failed: CheckOut date must be after CheckIn date");
                return BadRequest(new { Message = "CheckOut date must be after CheckIn date" });
            }

            // Check for overlapping bookings (CRITICAL LOGIC)
            var overlappingBookings = await _context.Bookings
                .Where(b => b.RoomId == booking.RoomId
                    && !b.IsDeleted
                    && b.Status != "Cancelled"
                    && b.CheckIn < booking.CheckOut
                    && b.CheckOut > booking.CheckIn)
                .ToListAsync();

            if (overlappingBookings.Any())
            {
                var existingBooking = overlappingBookings.First();
                _logger.LogWarning("Booking creation failed: Room is already booked from {CheckIn} to {CheckOut}",
                    existingBooking.CheckIn, existingBooking.CheckOut);
                return BadRequest(new { Message = $"Room is already booked from {existingBooking.CheckIn:yyyy-MM-dd} to {existingBooking.CheckOut:yyyy-MM-dd}" });
            }

            // Auto-calculate TotalPrice
            var days = (booking.CheckOut - booking.CheckIn).Days;
            if (days == 0)
            {
                days = 1; // Same-day booking
            }
            booking.TotalPrice = days * room.PricePerNight;

            _logger.LogInformation("Calculated TotalPrice: {Days} days × {PricePerNight} = {TotalPrice}",
                days, room.PricePerNight, booking.TotalPrice);

            // Set default Status to "Pending" if not provided
            if (string.IsNullOrWhiteSpace(booking.Status))
            {
                booking.Status = "Pending";
            }

            // Generate new Guid for Id
            if (booking.Id == Guid.Empty)
            {
                booking.Id = Guid.NewGuid();
                _logger.LogInformation("Generated new GUID for booking: {BookingId}", booking.Id);
            }

            // Set audit fields
            booking.CreatedAt = DateTime.UtcNow;
            booking.UpdatedAt = null;
            booking.IsDeleted = false;
            booking.DeletedAt = null;

            // Add to database
            _context.Bookings.Add(booking);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Booking created successfully with ID {BookingId}", booking.Id);

            // Load navigation properties for response
            await _context.Entry(booking).Reference(b => b.User).LoadAsync();
            await _context.Entry(booking).Reference(b => b.Room).LoadAsync();

            return CreatedAtAction(nameof(GetBookingById), new { id = booking.Id }, booking);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating booking");
            return Problem("An error occurred while creating the booking");
        }
    }

    // PUT: api/bookings/{id}
    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> UpdateBooking(Guid id, [FromBody] Booking updatedBooking)
    {
        try
        {
            _logger.LogInformation("Attempting to update booking with ID {BookingId}", id);

            // Find existing booking
            var existingBooking = await _context.Bookings.FindAsync(id);

            if (existingBooking is null || existingBooking.IsDeleted)
            {
                _logger.LogWarning("Booking with ID {BookingId} not found", id);
                return NotFound(new { Message = $"Booking with ID {id} not found" });
            }

            bool needsRecalculation = false;

            // If RoomId changed, validate new RoomId exists
            if (existingBooking.RoomId != updatedBooking.RoomId)
            {
                var roomExists = await _context.Rooms.AnyAsync(r => r.Id == updatedBooking.RoomId && !r.IsDeleted);
                if (!roomExists)
                {
                    _logger.LogWarning("Booking update failed: Room with ID {RoomId} not found", updatedBooking.RoomId);
                    return NotFound(new { Message = $"Room with ID {updatedBooking.RoomId} not found" });
                }
                needsRecalculation = true;
            }

            // Validate CheckOut > CheckIn
            if (updatedBooking.CheckOut <= updatedBooking.CheckIn)
            {
                _logger.LogWarning("Booking update failed: CheckOut date must be after CheckIn date");
                return BadRequest(new { Message = "CheckOut date must be after CheckIn date" });
            }

            // Check if dates changed
            if (existingBooking.CheckIn != updatedBooking.CheckIn || existingBooking.CheckOut != updatedBooking.CheckOut)
            {
                needsRecalculation = true;
            }

            // Check for overlapping bookings (excluding current booking)
            if (existingBooking.RoomId != updatedBooking.RoomId ||
                existingBooking.CheckIn != updatedBooking.CheckIn ||
                existingBooking.CheckOut != updatedBooking.CheckOut)
            {
                var overlappingBookings = await _context.Bookings
                    .Where(b => b.RoomId == updatedBooking.RoomId
                        && b.Id != id
                        && !b.IsDeleted
                        && b.Status != "Cancelled"
                        && b.CheckIn < updatedBooking.CheckOut
                        && b.CheckOut > updatedBooking.CheckIn)
                    .ToListAsync();

                if (overlappingBookings.Any())
                {
                    var existingOverlap = overlappingBookings.First();
                    _logger.LogWarning("Booking update failed: Room is already booked from {CheckIn} to {CheckOut}",
                        existingOverlap.CheckIn, existingOverlap.CheckOut);
                    return BadRequest(new { Message = $"Room is already booked from {existingOverlap.CheckIn:yyyy-MM-dd} to {existingOverlap.CheckOut:yyyy-MM-dd}" });
                }
            }

            // Recalculate TotalPrice if needed
            if (needsRecalculation)
            {
                var room = await _context.Rooms.FindAsync(updatedBooking.RoomId);
                if (room is not null)
                {
                    var days = (updatedBooking.CheckOut - updatedBooking.CheckIn).Days;
                    if (days == 0)
                    {
                        days = 1;
                    }
                    existingBooking.TotalPrice = days * room.PricePerNight;
                    _logger.LogInformation("Recalculated TotalPrice: {Days} days × {PricePerNight} = {TotalPrice}",
                        days, room.PricePerNight, existingBooking.TotalPrice);
                }
            }

            // Update properties
            existingBooking.UserId = updatedBooking.UserId;
            existingBooking.RoomId = updatedBooking.RoomId;
            existingBooking.CheckIn = updatedBooking.CheckIn;
            existingBooking.CheckOut = updatedBooking.CheckOut;
            existingBooking.Status = updatedBooking.Status;
            existingBooking.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Booking with ID {BookingId} updated successfully", id);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating booking with ID {BookingId}", id);
            return Problem("An error occurred while updating the booking");
        }
    }

    // DELETE: api/bookings/{id}
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> DeleteBooking(Guid id)
    {
        try
        {
            _logger.LogInformation("Attempting to delete booking with ID {BookingId}", id);

            // Find booking
            var booking = await _context.Bookings.FindAsync(id);

            if (booking is null || booking.IsDeleted)
            {
                _logger.LogWarning("Booking with ID {BookingId} not found", id);
                return NotFound(new { Message = $"Booking with ID {id} not found" });
            }

            // Soft delete
            booking.IsDeleted = true;
            booking.DeletedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Booking with ID {BookingId} soft deleted successfully", id);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting booking with ID {BookingId}", id);
            return Problem("An error occurred while deleting the booking");
        }
    }
}
