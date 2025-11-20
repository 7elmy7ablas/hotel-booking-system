namespace HotelBooking.API.DTOs;

public class HotelDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public decimal Rating { get; set; }
    public List<string> Amenities { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}
