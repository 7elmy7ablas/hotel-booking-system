namespace HotelBooking.API.DTOs;

/// <summary>
/// Data Transfer Object for login response
/// </summary>
public class LoginResponseDto
{
    public required string Token { get; set; }
    public required UserDto User { get; set; }
    public DateTime ExpiresAt { get; set; }
}
