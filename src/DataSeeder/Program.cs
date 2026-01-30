using Microsoft.EntityFrameworkCore;
using HotelBooking.Infrastructure.Data;
using HotelBooking.Domain.Entities;

var connectionString = "Server=(localdb)\\mssqllocaldb;Database=HotelBookingDb;Trusted_Connection=true;MultipleActiveResultSets=true;TrustServerCertificate=true";

var optionsBuilder = new DbContextOptionsBuilder<ApplicationDbContext>();
optionsBuilder.UseSqlServer(connectionString, sqlOptions => sqlOptions.EnableRetryOnFailure());

using var context = new ApplicationDbContext(optionsBuilder.Options);

Console.WriteLine("Clearing existing data...");
context.Rooms.RemoveRange(context.Rooms);
context.Hotels.RemoveRange(context.Hotels);
await context.SaveChangesAsync();

Console.WriteLine("Inserting Egyptian hotels...");

var hotels = new List<Hotel>
{
    new Hotel
    {
        Id = Guid.Parse("B19C1D5D-EFA5-4A91-827F-1A1F5F2900A1"),
        Name = "Nile Palace Hotel",
        Location = "Cairo, Egypt",
        Description = "Hotel on the Nile river with city view, pool, free breakfast.",
        Rating = 4.5m,
        Amenities = "Free WiFi,Pool,Free Breakfast,Nile View,Restaurant",
        CreatedAt = DateTime.UtcNow,
        IsDeleted = false
    },
    new Hotel
    {
        Id = Guid.Parse("5A38980A-0961-4D56-8807-8D0E83B57B3E"),
        Name = "Azure Beach Resort",
        Location = "Alexandria, Egypt",
        Description = "Beachfront resort with modern rooms and sea view.",
        Rating = 4.2m,
        Amenities = "Beach Access,Restaurant,Sea View,Free WiFi",
        CreatedAt = DateTime.UtcNow,
        IsDeleted = false
    },
    new Hotel
    {
        Id = Guid.Parse("F31B8E7B-29AA-4BA9-99A9-0B4F824CE89C"),
        Name = "Downtown Grand Hotel",
        Location = "Cairo, Egypt",
        Description = "Luxury city hotel in the heart of downtown.",
        Rating = 4.0m,
        Amenities = "Free WiFi,Bar,Restaurant,City View",
        CreatedAt = DateTime.UtcNow,
        IsDeleted = false
    },
    new Hotel
    {
        Id = Guid.Parse("29DE6ADA-B25B-44D2-8FFA-76328C4CEB4D"),
        Name = "Pyramids City Resort",
        Location = "Giza, Egypt",
        Description = "Resort near the Pyramids of Giza with spa and pool.",
        Rating = 4.7m,
        Amenities = "Spa,Pool,Pyramids View,Restaurant,Free WiFi",
        CreatedAt = DateTime.UtcNow,
        IsDeleted = false
    },
    new Hotel
    {
        Id = Guid.Parse("ED757A84-6A58-4E0B-8F18-2E170814E698"),
        Name = "Luxor Heritage Inn",
        Location = "Luxor, Egypt",
        Description = "Traditional inn with rooftop terrace overlooking the Nile.",
        Rating = 4.3m,
        Amenities = "Rooftop Terrace,Nile View,Restaurant,Free WiFi",
        CreatedAt = DateTime.UtcNow,
        IsDeleted = false
    },
    new Hotel
    {
        Id = Guid.Parse("C1ED0976-E8A9-4FD5-89C7-2BD9BA098C2D"),
        Name = "Sharm El-Sheikh Family Suites",
        Location = "Sharm El-Sheikh, Egypt",
        Description = "All-inclusive resort for families and children.",
        Rating = 4.6m,
        Amenities = "All-Inclusive,Kids Club,Pool,Beach Access,Restaurant",
        CreatedAt = DateTime.UtcNow,
        IsDeleted = false
    },
    new Hotel
    {
        Id = Guid.Parse("870983C6-D97E-43A8-9ECF-3F3D9C9575F7"),
        Name = "Red Sea Breeze Resort",
        Location = "Hurghada, Egypt",
        Description = "Resort with private beach and diving school.",
        Rating = 4.1m,
        Amenities = "Private Beach,Diving School,Pool,Restaurant,Free WiFi",
        CreatedAt = DateTime.UtcNow,
        IsDeleted = false
    },
    new Hotel
    {
        Id = Guid.Parse("6E82C08B-BD23-412D-A8BB-B990A4B4DB63"),
        Name = "Aswan Sun Plaza",
        Location = "Aswan, Egypt",
        Description = "Affordable hotel near the Corniche.",
        Rating = 3.9m,
        Amenities = "Free WiFi,Restaurant,Corniche View",
        CreatedAt = DateTime.UtcNow,
        IsDeleted = false
    },
    new Hotel
    {
        Id = Guid.Parse("25A75F8B-06E5-4DEA-BF9D-1E208B3F17B6"),
        Name = "Delta Urban Hotel",
        Location = "Mansoura, Egypt",
        Description = "Modern business hotel with restaurant and gym.",
        Rating = 4.0m,
        Amenities = "Free WiFi,Gym,Restaurant,Business Center",
        CreatedAt = DateTime.UtcNow,
        IsDeleted = false
    },
    new Hotel
    {
        Id = Guid.Parse("A5FE011F-8469-492F-8A1B-788129714537"),
        Name = "Port Saeed Bay Resort",
        Location = "Port Said, Egypt",
        Description = "Beachside resort with sea views and large pool.",
        Rating = 4.2m,
        Amenities = "Beach Access,Pool,Sea View,Restaurant,Free WiFi",
        CreatedAt = DateTime.UtcNow,
        IsDeleted = false
    },
    new Hotel
    {
        Id = Guid.Parse("DED9397C-410A-4580-8A8F-226EA5A59EEC"),
        Name = "Siwa Oasis Guest House",
        Location = "Siwa, Egypt",
        Description = "Eco-friendly guesthouse in Siwa Oasis.",
        Rating = 4.8m,
        Amenities = "Eco-Friendly,Desert View,Traditional Food,Free WiFi",
        CreatedAt = DateTime.UtcNow,
        IsDeleted = false
    }
};

