namespace HotelBooking.API.DTOs;

/// <summary>
/// Data Transfer Object for User (excludes PasswordHash)
/// </summary>
public class UserDto
{
    public Guid Id { get; set; }
    public required string Email { get; set; }
    public required string FullName { get; set; }
    public string? PhoneNumber { get; set; }
    public required string Role { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public bool IsDeleted { get; set; }
}
