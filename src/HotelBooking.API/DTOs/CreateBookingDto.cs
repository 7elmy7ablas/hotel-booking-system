using System.ComponentModel.DataAnnotations;

namespace HotelBooking.API.DTOs;

public class CreateBookingDto
{
    [Required]
    public Guid RoomId { get; set; }

    [Required]
    public DateTime CheckIn { get; set; }

    [Required]
    public DateTime CheckOut { get; set; }

    [Required]
    [StringLength(100)]
    public required string GuestName { get; set; }

    [Required]
    [EmailAddress]
    [StringLength(100)]
    public required string GuestEmail { get; set; }

    [Required]
    [Phone]
    [StringLength(20)]
    public required string GuestPhone { get; set; }
}
