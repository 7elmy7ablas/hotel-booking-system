using System.ComponentModel.DataAnnotations;

namespace HotelBooking.API.DTOs;

public class CreateHotelDto
{
    [Required]
    [StringLength(100, MinimumLength = 1)]
    public required string Name { get; set; }

    [Required]
    [StringLength(1000)]
    public required string Description { get; set; }

    [Required]
    [StringLength(200)]
    public required string Location { get; set; }

    [Required]
    [StringLength(100)]
    public required string City { get; set; }

    [Required]
    [StringLength(100)]
    public required string Country { get; set; }

    [Range(0, 5)]
    public decimal Rating { get; set; }

    public List<string> Amenities { get; set; } = new();
}
