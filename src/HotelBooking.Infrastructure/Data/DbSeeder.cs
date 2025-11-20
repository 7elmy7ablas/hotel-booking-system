using HotelBooking.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace HotelBooking.Infrastructure.Data;

public static class DbSeeder
{
    public static async Task SeedData(ApplicationDbContext context)
    {
        if (await context.Users.AnyAsync() || await context.Hotels.AnyAsync())
        {
            return;
        }

        var adminUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "admin@hotel.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123", workFactor: 12),
            FullName = "System Administrator",
            PhoneNumber = "+1-555-0100",
            Role = "Admin",
            CreatedAt = DateTime.UtcNow,
            IsDeleted = false
        };

        context.Users.Add(adminUser);

        var hotels = new List<Hotel>
        {
            new Hotel
            {
                Id = Guid.NewGuid(),
                Name = "Grand Plaza Hotel",
                Location = "123 Fifth Avenue, New York, NY 10001",
                Description = "Luxury hotel in the heart of Manhattan with stunning city views, world-class dining, and premium amenities.",
                Rating = 4.8m,
                Amenities = "Free WiFi,Swimming Pool,Fitness Center,Restaurant,Bar,Room Service,Spa,Parking,24/7 Concierge",
                CreatedAt = DateTime.UtcNow,
                IsDeleted = false
            },
            new Hotel
            {
                Id = Guid.NewGuid(),
                Name = "Seaside Resort & Spa",
                Location = "456 Ocean Drive, Miami Beach, FL 33139",
                Description = "Beachfront paradise offering direct ocean access, tropical gardens, and rejuvenating spa treatments.",
                Rating = 4.6m,
                Amenities = "Free WiFi,Private Beach,Swimming Pool,Spa,Restaurant,Bar,Water Sports,Parking",
                CreatedAt = DateTime.UtcNow,
                IsDeleted = false
            },
            new Hotel
            {
                Id = Guid.NewGuid(),
                Name = "Mountain View Lodge",
                Location = "789 Alpine Road, Aspen, CO 81611",
                Description = "Cozy mountain retreat with breathtaking views, ski-in/ski-out access, and rustic elegance.",
                Rating = 4.7m,
                Amenities = "Free WiFi,Ski Storage,Fireplace,Restaurant,Bar,Hot Tub,Parking,Shuttle Service",
                CreatedAt = DateTime.UtcNow,
                IsDeleted = false
            },
            new Hotel
            {
                Id = Guid.NewGuid(),
                Name = "Downtown Business Hotel",
                Location = "321 Market Street, San Francisco, CA 94102",
                Description = "Modern business hotel with state-of-the-art conference facilities and convenient downtown location.",
                Rating = 4.3m,
                Amenities = "Free WiFi,Business Center,Fitness Center,Restaurant,Meeting Rooms,Parking,Airport Shuttle",
                CreatedAt = DateTime.UtcNow,
                IsDeleted = false
            },
            new Hotel
            {
                Id = Guid.NewGuid(),
                Name = "Historic Garden Inn",
                Location = "555 Bourbon Street, New Orleans, LA 70130",
                Description = "Charming historic hotel featuring beautiful courtyard gardens, authentic Creole cuisine, and Southern hospitality.",
                Rating = 4.5m,
                Amenities = "Free WiFi,Garden,Restaurant,Bar,Live Music,Parking,Pet Friendly",
                CreatedAt = DateTime.UtcNow,
                IsDeleted = false
            },
            new Hotel
            {
                Id = Guid.NewGuid(),
                Name = "Desert Oasis Resort",
                Location = "888 Canyon Road, Scottsdale, AZ 85251",
                Description = "Luxurious desert resort with championship golf course, infinity pools, and stunning sunset views.",
                Rating = 4.9m,
                Amenities = "Free WiFi,Golf Course,Swimming Pool,Spa,Tennis Courts,Restaurant,Bar,Parking",
                CreatedAt = DateTime.UtcNow,
                IsDeleted = false
            },
            new Hotel
            {
                Id = Guid.NewGuid(),
                Name = "Lakeside Boutique Hotel",
                Location = "222 Lakeshore Drive, Chicago, IL 60611",
                Description = "Intimate boutique hotel overlooking Lake Michigan with personalized service and contemporary design.",
                Rating = 4.4m,
                Amenities = "Free WiFi,Lake View,Restaurant,Bar,Fitness Center,Parking,Pet Friendly",
                CreatedAt = DateTime.UtcNow,
                IsDeleted = false
            },
            new Hotel
            {
                Id = Guid.NewGuid(),
                Name = "Vineyard Estate Hotel",
                Location = "999 Wine Country Lane, Napa Valley, CA 94558",
                Description = "Elegant wine country estate surrounded by vineyards, offering wine tastings and farm-to-table dining.",
                Rating = 4.7m,
                Amenities = "Free WiFi,Wine Tasting,Restaurant,Swimming Pool,Spa,Parking,Bike Rentals",
                CreatedAt = DateTime.UtcNow,
                IsDeleted = false
            }
        };

        context.Hotels.AddRange(hotels);

        var rooms = new List<Room>();
        var roomTypes = new[]
        {
            new { Type = "Single", Capacity = 1, BasePrice = 120m },
            new { Type = "Double", Capacity = 2, BasePrice = 180m },
            new { Type = "Suite", Capacity = 4, BasePrice = 350m }
        };

        foreach (var hotel in hotels)
        {
            var priceMultiplier = hotel.Rating >= 4.7m ? 1.5m : hotel.Rating >= 4.5m ? 1.2m : 1.0m;

            foreach (var roomType in roomTypes)
            {
                rooms.Add(new Room
                {
                    Id = Guid.NewGuid(),
                    HotelId = hotel.Id,
                    RoomType = roomType.Type,
                    PricePerNight = Math.Round(roomType.BasePrice * priceMultiplier, 2),
                    Capacity = roomType.Capacity,
                    IsAvailable = true,
                    CreatedAt = DateTime.UtcNow,
                    IsDeleted = false
                });
            }
        }

        context.Rooms.AddRange(rooms);

        await context.SaveChangesAsync();
    }
}
