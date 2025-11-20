using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using HotelBooking.Infrastructure.Data;
using HotelBooking.Domain.Entities;
using HotelBooking.Application.Services;

namespace HotelBooking.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class BookingsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<BookingsController> _logger;
    private readonly BookingValidationService _validationService;

    public BookingsController(
        ApplicationDbContext context, 
        ILogger<BookingsController> logger,
        BookingValidationService validationService)
    {
        _context = context;
        _logger = logger;
        _validationService = validationService;
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
                .AsNoTracking()
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
                .AsNoTracking()
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
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            _logger.LogInformation("Attempting to create booking: {@Booking}", new { booking.UserId, booking.RoomId, booking.CheckIn, booking.CheckOut });

            // Validate UserId exists
            var userExists = await _context.Users.AnyAsync(u => u.Id == booking.UserId && !u.IsDeleted);
            if (!userExists)
            {
                _logger.LogWarning("Booking creation failed: User with ID {UserId} not found", booking.UserId);
                return NotFound(new { message = "User not found. Please ensure you are logged in." });
            }

            // Validate RoomId exists and get room details
            var room = await _context.Rooms
                .Include(r => r.Hotel)
                .FirstOrDefaultAsync(r => r.Id == booking.RoomId && !r.IsDeleted);

            if (room is null)
            {
                _logger.LogWarning("Booking creation failed: Room with ID {RoomId} not found", booking.RoomId);
                return NotFound(new { message = "The selected room is no longer available. Please choose another room." });
            }

            // Validate booking using BookingValidationService
            var validationResult = await _validationService.ValidateNoOverlapAsync(
                booking.RoomId,
                booking.CheckIn,
                booking.CheckOut);

            if (!validationResult.IsValid)
            {
                _logger.LogWarning("Booking validation failed: {ErrorMessage}", validationResult.ErrorMessage);
                return BadRequest(new { message = validationResult.ErrorMessage });
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
            return StatusCode(500, new { message = "We encountered an error while processing your booking. Please try again or contact support if the issue persists." });
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
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            _logger.LogInformation("Attempting to update booking with ID {BookingId}", id);

            // Find existing booking
            var existingBooking = await _context.Bookings.FindAsync(id);

            if (existingBooking is null || existingBooking.IsDeleted)
            {
                _logger.LogWarning("Booking with ID {BookingId} not found", id);
                return NotFound(new { message = "Booking not found. It may have been cancelled or does not exist." });
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

            // Check if dates changed
            if (existingBooking.CheckIn != updatedBooking.CheckIn || existingBooking.CheckOut != updatedBooking.CheckOut)
            {
                needsRecalculation = true;
            }

            // Validate booking using BookingValidationService (excluding current booking)
            if (existingBooking.RoomId != updatedBooking.RoomId ||
                existingBooking.CheckIn != updatedBooking.CheckIn ||
                existingBooking.CheckOut != updatedBooking.CheckOut)
            {
                var validationResult = await _validationService.ValidateNoOverlapAsync(
                    updatedBooking.RoomId,
                    updatedBooking.CheckIn,
                    updatedBooking.CheckOut,
                    id); // Exclude current booking from overlap check

                if (!validationResult.IsValid)
                {
                    _logger.LogWarning("Booking update validation failed: {ErrorMessage}", validationResult.ErrorMessage);
                    return BadRequest(new { message = validationResult.ErrorMessage });
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
