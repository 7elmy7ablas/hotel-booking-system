using System.ComponentModel.DataAnnotations;

namespace HotelBooking.API.DTOs;

/// <summary>
/// Data Transfer Object for user registration
/// </summary>
public class RegisterDto
{
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    public required string Email { get; set; }

    [Required(ErrorMessage = "Password is required")]
    [MinLength(6, ErrorMessage = "Password must be at least 6 characters")]
    public required string Password { get; set; }

    [Required(ErrorMessage = "Full name is required")]
    public required string FullName { get; set; }

    public string? PhoneNumber { get; set; }
}
