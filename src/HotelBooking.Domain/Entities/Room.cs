namespace HotelBooking.Domain.Entities;

using HotelBooking.Domain.Common;
using System.Text.Json.Serialization;

/// <summary>
/// Represents a room in a hotel
/// </summary>
public class Room : BaseEntity
{
    /// <summary>
    /// Foreign key to the hotel
    /// </summary>
    public required Guid HotelId { get; set; }

    /// <summary>
    /// Type of room (e.g., Single, Double, Suite)
    /// </summary>
    public required string RoomType { get; set; }

    /// <summary>
    /// Price per night for the room
    /// </summary>
    public required decimal PricePerNight { get; set; }

    /// <summary>
    /// Maximum number of guests the room can accommodate
    /// </summary>
    public required int Capacity { get; set; }

    /// <summary>
    /// Indicates whether the room is currently available for booking
    /// </summary>
    public bool IsAvailable { get; set; } = true;

    /// <summary>
    /// Navigation property to the hotel
    /// </summary>
    [JsonIgnore]
    public Hotel? Hotel { get; set; }

    /// <summary>
    /// Navigation property for room bookings
    /// </summary>
    [JsonIgnore]
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}
