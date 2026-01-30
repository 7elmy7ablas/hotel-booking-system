using FsCheck;
using FsCheck.Xunit;
using FluentAssertions;
using HotelBooking.Application.Interfaces;
using HotelBooking.Application.Services;
using HotelBooking.Domain.Entities;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;

namespace HotelBooking.Application.Tests.Services;

/// <summary>
/// Property-based tests for BookingValidationService overlap detection
/// Spec: .specify/specs/001-hotel-booking-flow/spec.md (EC-001)
/// Task: T006 - FsCheck property tests for comprehensive overlap verification
/// 
/// These tests verify the overlap detection formula:
/// isOverlap = !(newCheckOut <= existingCheckIn || newCheckIn >= existingCheckOut)
/// </summary>
public class BookingValidationServicePropertyTests
{
    private readonly Mock<IRepository<Booking>> _mockRepository;
    private readonly Mock<ILogger<BookingValidationService>> _mockLogger;
    private readonly BookingValidationService _service;

    public BookingValidationServicePropertyTests()
    {
        _mockRepository = new Mock<IRepository<Booking>>();
        _mockLogger = new Mock<ILogger<BookingValidationService>>();
        _service = new BookingValidationService(_mockRepository.Object, _mockLogger.Object);
    }

    #region Overlap Detection Properties

    /// <summary>
    /// Property: Sequential bookings (ending at same instant another starts) should NOT overlap
    /// Spec: EC-001 table - "Feb 15-18 | Feb 18-20 | ✅ Allowed (sequential)"
    /// </summary>
    [Property(Arbitrary = new[] { typeof(BookingDateGenerators) })]
    public Property SequentialBookings_EndToStart_ShouldNotOverlap(ValidDateRange dates)
    {
        return Prop.ForAll(
            Gen.Choose(1, 14).ToArbitrary(),
            secondDuration =>
            {
                var roomId = Guid.NewGuid();
                var existingBooking = CreateBooking(roomId, dates.CheckIn, dates.CheckOut);
                
                // New booking starts exactly when existing ends
                var newCheckIn = dates.CheckOut;
                var newCheckOut = newCheckIn.AddDays(secondDuration);

                _mockRepository.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
                    .ReturnsAsync(new List<Booking> { existingBooking });

                var result = _service.ValidateNoOverlapAsync(roomId, newCheckIn, newCheckOut).Result;

                return result.IsValid.ToProperty()
                    .Label($"Sequential: {dates.CheckIn:d}-{dates.CheckOut:d} then {newCheckIn:d}-{newCheckOut:d}");
            });
    }

    /// <summary>
    /// Property: Sequential bookings (starting at same instant another ends) should NOT overlap
    /// Spec: EC-001 table - "Feb 15-18 | Feb 10-15 | ✅ Allowed (ends when existing starts)"
    /// </summary>
    [Property(Arbitrary = new[] { typeof(BookingDateGenerators) })]
    public Property SequentialBookings_StartToEnd_ShouldNotOverlap(ValidDateRange dates)
    {
        return Prop.ForAll(
            Gen.Choose(1, 14).ToArbitrary(),
            firstDuration =>
            {
                var roomId = Guid.NewGuid();
                var existingBooking = CreateBooking(roomId, dates.CheckIn, dates.CheckOut);
                
                // New booking ends exactly when existing starts
                var newCheckOut = dates.CheckIn;
                var newCheckIn = newCheckOut.AddDays(-firstDuration);

                // Skip if newCheckIn is in the past
                if (newCheckIn.Date < DateTime.UtcNow.Date)
                    return true.ToProperty().Label("Skipped - past date");

                _mockRepository.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
                    .ReturnsAsync(new List<Booking> { existingBooking });

                var result = _service.ValidateNoOverlapAsync(roomId, newCheckIn, newCheckOut).Result;

                return result.IsValid.ToProperty()
                    .Label($"Sequential: {newCheckIn:d}-{newCheckOut:d} then {dates.CheckIn:d}-{dates.CheckOut:d}");
            });
    }

