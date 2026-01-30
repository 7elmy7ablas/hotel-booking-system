using FluentAssertions;
using HotelBooking.API.Controllers;
using HotelBooking.Application.Interfaces;
using HotelBooking.Application.Services;
using HotelBooking.Domain.Entities;
using HotelBooking.Infrastructure.Data;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Moq;
using System.Security.Claims;
using Xunit;

namespace HotelBooking.Tests.Controllers;

/// <summary>
/// Comprehensive unit tests for BookingsController (50+ tests)
/// Testing all CRUD operations, authorization, validation, and edge cases
/// </summary>
public class BookingsControllerTests
{
    private readonly ApplicationDbContext _context;
    private readonly Mock<ILogger<BookingsController>> _mockLogger;
    private readonly Mock<IRepository<Booking>> _mockBookingRepository;
    private readonly Mock<ILogger<BookingValidationService>> _mockValidationLogger;
    private readonly BookingValidationService _validationService;
    private readonly BookingsController _controller;

    public BookingsControllerTests()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        _context = new ApplicationDbContext(options);
        _mockLogger = new Mock<ILogger<BookingsController>>();
        _mockBookingRepository = new Mock<IRepository<Booking>>();
        _mockValidationLogger = new Mock<ILogger<BookingValidationService>>();
        
