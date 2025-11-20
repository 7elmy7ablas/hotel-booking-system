using Microsoft.AspNetCore.Mvc;

namespace HotelBooking.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TestController : ControllerBase
{
    private readonly ILogger<TestController> _logger;

    public TestController(ILogger<TestController> logger)
    {
        _logger = logger;
    }

    [HttpGet]
    public IActionResult Get()
    {
        _logger.LogInformation("CORS test endpoint called from origin: {Origin}", 
            Request.Headers["Origin"].ToString());
        
        return Ok(new
        {
            message = "CORS OK",
            timestamp = DateTime.UtcNow,
            origin = Request.Headers["Origin"].ToString(),
            method = Request.Method
        });
    }

    [HttpOptions]
    public IActionResult Options()
    {
        return Ok();
    }
}