context.Hotels.AddRange(hotels);
await context.SaveChangesAsync();

Console.WriteLine($"Inserted {hotels.Count} hotels");

Console.WriteLine("Inserting rooms...");

var rooms = new List<Room>
{
    new Room { Id = Guid.NewGuid(), HotelId = Guid.Parse("B19C1D5D-EFA5-4A91-827F-1A1F5F2900A1"), RoomType = "Single", PricePerNight = 60m, Capacity = 1, IsAvailable = true, CreatedAt = DateTime.UtcNow, IsDeleted = false },
    new Room { Id = Guid.NewGuid(), HotelId = Guid.Parse("B19C1D5D-EFA5-4A91-827F-1A1F5F2900A1"), RoomType = "Double", PricePerNight = 90m, Capacity = 2, IsAvailable = true, CreatedAt = DateTime.UtcNow, IsDeleted = false },
    new Room { Id = Guid.NewGuid(), HotelId = Guid.Parse("5A38980A-0961-4D56-8807-8D0E83B57B3E"), RoomType = "Standard", PricePerNight = 85m, Capacity = 2, IsAvailable = true, CreatedAt = DateTime.UtcNow, IsDeleted = false },
    new Room { Id = Guid.NewGuid(), HotelId = Guid.Parse("5A38980A-0961-4D56-8807-8D0E83B57B3E"), RoomType = "Suite", PricePerNight = 150m, Capacity = 4, IsAvailable = true, CreatedAt = DateTime.UtcNow, IsDeleted = false },
    new Room { Id = Guid.NewGuid(), HotelId = Guid.Parse("F31B8E7B-29AA-4BA9-99A9-0B4F824CE89C"), RoomType = "Standard", PricePerNight = 70m, Capacity = 2, IsAvailable = true, CreatedAt = DateTime.UtcNow, IsDeleted = false },
    new Room { Id = Guid.NewGuid(), HotelId = Guid.Parse("29DE6ADA-B25B-44D2-8FFA-76328C4CEB4D"), RoomType = "Queen", PricePerNight = 95m, Capacity = 2, IsAvailable = true, CreatedAt = DateTime.UtcNow, IsDeleted = false },
    new Room { Id = Guid.NewGuid(), HotelId = Guid.Parse("ED757A84-6A58-4E0B-8F18-2E170814E698"), RoomType = "Standard", PricePerNight = 50m, Capacity = 2, IsAvailable = true, CreatedAt = DateTime.UtcNow, IsDeleted = false },
    new Room { Id = Guid.NewGuid(), HotelId = Guid.Parse("C1ED0976-E8A9-4FD5-89C7-2BD9BA098C2D"), RoomType = "Family Suite", PricePerNight = 130m, Capacity = 5, IsAvailable = true, CreatedAt = DateTime.UtcNow, IsDeleted = false },
    new Room { Id = Guid.NewGuid(), HotelId = Guid.Parse("870983C6-D97E-43A8-9ECF-3F3D9C9575F7"), RoomType = "Sea View", PricePerNight = 110m, Capacity = 2, IsAvailable = true, CreatedAt = DateTime.UtcNow, IsDeleted = false },
    new Room { Id = Guid.NewGuid(), HotelId = Guid.Parse("6E82C08B-BD23-412D-A8BB-B990A4B4DB63"), RoomType = "Basic", PricePerNight = 30m, Capacity = 2, IsAvailable = true, CreatedAt = DateTime.UtcNow, IsDeleted = false },
    new Room { Id = Guid.NewGuid(), HotelId = Guid.Parse("25A75F8B-06E5-4DEA-BF9D-1E208B3F17B6"), RoomType = "Business", PricePerNight = 75m, Capacity = 2, IsAvailable = true, CreatedAt = DateTime.UtcNow, IsDeleted = false },
    new Room { Id = Guid.NewGuid(), HotelId = Guid.Parse("A5FE011F-8469-492F-8A1B-788129714537"), RoomType = "Standard", PricePerNight = 80m, Capacity = 2, IsAvailable = true, CreatedAt = DateTime.UtcNow, IsDeleted = false },
    new Room { Id = Guid.NewGuid(), HotelId = Guid.Parse("DED9397C-410A-4580-8A8F-226EA5A59EEC"), RoomType = "Eco Room", PricePerNight = 65m, Capacity = 2, IsAvailable = true, CreatedAt = DateTime.UtcNow, IsDeleted = false }
};

context.Rooms.AddRange(rooms);
await context.SaveChangesAsync();

Console.WriteLine($"Inserted {rooms.Count} rooms");
Console.WriteLine("\n✅ Egyptian hotels data seeded successfully!");

var totalHotels = await context.Hotels.CountAsync();
var totalRooms = await context.Rooms.CountAsync();

Console.WriteLine($"\nTotal Hotels: {totalHotels}");
Console.WriteLine($"Total Rooms: {totalRooms}");
Console.WriteLine("\nHotels:");
var allHotels = await context.Hotels.OrderBy(h => h.Name).ToListAsync();
foreach (var hotel in allHotels)
{
    Console.WriteLine($"  - {hotel.Name} ({hotel.Location}) - Rating: {hotel.Rating}");
}
