namespace HotelBooking.API.DTOs;

/// <summary>
/// Data Transfer Object for creating a new User
/// </summary>
public class CreateUserDto
{
    public required string Email { get; set; }
    public required string FullName { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Role { get; set; }
}