        // Setup default repository behavior - return empty list for overlap checks
        _mockBookingRepository.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Booking, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Booking>());
        
        _validationService = new BookingValidationService(_mockBookingRepository.Object, _mockValidationLogger.Object);
        _controller = new BookingsController(_context, _mockLogger.Object, _validationService);
    }

    #region Setup Helpers

    private async Task<User> CreateTestUser(string email = "test@example.com", string role = "User")
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = email,
            PasswordHash = "hashedpassword",
            FullName = "Test User",
            Role = role,
            CreatedAt = DateTime.UtcNow
        };
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return user;
    }

    private async Task<Hotel> CreateTestHotel(string name = "Test Hotel")
    {
        var hotel = new Hotel
        {
            Id = Guid.NewGuid(),
            Name = name,
            Location = "Test Location",
            Description = "Test Description",
            Rating = 4.5m,
            CreatedAt = DateTime.UtcNow
        };
        _context.Hotels.Add(hotel);
        await _context.SaveChangesAsync();
        return hotel;
    }

    private async Task<Room> CreateTestRoom(Guid hotelId, decimal pricePerNight = 100m)
    {
        var room = new Room
        {
            Id = Guid.NewGuid(),
            HotelId = hotelId,
            RoomType = "Double",
            PricePerNight = pricePerNight,
            Capacity = 2,
            IsAvailable = true,
            CreatedAt = DateTime.UtcNow
        };
        _context.Rooms.Add(room);
        await _context.SaveChangesAsync();
        return room;
    }

    private async Task<Booking> CreateTestBooking(Guid userId, Guid roomId, DateTime? checkIn = null, DateTime? checkOut = null)
    {
        var booking = new Booking
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            RoomId = roomId,
            CheckIn = checkIn ?? DateTime.Today.AddDays(1),
            CheckOut = checkOut ?? DateTime.Today.AddDays(3),
            TotalPrice = 200m,
            Status = "Confirmed",
            CreatedAt = DateTime.UtcNow
        };
        _context.Bookings.Add(booking);
        await _context.SaveChangesAsync();
        return booking;
    }

    private void SetupUserClaims(Guid userId, string role = "User")
    {
        var claims = new List<Claim>
        {
            new Claim("userId", userId.ToString()),
            new Claim(ClaimTypes.Role, role)
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var claimsPrincipal = new ClaimsPrincipal(identity);
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = claimsPrincipal }
        };
    }

    #endregion

    #region GetAllBookings Tests (5 tests)

    [Fact]
    public async Task GetAllBookings_ShouldReturnOk_WhenBookingsExist()
    {
        var user = await CreateTestUser();
        var hotel = await CreateTestHotel();
        var room = await CreateTestRoom(hotel.Id);
        await CreateTestBooking(user.Id, room.Id);

        var result = await _controller.GetAllBookings();

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var bookings = okResult.Value.Should().BeAssignableTo<IEnumerable<Booking>>().Subject;
        bookings.Should().HaveCount(1);
    }

    [Fact]
    public async Task GetAllBookings_ShouldReturnEmptyList_WhenNoBookingsExist()
    {
        var result = await _controller.GetAllBookings();

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var bookings = okResult.Value.Should().BeAssignableTo<IEnumerable<Booking>>().Subject;
        bookings.Should().BeEmpty();
    }

    [Fact]
    public async Task GetAllBookings_ShouldExcludeDeletedBookings()
    {
        var user = await CreateTestUser();
        var hotel = await CreateTestHotel();
        var room = await CreateTestRoom(hotel.Id);
        var booking = await CreateTestBooking(user.Id, room.Id);
        booking.IsDeleted = true;
        booking.DeletedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var result = await _controller.GetAllBookings();

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var bookings = okResult.Value.Should().BeAssignableTo<IEnumerable<Booking>>().Subject;
        bookings.Should().BeEmpty();
    }

    [Fact]
    public async Task GetAllBookings_ShouldIncludeUserNavigation()
    {
        var user = await CreateTestUser();
        var hotel = await CreateTestHotel();
        var room = await CreateTestRoom(hotel.Id);
        await CreateTestBooking(user.Id, room.Id);

        var result = await _controller.GetAllBookings();

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var bookings = okResult.Value.Should().BeAssignableTo<IEnumerable<Booking>>().Subject;
        bookings.First().User.Should().NotBeNull();
    }

    [Fact]
    public async Task GetAllBookings_ShouldIncludeRoomNavigation()
    {
        var user = await CreateTestUser();
        var hotel = await CreateTestHotel();
        var room = await CreateTestRoom(hotel.Id);
        await CreateTestBooking(user.Id, room.Id);

        var result = await _controller.GetAllBookings();

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var bookings = okResult.Value.Should().BeAssignableTo<IEnumerable<Booking>>().Subject;
        bookings.First().Room.Should().NotBeNull();
    }

    #endregion

    #region GetMyBookings Tests (8 tests)

    [Fact]
    public async Task GetMyBookings_ShouldReturnOk_WhenUserHasBookings()
    {
        var user = await CreateTestUser();
        var hotel = await CreateTestHotel();
        var room = await CreateTestRoom(hotel.Id);
        await CreateTestBooking(user.Id, room.Id);
        SetupUserClaims(user.Id);

        var result = await _controller.GetMyBookings();

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetMyBookings_ShouldReturnUnauthorized_WhenNoUserIdClaim()
    {
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal() }
        };

        var result = await _controller.GetMyBookings();

        result.Should().BeOfType<UnauthorizedObjectResult>();
    }

    [Fact]
    public async Task GetMyBookings_ShouldReturnUnauthorized_WhenInvalidGuid()
    {
        var claims = new List<Claim> { new Claim("userId", "not-a-guid") };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(identity) }
        };

        var result = await _controller.GetMyBookings();

        result.Should().BeOfType<UnauthorizedObjectResult>();
    }

    [Fact]
    public async Task GetMyBookings_ShouldReturnEmptyList_WhenUserHasNoBookings()
    {
        var user = await CreateTestUser();
        SetupUserClaims(user.Id);

        var result = await _controller.GetMyBookings();

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var bookings = okResult.Value as IEnumerable<object>;
        bookings.Should().BeEmpty();
    }

    [Fact]
    public async Task GetMyBookings_ShouldOnlyReturnOwnBookings_NotOthers()
    {
        var user1 = await CreateTestUser("user1@test.com");
        var user2 = await CreateTestUser("user2@test.com");
        var hotel = await CreateTestHotel();
        var room = await CreateTestRoom(hotel.Id);
        await CreateTestBooking(user1.Id, room.Id, DateTime.Today.AddDays(1), DateTime.Today.AddDays(3));
        await CreateTestBooking(user2.Id, room.Id, DateTime.Today.AddDays(5), DateTime.Today.AddDays(7));
        SetupUserClaims(user1.Id);

        var result = await _controller.GetMyBookings();

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var bookings = okResult.Value as IEnumerable<dynamic>;
        bookings.Should().HaveCount(1);
    }

    [Fact]
    public async Task GetMyBookings_ShouldExcludeDeletedBookings()
    {
        var user = await CreateTestUser();
        var hotel = await CreateTestHotel();
        var room = await CreateTestRoom(hotel.Id);
        var booking = await CreateTestBooking(user.Id, room.Id);
        booking.IsDeleted = true;
        await _context.SaveChangesAsync();
        SetupUserClaims(user.Id);

        var result = await _controller.GetMyBookings();

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var bookings = okResult.Value as IEnumerable<dynamic>;
        bookings.Should().BeEmpty();
    }

    [Fact]
    public async Task GetMyBookings_ShouldReturnBookingDetails()
    {
        var user = await CreateTestUser();
        var hotel = await CreateTestHotel("Grand Hotel");
        var room = await CreateTestRoom(hotel.Id);
        await CreateTestBooking(user.Id, room.Id);
        SetupUserClaims(user.Id);

        var result = await _controller.GetMyBookings();

        result.Should().BeOfType<OkObjectResult>();
    }

    [Fact]
    public async Task GetMyBookings_ShouldHandleMultipleBookings()
    {
        var user = await CreateTestUser();
        var hotel = await CreateTestHotel();
        var room = await CreateTestRoom(hotel.Id);
        await CreateTestBooking(user.Id, room.Id, DateTime.Today.AddDays(1), DateTime.Today.AddDays(3));
        await CreateTestBooking(user.Id, room.Id, DateTime.Today.AddDays(5), DateTime.Today.AddDays(7));
        await CreateTestBooking(user.Id, room.Id, DateTime.Today.AddDays(10), DateTime.Today.AddDays(12));
        SetupUserClaims(user.Id);

        var result = await _controller.GetMyBookings();

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var bookings = okResult.Value as IEnumerable<dynamic>;
        bookings.Should().HaveCount(3);
    }

    #endregion

    #region GetBookingById Tests (6 tests)

    [Fact]
    public async Task GetBookingById_ShouldReturnOk_WhenBookingExists()
    {
        var user = await CreateTestUser();
        var hotel = await CreateTestHotel();
        var room = await CreateTestRoom(hotel.Id);
        var booking = await CreateTestBooking(user.Id, room.Id);

        var result = await _controller.GetBookingById(booking.Id);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedBooking = okResult.Value.Should().BeOfType<Booking>().Subject;
        returnedBooking.Id.Should().Be(booking.Id);
    }

    [Fact]
    public async Task GetBookingById_ShouldReturnNotFound_WhenBookingDoesNotExist()
    {
        var result = await _controller.GetBookingById(Guid.NewGuid());

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task GetBookingById_ShouldReturnNotFound_WhenBookingIsDeleted()
    {
        var user = await CreateTestUser();
        var hotel = await CreateTestHotel();
        var room = await CreateTestRoom(hotel.Id);
        var booking = await CreateTestBooking(user.Id, room.Id);
        booking.IsDeleted = true;
        await _context.SaveChangesAsync();

        var result = await _controller.GetBookingById(booking.Id);

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task GetBookingById_ShouldIncludeUser()
    {
        var user = await CreateTestUser();
        var hotel = await CreateTestHotel();
        var room = await CreateTestRoom(hotel.Id);
        var booking = await CreateTestBooking(user.Id, room.Id);

        var result = await _controller.GetBookingById(booking.Id);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedBooking = okResult.Value.Should().BeOfType<Booking>().Subject;
        returnedBooking.User.Should().NotBeNull();
    }

    [Fact]
    public async Task GetBookingById_ShouldIncludeRoom()
    {
        var user = await CreateTestUser();
        var hotel = await CreateTestHotel();
        var room = await CreateTestRoom(hotel.Id);
        var booking = await CreateTestBooking(user.Id, room.Id);

        var result = await _controller.GetBookingById(booking.Id);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedBooking = okResult.Value.Should().BeOfType<Booking>().Subject;
        returnedBooking.Room.Should().NotBeNull();
    }

    [Fact]
    public async Task GetBookingById_ShouldReturnCorrectBookingData()
    {
        var user = await CreateTestUser();
        var hotel = await CreateTestHotel();
        var room = await CreateTestRoom(hotel.Id);
        var checkIn = DateTime.Today.AddDays(5);
        var checkOut = DateTime.Today.AddDays(8);
        var booking = await CreateTestBooking(user.Id, room.Id, checkIn, checkOut);

        var result = await _controller.GetBookingById(booking.Id);

        var okResult = result.Should().BeOfType<OkObjectResult>().Subject;
        var returnedBooking = okResult.Value.Should().BeOfType<Booking>().Subject;
        returnedBooking.CheckIn.Should().Be(checkIn);
        returnedBooking.CheckOut.Should().Be(checkOut);
    }

    #endregion

    #region CreateBooking Tests (15 tests)

    [Fact]
    public async Task CreateBooking_ShouldReturnCreated_WhenValidData()
    {
        var user = await CreateTestUser();
        var hotel = await CreateTestHotel();
        var room = await CreateTestRoom(hotel.Id, 100m);

        var booking = new Booking
        {
            UserId = user.Id,
            RoomId = room.Id,
            CheckIn = DateTime.Today.AddDays(5),
            CheckOut = DateTime.Today.AddDays(7),
            TotalPrice = 0,
            Status = "Pending"
        };

        var result = await _controller.CreateBooking(booking);

        result.Should().BeOfType<CreatedAtActionResult>();
    }

    [Fact]
    public async Task CreateBooking_ShouldReturnNotFound_WhenUserNotFound()
    {
        var hotel = await CreateTestHotel();
        var room = await CreateTestRoom(hotel.Id);

        var booking = new Booking
        {
            UserId = Guid.NewGuid(),
            RoomId = room.Id,
            CheckIn = DateTime.Today.AddDays(1),
            CheckOut = DateTime.Today.AddDays(3),
            TotalPrice = 200m,
            Status = "Pending"
        };

        var result = await _controller.CreateBooking(booking);

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task CreateBooking_ShouldReturnNotFound_WhenRoomNotFound()
    {
        var user = await CreateTestUser();

        var booking = new Booking
        {
            UserId = user.Id,
            RoomId = Guid.NewGuid(),
            CheckIn = DateTime.Today.AddDays(1),
            CheckOut = DateTime.Today.AddDays(3),
            TotalPrice = 200m,
            Status = "Pending"
        };

        var result = await _controller.CreateBooking(booking);

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task CreateBooking_ShouldCalculateTotalPrice()
    {
        var user = await CreateTestUser();
        var hotel = await CreateTestHotel();
        var room = await CreateTestRoom(hotel.Id, 150m);

        var booking = new Booking
        {
            UserId = user.Id,
            RoomId = room.Id,
            CheckIn = DateTime.Today.AddDays(10),
            CheckOut = DateTime.Today.AddDays(15),
            TotalPrice = 0,
            Status = "Pending"
        };

        var result = await _controller.CreateBooking(booking);

        var createdResult = result.Should().BeOfType<CreatedAtActionResult>().Subject;
        var createdBooking = createdResult.Value.Should().BeOfType<Booking>().Subject;
        createdBooking.TotalPrice.Should().Be(750m);
    }

    [Fact]
    public async Task CreateBooking_ShouldSetDefaultStatus()
    {
        var user = await CreateTestUser();
        var hotel = await CreateTestHotel();
        var room = await CreateTestRoom(hotel.Id);

        var booking = new Booking
        {
            UserId = user.Id,
            RoomId = room.Id,
            CheckIn = DateTime.Today.AddDays(20),
            CheckOut = DateTime.Today.AddDays(22),
            TotalPrice = 0,
            Status = ""
        };

        var result = await _controller.CreateBooking(booking);

        var createdResult = result.Should().BeOfType<CreatedAtActionResult>().Subject;
        var createdBooking = createdResult.Value.Should().BeOfType<Booking>().Subject;
        createdBooking.Status.Should().Be("Pending");
    }

    [Fact]
    public async Task CreateBooking_ShouldGenerateGuid()
    {
        var user = await CreateTestUser();
        var hotel = await CreateTestHotel();
        var room = await CreateTestRoom(hotel.Id);

        var booking = new Booking
        {
            Id = Guid.Empty,
            UserId = user.Id,
            RoomId = room.Id,
            CheckIn = DateTime.Today.AddDays(25),
            CheckOut = DateTime.Today.AddDays(27),
            TotalPrice = 0,
            Status = "Pending"
        };

        var result = await _controller.CreateBooking(booking);

        var createdResult = result.Should().BeOfType<CreatedAtActionResult>().Subject;
        var createdBooking = createdResult.Value.Should().BeOfType<Booking>().Subject;
        createdBooking.Id.Should().NotBe(Guid.Empty);
    }

    [Fact]
    public async Task CreateBooking_ShouldSetCreatedAt()
    {
        var user = await CreateTestUser();
        var hotel = await CreateTestHotel();
        var room = await CreateTestRoom(hotel.Id);

        var booking = new Booking
        {
            UserId = user.Id,
            RoomId = room.Id,
            CheckIn = DateTime.Today.AddDays(30),
            CheckOut = DateTime.Today.AddDays(32),
            TotalPrice = 0,
            Status = "Pending"
        };

        var result = await _controller.CreateBooking(booking);

        var createdResult = result.Should().BeOfType<CreatedAtActionResult>().Subject;
        var createdBooking = createdResult.Value.Should().BeOfType<Booking>().Subject;
        createdBooking.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task CreateBooking_WithOverlappingDates_ShouldReturnBadRequest_WhenMockReturnsOverlap()
    {
        var user = await CreateTestUser();
        var hotel = await CreateTestHotel();
        var room = await CreateTestRoom(hotel.Id);
        
        // Setup mock to return an existing booking that overlaps
        var existingBooking = new Booking
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            RoomId = room.Id,
            CheckIn = DateTime.Today.AddDays(1),
            CheckOut = DateTime.Today.AddDays(5),
            TotalPrice = 400m,
            Status = "Confirmed",
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow
        };
        
        _mockBookingRepository.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Booking> { existingBooking });

        var overlapping = new Booking
        {
            UserId = user.Id,
            RoomId = room.Id,
            CheckIn = DateTime.Today.AddDays(3),
            CheckOut = DateTime.Today.AddDays(6),
            TotalPrice = 0,
            Status = "Pending"
        };

        var result = await _controller.CreateBooking(overlapping);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Theory]
    [InlineData(1, 100)]
    [InlineData(2, 200)]
    [InlineData(5, 500)]
    [InlineData(7, 700)]
    [InlineData(14, 1400)]
    public async Task CreateBooking_ShouldCalculateCorrectPrice(int days, decimal expected)
    {
        var user = await CreateTestUser($"user{days}@test.com");
        var hotel = await CreateTestHotel($"Hotel{days}");
        var room = await CreateTestRoom(hotel.Id, 100m);

        var booking = new Booking
        {
            UserId = user.Id,
            RoomId = room.Id,
            CheckIn = DateTime.Today.AddDays(50 + days),
            CheckOut = DateTime.Today.AddDays(50 + days + days),
            TotalPrice = 0,
            Status = "Pending"
        };

        var result = await _controller.CreateBooking(booking);

        var createdResult = result.Should().BeOfType<CreatedAtActionResult>().Subject;
        var createdBooking = createdResult.Value.Should().BeOfType<Booking>().Subject;
        createdBooking.TotalPrice.Should().Be(expected);
    }

    [Fact]
    public async Task CreateBooking_SameDayCheckInCheckOut_ShouldReturnBadRequest()
    {
        var user = await CreateTestUser();
        var hotel = await CreateTestHotel();
        var room = await CreateTestRoom(hotel.Id, 100m);

        var booking = new Booking
        {
            UserId = user.Id,
            RoomId = room.Id,
            CheckIn = DateTime.Today.AddDays(100),
            CheckOut = DateTime.Today.AddDays(100), // Same day as check-in is invalid
            TotalPrice = 0,
            Status = "Pending"
        };

        var result = await _controller.CreateBooking(booking);

        // Validation service rejects same-day checkout (checkout must be after check-in)
        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task CreateBooking_ShouldSetIsDeletedFalse()
    {
        var user = await CreateTestUser();
        var hotel = await CreateTestHotel();
        var room = await CreateTestRoom(hotel.Id);

        var booking = new Booking
        {
            UserId = user.Id,
            RoomId = room.Id,
            CheckIn = DateTime.Today.AddDays(110),
            CheckOut = DateTime.Today.AddDays(112),
            TotalPrice = 0,
            Status = "Pending"
        };

        var result = await _controller.CreateBooking(booking);

        var createdResult = result.Should().BeOfType<CreatedAtActionResult>().Subject;
        var createdBooking = createdResult.Value.Should().BeOfType<Booking>().Subject;
        createdBooking.IsDeleted.Should().BeFalse();
    }

    [Fact]
    public async Task CreateBooking_ShouldPersistToDatabase()
    {
        var user = await CreateTestUser();
        var hotel = await CreateTestHotel();
        var room = await CreateTestRoom(hotel.Id);

        var booking = new Booking
        {
            UserId = user.Id,
            RoomId = room.Id,
            CheckIn = DateTime.Today.AddDays(120),
            CheckOut = DateTime.Today.AddDays(122),
            TotalPrice = 0,
            Status = "Pending"
        };

        var result = await _controller.CreateBooking(booking);

        var createdResult = result.Should().BeOfType<CreatedAtActionResult>().Subject;
        var createdBooking = createdResult.Value.Should().BeOfType<Booking>().Subject;
        
        var dbBooking = await _context.Bookings.FindAsync(createdBooking.Id);
        dbBooking.Should().NotBeNull();
    }

    [Fact]
    public async Task CreateBooking_ShouldReturnNotFound_WhenRoomIsDeleted()
    {
        var user = await CreateTestUser();
        var hotel = await CreateTestHotel();
        var room = await CreateTestRoom(hotel.Id);
        room.IsDeleted = true;
        await _context.SaveChangesAsync();

        var booking = new Booking
        {
            UserId = user.Id,
            RoomId = room.Id,
            CheckIn = DateTime.Today.AddDays(130),
            CheckOut = DateTime.Today.AddDays(132),
            TotalPrice = 0,
            Status = "Pending"
        };

        var result = await _controller.CreateBooking(booking);

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task CreateBooking_ShouldReturnNotFound_WhenUserIsDeleted()
    {
        var user = await CreateTestUser();
        user.IsDeleted = true;
        await _context.SaveChangesAsync();
        var hotel = await CreateTestHotel();
        var room = await CreateTestRoom(hotel.Id);

        var booking = new Booking
        {
            UserId = user.Id,
            RoomId = room.Id,
            CheckIn = DateTime.Today.AddDays(140),
            CheckOut = DateTime.Today.AddDays(142),
            TotalPrice = 0,
            Status = "Pending"
        };

        var result = await _controller.CreateBooking(booking);

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    #endregion

    #region UpdateBooking Tests (8 tests)

    [Fact]
    public async Task UpdateBooking_ShouldReturnNoContent_WhenValid()
    {
        var user = await CreateTestUser();
        var hotel = await CreateTestHotel();
        var room = await CreateTestRoom(hotel.Id);
        var booking = await CreateTestBooking(user.Id, room.Id, DateTime.Today.AddDays(200), DateTime.Today.AddDays(202));

        var updated = new Booking
        {
            UserId = user.Id,
            RoomId = room.Id,
            CheckIn = DateTime.Today.AddDays(205),
            CheckOut = DateTime.Today.AddDays(207),
            TotalPrice = 200m,
            Status = "Confirmed"
        };

        var result = await _controller.UpdateBooking(booking.Id, updated);

        result.Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task UpdateBooking_ShouldReturnNotFound_WhenNotExists()
    {
        var user = await CreateTestUser();
        var hotel = await CreateTestHotel();
        var room = await CreateTestRoom(hotel.Id);

        var updated = new Booking
        {
            UserId = user.Id,
            RoomId = room.Id,
            CheckIn = DateTime.Today.AddDays(1),
            CheckOut = DateTime.Today.AddDays(3),
            TotalPrice = 200m,
            Status = "Confirmed"
        };

        var result = await _controller.UpdateBooking(Guid.NewGuid(), updated);

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task UpdateBooking_ShouldRecalculatePrice()
    {
        var user = await CreateTestUser();
        var hotel = await CreateTestHotel();
        var room = await CreateTestRoom(hotel.Id, 100m);
        var booking = await CreateTestBooking(user.Id, room.Id, DateTime.Today.AddDays(300), DateTime.Today.AddDays(302));

        var updated = new Booking
        {
            UserId = user.Id,
            RoomId = room.Id,
            CheckIn = DateTime.Today.AddDays(310),
            CheckOut = DateTime.Today.AddDays(315),
            TotalPrice = 0,
            Status = "Confirmed"
        };

        await _controller.UpdateBooking(booking.Id, updated);

        var dbBooking = await _context.Bookings.FindAsync(booking.Id);
        dbBooking!.TotalPrice.Should().Be(500m);
    }

    [Fact]
    public async Task UpdateBooking_ShouldSetUpdatedAt()
    {
        var user = await CreateTestUser();
        var hotel = await CreateTestHotel();
        var room = await CreateTestRoom(hotel.Id);
        var booking = await CreateTestBooking(user.Id, room.Id, DateTime.Today.AddDays(400), DateTime.Today.AddDays(402));

        var updated = new Booking
        {
            UserId = user.Id,
            RoomId = room.Id,
            CheckIn = DateTime.Today.AddDays(405),
            CheckOut = DateTime.Today.AddDays(407),
            TotalPrice = 200m,
            Status = "Confirmed"
        };

        await _controller.UpdateBooking(booking.Id, updated);

        var dbBooking = await _context.Bookings.FindAsync(booking.Id);
        dbBooking!.UpdatedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task UpdateBooking_ShouldUpdateStatus()
    {
        var user = await CreateTestUser();
        var hotel = await CreateTestHotel();
        var room = await CreateTestRoom(hotel.Id);
        var booking = await CreateTestBooking(user.Id, room.Id, DateTime.Today.AddDays(500), DateTime.Today.AddDays(502));

        var updated = new Booking
        {
            UserId = user.Id,
            RoomId = room.Id,
            CheckIn = DateTime.Today.AddDays(500),
            CheckOut = DateTime.Today.AddDays(502),
            TotalPrice = 200m,
            Status = "Cancelled"
        };

        await _controller.UpdateBooking(booking.Id, updated);

        var dbBooking = await _context.Bookings.FindAsync(booking.Id);
        dbBooking!.Status.Should().Be("Cancelled");
    }

    [Fact]
    public async Task UpdateBooking_ShouldReturnNotFound_WhenDeleted()
    {
        var user = await CreateTestUser();
        var hotel = await CreateTestHotel();
        var room = await CreateTestRoom(hotel.Id);
        var booking = await CreateTestBooking(user.Id, room.Id, DateTime.Today.AddDays(600), DateTime.Today.AddDays(602));
        booking.IsDeleted = true;
        await _context.SaveChangesAsync();

        var updated = new Booking
        {
            UserId = user.Id,
            RoomId = room.Id,
            CheckIn = DateTime.Today.AddDays(605),
            CheckOut = DateTime.Today.AddDays(607),
            TotalPrice = 200m,
            Status = "Confirmed"
        };

        var result = await _controller.UpdateBooking(booking.Id, updated);

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task UpdateBooking_WithOverlappingDates_ShouldValidateOverlap_WhenMockReturnsOverlap()
    {
        var user = await CreateTestUser();
        var hotel = await CreateTestHotel();
        var room = await CreateTestRoom(hotel.Id);
        var booking2 = await CreateTestBooking(user.Id, room.Id, DateTime.Today.AddDays(710), DateTime.Today.AddDays(715));

        // Setup mock to return an existing booking that will overlap
        var existingBooking = new Booking
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            RoomId = room.Id,
            CheckIn = DateTime.Today.AddDays(700),
            CheckOut = DateTime.Today.AddDays(705),
            TotalPrice = 500m,
            Status = "Confirmed",
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow
        };
        
        _mockBookingRepository.Setup(r => r.GetAllAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<Booking> { existingBooking });

        var updated = new Booking
        {
            UserId = user.Id,
            RoomId = room.Id,
            CheckIn = DateTime.Today.AddDays(702),
            CheckOut = DateTime.Today.AddDays(707),
            TotalPrice = 200m,
            Status = "Confirmed"
        };

        var result = await _controller.UpdateBooking(booking2.Id, updated);

        result.Should().BeOfType<BadRequestObjectResult>();
    }

    [Fact]
    public async Task UpdateBooking_ShouldAllowSameDates()
    {
        var user = await CreateTestUser();
        var hotel = await CreateTestHotel();
        var room = await CreateTestRoom(hotel.Id);
        var booking = await CreateTestBooking(user.Id, room.Id, DateTime.Today.AddDays(800), DateTime.Today.AddDays(805));

        var updated = new Booking
        {
            UserId = user.Id,
            RoomId = room.Id,
            CheckIn = DateTime.Today.AddDays(800),
            CheckOut = DateTime.Today.AddDays(805),
            TotalPrice = 200m,
            Status = "Cancelled"
        };

        var result = await _controller.UpdateBooking(booking.Id, updated);

        result.Should().BeOfType<NoContentResult>();
    }

    #endregion

    #region DeleteBooking Tests (6 tests)

    [Fact]
    public async Task DeleteBooking_ShouldReturnNoContent_WhenExists()
    {
        var user = await CreateTestUser();
        var hotel = await CreateTestHotel();
        var room = await CreateTestRoom(hotel.Id);
        var booking = await CreateTestBooking(user.Id, room.Id);

        var result = await _controller.DeleteBooking(booking.Id);

        result.Should().BeOfType<NoContentResult>();
    }

    [Fact]
    public async Task DeleteBooking_ShouldReturnNotFound_WhenNotExists()
    {
        var result = await _controller.DeleteBooking(Guid.NewGuid());

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task DeleteBooking_ShouldSoftDelete()
    {
        var user = await CreateTestUser();
        var hotel = await CreateTestHotel();
        var room = await CreateTestRoom(hotel.Id);
        var booking = await CreateTestBooking(user.Id, room.Id);

        await _controller.DeleteBooking(booking.Id);

        var dbBooking = await _context.Bookings.FindAsync(booking.Id);
        dbBooking.Should().NotBeNull();
        dbBooking!.IsDeleted.Should().BeTrue();
    }

    [Fact]
    public async Task DeleteBooking_ShouldSetDeletedAt()
    {
        var user = await CreateTestUser();
        var hotel = await CreateTestHotel();
        var room = await CreateTestRoom(hotel.Id);
        var booking = await CreateTestBooking(user.Id, room.Id);

        await _controller.DeleteBooking(booking.Id);

        var dbBooking = await _context.Bookings.FindAsync(booking.Id);
        dbBooking!.DeletedAt.Should().NotBeNull();
    }

    [Fact]
    public async Task DeleteBooking_ShouldReturnNotFound_WhenAlreadyDeleted()
    {
        var user = await CreateTestUser();
        var hotel = await CreateTestHotel();
        var room = await CreateTestRoom(hotel.Id);
        var booking = await CreateTestBooking(user.Id, room.Id);
        booking.IsDeleted = true;
        await _context.SaveChangesAsync();

        var result = await _controller.DeleteBooking(booking.Id);

        result.Should().BeOfType<NotFoundObjectResult>();
    }

    [Fact]
    public async Task DeleteBooking_ShouldNotRemoveFromDatabase()
    {
        var user = await CreateTestUser();
        var hotel = await CreateTestHotel();
        var room = await CreateTestRoom(hotel.Id);
        var booking = await CreateTestBooking(user.Id, room.Id);
        var bookingId = booking.Id;

        await _controller.DeleteBooking(bookingId);

        // Use IgnoreQueryFilters to check soft-deleted records
        var exists = await _context.Bookings.IgnoreQueryFilters().AnyAsync(b => b.Id == bookingId);
        exists.Should().BeTrue();
    }

    #endregion
}
