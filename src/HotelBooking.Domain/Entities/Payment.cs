namespace HotelBooking.Domain.Entities;

using HotelBooking.Domain.Common;
using System.Text.Json.Serialization;

/// <summary>
/// Represents a payment for a booking
/// </summary>
public class Payment : BaseEntity
{
    /// <summary>
    /// Foreign key to the booking
    /// </summary>
    public required Guid BookingId { get; set; }

    /// <summary>
    /// Payment amount
    /// </summary>
    public required decimal Amount { get; set; }

    /// <summary>
    /// Payment method (e.g., CreditCard, DebitCard, PayPal, Cash)
    /// </summary>
    public required string PaymentMethod { get; set; }

    /// <summary>
    /// Payment status (e.g., Pending, Completed, Failed, Refunded)
    /// </summary>
    public required string Status { get; set; } = "Pending";

    /// <summary>
    /// Date and time when the payment was made
    /// </summary>
    public DateTime? PaymentDate { get; set; }

    /// <summary>
    /// Navigation property to the booking
    /// </summary>
    [JsonIgnore]
    public Booking? Booking { get; set; }
}