    /// <summary>
    /// Property: Partial overlap at start should be REJECTED
    /// Spec: EC-001 table - "Feb 15-18 | Feb 10-16 | ❌ Overlap"
    /// </summary>
    [Property(Arbitrary = new[] { typeof(BookingDateGenerators) })]
    public Property PartialOverlap_AtStart_ShouldBeRejected(ValidDateRange dates)
    {
        return Prop.ForAll(
            Gen.Choose(1, (dates.CheckOut - dates.CheckIn).Days - 1).Where(d => d > 0).ToArbitrary(),
            overlapDays =>
            {
                var roomId = Guid.NewGuid();
                var existingBooking = CreateBooking(roomId, dates.CheckIn, dates.CheckOut);
                
                // New booking ends after existing starts (partial overlap at start)
                var newCheckOut = dates.CheckIn.AddDays(overlapDays);
                var newCheckIn = newCheckOut.AddDays(-overlapDays - 1);

                // Skip if newCheckIn is in the past
                if (newCheckIn.Date < DateTime.UtcNow.Date)
                    return true.ToProperty().Label("Skipped - past date");

                _mockRepository.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
                    .ReturnsAsync(new List<Booking> { existingBooking });

                var result = _service.ValidateNoOverlapAsync(roomId, newCheckIn, newCheckOut).Result;

                return (!result.IsValid).ToProperty()
                    .Label($"Overlap at start: existing {dates.CheckIn:d}-{dates.CheckOut:d}, new {newCheckIn:d}-{newCheckOut:d}");
            });
    }

    /// <summary>
    /// Property: Partial overlap at end should be REJECTED
    /// Spec: EC-001 table - "Feb 15-18 | Feb 17-20 | ❌ Overlap"
    /// </summary>
    [Property(Arbitrary = new[] { typeof(BookingDateGenerators) })]
    public Property PartialOverlap_AtEnd_ShouldBeRejected(ValidDateRange dates)
    {
        return Prop.ForAll(
            Gen.Choose(1, (dates.CheckOut - dates.CheckIn).Days - 1).Where(d => d > 0).ToArbitrary(),
            overlapDays =>
            {
                var roomId = Guid.NewGuid();
                var existingBooking = CreateBooking(roomId, dates.CheckIn, dates.CheckOut);
                
                // New booking starts before existing ends (partial overlap at end)
                var newCheckIn = dates.CheckOut.AddDays(-overlapDays);
                var newCheckOut = newCheckIn.AddDays(overlapDays + 3);

                _mockRepository.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
                    .ReturnsAsync(new List<Booking> { existingBooking });

                var result = _service.ValidateNoOverlapAsync(roomId, newCheckIn, newCheckOut).Result;

                return (!result.IsValid).ToProperty()
                    .Label($"Overlap at end: existing {dates.CheckIn:d}-{dates.CheckOut:d}, new {newCheckIn:d}-{newCheckOut:d}");
            });
    }

    /// <summary>
    /// Property: Identical dates should be REJECTED
    /// Spec: EC-001 table - "Feb 15-18 | Feb 15-18 | ❌ Overlap (identical)"
    /// </summary>
    [Property(Arbitrary = new[] { typeof(BookingDateGenerators) })]
    public Property IdenticalDates_ShouldBeRejected(ValidDateRange dates)
    {
        var roomId = Guid.NewGuid();
        var existingBooking = CreateBooking(roomId, dates.CheckIn, dates.CheckOut);

        _mockRepository.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Booking> { existingBooking });

        var result = _service.ValidateNoOverlapAsync(roomId, dates.CheckIn, dates.CheckOut).Result;

