using Microsoft.AspNetCore.Mvc;
using System.Reflection;

namespace HotelBooking.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult GetHealth()
    {
        var version = Assembly.GetExecutingAssembly()
            .GetCustomAttribute<AssemblyInformationalVersionAttribute>()
            ?.InformationalVersion ?? "1.0.0";

        return Ok(new
        {
            Status = "Healthy",
            Version = version,
            Timestamp = DateTime.UtcNow,
            Service = "Hotel Booking API"
        });
    }
}
