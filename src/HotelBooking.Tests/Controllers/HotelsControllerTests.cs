using FluentAssertions;
using HotelBooking.API.Controllers;
using HotelBooking.API.Models;
using HotelBooking.Domain.Entities;
using HotelBooking.Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HotelBooking.Tests.Controllers;

/// <summary>
/// Comprehensive unit tests for HotelsController (50+ tests)
/// Testing all CRUD operations, caching, pagination, and edge cases
/// </summary>
public class HotelsControllerTests
{
    private readonly ApplicationDbContext _context;
    private readonly Mock<ILogger<HotelsController>> _mockLogger;
    private readonly Mock<IHostEnvironment> _mockEnv;
    private readonly IMemoryCache _cache;
    private readonly HotelsController _controller;

    public HotelsControllerTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _mockLogger = new Mock<ILogger<HotelsController>>();
        _mockEnv = new Mock<IHostEnvironment>();
        _mockEnv.Setup(e => e.EnvironmentName).Returns("Development");
        _cache = new MemoryCache(new MemoryCacheOptions());
        _controller = new HotelsController(_context, _mockLogger.Object, _mockEnv.Object, _cache);
    }

    #region Setup Helpers

    private async Task<Hotel> CreateTestHotel(string name = "Test Hotel", string location = "Test Location")
    {
        var hotel = new Hotel
        {
            Id = Guid.NewGuid(),
            Name = name,
            Location = location,
            Description = "Test Description",
            Rating = 4.5m,
            Amenities = "WiFi,Pool,Spa",
            CreatedAt = DateTime.UtcNow
        };
        _context.Hotels.Add(hotel);
        await _context.SaveChangesAsync();
        return hotel;
    }

    private async Task<Room> CreateTestRoom(Guid hotelId, string roomType = "Double", decimal price = 100m)
    {
        var room = new Room
        {
            Id = Guid.NewGuid(),
            HotelId = hotelId,
            RoomType = roomType,
            PricePerNight = price,
            Capacity = 2,
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow
        };
        _context.Rooms.Add(room);
        await _context.SaveChangesAsync();
        return room;
    }

    private async Task<List<Hotel>> CreateMultipleHotels(int count)
    {
        var hotels = new List<Hotel>();
        for (int i = 0; i < count; i++)
        {
            hotels.Add(await CreateTestHotel($"Hotel {i}", $"Location {i}"));
        }
        return hotels;
    }

    private void SetupAdminClaims()
    {
        var claims = new List<Claim>
        {
            new Claim("userId", Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.Role, "Admin")
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
        };
    }

    #endregion

    #region GetAllHotels Tests (12 tests)

    [Fact]
    public async Task GetAllHotels_ShouldReturnOk_WhenHotelsExist()
    {
        await CreateTestHotel();

        var result = await _controller.GetAllHotels();

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetAllHotels_ShouldReturnPagedResult()
    {
        await CreateMultipleHotels(5);

        var result = await _controller.GetAllHotels();

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        okResult.Value.Should().BeOfType<PagedResult<Hotel>>();
    }

    [Fact]
    public async Task GetAllHotels_ShouldReturnCorrectCount()
    {
        await CreateMultipleHotels(3);

        var result = await _controller.GetAllHotels();

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var pagedResult = okResult.Value.Should().BeOfType<PagedResult<Hotel>>().Subject;
        pagedResult.TotalCount.Should().Be(3);
    }

    [Fact]
    public async Task GetAllHotels_ShouldRespectPageSize()
    {
        await CreateMultipleHotels(15);

        var result = await _controller.GetAllHotels(pageNumber: 1, pageSize: 5);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var pagedResult = okResult.Value.Should().BeOfType<PagedResult<Hotel>>().Subject;
        pagedResult.Items.Should().HaveCount(5);
    }

    [Fact]
    public async Task GetAllHotels_ShouldRespectPageNumber()
    {
        await CreateMultipleHotels(15);

        var result = await _controller.GetAllHotels(pageNumber: 2, pageSize: 10);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var pagedResult = okResult.Value.Should().BeOfType<PagedResult<Hotel>>().Subject;
        pagedResult.Items.Should().HaveCount(5);
    }

    [Fact]
    public async Task GetAllHotels_ShouldExcludeDeletedHotels()
    {
        var hotel = await CreateTestHotel();
        hotel.IsDeleted = true;
        await _context.SaveChangesAsync();

        var result = await _controller.GetAllHotels();

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var pagedResult = okResult.Value.Should().BeOfType<PagedResult<Hotel>>().Subject;
        pagedResult.TotalCount.Should().Be(0);
    }

    [Fact]
    public async Task GetAllHotels_ShouldIncludeRooms()
    {
        var hotel = await CreateTestHotel();
        await CreateTestRoom(hotel.Id);

        _cache.Remove($"hotels_page_1_size_10");
        var result = await _controller.GetAllHotels();

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var pagedResult = okResult.Value.Should().BeOfType<PagedResult<Hotel>>().Subject;
        pagedResult.Items.First().Rooms.Should().NotBeEmpty();
    }

    [Fact]
    public async Task GetAllHotels_ShouldNormalizePageNumber()
    {
        await CreateTestHotel();

        var result = await _controller.GetAllHotels(pageNumber: -5);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetAllHotels_ShouldCapPageSize()
    {
        await CreateMultipleHotels(150);

        var result = await _controller.GetAllHotels(pageSize: 200);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var pagedResult = okResult.Value.Should().BeOfType<PagedResult<Hotel>>().Subject;
        pagedResult.Items.Should().HaveCountLessOrEqualTo(100);
    }

    [Fact]
    public async Task GetAllHotels_ShouldOrderByName()
    {
        await CreateTestHotel("Zebra Hotel");
        await CreateTestHotel("Alpha Hotel");
        await CreateTestHotel("Middle Hotel");

        _cache.Remove($"hotels_page_1_size_10");
        var result = await _controller.GetAllHotels();

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var pagedResult = okResult.Value.Should().BeOfType<PagedResult<Hotel>>().Subject;
        pagedResult.Items.First().Name.Should().Be("Alpha Hotel");
    }

    [Fact]
    public async Task GetAllHotels_ShouldUseCache()
    {
        await CreateTestHotel();
        await _controller.GetAllHotels();

        var cacheKey = "hotels_page_1_size_10";
        _cache.TryGetValue(cacheKey, out PagedResult<Hotel>? cached);
        cached.Should().NotBeNull();
    }

    [Fact]
    public async Task GetAllHotels_ShouldReturnEmptyList_WhenNoHotels()
    {
        var result = await _controller.GetAllHotels();

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var pagedResult = okResult.Value.Should().BeOfType<PagedResult<Hotel>>().Subject;
        pagedResult.Items.Should().BeEmpty();
    }

    #endregion

    #region GetHotelById Tests (8 tests)

    [Fact]
    public async Task GetHotelById_ShouldReturnOk_WhenHotelExists()
    {
        var hotel = await CreateTestHotel();

        var result = await _controller.GetHotelById(hotel.Id);

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetHotelById_ShouldReturnCorrectHotel()
    {
        var hotel = await CreateTestHotel("Specific Hotel");

        var result = await _controller.GetHotelById(hotel.Id);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedHotel = okResult.Value.Should().BeOfType<Hotel>().Subject;
        returnedHotel.Name.Should().Be("Specific Hotel");
    }

    [Fact]
    public async Task GetHotelById_ShouldReturnNotFound_WhenNotExists()
    {
        var result = await _controller.GetHotelById(Guid.NewGuid());

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task GetHotelById_ShouldReturnNotFound_WhenDeleted()
    {
        var hotel = await CreateTestHotel();
        hotel.IsDeleted = true;
        await _context.SaveChangesAsync();

        var result = await _controller.GetHotelById(hotel.Id);

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task GetHotelById_ShouldIncludeRooms()
    {
        var hotel = await CreateTestHotel();
        await CreateTestRoom(hotel.Id);

        _cache.Remove($"hotel_{hotel.Id}");
        var result = await _controller.GetHotelById(hotel.Id);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedHotel = okResult.Value.Should().BeOfType<Hotel>().Subject;
        returnedHotel.Rooms.Should().NotBeEmpty();
    }

    [Fact]
    public async Task GetHotelById_ShouldExcludeDeletedRooms()
    {
        var hotel = await CreateTestHotel();
        var room = await CreateTestRoom(hotel.Id);
        room.IsDeleted = true;
        await _context.SaveChangesAsync();

        _cache.Remove($"hotel_{hotel.Id}");
        var result = await _controller.GetHotelById(hotel.Id);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedHotel = okResult.Value.Should().BeOfType<Hotel>().Subject;
        returnedHotel.Rooms.Should().BeEmpty();
    }

    [Fact]
    public async Task GetHotelById_ShouldCacheResult()
    {
        var hotel = await CreateTestHotel();
        await _controller.GetHotelById(hotel.Id);

        var cacheKey = $"hotel_{hotel.Id}";
        _cache.TryGetValue(cacheKey, out Hotel? cached);
        cached.Should().NotBeNull();
    }

    [Fact]
    public async Task GetHotelById_ShouldReturnFromCache()
    {
        var hotel = await CreateTestHotel();
        
        await _controller.GetHotelById(hotel.Id);
        await _controller.GetHotelById(hotel.Id);

        var result = await _controller.GetHotelById(hotel.Id);
        result.Should().BeOfType<OkObjectResult>();
    }

    #endregion

    #region CreateHotel Tests (12 tests)

    [Fact]
    public async Task CreateHotel_ShouldReturnCreated_WhenValid()
    {
        var hotel = new Hotel
        {
            Name = "New Hotel",
            Location = "New Location",
            Description = "Description",
            Rating = 4.0m
        };

        var result = await _controller.CreateHotel(hotel);

        result.Should().BeOfType<CreatedAtActionResult>();
    }

    [Fact]
    public async Task CreateHotel_ShouldReturnBadRequest_WhenNameEmpty()
    {
        var hotel = new Hotel
        {
            Name = "",
            Location = "Location"
        };

        var result = await _controller.CreateHotel(hotel);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task CreateHotel_ShouldReturnBadRequest_WhenLocationEmpty()
    {
        var hotel = new Hotel
        {
            Name = "Hotel Name",
            Location = ""
        };

        var result = await _controller.CreateHotel(hotel);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task CreateHotel_ShouldGenerateGuid()
    {
        var hotel = new Hotel
        {
            Id = Guid.Empty,
            Name = "Hotel",
            Location = "Location"
        };

        var result = await _controller.CreateHotel(hotel);

        var createdResult = result.Should().BeOfType<CreatedAtActionResult>().Subject;
        var createdHotel = createdResult.Value.Should().BeOfType<Hotel>().Subject;
        createdHotel.Id.Should().NotBe(Guid.Empty);
    }

    [Fact]
    public async Task CreateHotel_ShouldSetCreatedAt()
    {
        var hotel = new Hotel
        {
            Name = "Hotel",
            Location = "Location"
        };

        var result = await _controller.CreateHotel(hotel);

        var createdResult = result.Should().BeOfType<CreatedAtActionResult>().Subject;
        var createdHotel = createdResult.Value.Should().BeOfType<Hotel>().Subject;
        createdHotel.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task CreateHotel_ShouldSetIsDeletedFalse()
    {
        var hotel = new Hotel
        {
            Name = "Hotel",
            Location = "Location"
        };

        var result = await _controller.CreateHotel(hotel);

        var createdResult = result.Should().BeOfType<CreatedAtActionResult>().Subject;
        var createdHotel = createdResult.Value.Should().BeOfType<Hotel>().Subject;
        createdHotel.IsDeleted.Should().BeFalse();
    }

    [Fact]
    public async Task CreateHotel_ShouldPersistToDatabase()
    {
        var hotel = new Hotel
        {
            Name = "Persist Hotel",
            Location = "Location"
        };

        var result = await _controller.CreateHotel(hotel);

        var createdResult = result.Should().BeOfType<CreatedAtActionResult>().Subject;
        var createdHotel = createdResult.Value.Should().BeOfType<Hotel>().Subject;
        
        var dbHotel = await _context.Hotels.FindAsync(createdHotel.Id);
        dbHotel.Should().NotBeNull();
        dbHotel!.Name.Should().Be("Persist Hotel");
    }

    [Fact]
    public async Task CreateHotel_ShouldReturnBadRequest_WhenNameWhitespace()
    {
        var hotel = new Hotel
        {
            Name = "   ",
            Location = "Location"
        };

        var result = await _controller.CreateHotel(hotel);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task CreateHotel_ShouldReturnBadRequest_WhenLocationWhitespace()
    {
        var hotel = new Hotel
        {
            Name = "Hotel",
            Location = "   "
        };

        var result = await _controller.CreateHotel(hotel);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task CreateHotel_ShouldInitializeRoomsCollection()
    {
        var hotel = new Hotel
        {
            Name = "Hotel",
            Location = "Location",
            Rooms = null!
        };

        var result = await _controller.CreateHotel(hotel);

        var createdResult = result.Should().BeOfType<CreatedAtActionResult>().Subject;
        var createdHotel = createdResult.Value.Should().BeOfType<Hotel>().Subject;
        createdHotel.Rooms.Should().NotBeNull();
    }

    [Fact]
    public async Task CreateHotel_ShouldInvalidateCache()
    {
        await CreateTestHotel();
        await _controller.GetAllHotels();

        var hotel = new Hotel
        {
            Name = "New Hotel",
            Location = "Location"
        };

        await _controller.CreateHotel(hotel);

        var cacheKey = "hotels_page_1_size_10";
        _cache.TryGetValue(cacheKey, out PagedResult<Hotel>? _).Should().BeFalse();
    }

    [Theory]
    [InlineData(0)]
    [InlineData(2.5)]
    [InlineData(5)]
    public async Task CreateHotel_ShouldAcceptValidRatings(decimal rating)
    {
        var hotel = new Hotel
        {
            Name = $"Hotel {rating}",
            Location = "Location",
            Rating = rating
        };

        var result = await _controller.CreateHotel(hotel);

        result.Should().BeOfType<CreatedAtActionResult>();
    }

    #endregion

    #region UpdateHotel Tests (10 tests)

    [Fact]
    public async Task UpdateHotel_ShouldReturnNoContent_WhenValid()
    {
        var hotel = await CreateTestHotel();

        var updated = new Hotel
        {
            Name = "Updated Name",
            Location = "Updated Location"
        };

        var result = await _controller.UpdateHotel(hotel.Id, updated);

        result.Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task UpdateHotel_ShouldReturnNotFound_WhenNotExists()
    {
        var updated = new Hotel
        {
            Name = "Name",
            Location = "Location"
        };

        var result = await _controller.UpdateHotel(Guid.NewGuid(), updated);

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task UpdateHotel_ShouldReturnBadRequest_WhenNameEmpty()
    {
        var hotel = await CreateTestHotel();

        var updated = new Hotel
        {
            Name = "",
            Location = "Location"
        };

        var result = await _controller.UpdateHotel(hotel.Id, updated);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task UpdateHotel_ShouldReturnBadRequest_WhenLocationEmpty()
    {
        var hotel = await CreateTestHotel();

        var updated = new Hotel
        {
            Name = "Name",
            Location = ""
        };

        var result = await _controller.UpdateHotel(hotel.Id, updated);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task UpdateHotel_ShouldUpdateAllFields()
    {
        var hotel = await CreateTestHotel();

        var updated = new Hotel
        {
            Name = "New Name",
            Location = "New Location",
            Description = "New Description",
            Rating = 5.0m,
            Amenities = "New Amenities"
        };

        await _controller.UpdateHotel(hotel.Id, updated);

        var dbHotel = await _context.Hotels.FindAsync(hotel.Id);
        dbHotel!.Name.Should().Be("New Name");
        dbHotel.Location.Should().Be("New Location");
        dbHotel.Description.Should().Be("New Description");
        dbHotel.Rating.Should().Be(5.0m);
        dbHotel.Amenities.Should().Be("New Amenities");
    }

    [Fact]
    public async Task UpdateHotel_ShouldSetUpdatedAt()
    {
        var hotel = await CreateTestHotel();

        var updated = new Hotel
        {
            Name = "Updated",
            Location = "Location"
        };

        await _controller.UpdateHotel(hotel.Id, updated);

        var dbHotel = await _context.Hotels.FindAsync(hotel.Id);
        dbHotel!.UpdatedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task UpdateHotel_ShouldPreserveCreatedAt()
    {
        var hotel = await CreateTestHotel();
        var originalCreatedAt = hotel.CreatedAt;

        var updated = new Hotel
        {
            Name = "Updated",
            Location = "Location"
        };

        await _controller.UpdateHotel(hotel.Id, updated);

        var dbHotel = await _context.Hotels.FindAsync(hotel.Id);
        dbHotel!.CreatedAt.Should().Be(originalCreatedAt);
    }

    [Fact]
    public async Task UpdateHotel_ShouldPreserveId()
    {
        var hotel = await CreateTestHotel();
        var originalId = hotel.Id;

        var updated = new Hotel
        {
            Name = "Updated",
            Location = "Location"
        };

        await _controller.UpdateHotel(hotel.Id, updated);

        var dbHotel = await _context.Hotels.FindAsync(originalId);
        dbHotel.Should().NotBeNull();
    }

    [Fact]
    public async Task UpdateHotel_ShouldInvalidateCache()
    {
        var hotel = await CreateTestHotel();
        await _controller.GetHotelById(hotel.Id);

        var updated = new Hotel
        {
            Name = "Updated",
            Location = "Location"
        };

        await _controller.UpdateHotel(hotel.Id, updated);

        var cacheKey = $"hotel_{hotel.Id}";
        _cache.TryGetValue(cacheKey, out Hotel? _).Should().BeFalse();
    }

    [Fact]
    public async Task UpdateHotel_ShouldReturnBadRequest_WhenNameWhitespace()
    {
        var hotel = await CreateTestHotel();

        var updated = new Hotel
        {
            Name = "   ",
            Location = "Location"
        };

        var result = await _controller.UpdateHotel(hotel.Id, updated);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    #endregion

    #region DeleteHotel Tests (8 tests)

    [Fact]
    public async Task DeleteHotel_ShouldReturnNoContent_WhenExists()
    {
        var hotel = await CreateTestHotel();

        var result = await _controller.DeleteHotel(hotel.Id);

        result.Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task DeleteHotel_ShouldReturnNotFound_WhenNotExists()
    {
        var result = await _controller.DeleteHotel(Guid.NewGuid());

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task DeleteHotel_ShouldSoftDelete()
    {
        var hotel = await CreateTestHotel();

        await _controller.DeleteHotel(hotel.Id);

        var dbHotel = await _context.Hotels.FindAsync(hotel.Id);
        dbHotel.Should().NotBeNull();
        dbHotel!.IsDeleted.Should().BeTrue();
    }

    [Fact]
    public async Task DeleteHotel_ShouldSetDeletedAt()
    {
        var hotel = await CreateTestHotel();

        await _controller.DeleteHotel(hotel.Id);

        var dbHotel = await _context.Hotels.FindAsync(hotel.Id);
        dbHotel!.DeletedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task DeleteHotel_ShouldNotRemoveFromDatabase()
    {
        var hotel = await CreateTestHotel();
        var hotelId = hotel.Id;

        await _controller.DeleteHotel(hotelId);

        // Use IgnoreQueryFilters to check soft-deleted records
        var exists = await _context.Hotels.IgnoreQueryFilters().AnyAsync(h => h.Id == hotelId);
        exists.Should().BeTrue();
    }

    [Fact]
    public async Task DeleteHotel_ShouldInvalidateCache()
    {
        var hotel = await CreateTestHotel();
        await _controller.GetHotelById(hotel.Id);

        await _controller.DeleteHotel(hotel.Id);

        var cacheKey = $"hotel_{hotel.Id}";
        _cache.TryGetValue(cacheKey, out Hotel? _).Should().BeFalse();
    }

    [Fact]
    public async Task DeleteHotel_ShouldInvalidateListCache()
    {
        var hotel = await CreateTestHotel();
        await _controller.GetAllHotels();

        await _controller.DeleteHotel(hotel.Id);

        var cacheKey = "hotels_page_1_size_10";
        _cache.TryGetValue(cacheKey, out PagedResult<Hotel>? _).Should().BeFalse();
    }

    [Fact]
    public async Task DeleteHotel_ShouldPreserveOtherHotels()
    {
        var hotel1 = await CreateTestHotel("Hotel 1");
        var hotel2 = await CreateTestHotel("Hotel 2");

        await _controller.DeleteHotel(hotel1.Id);

        var dbHotel2 = await _context.Hotels.FindAsync(hotel2.Id);
        dbHotel2!.IsDeleted.Should().BeFalse();
    }

    #endregion
}
