namespace HotelBooking.Domain.Entities;

using HotelBooking.Domain.Common;
using System.Text.Json.Serialization;

/// <summary>
/// Represents a hotel in the system
/// </summary>
public class Hotel : BaseEntity
{
    /// <summary>
    /// Name of the hotel
    /// </summary>
    public required string Name { get; set; }

    /// <summary>
    /// Location/address of the hotel
    /// </summary>
    public required string Location { get; set; }

    /// <summary>
    /// Detailed description of the hotel
    /// </summary>
    public string? Description { get; set; }

    /// <summary>
    /// Hotel rating (0-5 stars)
    /// </summary>
    public decimal Rating { get; set; }

    /// <summary>
    /// Comma-separated list of hotel amenities
    /// </summary>
    public string? Amenities { get; set; }

    /// <summary>
    /// Navigation property for hotel rooms
    /// </summary>
    [JsonIgnore]
    public ICollection<Room> Rooms { get; set; } = new List<Room>();
}
