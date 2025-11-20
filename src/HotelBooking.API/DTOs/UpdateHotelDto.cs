using System.ComponentModel.DataAnnotations;

namespace HotelBooking.API.DTOs;

public class UpdateHotelDto
{
    [StringLength(100, MinimumLength = 1)]
    public string? Name { get; set; }

    [StringLength(1000)]
    public string? Description { get; set; }

    [Range(0, 5)]
    public decimal? Rating { get; set; }

    public List<string>? Amenities { get; set; }
}
