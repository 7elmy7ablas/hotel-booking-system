using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using HotelBooking.Infrastructure.Data;
using HotelBooking.Domain.Entities;
using HotelBooking.API.DTOs;

namespace HotelBooking.API.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<UsersController> _logger;

    public UsersController(ApplicationDbContext context, ILogger<UsersController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET: api/users/profile
    [HttpGet("profile")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<ActionResult<UserDto>> GetProfile()
    {
        try
        {
            // Get user ID from JWT claims
            var userIdClaim = User.FindFirst("userId")?.Value;
            
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                _logger.LogWarning("Invalid or missing userId claim in token");
                return Unauthorized(new { Message = "Invalid token" });
            }

            _logger.LogInformation("Retrieving profile for user ID {UserId}", userId);

            // Get user from database
            var user = await _context.Users
                .Where(u => u.Id == userId && !u.IsDeleted)
                .AsNoTracking()
                .FirstOrDefaultAsync();

            if (user == null)
            {
                _logger.LogWarning("User with ID {UserId} not found", userId);
                return NotFound(new { Message = "User not found" });
            }

            // Return user DTO (without password)
            var userDto = new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                PhoneNumber = user.PhoneNumber,
                Role = user.Role,
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt,
                IsDeleted = user.IsDeleted
            };

            _logger.LogInformation("Profile retrieved successfully for user ID {UserId}", userId);

            return Ok(userDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user profile");
            return Problem("An error occurred while retrieving the profile");
        }
    }

    // GET: api/users
    [Authorize(Roles = "Admin")]
    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<UserDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetAllUsers()
    {
        try
        {
            _logger.LogInformation("Retrieving all users");

            var users = await _context.Users
                .Where(u => !u.IsDeleted)
                .AsNoTracking()
                .ToListAsync();

            // Map to UserDto (exclude PasswordHash)
            var userDtos = users.Select(u => new UserDto
            {
                Id = u.Id,
                Email = u.Email,
                FullName = u.FullName,
                PhoneNumber = u.PhoneNumber,
                Role = u.Role,
                CreatedAt = u.CreatedAt,
                UpdatedAt = u.UpdatedAt,
                IsDeleted = u.IsDeleted
            }).ToList();

            _logger.LogInformation("Retrieved {Count} users", userDtos.Count);

            return Ok(userDtos);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving users");
            return Problem("An error occurred while retrieving users");
        }
    }

    // GET: api/users/{id}
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetUserById(Guid id)
    {
        try
        {
            _logger.LogInformation("Retrieving user with ID {UserId}", id);

            var user = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == id && !u.IsDeleted);

            if (user is null)
            {
                _logger.LogWarning("User with ID {UserId} not found", id);
                return NotFound(new { Message = $"User with ID {id} not found" });
            }

            // Map to UserDto (exclude PasswordHash)
            var userDto = new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                PhoneNumber = user.PhoneNumber,
                Role = user.Role,
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt,
                IsDeleted = user.IsDeleted
            };

            _logger.LogInformation("User with ID {UserId} retrieved successfully", id);

            return Ok(userDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving user with ID {UserId}", id);
            return Problem("An error occurred while retrieving the user");
        }
    }

    // POST: api/users
    [Authorize(Roles = "Admin")]
    [HttpPost]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserDto createUserDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            _logger.LogInformation("Attempting to create user: {@User}", new { createUserDto.Email, createUserDto.FullName, createUserDto.Role });

            // Validate Email format
            if (string.IsNullOrWhiteSpace(createUserDto.Email) || !createUserDto.Email.Contains("@") || !createUserDto.Email.Contains("."))
            {
                _logger.LogWarning("User creation failed: Invalid email format");
                return BadRequest(new { Message = "Invalid email format. Email must contain @ and ." });
            }

            // Validate Email is unique
            var emailExists = await _context.Users.AnyAsync(u => u.Email == createUserDto.Email && !u.IsDeleted);
            if (emailExists)
            {
                _logger.LogWarning("User creation failed: Email {Email} already exists", createUserDto.Email);
                return BadRequest(new { Message = $"Email {createUserDto.Email} already exists" });
            }

            // Validate FullName
            if (string.IsNullOrWhiteSpace(createUserDto.FullName))
            {
                _logger.LogWarning("User creation failed: FullName is required");
                return BadRequest(new { Message = "FullName is required" });
            }

            // Create User from DTO
            var user = new User
            {
                Email = createUserDto.Email,
                FullName = createUserDto.FullName,
                PhoneNumber = createUserDto.PhoneNumber,
                Role = createUserDto.Role ?? "User",
                PasswordHash = "", // Will be set by auth endpoint later
                Id = Guid.NewGuid(),
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = null,
                IsDeleted = false,
                DeletedAt = null
            };

            _logger.LogInformation("Generated new GUID for user: {UserId}", user.Id);

            // Add to database
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            _logger.LogInformation("User created successfully with ID {UserId}", user.Id);

            // Map to UserDto (exclude PasswordHash)
            var userDto = new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                PhoneNumber = user.PhoneNumber,
                Role = user.Role,
                CreatedAt = user.CreatedAt,
                UpdatedAt = user.UpdatedAt,
                IsDeleted = user.IsDeleted
            };

            return CreatedAtAction(nameof(GetUserById), new { id = user.Id }, userDto);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user");
            return Problem("An error occurred while creating the user");
        }
    }

    // PUT: api/users/{id}
    [Authorize(Roles = "Admin")]
    [HttpPut("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> UpdateUser(Guid id, [FromBody] User updatedUser)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            _logger.LogInformation("Attempting to update user with ID {UserId}", id);

            // Find existing user
            var existingUser = await _context.Users.FindAsync(id);

            if (existingUser is null || existingUser.IsDeleted)
            {
                _logger.LogWarning("User with ID {UserId} not found", id);
                return NotFound(new { Message = $"User with ID {id} not found" });
            }

            // If Email changed, validate format and uniqueness
            if (existingUser.Email != updatedUser.Email)
            {
                // Validate Email format
                if (string.IsNullOrWhiteSpace(updatedUser.Email) || !updatedUser.Email.Contains("@") || !updatedUser.Email.Contains("."))
                {
                    _logger.LogWarning("User update failed: Invalid email format");
                    return BadRequest(new { Message = "Invalid email format. Email must contain @ and ." });
                }

                // Validate Email is unique
                var emailExists = await _context.Users.AnyAsync(u => u.Email == updatedUser.Email && u.Id != id && !u.IsDeleted);
                if (emailExists)
                {
                    _logger.LogWarning("User update failed: Email {Email} already exists", updatedUser.Email);
                    return BadRequest(new { Message = $"Email {updatedUser.Email} already exists" });
                }
            }

            // Validate FullName
            if (string.IsNullOrWhiteSpace(updatedUser.FullName))
            {
                _logger.LogWarning("User update failed: FullName is required");
                return BadRequest(new { Message = "FullName is required" });
            }

            // Update properties (Email, FullName, PhoneNumber, Role only)
            // Do NOT update Id, CreatedAt, PasswordHash, or IsDeleted
            existingUser.Email = updatedUser.Email;
            existingUser.FullName = updatedUser.FullName;
            existingUser.PhoneNumber = updatedUser.PhoneNumber;
            existingUser.Role = updatedUser.Role;
            existingUser.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("User with ID {UserId} updated successfully", id);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating user with ID {UserId}", id);
            return Problem("An error occurred while updating the user");
        }
    }

    // DELETE: api/users/{id}
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> DeleteUser(Guid id)
    {
        try
        {
            _logger.LogInformation("Attempting to delete user with ID {UserId}", id);

            // Find user
            var user = await _context.Users.FindAsync(id);

            if (user is null || user.IsDeleted)
            {
                _logger.LogWarning("User with ID {UserId} not found", id);
                return NotFound(new { Message = $"User with ID {id} not found" });
            }

            // Soft delete
            user.IsDeleted = true;
            user.DeletedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            _logger.LogInformation("User with ID {UserId} soft deleted successfully", id);

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting user with ID {UserId}", id);
            return Problem("An error occurred while deleting the user");
        }
    }
}
