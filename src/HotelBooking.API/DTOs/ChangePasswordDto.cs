using System.ComponentModel.DataAnnotations;

namespace HotelBooking.API.DTOs;

/// <summary>
/// Data Transfer Object for changing user password
/// </summary>
public class ChangePasswordDto
{
    [Required(ErrorMessage = "Email is required")]
    public required string Email { get; set; }

    [Required(ErrorMessage = "Old password is required")]
    public required string OldPassword { get; set; }

    [Required(ErrorMessage = "New password is required")]
    [MinLength(6, ErrorMessage = "New password must be at least 6 characters")]
    public required string NewPassword { get; set; }
}