        return (!result.IsValid).ToProperty()
            .Label($"Identical: {dates.CheckIn:d}-{dates.CheckOut:d}");
    }

    /// <summary>
    /// Property: Complete containment (new inside existing) should be REJECTED
    /// </summary>
    [Property(Arbitrary = new[] { typeof(BookingDateGenerators) })]
    public Property NewBookingInsideExisting_ShouldBeRejected(ValidDateRange dates)
    {
        // Only test if we have room for containment (at least 3 days)
        var duration = (dates.CheckOut - dates.CheckIn).Days;
        if (duration < 3)
            return true.ToProperty().Label("Skipped - too short");

        var roomId = Guid.NewGuid();
        var existingBooking = CreateBooking(roomId, dates.CheckIn, dates.CheckOut);
        
        // New booking is completely inside existing
        var newCheckIn = dates.CheckIn.AddDays(1);
        var newCheckOut = dates.CheckOut.AddDays(-1);

        _mockRepository.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Booking> { existingBooking });

        var result = _service.ValidateNoOverlapAsync(roomId, newCheckIn, newCheckOut).Result;

        return (!result.IsValid).ToProperty()
            .Label($"Contained: new {newCheckIn:d}-{newCheckOut:d} inside {dates.CheckIn:d}-{dates.CheckOut:d}");
    }

    /// <summary>
    /// Property: Complete containment (existing inside new) should be REJECTED
    /// </summary>
    [Property(Arbitrary = new[] { typeof(BookingDateGenerators) })]
    public Property ExistingBookingInsideNew_ShouldBeRejected(ValidDateRange dates)
    {
        var roomId = Guid.NewGuid();
        var existingBooking = CreateBooking(roomId, dates.CheckIn, dates.CheckOut);
        
        // New booking completely contains existing
        var newCheckIn = dates.CheckIn.AddDays(-2);
        var newCheckOut = dates.CheckOut.AddDays(2);

        // Skip if newCheckIn is in the past
        if (newCheckIn.Date < DateTime.UtcNow.Date)
            return true.ToProperty().Label("Skipped - past date");

        _mockRepository.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Booking> { existingBooking });

        var result = _service.ValidateNoOverlapAsync(roomId, newCheckIn, newCheckOut).Result;

        return (!result.IsValid).ToProperty()
            .Label($"Contains: new {newCheckIn:d}-{newCheckOut:d} contains {dates.CheckIn:d}-{dates.CheckOut:d}");
    }

    /// <summary>
    /// Property: Bookings for DIFFERENT rooms should NEVER conflict
    /// </summary>
    [Property(Arbitrary = new[] { typeof(BookingDateGenerators) })]
    public Property DifferentRooms_ShouldNeverConflict(ValidDateRange dates)
    {
        var roomId1 = Guid.NewGuid();
        var roomId2 = Guid.NewGuid();
        
        var existingBooking = CreateBooking(roomId1, dates.CheckIn, dates.CheckOut);

        _mockRepository.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Booking> { existingBooking });

        // Same dates, different room should always succeed
        var result = _service.ValidateNoOverlapAsync(roomId2, dates.CheckIn, dates.CheckOut).Result;

        return result.IsValid.ToProperty()
            .Label($"Different rooms: {roomId1} vs {roomId2}");
    }

    /// <summary>
    /// Property: Cancelled bookings should NOT cause conflicts
    /// </summary>
    [Property(Arbitrary = new[] { typeof(BookingDateGenerators) })]
    public Property CancelledBookings_ShouldNotConflict(ValidDateRange dates)
    {
        var roomId = Guid.NewGuid();
        var cancelledBooking = CreateBooking(roomId, dates.CheckIn, dates.CheckOut);
        cancelledBooking.Status = "Cancelled";

        _mockRepository.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Booking> { cancelledBooking });

        var result = _service.ValidateNoOverlapAsync(roomId, dates.CheckIn, dates.CheckOut).Result;

        return result.IsValid.ToProperty()
            .Label($"Cancelled booking should not conflict");
    }

    /// <summary>
    /// Property: Soft-deleted bookings should NOT cause conflicts
    /// </summary>
    [Property(Arbitrary = new[] { typeof(BookingDateGenerators) })]
    public Property DeletedBookings_ShouldNotConflict(ValidDateRange dates)
    {
        var roomId = Guid.NewGuid();
        var deletedBooking = CreateBooking(roomId, dates.CheckIn, dates.CheckOut);
        deletedBooking.IsDeleted = true;

        _mockRepository.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Booking> { deletedBooking });

        var result = _service.ValidateNoOverlapAsync(roomId, dates.CheckIn, dates.CheckOut).Result;

        return result.IsValid.ToProperty()
            .Label($"Deleted booking should not conflict");
    }

    #endregion

    #region Helpers

    private static Booking CreateBooking(Guid roomId, DateTime checkIn, DateTime checkOut)
    {
        return new Booking
        {
            Id = Guid.NewGuid(),
            RoomId = roomId,
            UserId = Guid.NewGuid(),
            CheckIn = checkIn,
            CheckOut = checkOut,
            TotalPrice = (checkOut - checkIn).Days * 100m,
            Status = "Confirmed",
            IsDeleted = false
        };
    }

    #endregion
}

#region Custom Generators

/// <summary>
/// Custom FsCheck generators for booking dates
/// </summary>
public static class BookingDateGenerators
{
    public static Arbitrary<ValidDateRange> ValidDateRangeArbitrary() =>
        Arb.From(
            from daysFromNow in Gen.Choose(1, 180)
            from duration in Gen.Choose(1, 14)
            let checkIn = DateTime.UtcNow.Date.AddDays(daysFromNow)
            let checkOut = checkIn.AddDays(duration)
            select new ValidDateRange
            {
                CheckIn = checkIn,
                CheckOut = checkOut
            }
        );
}

/// <summary>
/// Valid date range for property testing
/// </summary>
public class ValidDateRange
{
    public DateTime CheckIn { get; set; }
    public DateTime CheckOut { get; set; }
}

#endregion
