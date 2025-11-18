namespace HotelBooking.Domain.Entities;

using HotelBooking.Domain.Common;
using System.Text.Json.Serialization;

/// <summary>
/// Represents a booking made by a user
/// </summary>
public class Booking : BaseEntity
{
    /// <summary>
    /// Foreign key to the user who made the booking
    /// </summary>
    public required Guid UserId { get; set; }

    /// <summary>
    /// Foreign key to the booked room
    /// </summary>
    public required Guid RoomId { get; set; }

    /// <summary>
    /// Check-in date
    /// </summary>
    public required DateTime CheckIn { get; set; }

    /// <summary>
    /// Check-out date
    /// </summary>
    public required DateTime CheckOut { get; set; }

    /// <summary>
    /// Total price for the booking
    /// </summary>
    public required decimal TotalPrice { get; set; }

    /// <summary>
    /// Booking status (e.g., Pending, Confirmed, Cancelled, Completed)
    /// </summary>
    public required string Status { get; set; } = "Pending";

    /// <summary>
    /// Navigation property to the user
    /// </summary>
    [JsonIgnore]
    public User? User { get; set; }

    /// <summary>
    /// Navigation property to the room
    /// </summary>
    [JsonIgnore]
    public Room? Room { get; set; }

    /// <summary>
    /// Navigation property to the payment
    /// </summary>
    [JsonIgnore]
    public Payment? Payment { get; set; }
}
