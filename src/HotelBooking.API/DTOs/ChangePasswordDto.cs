using System.ComponentModel.DataAnnotations;

namespace HotelBooking.API.DTOs;

/// <summary>
/// Data Transfer Object for changing user password
/// </summary>
public class ChangePasswordDto
{
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    [StringLength(100, ErrorMessage = "Email cannot exceed 100 characters")]
    public required string Email { get; set; }

    [Required(ErrorMessage = "Old password is required")]
    [StringLength(100, ErrorMessage = "Old password cannot exceed 100 characters")]
    public required string OldPassword { get; set; }

    [Required(ErrorMessage = "New password is required")]
    [StringLength(100, MinimumLength = 6, ErrorMessage = "New password must be between 6 and 100 characters")]
    public required string NewPassword { get; set; }
}
