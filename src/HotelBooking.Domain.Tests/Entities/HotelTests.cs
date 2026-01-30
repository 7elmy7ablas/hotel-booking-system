using FluentAssertions;
using HotelBooking.Domain.Entities;
using Xunit;

namespace HotelBooking.Domain.Tests.Entities;

public class HotelTests
{
    [Fact]
    public void Hotel_ShouldBeCreated_WithValidProperties()
    {
        // Arrange
        var name = "Grand Hotel";
        var location = "123 Main St, Cairo";
        var description = "Luxury hotel in the city center";
        var rating = 4.5m;

        // Act
        var hotel = new Hotel
        {
            Name = name,
            Location = location,
            Description = description,
            Rating = rating
        };

        // Assert
        hotel.Name.Should().Be(name);
        hotel.Location.Should().Be(location);
        hotel.Description.Should().Be(description);
        hotel.Rating.Should().Be(rating);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(2.5)]
    [InlineData(5)]
    public void Hotel_ShouldAcceptValidRatings(decimal rating)
    {
        // Arrange & Act
        var hotel = new Hotel
        {
            Name = "Test Hotel",
            Location = "Test Location",
            Rating = rating
        };

        // Assert
        hotel.Rating.Should().Be(rating);
    }

    [Fact]
    public void Hotel_ShouldHaveEmptyRoomsCollection_WhenCreated()
    {
        // Arrange & Act
        var hotel = new Hotel
        {
            Name = "Test Hotel",
            Location = "Test Location"
        };

        // Assert
        hotel.Rooms.Should().NotBeNull();
        hotel.Rooms.Should().BeEmpty();
    }

    [Fact]
    public void Hotel_CanHaveMultipleRooms()
    {
        // Arrange
        var hotel = new Hotel
        {
            Name = "Test Hotel",
            Location = "Test Location",
            Rooms = new List<Room>()
        };

        var hotelId = Guid.NewGuid();

        // Act
        hotel.Rooms.Add(new Room 
        { 
            HotelId = hotelId, 
            RoomType = "Single", 
            PricePerNight = 100m, 
            Capacity = 1 
        });
        hotel.Rooms.Add(new Room 
        { 
            HotelId = hotelId, 
            RoomType = "Double", 
            PricePerNight = 150m, 
            Capacity = 2 
        });

        // Assert
        hotel.Rooms.Should().HaveCount(2);
    }

    [Fact]
    public void Hotel_ShouldSupportAmenities()
    {
        // Arrange
        var amenities = "Free WiFi,Pool,Spa,Restaurant";

        // Act
        var hotel = new Hotel
        {
            Name = "Luxury Resort",
            Location = "Beach Road",
            Amenities = amenities
        };

        // Assert
        hotel.Amenities.Should().Be(amenities);
        hotel.Amenities.Should().Contain("Pool");
    }

    [Fact]
    public void Hotel_ShouldAllowNullDescription()
    {
        // Arrange & Act
        var hotel = new Hotel
        {
            Name = "Basic Hotel",
            Location = "Downtown"
        };

        // Assert
        hotel.Description.Should().BeNull();
    }

    [Fact]
    public void Hotel_ShouldAllowNullAmenities()
    {
        // Arrange & Act
        var hotel = new Hotel
        {
            Name = "Basic Hotel",
            Location = "Downtown"
        };

        // Assert
        hotel.Amenities.Should().BeNull();
    }
}
