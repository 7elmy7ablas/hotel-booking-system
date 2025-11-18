namespace HotelBooking.Domain.Entities;

using HotelBooking.Domain.Common;
using System.Text.Json.Serialization;

/// <summary>
/// Represents a user in the system
/// </summary>
public class User : BaseEntity
{
    /// <summary>
    /// User's email address (unique)
    /// </summary>
    public required string Email { get; set; }

    /// <summary>
    /// Hashed password for authentication
    /// </summary>
    public required string PasswordHash { get; set; }

    /// <summary>
    /// User's full name
    /// </summary>
    public required string FullName { get; set; }

    /// <summary>
    /// User's phone number
    /// </summary>
    public string? PhoneNumber { get; set; }

    /// <summary>
    /// User role (e.g., Admin, Customer)
    /// </summary>
    public required string Role { get; set; } = "Customer";

    /// <summary>
    /// Navigation property for user bookings
    /// </summary>
    [JsonIgnore]
    public ICollection<Booking> Bookings { get; set; } = new List<Booking>();
}
