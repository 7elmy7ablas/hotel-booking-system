using HotelBooking.Domain.Entities;

namespace HotelBooking.Application.Tests;

/// <summary>
/// Test interfaces for mocking repositories in Application layer tests.
/// These interfaces represent the repository contracts that would exist
/// in the Application layer.
/// </summary>

public interface IBookingRepository
{
    Task<Booking?> GetByIdAsync(Guid id);
    Task<Booking> AddAsync(Booking booking);
    Task<bool> UpdateAsync(Booking booking);
    Task<IEnumerable<Booking>> GetByUserIdAsync(Guid userId);
    Task<bool> IsRoomAvailableAsync(Guid roomId, DateTime checkIn, DateTime checkOut);
}

public interface IRoomRepository
{
    Task<Room?> GetByIdAsync(Guid id);
    Task<IEnumerable<Room>> GetByHotelIdAsync(Guid hotelId);
    Task<IEnumerable<Room>> GetAvailableRoomsAsync(DateTime checkIn, DateTime checkOut);
}

public interface IHotelRepository
{
    Task<IEnumerable<Hotel>> GetAllAsync();
    Task<Hotel?> GetByIdAsync(Guid id);
    Task<IEnumerable<Hotel>> SearchByLocationAsync(string location);
    Task<Hotel> AddAsync(Hotel hotel);
    Task<bool> UpdateAsync(Hotel hotel);
    Task<bool> DeleteAsync(Guid id);
}
