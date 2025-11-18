using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using HotelBooking.Infrastructure.Data;
using HotelBooking.Domain.Entities;

namespace HotelBooking.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class PaymentsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<PaymentsController> _logger;

    public PaymentsController(ApplicationDbContext context, ILogger<PaymentsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/payments
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<Payment>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetAllPayments()
    {
        try
        {
            _logger.LogInformation("Retrieving all payments");

            var payments = await _context.Payments
                .Where(p => !p.IsDeleted)
                .Include(p => p.Booking)
                .ToListAsync();

            _logger.LogInformation("Retrieved {Count} payments", payments.Count);

            return Ok(payments);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving payments");
            return Problem("An error occurred while retrieving payments");
        }
    }

    // GET: api/payments/{id}
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(Payment), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetPaymentById(Guid id)
    {
        try
        {
            _logger.LogInformation("Retrieving payment with ID {PaymentId}", id);

            var payment = await _context.Payments
                .Include(p => p.Booking)
                .FirstOrDefaultAsync(p => p.Id == id && !p.IsDeleted);

            if (payment is null)
            {
                _logger.LogWarning("Payment with ID {PaymentId} not found", id);
                return NotFound(new { Message = $"Payment with ID {id} not found" });
            }

            _logger.LogInformation("Payment with ID {PaymentId} retrieved successfully", id);

            return Ok(payment);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving payment with ID {PaymentId}", id);
            return Problem("An error occurred while retrieving the payment");
        }
    }

    // POST: api/payments
    [HttpPost]
    [ProducesResponseType(typeof(Payment), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> CreatePayment([FromBody] Payment payment)
    {
        try
        {
            _logger.LogInformation("Attempting to create payment: {@Payment}", new { payment.BookingId, payment.Amount, payment.PaymentMethod });

            // Validate BookingId exists
            var bookingExists = await _context.Bookings.AnyAsync(b => b.Id == payment.BookingId && !b.IsDeleted);
            if (!bookingExists)
            {
                _logger.LogWarning("Payment creation failed: Booking with ID {BookingId} not found", payment.BookingId);
                return NotFound(new { Message = $"Booking with ID {payment.BookingId} not found" });
            }

            // Validate Amount > 0
            if (payment.Amount <= 0)
            {
                _logger.LogWarning("Payment creation failed: Amount must be greater than 0");
                return BadRequest(new { Message = "Amount must be greater than 0" });
            }

            // Validate PaymentMethod
            if (string.IsNullOrWhiteSpace(payment.PaymentMethod))
            {
                _logger.LogWarning("Payment creation failed: PaymentMethod is required");
                return BadRequest(new { Message = "PaymentMethod is required" });
            }

            // Generate new Guid for Id
            if (payment.Id == Guid.Empty)
            {
                payment.Id = Guid.NewGuid();
                _logger.LogInformation("Generated new GUID for payment: {PaymentId}", payment.Id);
            }

            // Set default Status to "Pending" if not provided
            if (string.IsNullOrWhiteSpace(payment.Status))
            {
                payment.Status = "Pending";
            }

            // Set audit fields
            payment.CreatedAt = DateTime.UtcNow;
            payment.UpdatedAt = null;
            payment.IsDeleted = false;
            payment.DeletedAt = null;

            // Add to database
            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();

            _logger.LogInformation("Payment created successfully with ID {PaymentId}", payment.Id);

            return CreatedAtAction(nameof(GetPaymentById), new { id = payment.Id }, payment);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating payment");
            return Problem("An error occurred while creating the payment");
        }
    }

    // PUT: api/payments/{id}
    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> UpdatePayment(Guid id, [FromBody] Payment updatedPayment)
    {
        try
        {
            _logger.LogInformation("Attempting to update payment with ID {PaymentId}", id);

            // Find existing payment
            var existingPayment = await _context.Payments.FindAsync(id);

            if (existingPayment is null || existingPayment.IsDeleted)
            {
                _logger.LogWarning("Payment with ID {PaymentId} not found", id);
                return NotFound(new { Message = $"Payment with ID {id} not found" });
            }

            // Validate Amount > 0
            if (updatedPayment.Amount <= 0)
            {
                _logger.LogWarning("Payment update failed: Amount must be greater than 0");
                return BadRequest(new { Message = "Amount must be greater than 0" });
            }

            // Update properties
            existingPayment.Amount = updatedPayment.Amount;
            existingPayment.PaymentMethod = updatedPayment.PaymentMethod;
            existingPayment.Status = updatedPayment.Status;
            existingPayment.PaymentDate = updatedPayment.PaymentDate;
            existingPayment.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Payment with ID {PaymentId} updated successfully", id);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating payment with ID {PaymentId}", id);
            return Problem("An error occurred while updating the payment");
        }
    }

    // DELETE: api/payments/{id}
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> DeletePayment(Guid id)
    {
        try
        {
            _logger.LogInformation("Attempting to delete payment with ID {PaymentId}", id);

            // Find payment
            var payment = await _context.Payments.FindAsync(id);

            if (payment is null || payment.IsDeleted)
            {
                _logger.LogWarning("Payment with ID {PaymentId} not found", id);
                return NotFound(new { Message = $"Payment with ID {id} not found" });
            }

            // Soft delete
            payment.IsDeleted = true;
            payment.DeletedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("Payment with ID {PaymentId} soft deleted successfully", id);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting payment with ID {PaymentId}", id);
            return Problem("An error occurred while deleting the payment");
        }
    }
}
