using System.ComponentModel.DataAnnotations;

namespace HotelBooking.API.DTOs;

/// <summary>
/// Data Transfer Object for creating a new User
/// </summary>
public class CreateUserDto
{
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    [StringLength(100, ErrorMessage = "Email cannot exceed 100 characters")]
    public required string Email { get; set; }

    [Required(ErrorMessage = "Full name is required")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "Full name must be between 2 and 100 characters")]
    public required string FullName { get; set; }

    [Phone(ErrorMessage = "Invalid phone number format")]
    [StringLength(20, ErrorMessage = "Phone number cannot exceed 20 characters")]
    public string? PhoneNumber { get; set; }

    [StringLength(50, ErrorMessage = "Role cannot exceed 50 characters")]
    public string? Role { get; set; }
}
