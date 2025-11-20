using HotelBooking.Domain.Entities;
using HotelBooking.Application.Interfaces;
using Microsoft.Extensions.Logging;

namespace HotelBooking.Application.Services;

/// <summary>
/// Service for validating booking business rules
/// </summary>
public class BookingValidationService
{
    private readonly IRepository<Booking> _bookingRepository;
    private readonly ILogger<BookingValidationService> _logger;

    public BookingValidationService(
        IRepository<Booking> bookingRepository,
        ILogger<BookingValidationService> logger)
    {
        _bookingRepository = bookingRepository;
        _logger = logger;
    }

    /// <summary>
    /// Validates that a booking does not overlap with existing bookings
    /// CRITICAL: This method implements comprehensive overlap detection
    /// </summary>
    /// <param name="roomId">Room ID to check</param>
    /// <param name="checkIn">Check-in date</param>
    /// <param name="checkOut">Check-out date</param>
    /// <param name="excludeBookingId">Optional booking ID to exclude (for updates)</param>
    /// <returns>Validation result with error message if invalid</returns>
    public async Task<BookingValidationResult> ValidateNoOverlapAsync(
        Guid roomId,
        DateTime checkIn,
        DateTime checkOut,
        Guid? excludeBookingId = null)
    {
        _logger.LogInformation(
            "Validating booking overlap for Room {RoomId}, CheckIn: {CheckIn}, CheckOut: {CheckOut}",
            roomId, checkIn, checkOut);

        // Validate date logic
        if (checkOut <= checkIn)
        {
            return BookingValidationResult.Failure(
                "Check-out date must be after check-in date");
        }

        // Validate dates are not in the past
        if (checkIn.Date < DateTime.UtcNow.Date)
        {
            return BookingValidationResult.Failure(
                "Check-in date cannot be in the past");
        }

        // Get all active bookings for this room
        var existingBookings = await _bookingRepository.GetAllAsync();
        
        var overlappingBookings = existingBookings
            .Where(b => b.RoomId == roomId
                && !b.IsDeleted
                && b.Status != "Cancelled"
                && (excludeBookingId == null || b.Id != excludeBookingId)
                // CRITICAL OVERLAP LOGIC:
                // Two bookings overlap if:
                // 1. New booking starts before existing ends AND
                // 2. New booking ends after existing starts
                // This covers ALL overlap scenarios:
                // - Exact match
                // - Partial overlap (start or end)
                // - Complete containment (either direction)
                && b.CheckIn < checkOut
                && b.CheckOut > checkIn)
            .ToList();

        if (overlappingBookings.Any())
        {
            var firstOverlap = overlappingBookings.First();
            var message = $"Room is already booked from {firstOverlap.CheckIn:yyyy-MM-dd} to {firstOverlap.CheckOut:yyyy-MM-dd}";
            
            _logger.LogWarning(
                "Booking overlap detected for Room {RoomId}. Existing booking: {ExistingCheckIn} to {ExistingCheckOut}",
                roomId, firstOverlap.CheckIn, firstOverlap.CheckOut);

            return BookingValidationResult.Failure(message);
        }

        _logger.LogInformation("No booking overlap detected for Room {RoomId}", roomId);
        return BookingValidationResult.Success();
    }

    /// <summary>
    /// Validates booking dates are valid
    /// </summary>
    public BookingValidationResult ValidateDates(DateTime checkIn, DateTime checkOut)
    {
        if (checkOut <= checkIn)
        {
            return BookingValidationResult.Failure(
                "Check-out date must be after check-in date");
        }

        if (checkIn.Date < DateTime.UtcNow.Date)
        {
            return BookingValidationResult.Failure(
                "Check-in date cannot be in the past");
        }

        // Validate maximum booking duration (e.g., 30 days)
        var duration = (checkOut - checkIn).Days;
        if (duration > 30)
        {
            return BookingValidationResult.Failure(
                "Booking duration cannot exceed 30 days");
        }

        return BookingValidationResult.Success();
    }
}

/// <summary>
/// Result of booking validation
/// </summary>
public class BookingValidationResult
{
    public bool IsValid { get; private set; }
    public string? ErrorMessage { get; private set; }

    private BookingValidationResult(bool isValid, string? errorMessage = null)
    {
        IsValid = isValid;
        ErrorMessage = errorMessage;
    }

    public static BookingValidationResult Success() => new(true);
    public static BookingValidationResult Failure(string errorMessage) => new(false, errorMessage);
}
