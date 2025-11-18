using System.ComponentModel.DataAnnotations;

namespace HotelBooking.API.DTOs;

/// <summary>
/// Data Transfer Object for user login
/// </summary>
public class LoginDto
{
    [Required(ErrorMessage = "Email is required")]
    public required string Email { get; set; }

    [Required(ErrorMessage = "Password is required")]
    public required string Password { get; set; }
}
